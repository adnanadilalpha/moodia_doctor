"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaVideo, FaComments, FaPhoneSlash } from "react-icons/fa";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  doc,
  addDoc,
} from "firebase/firestore";

interface AppointmentProps {
  username: string;
  type: string;
  date: string;
  time: string;
  videoCall: boolean;
  sessionId: string;
  patientId: string;
  meetingUrl: string; // Meeting URL from Firebase session data
}

const AppointmentCard: React.FC = () => {
  const [appointment, setAppointment] = useState<AppointmentProps | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchUpcomingAppointment = async (userId: string) => {
      const q = query(
        collection(db, "sessions"),
        where("doctorId", "==", userId),
        where("isUpcoming", "==", true),
        where("isCompleted", "==", false),
        orderBy("dateTime", "asc"),
        limit(1)
      );

      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnapshot = querySnapshot.docs[0];
          const data = docSnapshot.data();

          // Fetch patient data based on the `userId` from the session
          const userQuery = query(
            collection(db, "users"),
            where("userId", "==", data.userId),
            limit(1)
          );
          const userDocSnapshot = await getDocs(userQuery);
          const userData = userDocSnapshot.docs[0]?.data();

          setAppointment({
            username: userData?.username || "Unknown Patient",
            type: data.type === "Online" ? "Online" : "In-Person",
            date: new Date(data.dateTime.toDate()).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            }),
            time: new Date(data.dateTime.toDate()).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            videoCall: data.type === "Online",
            sessionId: docSnapshot.id,
            patientId: data.userId,
            meetingUrl: data.meetingUrl || "", // Fetching the meetingUrl
          });
        } else {
          setAppointment(null); // No upcoming appointments
        }
      } catch (error) {
        console.error("Error fetching appointment:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUpcomingAppointment(user.uid); // Fetch based on current logged-in doctor (userId)
      } else {
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [auth, db]);

  // Handle starting the video call and ensuring camera/mic permissions
  const handleStartCall = () => {
    if (appointment && appointment.meetingUrl) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(() => {
          router.push(`/meeting?url=${encodeURIComponent(appointment.meetingUrl)}`);
        })
        .catch((error) => {
          console.error("Error accessing media devices:", error);
          alert("Please allow access to camera and microphone to start the call.");
        });
    } else {
      console.error("Meeting URL is missing.");
      alert("Unable to start the call. Meeting URL is missing.");
    }
  };
  

  const handleStartChat = async () => {
    if (!appointment) return;

    const chatRef = collection(db, "chats");
    const q = query(
      chatRef,
      where("doctorId", "==", auth.currentUser?.uid),
      where("patientId", "==", appointment.patientId),
      limit(1)
    );

    try {
      const querySnapshot = await getDocs(q);
      let chatId: string;

      if (!querySnapshot.empty) {
        // Chat already exists
        chatId = querySnapshot.docs[0].id;
      } else {
        // Create a new chat if it doesn't exist
        const newChatRef = await addDoc(collection(db, "chats"), {
          doctorId: auth.currentUser?.uid,
          patientId: appointment.patientId,
          createdAt: new Date(),
          lastMessage: "", // Initialize empty message
          unreadMessages: 0,
        });
        chatId = newChatRef.id;
      }

      // Navigate to the chat page with the chatId
      router.push(`/message/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const handleCompleteInPersonSession = async () => {
    if (appointment) {
      try {
        const sessionRef = doc(db, "sessions", appointment.sessionId);
        await updateDoc(sessionRef, { isCompleted: true, isUpcoming: false });
        alert("Session marked as completed.");
        setAppointment(null);
      } catch (error) {
        console.error("Error marking in-person session as complete:", error);
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
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Upcoming Appointment</h2>
        <p className="text-gray-600 mb-2">Patient: {appointment.username}</p>
        <p className="text-gray-600">Location: {appointment.type}</p>
      </div>
      <div className="flex items-center justify-between mt-4 space-x-4">
        <span className="text-gray-600">
          {appointment.date}, {appointment.time}
        </span>
        <div className="flex space-x-4">
          {appointment.videoCall ? (
            <button
              onClick={handleStartCall}
              className="bg-green-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2"
            >
              <FaVideo />
              <span>Video Call</span>
            </button>
          ) : (
            <button
              onClick={handleCompleteInPersonSession}
              className="bg-yellow-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2"
            >
              <span>Complete In-Person</span>
            </button>
          )}
          <button
            onClick={handleStartChat}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2"
          >
            <FaComments />
            <span>Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
