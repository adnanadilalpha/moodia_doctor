import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';  // Use this instead of 'next/router'
import Image from 'next/image';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const SplashScreen = () => {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true); // State to control splash screen visibility

  useEffect(() => {
    // Ensure the splash screen is displayed for at least 2 seconds
    const splashTimeout = setTimeout(() => {
      setShowSplash(false); // Hide the splash screen after 2 seconds
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
          router.push('/signup'); // Navigate to the login page if not logged in
        }
      });

      return () => unsubscribe();
    }
  }, [showSplash, router]);

  if (showSplash) {
    return (
      <div className="flex items-center justify-center min-h-screen w-ful animate-fade-in ">
        <div className="animate-scale-up">
          <Image src="/images/logo.png" alt="Moodia Logo" width={600} height={600} />
        </div>
      </div>
    );
  }

  return null; // Return null while redirecting
};

export default SplashScreen;