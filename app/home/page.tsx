"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import AppointmentCard from "../components/dashboard/AppointmentCard";
import PatientActivityCard from "../components/dashboard/PatientActivity";
import ProgressCard from "../components/dashboard/ProgressCard";
import CalendarCard from "../components/dashboard/CalendarCard";
import { auth, db } from "../firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp, setDoc, getDocs } from "firebase/firestore";
import { FaUserMd, FaCalendarCheck, FaChartLine } from 'react-icons/fa';

const createNotification = async (doctorId: string, message: string) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      doctorId,
      message,
      createdAt: serverTimestamp(),
      read: false
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const createUrgentNotification = async (message: string) => {
  if (!auth.currentUser) return;
  await createNotification(auth.currentUser.uid, `URGENT: ${message}`);
};

const HomePage: React.FC = () => {
  const [userName, setUserName] = useState<string>('Dr. Unknown');
  const [doctor, setDoctor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [appointmentsToday, setAppointmentsToday] = useState<number>(0);
  const [patientGrowth, setPatientGrowth] = useState<string>("0%");
  const router = useRouter();

  useEffect(() => {
    const fetchUserName = async () => {
      setIsLoading(true);
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'doctors', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData?.fullName || 'Dr. Unknown');
            setDoctor(userData);
          } else {
            setUserName('Dr. Unknown');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserName();
  }, []);

  const [patientActivities] = useState([
    { id: 1, month: "July", activities: 30 },
    { id: 2, month: "August", activities: 45 },
    { id: 3, month: "September", activities: 50 },
  ]);

  const createDailySummaryNotification = async () => {
    if (!auth.currentUser) return;
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const dailySummaryRef = doc(db, 'dailySummaries', auth.currentUser.uid);
    const dailySummaryDoc = await getDoc(dailySummaryRef);
    if (dailySummaryDoc.exists() && dailySummaryDoc.data().lastSent === todayString) {
      console.log('Daily summary already sent today');
      return;
    }
    await createNotification(
      auth.currentUser.uid,
      `Daily Summary for ${todayString}: You have X appointments today.`
    );
    await setDoc(dailySummaryRef, { lastSent: todayString }, { merge: true });
  };

  useEffect(() => {
    createDailySummaryNotification();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchSessionData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // Fetch sessions for the current doctor
      const sessionsRef = collection(db, 'sessions');
      const sessionsSnapshot = await getDocs(sessionsRef);
      const sessions = sessionsSnapshot.docs.map(doc => doc.data());

      // Calculate total patients
      const totalPatientsSet = new Set();
      sessions.forEach(session => {
        if (session.doctorId === currentUser.uid) {
          totalPatientsSet.add(session.patientId);
        }
      });
      setTotalPatients(totalPatientsSet.size);

      // Calculate appointments today
      const todayAppointments = sessions.filter(session => 
        session.doctorId === currentUser.uid && 
        session.date === todayString
      ).length;
      setAppointmentsToday(todayAppointments);

      // Calculate patient growth
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const lastWeekString = lastWeek.toISOString().split('T')[0];

      const lastWeekSessions = sessions.filter(session => 
        session.doctorId === currentUser.uid && 
        session.date >= lastWeekString && 
        session.date < todayString
      ).length;

      const currentWeekSessions = sessions.filter(session => 
        session.doctorId === currentUser.uid && 
        session.date >= todayString
      ).length;

      const growth = ((currentWeekSessions - lastWeekSessions) / (lastWeekSessions || 1)) * 100;
      setPatientGrowth(`${growth > 0 ? '+' : ''}${growth.toFixed(2)}%`);
    };

    fetchSessionData();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-100 to-blue-300">
      <Navbar />
      <div className="flex-grow flex">
        <Sidebar />
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <main className="p-6 sm:p-10">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-800">Welcome back, {userName}</h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your patients today.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <QuickStatCard icon={<FaUserMd />} title="Total Patients" value={totalPatients.toString()} />
              <QuickStatCard icon={<FaCalendarCheck />} title="Appointments Today" value={appointmentsToday.toString()} />
              <QuickStatCard icon={<FaChartLine />} title="Patient Growth" value={patientGrowth} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <AppointmentCard />
                <CalendarCard />
              </div>
              <div className="space-y-6">
                <PatientActivityCard activities={patientActivities} />
                <ProgressCard />
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

const QuickStatCard: React.FC<{ icon: React.ReactNode; title: string; value: string }> = ({ icon, title, value }) => (
  <div className="bg-white rounded-lg shadow-md p-6 flex items-center transition-all hover:shadow-lg">
    <div className="rounded-full bg-primary-100 p-3 mr-4">{icon}</div>
    <div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-2xl font-bold text-primary-600">{value}</p>
    </div>
  </div>
);

export default HomePage;
