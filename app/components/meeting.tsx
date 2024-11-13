"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FaPhoneSlash } from 'react-icons/fa';

const DoctorMeeting: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  const { user } = useAuth();
  const [patientName, setPatientName] = useState('');

  const meetingUrl = decodeURIComponent(searchParams.get("url") || "");
  const meetingId = meetingUrl.split('/').pop() || '';
  const patientId = searchParams.get("patientId") || "";

  // Fetch patient name
  useEffect(() => {
    const fetchPatientInfo = async () => {
      if (patientId) {
        const patientDoc = await getDoc(doc(db, 'users', patientId));
        if (patientDoc.exists()) {
          setPatientName(patientDoc.data().username || 'Patient');
        }
      }
    };

    fetchPatientInfo();
  }, [patientId]);

  // Load existing notes
  useEffect(() => {
    const loadNotes = async () => {
      if (meetingId) {
        const noteDoc = await getDoc(doc(db, 'meetingNotes', meetingId));
        if (noteDoc.exists()) {
          setSavedNotes(noteDoc.data().notes);
          setNotes(noteDoc.data().notes);
        }
      }
    };
    loadNotes();
  }, [meetingId]);

  const saveNotes = async () => {
    if (!meetingId || !patientId || !user?.uid) {
      alert('Unable to save notes: Missing required information');
      return;
    }

    try {
      const noteData = {
        notes,
        timestamp: serverTimestamp(),
        doctorId: user.uid,
        patientId: patientId,
        meetingUrl: meetingUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'meetingNotes', meetingId), noteData);
      setSavedNotes(notes);
      alert('Notes saved successfully!');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    }
  };

  const handleEndMeeting = () => {
    if (window.confirm('Are you sure you want to end the meeting?')) {
      router.back();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Session with {patientName}</h1>
        <button
          onClick={handleEndMeeting}
          className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <FaPhoneSlash className="mr-2" />
          End Call
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative">
          {meetingUrl ? (
            <iframe
              src={`${meetingUrl}?userName=${encodeURIComponent(user?.email || '')}&cssFile=${encodeURIComponent('/meeting-styles.css')}&showNameField=false&showFullscreenButton=true`}
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className="w-full h-full"
              onLoad={() => setLoading(false)}
            ></iframe>
          ) : (
            <p>Invalid meeting URL.</p>
          )}
        </div>

        {/* Notes Panel */}
        <div className="w-1/4 bg-white shadow-lg p-4 flex flex-col">
          <h3 className="text-lg font-semibold mb-2">Session Notes</h3>
          <textarea
            className="flex-1 p-2 border rounded-lg mb-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter session notes..."
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {savedNotes ? 'Last saved: ' + new Date().toLocaleTimeString() : 'Not saved yet'}
            </span>
            <button
              onClick={saveNotes}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorMeeting;
