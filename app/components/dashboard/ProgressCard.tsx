import React from 'react';

interface ProgressProps {
  progress: number;
}

const ProgressCard: React.FC<ProgressProps> = ({ progress }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Daily Progress</h2>
      <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
        <span className="text-green-600 text-3xl font-bold">{progress}%</span>
      </div>
    </div>
  );
};

export default ProgressCard;