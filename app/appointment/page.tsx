'use client';

import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, getDocs, updateDoc, doc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import Sidebar from '../components/sidebar';
import Navbar from '../components/navbar';
import { db } from '../firebase';

interface Appointment {
  id: string;
  patientName: string;
  patientPhotoURL: string;
  dateTime: any; // Firestore Timestamp or ISO String
  type: string;
  isUpcoming: boolean;
  isCompleted: boolean;
  notificationSent: boolean;
}

const createNotification = async (doctorId: string, message: string) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      doctorId,
      message,
      createdAt: serverTimestamp(),
      read: false,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const fetchPatientInfo = async (patientId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', patientId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        patientName: userData?.username || "Unknown",
        patientPhotoURL: userData?.photoURL || "",
      };
    } else {
      return {
        patientName: "Unknown",
        patientPhotoURL: "",
      };
    }
  } catch (error) {
    console.error("Error fetching patient information:", error);
    return {
      patientName: "Unknown",
      patientPhotoURL: "",
    };
  }
};

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

        const appointmentsData: Appointment[] = await Promise.all(
          appointmentsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const patientInfo = await fetchPatientInfo(data.userId);

            return {
              id: doc.id,
              patientName: patientInfo.patientName,
              patientPhotoURL: patientInfo.patientPhotoURL,
              dateTime: data.dateTime,
              type: data.type || "Unknown",
              isUpcoming: data.isUpcoming,
              isCompleted: data.isCompleted,
              notificationSent: data.notificationSent || false,
            };
          })
        );

        setAppointments(appointmentsData);

        // Create notifications for new appointments
        appointmentsSnapshot.docs.forEach(async (doc) => {
          const data = doc.data();
          if (data.isUpcoming && !data.notificationSent) {
            await createNotification(user.uid, `New appointment scheduled with ${data.name}`);
            await updateDoc(doc.ref, { notificationSent: true });
          }
        });
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

  const formatDateTime = (dateTime: any) => {
    if (typeof dateTime === 'string') {
      return new Date(dateTime).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (dateTime?.seconds) {
      return new Date(dateTime.seconds * 1000).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return 'Invalid Date';
  };

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
                            <img
                              src={appointment.patientPhotoURL}
                              alt={`${appointment.patientName} profile`}
                              className="w-16 h-16 rounded-full object-cover mb-4"
                            />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{appointment.patientName}</h3>
                            <p className="text-sm text-gray-500 mt-2">{formatDateTime(appointment.dateTime)}</p>
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
                            <img
                              src={appointment.patientPhotoURL}
                              alt={`${appointment.patientName} profile`}
                              className="w-16 h-16 rounded-full object-cover mb-4"
                            />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{appointment.patientName}</h3>
                            <p className="text-sm text-gray-500 mt-2">{formatDateTime(appointment.dateTime)}</p>
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
