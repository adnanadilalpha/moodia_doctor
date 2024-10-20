'use client';

// components/SplashScreen.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';  // Use this instead of 'next/router'
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import DoctorPatientLoading from './DoctorPatientLoading';

const SplashScreen = () => {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true); // State to control splash screen visibility

  useEffect(() => {
    // Ensure the splash screen is displayed for at least 3 seconds
    const splashTimeout = setTimeout(() => {
      setShowSplash(false); // Hide the splash screen after 3 seconds
    }, 3000);

    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    if (!showSplash) {
      // After the splash screen is hidden, check authentication status
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          router.push('/home');  // Navigate to the home page if logged in
        } else {
          router.push('/signup'); // Navigate to the signup page if not logged in
        }
      });

      return () => unsubscribe();
    }
  }, [showSplash, router]);

  if (showSplash) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-b from-blue-100 to-blue-300">
        {/* Moodia Logo */}
        <div className="fixed top-8 animate-fade-in z-10">
        <img src="/images/logo.png" alt="Logo" className="w-[150px] md:w-[300px]" />
        </div>

        {/* Doctor-Patient Animation */}
        <DoctorPatientLoading />
      </div>
    );
  }

  return null; // Return null while redirecting
};

export default SplashScreen;
