import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../../public/animations/animation.json';

const LottieWrapper: React.FC = () => {
  return <Lottie animationData={animationData} loop={true} />;
};

export default LottieWrapper;

