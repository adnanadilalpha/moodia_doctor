'use client';

import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import Sidebar from '../components/sidebar';
import Navbar from '../components/navbar';

interface Appointment {
  id: string;
  name: string;
  specialization: string;
  dateTime: any; // Firestore Timestamp
  type: string;
  isUpcoming: boolean;
  isCompleted: boolean;
}

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const firestore = getFirestore();

  useEffect(() => {
    const fetchAppointments = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const appointmentsQuery = query(
          collection(firestore, 'sessions'),
          where('doctorId', '==', user.uid),
          orderBy('dateTime', 'asc')
        );

        const appointmentsSnapshot = await getDocs(appointmentsQuery);

        setAppointments(
          appointmentsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "Unknown",  // Handle missing or empty names
              specialization: data.specialization || "N/A",
              dateTime: data.dateTime,
              type: data.type || "Unknown",
              isUpcoming: data.isUpcoming,
              isCompleted: data.isCompleted,
            };
          }) as Appointment[]
        );
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [auth, firestore]);

  const upcomingAppointments = appointments.filter(appointment => appointment.isUpcoming);
  const pastAppointments = appointments.filter(appointment => !appointment.isUpcoming);

  return (
    <div className='flex flex-col min-h-screen bg-gray-100'>
      <Navbar />
      <div className="flex-grow flex">
      <Sidebar patientId='' />
        <div className='p-8'>
          <h1 className='text-4xl font-bold text-black mb-8'>Appointments</h1>

          {loading ? (
            <div className="text-center text-xl text-gray-500">Loading appointments...</div>
          ) : (
            <>
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-green-600 mb-4">Upcoming Appointments</h2>
                {upcomingAppointments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingAppointments.map(appointment => (
                      <div key={appointment.id} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
                        <div className="flex flex-col justify-between h-full">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{appointment.name}</h3>
                            <p className="text-sm text-gray-500">{appointment.specialization}</p>
                            <p className="text-sm text-gray-500 mt-2">{new Date(appointment.dateTime.toDate()).toLocaleString()}</p>
                            <p className={`text-sm font-medium mt-1 ${appointment.type === 'Online' ? 'text-blue-500' : 'text-yellow-500'}`}>
                              {appointment.type === 'Online' ? 'Online Session' : 'In-Person Session'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No upcoming appointments.</p>
                )}
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-600 mb-4">Past Appointments</h2>
                {pastAppointments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastAppointments.map(appointment => (
                      <div key={appointment.id} className="bg-gray-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
                        <div className="flex flex-col justify-between h-full">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{appointment.name}</h3>
                            <p className="text-sm text-gray-500">{appointment.specialization}</p>
                            <p className="text-sm text-gray-500 mt-2">{new Date(appointment.dateTime.toDate()).toLocaleString()}</p>
                            <p className={`text-sm font-medium mt-1 ${appointment.type === 'Online' ? 'text-blue-500' : 'text-yellow-500'}`}>
                              {appointment.type === 'Online' ? 'Online Session' : 'In-Person Session'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No past appointments.</p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
