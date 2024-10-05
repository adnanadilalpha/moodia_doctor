'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/app/firebase'; // Adjust the path to your Firebase configuration
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventInput, EventApi } from '@fullcalendar/core';

type Session = {
  dateTime: Timestamp;
  doctorId: string;
  isCompleted: boolean;
  isUpcoming: boolean;
  name: string;
  sessionId: string;
  specialization: string;
  type: string;
  userId: string;
};

const CalendarCard: React.FC = () => {
  const [currentEvents, setCurrentEvents] = useState<EventInput[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null);
  const [doctorId, setDoctorId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true); // For loading state

  const [error, setError] = useState<string>(''); // For error handling

  // Get current doctorId
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setDoctorId(user.uid);
      } else {
        // Redirect to login if not authenticated
        // router.push('/login');
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch sessions when doctorId changes
  useEffect(() => {
    if (doctorId) {
      // Fetch sessions
      const fetchSessions = async () => {
        try {
          const sessionsRef = collection(db, 'sessions');
          const q = query(sessionsRef, where('doctorId', '==', doctorId));
          const querySnapshot = await getDocs(q);
          const events: EventInput[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data() as Session;
            // Map the session data to EventInput
            const event: EventInput = {
              id: data.sessionId,
              title: `${data.name} - ${data.type}`,
              start: new Date(data.dateTime.seconds * 1000), // Convert Timestamp to Date
              extendedProps: {
                ...data, // Include all data for easy access in modal
              },
            };
            events.push(event);
          });
          setCurrentEvents(events);
        } catch (error) {
          console.error('Error fetching sessions:', error);
          setError('Failed to load appointments. Please try again later.');
        } finally {
          setLoading(false);
        }
      };
      fetchSessions();
    }
  }, [doctorId]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedEvent(null);
  };

  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="flex flex-col text-xs md:text-sm">
        <strong>{eventInfo.timeText}</strong>
        <span>{eventInfo.event.title}</span>
      </div>
    );
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Appointments</h2>
      <div className="bg-gray-50 rounded-lg p-4">
        {loading ? (
          <p>Loading appointments...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={currentEvents}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height="auto"
            eventDisplay="block"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth',
            }}
            contentHeight="auto"
            aspectRatio={1.5}
          />
        )}
      </div>

      {/* Modal for displaying appointment details */}
      {modalIsOpen && selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedEvent.extendedProps?.name}</h2>
            <p className="text-base mb-2">
              <strong>Date and Time:</strong>{' '}
              {formatDateTime(selectedEvent.start as Date)}
            </p>
            <p className="text-base mb-2">
              <strong>Session Type:</strong> {selectedEvent.extendedProps?.type}
            </p>
            <p className="text-base mb-2">
              <strong>Specialization:</strong>{' '}
              {selectedEvent.extendedProps?.specialization}
            </p>

            <button
              onClick={closeModal}
              className="mt-6 px-4 py-2 bg-primary text-black rounded hover:bg-primary-dark w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarCard;
