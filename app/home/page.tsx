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
import { doc, getDoc, addDoc, collection, serverTimestamp, setDoc } from "firebase/firestore";

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
  const router = useRouter(); 

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;

      if (user) {
        const userDocRef = doc(db, 'doctors', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData?.fullName || 'Dr. Unknown');
        } else {
          setUserName('Dr. Unknown');
        }
      }
    };

    fetchUserName();
  }, []);

  const [upcomingAppointments] = useState([
    {
      id: 1,
      hospital: "Manggis ST Hospital",
      location: "New York, USA",
      date: "14 Mar 2022",
      time: "09:00 PM",
      videoCall: true,
    },
  ]);

  const [patientActivities] = useState([
    { id: 1, month: "July", activities: 30 },
    { id: 2, month: "August", activities: 45 },
    { id: 3, month: "September", activities: 50 },
  ]);

  const [dailyProgress] = useState(80);

  const createDailySummaryNotification = async () => {
    if (!auth.currentUser) return;

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Check if we've already sent a daily summary today
    const dailySummaryRef = doc(db, 'dailySummaries', auth.currentUser.uid);
    const dailySummaryDoc = await getDoc(dailySummaryRef);

    if (dailySummaryDoc.exists() && dailySummaryDoc.data().lastSent === todayString) {
      console.log('Daily summary already sent today');
      return;
    }

    // Create the daily summary notification
    await createNotification(
      auth.currentUser.uid,
      `Daily Summary for ${todayString}: You have X appointments today.`
    );

    // Update the last sent date
    await setDoc(dailySummaryRef, { lastSent: todayString }, { merge: true });
  };

  useEffect(() => {
    createDailySummaryNotification();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex-grow flex">
        <Sidebar />

     <div className="flex flex-col w-full">
     <main className="flex-grow p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Hi, {userName}</h1> 
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <AppointmentCard />
              <CalendarCard />
            </div>

            <div className="lg:col-span-1 space-y-8">
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

export default HomePage;
