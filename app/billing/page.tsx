'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import Navbar from '../components/navbar';
import { Line, Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register necessary components from chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface BillingData {
  date: string;
  amount: string;
  status: string;
}

interface EarningData {
  date: string;
  amount: string;
}

interface Activity {
  description: string;
  date: string;
  type: 'Payment' | 'Withdrawal' | 'Billing';
  amount: string;
  status: string;
}

// Dummy Data (for now)
const dummyEarningData: EarningData[] = [
  { date: '2024-09-01', amount: '$500' },
  { date: '2024-08-15', amount: '$300' },
];

const dummyBillingData: BillingData[] = [
  { date: '2024-09-01', amount: '$200', status: 'Paid' },
  { date: '2024-08-15', amount: '$150', status: 'Pending' },
];

const dummyActivities: Activity[] = [
  { description: 'Payment made to client X', date: '2024-09-02', type: 'Payment', amount: '$200', status: 'Completed' },
  { description: 'Withdrawal to bank account', date: '2024-09-01', type: 'Withdrawal', amount: '$500', status: 'Completed' },
  { description: 'Billing for client Y', date: '2024-08-30', type: 'Billing', amount: '$150', status: 'Pending' },
];

// Chart Data
const getEarningsChartData = (data: EarningData[]) => ({
  labels: data.map(item => item.date),
  datasets: [
    {
      label: 'Earnings',
      data: data.map(item => parseFloat(item.amount.replace('$', ''))),
      fill: true,
      borderColor: '#86EFAC',
      backgroundColor: 'rgba(134, 239, 172, 0.2)',
      tension: 0.4,
    },
  ],
});

const getBillingChartData = (data: BillingData[]) => ({
  labels: data.map(item => item.date),
  datasets: [
    {
      label: 'Billing',
      data: data.map(item => parseFloat(item.amount.replace('$', ''))),
      fill: true,
      backgroundColor: '#6366F1',
    },
  ],
});

const BillingEarning: React.FC = () => {
  const [billingData, setBillingData] = useState<BillingData[]>([]);
  const [earningData, setEarningData] = useState<EarningData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    // Placeholder for backend data fetching logic
    setBillingData(dummyBillingData);
    setEarningData(dummyEarningData);
    setActivities(dummyActivities);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-100 to-blue-300">
      <Navbar />
      <div className="flex-grow flex">
      <Sidebar patientId="" />
        <div className="p-6 w-full">
          <h2 className="text-3xl font-semibold mb-6">Earnings and Billings</h2>

          {/* Time Range Filter */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-4 py-2 rounded-lg ${timeRange === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-4 py-2 rounded-lg ${timeRange === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeRange('yearly')}
              className={`px-4 py-2 rounded-lg ${timeRange === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Yearly
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings Section */}
            <div className="p-4 bg-white rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-4">Earnings</h3>
              <div className="h-64">
                <Line
                  data={getEarningsChartData(earningData)}
                  options={{
                    animations: {
                      tension: {
                        duration: 1000,
                        easing: 'easeInOutQuart',
                        from: 1,
                        to: 0.3,
                        loop: true,
                      },
                    },
                  }}
                />
              </div>
              <button className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                Withdraw Earnings
              </button>
            </div>

            {/* Billing Section */}
            <div className="p-4 bg-white rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-4">Billing</h3>
              <div className="h-64">
                <Bar
                  data={getBillingChartData(billingData)}
                  options={{
                    animations: {
                      tension: {
                        duration: 1000,
                        easing: 'easeInOutQuart',
                        from: 1,
                        to: 0.3,
                        loop: true,
                      },
                    },
                  }}
                />
              </div>
              <button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Update Payment Method
              </button>
            </div>
          </div>

          {/* Activity List */}
          <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-4">Recent Activities</h3>
            <ul className="space-y-4">
              {activities.map((activity, index) => (
                <li key={index} className="flex justify-between p-4 bg-gray-50 rounded-lg shadow-md">
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-gray-500">{activity.date}</p>
                  </div>
                  <div>
                    <p className="font-medium">{activity.amount}</p>
                    <p className={`text-sm ${activity.status === 'Completed' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {activity.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingEarning;
