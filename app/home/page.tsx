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
import { doc, getDoc, addDoc, collection, serverTimestamp, setDoc, getDocs, onSnapshot, query, where, updateDoc } from "firebase/firestore";
import { FaUserMd, FaCalendarCheck, FaChartLine } from 'react-icons/fa';

const createNotification = async (
  doctorId: string,
  message: string,
  type: 'message' | 'session' | 'update' | 'daily_summary',
  options?: {
    priority?: 'low' | 'medium' | 'high';
    relatedId?: string;
    metadata?: { [key: string]: any };
  }
) => {
  try {
    // Check doctor's notification preferences
    const doctorRef = doc(db, 'doctors', doctorId);
    const doctorDoc = await getDoc(doctorRef);
    const notificationPrefs = doctorDoc.data()?.notificationPreferences || {};

    // Only create notification if the doctor hasn't disabled this type
    if (notificationPrefs[type] !== false) {
      const notification = {
        doctorId,
        message,
        type,
        createdAt: serverTimestamp(),
        read: false,
        priority: options?.priority || 'low',
        relatedId: options?.relatedId,
        metadata: options?.metadata || {}
      };

      await addDoc(collection(db, 'notifications'), notification);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const createUrgentNotification = async (message: string) => {
  if (!auth.currentUser) return;
  await createNotification(
    auth.currentUser.uid,
    `URGENT: ${message}`,
    'update',
    { priority: 'high' }
  );
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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoading(true);
      try {
        if (user) {
          const userDocRef = doc(db, 'doctors', user.uid);
          // Set up real-time listener
          const unsubscribeDoc = onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const userData = docSnapshot.data();
              setUserName(userData?.fullName || 'Dr. Unknown');
              setDoctor(userData);
            } else {
              setUserName('Dr. Unknown');
            }
            setIsLoading(false);
          });

          // Clean up doc listener when auth state changes
          return () => unsubscribeDoc();
        } else {
          setUserName('Dr. Unknown');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    });

    // Clean up auth listener on component unmount
    return () => unsubscribe();
  }, []); // Empty dependency array since we want this to run once on mount

  const [patientActivities] = useState([
    { id: 1, month: "July", activities: 30 },
    { id: 2, month: "August", activities: 45 },
    { id: 3, month: "September", activities: 50 },
  ]);

  const createDailySummaryNotification = async () => {
    if (!auth.currentUser) return;
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Check if summary was already sent today
    const dailySummaryRef = doc(db, 'dailySummaries', auth.currentUser.uid);
    const dailySummaryDoc = await getDoc(dailySummaryRef);
    if (dailySummaryDoc.exists() && dailySummaryDoc.data().lastSent === todayString) {
      console.log('Daily summary already sent today');
      return;
    }

    try {
      // Get today's appointments
      const sessionsRef = collection(db, 'sessions');
      const sessionsQuery = query(
        sessionsRef,
        where('doctorId', '==', auth.currentUser.uid),
        where('date', '==', todayString)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const appointmentsToday = sessionsSnapshot.docs.length;

      // Get unread messages
      const chatsRef = collection(db, 'chats');
      const chatsQuery = query(
        chatsRef,
        where('doctorId', '==', auth.currentUser.uid),
        where('unreadMessages', '>', 0)
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      const unreadMessages = chatsSnapshot.docs.reduce(
        (total, doc) => total + (doc.data().unreadMessages || 0),
        0
      );

      // Only create notification if there's something to report
      if (appointmentsToday > 0 || unreadMessages > 0) {
        let summaryMessage = 'Daily Summary: ';
        const summaryParts = [];

        if (appointmentsToday > 0) {
          summaryParts.push(`${appointmentsToday} appointment${appointmentsToday > 1 ? 's' : ''} today`);
        }
        
        if (unreadMessages > 0) {
          summaryParts.push(`${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}`);
        }

        summaryMessage += summaryParts.join(' and ');

        await createNotification(
          auth.currentUser.uid,
          summaryMessage,
          'daily_summary',
          {
            priority: 'medium',
            metadata: {
              appointmentsToday,
              unreadMessages,
              date: todayString
            }
          }
        );
      }

      // Update last sent date regardless of whether we sent a notification
      await setDoc(dailySummaryRef, { lastSent: todayString }, { merge: true });
      
    } catch (error) {
      console.error('Error creating daily summary:', error);
    }
  };

  // Update the useEffect to run the summary at a specific time
  useEffect(() => {
    const checkAndCreateDailySummary = async () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Only create summary during morning hours (e.g., between 7 AM and 9 AM)
      if (hour >= 7 && hour <= 9) {
        await createDailySummaryNotification();
      }
    };

    checkAndCreateDailySummary();

    // Set up interval to check every hour
    const interval = setInterval(checkAndCreateDailySummary, 3600000); // 1 hour in milliseconds

    return () => clearInterval(interval);
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

  const setupAppointmentNotifications = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('No authenticated user found');
      return;
    }

    // Create a query for sessions with the current doctor's ID
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('doctorId', '==', currentUser.uid),
      where('notificationSent', '!=', true) // Add this field to track if notification was sent
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const sessionData = change.doc.data();
          
          try {
            // Fetch patient details
            const patientRef = doc(db, 'users', sessionData.patientId);
            const patientDoc = await getDoc(patientRef);
            const patientData = patientDoc.data();
            const patientName = patientData?.username || 'Patient';

            // Format date and time
            const sessionDate = new Date(sessionData.dateTime.seconds * 1000);
            const formattedDate = sessionDate.toLocaleDateString();
            const formattedTime = sessionDate.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            });

            // Create notification with patient's name and session details
            await createNotification(
              currentUser.uid,  // Use the stored currentUser reference
              `New appointment scheduled with ${patientName} for ${formattedDate} at ${formattedTime}`,
              'session',
              {
                priority: 'high',
                relatedId: change.doc.id,
                metadata: {
                  patientId: sessionData.patientId,
                  patientName,
                  sessionDate: sessionDate.toISOString(),
                  sessionType: sessionData.type
                }
              }
            );

            // Mark notification as sent
            await updateDoc(doc(sessionsRef, change.doc.id), {
              notificationSent: true
            });
          } catch (error) {
            console.error('Error processing new appointment notification:', error);
          }
        }
      });
    });

    // Return unsubscribe function
    return unsubscribe;
  };

  // Add a new useEffect to handle appointment notifications
  useEffect(() => {
    const unsubscribe = setupAppointmentNotifications();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array since we only want to set up the listener once

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
