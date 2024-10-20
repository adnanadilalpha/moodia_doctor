// components/DoctorPatientLoading.tsx
import React from 'react';
import dynamic from 'next/dynamic';

const LottieWrapper = dynamic(() => import('./LottieWrapper'), { ssr: false });

const DoctorPatientLoading: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="scene-container bg-white flex flex-col items-center justify-center rounded-xl p-8">
        <div className="lottie-animation">
          <LottieWrapper />
        </div>
        <p className="loading-text text-primary font-bold text-4xl">Connecting...</p>
      </div>
    </div>
  );
};

export default DoctorPatientLoading;
