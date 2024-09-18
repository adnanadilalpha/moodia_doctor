'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import Image from 'next/image';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const router = useRouter();

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.emailVerified) {
          setIsEmailVerified(true);
          router.push('/home');
        } else {
          setIsVerificationSent(true);
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the UID exists in the 'doctors' collection
      const userDocRef = doc(db, 'doctors', user.uid);
      const docSnapshot = await getDoc(userDocRef);

      if (!docSnapshot.exists()) {
        throw new Error('No doctor account found with this email.');
      }

      if (!user.emailVerified) {
        setIsVerificationSent(true);
        setErrorMessage('Please verify your email before logging in.');
        await sendEmailVerification(user);
      } else {
        router.push('/home');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Failed to login!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the UID exists in the 'doctors' collection
      const userDocRef = doc(db, 'doctors', user.uid);
      const docSnapshot = await getDoc(userDocRef);

      if (!docSnapshot.exists()) {
        throw new Error('No doctor account found with this email.');
      }

      if (!user.emailVerified) {
        setIsVerificationSent(true);
        setErrorMessage('Please verify your email before logging in.');
        await sendEmailVerification(user);
      } else {
        router.push('/home');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Failed to login with Google!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-custom">
      {/* Left side: Login form */}
      <div className="md:w-1/2 flex flex-col justify-center p-8 bg-white">
        {isVerificationSent && !isEmailVerified ? (
          // Verification reminder
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Verify Your Email</h2>
            <p className="mb-4">
              A verification email has been sent to <strong>{email}</strong>. Please verify your
              email to continue.
            </p>
            <button
              onClick={async () => {
                const user = auth.currentUser;
                if (user) {
                  await user.reload();
                  if (user.emailVerified) {
                    setIsEmailVerified(true);
                    router.push('/home');
                  } else {
                    setErrorMessage('Email not verified yet. Please check your inbox.');
                  }
                }
              }}
              className="bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-all"
            >
              I have verified my email
            </button>
            {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
          </div>
        ) : (
          // Login form
          <>
            {/* Logo */}
            <div className="flex mb-8 fixed top-12 left-12">
              <Image
                src="/images/logo.png"
                alt="Moodia Logo"
                width={300}
                height={300}
                priority // Ensures the logo loads quickly
              />
            </div>

            <h2 className="text-4xl font-bold text-gray-800 mb-2">Sign in to your account 👋</h2>
            <p className="text-gray-600 mb-8">
              Enter your credentials to continue using our service.
            </p>

            <div className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full p-3 border ${
                    fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.email ? 'focus:ring-red-500' : 'focus:ring-primary'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-3 border ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.password ? 'focus:ring-red-500' : 'focus:ring-primary'
                  }`}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {/* General Error Message */}
              {errorMessage && <p className="text-red-500">{errorMessage}</p>}

              {/* Sign In Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className={`w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-all ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="flex items-center justify-between my-4">
                <hr className="w-full border-gray-300" />
                <span className="mx-2 text-gray-500">OR</span>
                <hr className="w-full border-gray-300" />
              </div>

              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faGoogle} className="text-primary mr-2" />
                Sign in with Google
              </button>

              {/* Sign Up Link */}
              <p className="text-gray-600 text-center mt-4">
                Don't have an account?{' '}
                <a href="/signup" className="text-primary hover:underline">
                  Sign Up
                </a>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Right side: Image and additional information */}
      <div className="hidden md:flex md:w-1/2 bg-primary p-8 relative">
        <div className="m-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Experience the Best with Us 😊</h2>
          <p className="mb-8">
            A dedicated virtual consultation platform for doctors and patients to connect across
            various channels.
          </p>
          <Image
            src="/images/doctor-log.png"
            alt="Doctors"
            width={500}
            height={500}
            objectFit="contain"
            priority // Ensures the image loads quickly
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
