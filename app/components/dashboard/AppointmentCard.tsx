"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaVideo, FaComments, FaCheck, FaBan } from "react-icons/fa";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

interface AppointmentProps {
  username: string;
  type: string;
  date: string;
  time: string;
  videoCall: boolean;
  sessionId: string;
  patientId: string;
  meetingUrl: string;
}

const createNotification = async (doctorId: string, message: string) => {
  try {
    await addDoc(collection(db, "notifications"), {
      doctorId,
      message,
      createdAt: serverTimestamp(),
      read: false,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

const AppointmentCard: React.FC = () => {
  const [appointment, setAppointment] = useState<AppointmentProps | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const fetchUpcomingAppointment = () => {
          const q = query(
            collection(db, "sessions"),
            where("doctorId", "==", user.uid),
            where("isUpcoming", "==", true),
            where("isCompleted", "==", false),
            orderBy("dateTime", "asc"),
            limit(1)
          );

          const unsubscribeSnapshot = onSnapshot(q, async (querySnapshot) => {
            if (!querySnapshot.empty) {
              const docSnapshot = querySnapshot.docs[0];
              const data = docSnapshot.data();

              let date: Date | null = null;
              if (typeof data.dateTime === "string") {
                date = new Date(data.dateTime);
              } else if (data.dateTime?.toDate) {
                date = data.dateTime.toDate();
              }

              const patientId = data.userId;
              let patientName = "Patient";
              if (patientId) {
                const userDocRef = doc(db, "users", patientId);
                const userDocSnapshot = await getDoc(userDocRef);
                if (userDocSnapshot.exists()) {
                  const userData = userDocSnapshot.data();
                  patientName = userData.username || userData.name || "Patient";
                }
              }

              setAppointment({
                username: patientName,
                type: data.type === "Online" ? "Online" : "In-Person",
                date: date
                  ? date.toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })
                  : "No Date",
                time: date
                  ? date.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "No Time",
                videoCall: data.type === "Online",
                sessionId: docSnapshot.id,
                patientId: data.userId,
                meetingUrl: data.meetingUrl || "",
              });
            } else {
              setAppointment(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Error fetching appointment:", error);
            setLoading(false);
          });

          return unsubscribeSnapshot;
        };

        const unsubscribeSnapshot = fetchUpcomingAppointment();
        return () => {
          unsubscribeSnapshot();
        };
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [auth]);

  const handleStartCall = async () => {
    if (appointment && appointment.meetingUrl) {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        await createNotification(
          auth.currentUser?.uid || "",
          `Video call started with ${appointment.username}`
        );
        router.push(`/meeting?url=${encodeURIComponent(appointment.meetingUrl)}&patientId=${appointment.patientId}`);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Please allow access to camera and microphone to start the call.");
      }
    } else {
      alert("Unable to start the call. Meeting URL is missing.");
    }
  };

  const handleCompleteSession = async () => {
    if (appointment) {
      try {
        const sessionRef = doc(db, "sessions", appointment.sessionId);
        await updateDoc(sessionRef, { 
          isCompleted: true, 
          isUpcoming: false,
          status: 'completed'
        });
        await createNotification(
          auth.currentUser?.uid || "",
          `Session completed with ${appointment.username}`
        );
      } catch (error) {
        console.error("Error marking session as complete:", error);
      }
    }
  };

  const handleCancelAppointment = async () => {
    if (appointment) {
      try {
        const sessionRef = doc(db, "sessions", appointment.sessionId);
        await updateDoc(sessionRef, { 
          isUpcoming: false, 
          isCompleted: false,
          status: "Cancelled" 
        });
        await createNotification(
          auth.currentUser?.uid || "",
          `Appointment with ${appointment.username} has been cancelled`
        );
      } catch (error) {
        console.error("Error cancelling appointment:", error);
      }
    }
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
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Upcoming Appointment</h2>
        <p className="text-gray-600 mb-2">Patient: {appointment.username}</p>
        <p className="text-gray-600">Location: {appointment.type}</p>
        <span className="text-gray-600">{appointment.date}, {appointment.time}</span>
      </div>
      <div className="flex items-center justify-between mt-4 space-x-4">
        <div className="flex items-center space-x-2">
          {appointment?.videoCall && (
            <button
              onClick={handleStartCall}
              className="bg-green-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2"
            >
              <FaVideo />
              <span>Video Call</span>
            </button>
          )}
          <button
            onClick={() => router.push(`/chat?chatId=${appointment?.sessionId}`)}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2"
          >
            <FaComments />
            <span>Chat</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCompleteSession}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2"
          >
            <FaCheck />
            <span>Complete</span>
          </button>
          <button
            onClick={handleCancelAppointment}
            className="bg-red-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2"
          >
            <FaBan />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
