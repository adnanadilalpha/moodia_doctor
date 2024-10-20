// components/DoctorPatientLoading.tsx
import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../../public/animations/animation.json'; // Adjust the path if needed
import './DoctorPatientLoading.css'; // Import your existing CSS for any additional styling

const DoctorPatientLoading: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="scene-container">

        {/* Lottie Animation */}
        <div className="lottie-animation">
          <Lottie animationData={animationData} loop={true} />
        </div>

        {/* Connecting Text */}
        <p className="loading-text">Connecting...</p>
      </div>
    </div>
  );
};

export default DoctorPatientLoading;
