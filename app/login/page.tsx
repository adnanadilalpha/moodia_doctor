'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';  // Use `next/navigation` instead of `next/router`
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';  // Import Firestore for checking user type
import { doc, getDoc } from 'firebase/firestore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage(''); // Clear any previous error messages
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the UID exists in the 'doctors' collection
      const userDocRef = doc(db, 'doctors', user.uid);
      const docSnapshot = await getDoc(userDocRef);

      if (!docSnapshot.exists()) {
        throw new Error('No doctor account found with this email.');
      }

      router.push('/home');  // Navigate to home after successful login
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

      router.push('/home');  // Navigate to home after successful login
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Failed to login with Google!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side with form */}
      <div className="md:w-1/2 flex flex-col justify-center px-12 md:px-24 bg-white">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Sign in to your account 👋</h2>
        <p className="text-gray-500 mb-8">Let's enter your credentials to continue to the service</p>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Input your email here"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Input your password here"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="flex items-center justify-between my-4">
          <hr className="w-full border-gray-300" />
          <span className="mx-2 text-gray-500">OR</span>
          <hr className="w-full border-gray-300" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-600 transition-all mb-4"
        >
          Sign in with Google
        </button>

        <p className="text-gray-600 text-center">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </a>
        </p>
      </div>

      {/* Right side with image */}
      <div className="hidden md:flex md:w-1/2 bg-blue-50 justify-center items-center">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-700">We give the best experience 😊</h3>
          <p className="text-gray-600 mt-4 mb-8">
            Dedicated virtual consultation platform for doctors and patients to help them consult across various channels.
          </p>
          <div className="flex justify-center">
            <img src="/images/doctor-log.png" alt="Doctors" className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;