'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { auth, db } from '@/app/firebase'; // Adjust the path to your Firebase configuration
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import 'react-big-calendar/lib/css/react-big-calendar.css';

type Session = {
  dateTime: Timestamp | string | { seconds: number };
  doctorId: string;
  isCompleted: boolean;
  isUpcoming: boolean;
  userId: string;
  sessionId: string;
  type: string;
  // ... other fields
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Session & { patientName: string };
};

type UserData = {
  username: string;
  // add other fields that exist in your user document
};

const localizer = momentLocalizer(moment);

const CalendarCard: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // For loading state
  const [error, setError] = useState<string>(''); // For error handling

  // Get current doctorId
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setDoctorId(user.uid);
      } else {
        setDoctorId(null);
        setError('User not authenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch sessions when doctorId changes
  useEffect(() => {
    if (doctorId) {
      const fetchSessions = async () => {
        try {
          const sessionsRef = collection(db, 'sessions');
          const q = query(sessionsRef, where('doctorId', '==', doctorId));
          const querySnapshot = await getDocs(q);
          
          const fetchedEvents: CalendarEvent[] = await Promise.all(
            querySnapshot.docs.map(async (docSnapshot) => {
              const data = docSnapshot.data() as Session;
              
              // Fetch patient name from users collection
              const userDocRef = doc(db, 'users', data.userId);
              const userDocSnap = await getDoc(userDocRef);
              const userData = userDocSnap.data() as UserData | undefined;
              const patientName = userData?.username || 'Unknown Patient';
              
              let startDate: Date;
              if (data.dateTime instanceof Timestamp) {
                startDate = data.dateTime.toDate();
              } else if (typeof data.dateTime === 'string') {
                startDate = new Date(data.dateTime);
              } else if (typeof data.dateTime === 'object' && 'seconds' in data.dateTime) {
                startDate = new Date(data.dateTime.seconds * 1000);
              } else {
                console.error('Unexpected dateTime format:', data.dateTime);
                startDate = new Date();
              }
              
              const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
              return {
                id: data.sessionId,
                title: `${patientName} - ${data.type}`,
                start: startDate,
                end: endDate,
                resource: { ...data, patientName },
              };
            })
          );
          
          setEvents(fetchedEvents);
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

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const isUpcoming = event.resource.isUpcoming;
    const backgroundColor = isUpcoming ? 'bg-primary-500' : 'bg-accent-500';
    return {
      className: `${backgroundColor} text-white rounded-lg p-1`,
      style: {
        border: 'none',
      },
    };
  };

  const renderEventContent = (event: CalendarEvent) => {
    return (
      <div>
        <div className="font-semibold">{event.resource.patientName}</div>
        <div>{event.resource.type}</div>
        <div>{event.resource.isUpcoming ? 'Upcoming' : 'Previous'}</div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center p-4">Loading appointments...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Appointments</h2>
      <div className="bg-gray-50 rounded-lg p-4" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{
            event: (props) => renderEventContent(props.event),
          }}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          defaultView={Views.MONTH}
          className="rounded-lg overflow-hidden"
          messages={{
            next: "Next",
            previous: "Back",
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day"
          }}
        />
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">{selectedEvent.resource.patientName}</h3>
            <p className="mb-2"><strong>Date:</strong> {moment(selectedEvent.start).format('MMMM D, YYYY')}</p>
            <p className="mb-2"><strong>Time:</strong> {moment(selectedEvent.start).format('h:mm A')} - {moment(selectedEvent.end).format('h:mm A')}</p>
            <p className="mb-2"><strong>Type:</strong> {selectedEvent.resource.type}</p>
            <p className="mb-4"><strong>Status:</strong> {selectedEvent.resource.isUpcoming ? 'Upcoming' : 'Previous'}</p>
            
            {selectedEvent.resource.isUpcoming && (
              <div className="flex space-x-2 mb-4">
                {selectedEvent.resource.type === 'Online' ? (
                  <>
                    <button className="bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition duration-200">
                      Call Now
                    </button>
                    <button className="bg-accent-500 text-white py-2 px-4 rounded-lg hover:bg-accent-600 transition duration-200">
                      Chat
                    </button>
                  </>
                ) : (
                  <button className="bg-accent-500 text-white py-2 px-4 rounded-lg hover:bg-accent-600 transition duration-200">
                    Chat
                  </button>
                )}
              </div>
            )}
            
            <button
              onClick={closeModal}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
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
