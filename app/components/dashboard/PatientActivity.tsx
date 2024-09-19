'use client';

import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { auth, db } from '@/app/firebase'; // Adjust the path to your Firebase configuration
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import 'chart.js/auto'; // Required for chart.js to work correctly

interface Session {
  dateTime: Timestamp;
  doctorId: string;
  isCompleted: boolean;
  isUpcoming: boolean;
}

interface Activity {
  id: number;
  month: string;
  activities: number;
}

interface PatientActivityProps {
  activities: Activity[]; // Ensure activities prop is an array of Activity objects
}

const PatientActivityCard: React.FC<PatientActivityProps> = () => {
  const [doctorId, setDoctorId] = useState<string>('');
  const [pastSessionsCount, setPastSessionsCount] = useState<number>(0);
  const [upcomingSessionsCount, setUpcomingSessionsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Get current doctorId
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setDoctorId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch session data from Firebase
  useEffect(() => {
    if (doctorId) {
      const fetchSessions = async () => {
        try {
          const sessionsRef = collection(db, 'sessions');
          const q = query(sessionsRef, where('doctorId', '==', doctorId));
          const querySnapshot = await getDocs(q);

          let pastCount = 0;
          let upcomingCount = 0;

          querySnapshot.forEach((doc) => {
            const data = doc.data() as Session;
            if (data.isUpcoming) {
              upcomingCount++;
            } else {
              pastCount++;
            }
          });

          setPastSessionsCount(pastCount);
          setUpcomingSessionsCount(upcomingCount);
        } catch (error) {
          console.error('Error fetching sessions:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSessions();
    }
  }, [doctorId]);

  // Data for the Doughnut chart
  const data = {
    labels: ['Past Sessions', 'Upcoming Sessions'],
    datasets: [
      {
        label: 'Session Breakdown',
        data: [pastSessionsCount, upcomingSessionsCount],
        backgroundColor: ['#F59E0B', '#86EFAC'], // yellow-500 and primary color
        hoverBackgroundColor: ['#F59E0B', '#4ADE80'], // yellow-500 and a slightly darker shade for hover
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as 'bottom', // Explicitly setting 'bottom'
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Total Patient Activity</h2>
      <p className="text-gray-600">Today, {new Date().toLocaleDateString()}</p>

      {loading ? (
        <p>Loading session data...</p>
      ) : (
        <div className="h-64">
          <Doughnut data={data} options={options} />
        </div>
      )}

      <div className="flex justify-between mt-4 text-gray-700">
        <div>
          <p className="text-lg font-bold">{upcomingSessionsCount}</p>
          <p className="text-sm">Upcoming Sessions</p>
        </div>
        <div>
          <p className="text-lg font-bold">{pastSessionsCount}</p>
          <p className="text-sm">Past Sessions</p>
        </div>
      </div>
    </div>
  );
};

export default PatientActivityCard;
