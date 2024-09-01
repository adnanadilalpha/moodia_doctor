import React from 'react';

interface PatientActivityProps {
  activities: { month: string; activities: number }[];
}

const PatientActivityCard: React.FC<PatientActivityProps> = ({ activities }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Patient Activities</h2>
      <p className="text-gray-600">Today, 5 October 2022</p>
      <div className="h-32 mt-4">
        <ul className="space-y-2">
          {activities.map((activity, index) => (
            <li key={index} className="flex justify-between">
              <span>{activity.month}</span>
              <span>{activity.activities} activities</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PatientActivityCard;