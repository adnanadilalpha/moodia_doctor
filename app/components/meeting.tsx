"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const DoctorMeeting: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const { user } = useAuth();

  // Get URL parameters
  const meetingUrl = decodeURIComponent(searchParams.get("url") || "");
  const meetingId = meetingUrl.split('/').pop() || '';
  const patientId = searchParams.get("patientId") || "";

  // Debug logging
  useEffect(() => {
    console.log('Patient ID from URL:', patientId);
    console.log('Meeting ID:', meetingId);
    console.log('Doctor ID:', user?.uid);
  }, [patientId, meetingId, user]);

  useEffect(() => {
    // Load existing notes when component mounts
    const loadNotes = async () => {
      if (meetingId) {
        try {
          const noteDoc = await getDoc(doc(db, 'meetingNotes', meetingId));
          if (noteDoc.exists()) {
            console.log('Loaded note data:', noteDoc.data()); // Debug log
            setSavedNotes(noteDoc.data().notes);
            setNotes(noteDoc.data().notes);
          }
        } catch (error) {
          console.error('Error loading notes:', error);
        }
      }
    };
    loadNotes();
  }, [meetingId]);

  const saveNotes = async () => {
    if (!meetingId || !patientId || !user?.uid) {
      console.error('Missing required information:', {
        meetingId,
        patientId,
        doctorId: user?.uid
      });
      alert('Unable to save notes: Missing required information');
      return;
    }

    try {
      const noteData = {
        notes,
        timestamp: new Date().toISOString(),
        doctorId: user.uid,
        patientId: patientId, // Make sure patientId is included
        meetingUrl: meetingUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Saving note data:', noteData); // Debug log

      await setDoc(doc(db, 'meetingNotes', meetingId), noteData);
      setSavedNotes(notes);
      
      // Verify the save
      const savedDoc = await getDoc(doc(db, 'meetingNotes', meetingId));
      console.log('Verified saved data:', savedDoc.data()); // Debug log
      
      alert('Notes saved successfully!');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    }
  };

  // Add validation for required parameters
  useEffect(() => {
    if (!meetingUrl || !patientId) {
      alert("Missing required information");
      router.back();
    }
  }, [meetingUrl, patientId, router]);

  const customizedMeetingUrl = `${meetingUrl}?userName=${encodeURIComponent(user?.email || '')}&cssFile=${encodeURIComponent('/meeting-styles.css')}&showNameField=false&showFullscreenButton=true`;

  useEffect(() => {
    if (!meetingUrl) {
      alert("Meeting URL is missing");
      router.back();
    }
  }, [meetingUrl, router]);

  const handleEndMeeting = () => {
    router.back();
  };

  const toggleMute = () => {
    const iframe = document.querySelector('iframe');
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ action: 'toggle-mute' }, '*');
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    const iframe = document.querySelector('iframe');
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ action: 'toggle-video' }, '*');
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <div className="flex-1 relative">
        {meetingUrl ? (
          <iframe
            src={customizedMeetingUrl}
            allow="camera; microphone; fullscreen; speaker; display-capture"
            className="w-full h-full rounded-lg shadow-lg"
            onLoad={() => setLoading(false)}
            title="One on One Session"
          ></iframe>
        ) : (
          <p>Invalid meeting URL.</p>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white mt-4">Loading meeting...</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-full md:w-1/3 p-6 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Patient Notes
            {patientId && (
              <span className="text-sm text-gray-500 ml-2">
                Patient ID: {patientId.slice(0, 6)}...
              </span>
            )}
          </h3>
          <textarea
            className="flex-1 p-4 border border-gray-200 rounded-lg mb-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter patient notes here..."
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {savedNotes ? 'Last saved: ' + new Date().toLocaleTimeString() : 'Not saved yet'}
            </span>
            <button
              onClick={saveNotes}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              disabled={!patientId || !user?.uid}
            >
              Save Notes
            </button>
          </div>
          {/* Debug information - remove in production */}
          <div className="mt-2 text-xs text-gray-400">
            Patient ID: {patientId}<br />
            Meeting ID: {meetingId}<br />
            Doctor ID: {user?.uid}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorMeeting;
