'use client';

import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc, 
  doc, 
  addDoc, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore';
import Sidebar from '../components/sidebar';
import Navbar from '../components/navbar';
import { db } from '../firebase';
import { Button } from '../components/ui/button';
import { AvailabilityModal } from '../components/AvailabilityModal';

interface DaySchedule {
  start: string;
  end: string;
  enabled: boolean;
}

interface Availability {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface Appointment {
  id: string;
  patientName: string;
  patientPhotoURL: string;
  dateTime: any;
  type: string;
  isUpcoming: boolean;
  isCompleted: boolean;
  notificationSent: boolean;
  status: 'scheduled' | 'completed' | 'cancelled';
  userId: string;
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

const updateAppointmentStatus = async (
  appointmentId: string, 
  status: 'completed' | 'cancelled',
  patientId: string
) => {
  try {
    await updateDoc(doc(db, 'sessions', appointmentId), {
      status,
      isUpcoming: false,
      isCompleted: status === 'completed'
    });

    // Send notification to patient
    const message = status === 'completed' 
      ? 'Your appointment has been marked as completed'
      : 'Your appointment has been cancelled';
    
    await addDoc(collection(db, 'notifications'), {
      userId: patientId,
      message,
      createdAt: serverTimestamp(),
      read: false,
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
};

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [patientInfoCache, setPatientInfoCache] = useState<{[key: string]: {
    patientName: string;
    patientPhotoURL: string;
  }}>({});

  const auth = getAuth();
  const firestore = getFirestore();

  const getPatientInfo = async (patientId: string) => {
    if (patientInfoCache[patientId]) {
      return patientInfoCache[patientId];
    }

    const info = await fetchPatientInfo(patientId);
    setPatientInfoCache(prev => ({
      ...prev,
      [patientId]: info
    }));
    return info;
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const appointmentsQuery = query(
      collection(firestore, 'sessions'),
      where('doctorId', '==', user.uid),
      orderBy('dateTime', 'asc')
    );

    const unsubscribe = onSnapshot(appointmentsQuery, async (snapshot) => {
      const appointmentsPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const patientInfo = await getPatientInfo(data.userId);

        return {
          id: doc.id,
          patientName: patientInfo.patientName,
          patientPhotoURL: patientInfo.patientPhotoURL,
          dateTime: data.dateTime,
          type: data.type || "Unknown",
          isUpcoming: data.isUpcoming,
          isCompleted: data.isCompleted,
          notificationSent: data.notificationSent || false,
          status: data.status || 'scheduled',
          userId: data.userId,
        };
      });

      const appointmentsData = await Promise.all(appointmentsPromises);
      setAppointments(appointmentsData);
      setLoading(false);

      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.isUpcoming && !data.notificationSent) {
            await createNotification(user.uid, `New appointment scheduled with ${data.name}`);
            await updateDoc(change.doc.ref, { notificationSent: true });
          }
        }
      });
    }, (error) => {
      console.error("Error fetching appointments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  const handleComplete = async (appointment: Appointment) => {
    try {
      await updateDoc(doc(firestore, 'sessions', appointment.id), {
        status: 'completed',
        isUpcoming: false,
        isCompleted: true
      });

      await addDoc(collection(firestore, 'notifications'), {
        userId: appointment.userId,
        message: 'Your appointment has been marked as completed',
        createdAt: serverTimestamp(),
        read: false,
      });
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
  };

  const handleCancel = async (appointment: Appointment) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await updateDoc(doc(firestore, 'sessions', appointment.id), {
          status: 'cancelled',
          isUpcoming: false,
          isCompleted: false
        });

        await addDoc(collection(firestore, 'notifications'), {
          userId: appointment.userId,
          message: 'Your appointment has been cancelled',
          createdAt: serverTimestamp(),
          read: false,
        });
      } catch (error) {
        console.error('Error cancelling appointment:', error);
      }
    }
  };

  const upcomingAppointments = React.useMemo(() => 
    appointments.filter(appointment => appointment.isUpcoming),
    [appointments]
  );

  const pastAppointments = React.useMemo(() => 
    appointments.filter(appointment => !appointment.isUpcoming),
    [appointments]
  );

  const formatDateTime = (dateTime: any) => {
    if (typeof dateTime === 'string') {
      return new Date(dateTime).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (dateTime?.seconds) {
      return new Date(dateTime.seconds * 1000).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return 'Invalid Date';
  };

  const AppointmentCard = React.memo(({ appointment }: { appointment: Appointment }) => (
    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
      <div className="flex flex-col justify-between h-full">
        <div>
          <img
            src={appointment.patientPhotoURL}
            alt={`${appointment.patientName} profile`}
            className="w-16 h-16 rounded-full object-cover mb-4"
          />
          <h3 className="text-xl font-bold text-gray-800 mb-2">{appointment.patientName}</h3>
          <p className="text-sm text-gray-500 mt-2">{formatDateTime(appointment.dateTime)}</p>
          <p className={`text-sm font-medium mt-1 ${
            appointment.type === 'Online' ? 'text-blue-500' : 'text-yellow-500'
          }`}>
            {appointment.type === 'Online' ? 'Online Session' : 'In-Person Session'}
          </p>
          <p className={`text-sm font-medium mt-1 ${
            appointment.status === 'scheduled' ? 'text-green-500' :
            appointment.status === 'completed' ? 'text-blue-500' : 'text-red-500'
          }`}>
            Status: {appointment.status}
          </p>
        </div>
        
        {appointment.isUpcoming && (
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={() => handleComplete(appointment)}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Complete
            </Button>
            <Button 
              onClick={() => handleCancel(appointment)}
              variant="destructive"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  ));

  return (
    <div className='flex flex-col min-h-screen bg-gradient-to-r from-blue-100 to-blue-300'>
      <Navbar />
      <div className="flex-grow flex">
        <Sidebar patientId='' />
        <div className='p-8 w-full'>
          <div className="flex justify-between items-center mb-8">
            <h1 className='text-4xl font-bold text-black'>Appointments</h1>
            <Button 
              onClick={() => setShowAvailabilityModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Set Availability
            </Button>
          </div>

          <div>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-green-600 mb-4">Upcoming Appointments</h2>
              {upcomingAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingAppointments.map(appointment => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
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
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No past appointments.</p>
              )}
            </section>
          </div>
        </div>
      </div>
      
      {showAvailabilityModal && (
        <AvailabilityModal 
          onClose={() => setShowAvailabilityModal(false)}
          onSave={async (availability: Availability) => {
            // Handle saving availability
            setShowAvailabilityModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Appointments;
