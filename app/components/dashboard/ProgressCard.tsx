'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { auth, db } from '@/app/firebase'; // Adjust the path to your Firebase configuration
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import 'chart.js/auto'; // Required for chart.js to work correctly

interface Session {
  dateTime: Timestamp;
  doctorId: string;
}

const ProgressCard: React.FC = () => {
  const [doctorId, setDoctorId] = useState<string>('');
  const [progressData, setProgressData] = useState<number[]>([]);
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

  // Fetch session data from Firebase for today
  useEffect(() => {
    if (doctorId) {
      const fetchSessions = async () => {
        try {
          const sessionsRef = collection(db, 'sessions');
          const q = query(sessionsRef, where('doctorId', '==', doctorId));

          const querySnapshot = await getDocs(q);
          const today = new Date().setHours(0, 0, 0, 0); // Get today's date (midnight)

          let dailySessionCount = 0;
          const progress: number[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data() as Session;
            const sessionDate = new Date(data.dateTime.seconds * 1000).setHours(0, 0, 0, 0); // Convert Firestore timestamp to JS Date (midnight)

            // Check if the session is booked for today
            if (sessionDate === today) {
              dailySessionCount++;
            }
          });

          progress.push(dailySessionCount); // Add the daily session count to progress data
          setProgressData(progress);
        } catch (error) {
          console.error('Error fetching sessions:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSessions();
    }
  }, [doctorId]);

  // Create chart data for the Line chart
  const chartData = {
    labels: progressData.map(() => new Date().toLocaleDateString()), // Display today's date as the label
    datasets: [
      {
        label: 'Daily Sessions',
        data: progressData,
        fill: true,
        borderColor: '#86EFAC', // Use the primary color for the line
        backgroundColor: 'rgba(134, 239, 172, 0.2)', // Lighter primary color for the background
        tension: 0.4,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Daily Sessions Progress</h2>

      {loading ? (
        <p>Loading session data...</p>
      ) : (
        <div>
          <div className="text-3xl font-bold text-gray-700 flex justify-between mb-4">
            <span>{progressData[progressData.length - 1] || 0} sessions</span>
            <span className="text-green-600 text-base font-medium">
              +{progressData.length > 1 ? (progressData[progressData.length - 1] - progressData[progressData.length - 2]) : 0} vs last day
            </span>
          </div>

          <div className="h-32">
            <Line data={chartData} options={options} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressCard;
