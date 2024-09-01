"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';
import { FaVideo } from 'react-icons/fa';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';

interface AppointmentProps {
  username: string;
  type: string;
  date: string;
  time: string;
  videoCall: boolean;
  sessionId: string; // Add sessionId to easily identify and update the session
}

const AppointmentCard: React.FC = () => {
  const [appointment, setAppointment] = useState<AppointmentProps | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchUpcomingAppointment = async (userId: string) => {
      console.log(`Fetching appointments for doctorId: ${userId}`);
      
      const q = query(
        collection(db, "sessions"),
        where("doctorId", "==", userId),
        where("isUpcoming", "==", true),
        where("isCompleted", "==", false), // Ensure we only fetch incomplete sessions
        orderBy("dateTime", "asc"),
        limit(1) // Get the closest upcoming appointment
      );

      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          console.log("Found upcoming appointment.");
          const doc = querySnapshot.docs[0];
          const data = doc.data();

          // Fetch user data based on the userId from the session
          const userQuery = query(
            collection(db, "users"),
            where("userId", "==", data.userId),
            limit(1) // Since userId is unique, limit to 1
          );

          const userDocSnapshot = await getDocs(userQuery);
          const userData = userDocSnapshot.docs[0]?.data();

          setAppointment({
            username: userData?.username || "Dr", // Fallback to "Unknown" if no name is found
            type: data.type === "Online" ? "Online" : "In-Person",
            date: new Date(data.dateTime.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
            time: new Date(data.dateTime.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            videoCall: data.type === "Online",
            sessionId: doc.id, // Store the sessionId for later use
          });
        } else {
          console.log("No upcoming appointments found.");
        }
      } catch (error) {
        console.error("Error fetching appointment: ", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(`User logged in: ${user.uid}`);
        fetchUpcomingAppointment(user.uid);
      } else {
        console.error("No user is currently logged in.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  const handleStartCall = () => {
    // Mark the session as completed once the video call is finished
    const completeSession = async () => {
      if (appointment) {
        try {
          const sessionRef = doc(db, "sessions", appointment.sessionId);
          await updateDoc(sessionRef, { isCompleted: true, isUpcoming: false });
          console.log("Session marked as completed.");
        } catch (error) {
          console.error("Error updating session status: ", error);
        }
      }
    };

    // Simulate video call navigation and mark as complete after some time
    router.push('/agora'); // Navigate to the video call page
    setTimeout(completeSession, 5000); // Mark the session as complete after 5 seconds
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
        <FaVideo size={32} className="text-gray-500" />
        <p className="text-gray-600">No upcoming appointments found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Upcoming Appointment</h2>
        <p className="text-gray-600 mb-2">Patient: {appointment.username}</p>
        <p className="text-gray-600">Location: {appointment.type}</p>
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-gray-600">{appointment.date}, {appointment.time}</span>
        {appointment.videoCall && (
          <button onClick={handleStartCall} className="bg-green-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2">
            <FaVideo />
            <span>Video Call</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;