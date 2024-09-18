'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons'; // Import Google icon

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const router = useRouter();

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let strength = '';
    const regexes = [
      /.{8,}/, // Minimum length 8
      /[a-z]/, // Lowercase letter
      /[A-Z]/, // Uppercase letter
      /[0-9]/, // Digit
      /[^A-Za-z0-9]/, // Special character
    ];

    const passedTests = regexes.reduce(
      (acc, regex) => acc + (regex.test(password) ? 1 : 0),
      0
    );

    switch (passedTests) {
      case 0:
      case 1:
      case 2:
        strength = 'Weak';
        break;
      case 3:
        strength = 'Medium';
        break;
      case 4:
      case 5:
        strength = 'Strong';
        break;
      default:
        strength = '';
    }

    setPasswordStrength(strength);
  };

  useEffect(() => {
    checkPasswordStrength(password);
  }, [password]);

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
    if (!fullName.trim()) errors.fullName = 'Full name is required.';
    if (!specialization.trim()) errors.specialization = 'Specialization is required.';
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    setErrorMessage('');
    if (!validateForm()) {
      return;
    }
    try {
      // Password validation
      const passwordRequirements = [
        { regex: /.{8,}/, message: 'Password must be at least 8 characters long.' },
        { regex: /[a-z]/, message: 'Password must contain a lowercase letter.' },
        { regex: /[A-Z]/, message: 'Password must contain an uppercase letter.' },
        { regex: /[0-9]/, message: 'Password must contain a number.' },
        { regex: /[^A-Za-z0-9]/, message: 'Password must contain a special character.' },
      ];

      for (const requirement of passwordRequirements) {
        if (!requirement.regex.test(password)) {
          setFieldErrors((prev) => ({ ...prev, password: requirement.message }));
          throw new Error(requirement.message);
        }
      }

      // Check if email already exists in the 'users' collection
      const userDocRef = doc(db, 'users', email);
      const docSnapshot = await getDoc(userDocRef);
      if (docSnapshot.exists()) {
        setFieldErrors((prev) => ({
          ...prev,
          email: 'This email is already registered as a patient.',
        }));
        throw new Error('This email is already registered as a patient.');
      }

      // Proceed with doctor sign-up
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user data to the 'doctors' collection
      await setDoc(doc(db, 'doctors', user.uid), {
        fullName: fullName,
        email: email,
        specialization: specialization,
        userType: 'doctor',
      });

      // Send email verification
      await sendEmailVerification(user);
      setIsVerificationSent(true);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Failed to sign up!');
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if email already exists in the 'users' collection
      const userDocRef = doc(db, 'users', user.uid);
      const docSnapshot = await getDoc(userDocRef);
      if (docSnapshot.exists()) {
        setFieldErrors((prev) => ({
          ...prev,
          email: 'This email is already registered as a patient.',
        }));
        throw new Error('This email is already registered as a patient.');
      }

      // Save user data to the 'doctors' collection (if first-time sign-in)
      const doctorDocRef = doc(db, 'doctors', user.uid);
      const doctorSnapshot = await getDoc(doctorDocRef);
      if (!doctorSnapshot.exists()) {
        await setDoc(doctorDocRef, {
          fullName: user.displayName || '',
          email: user.email,
          specialization: specialization,
          userType: 'doctor',
        });
      }

      // Send email verification if not verified
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setIsVerificationSent(true);
      } else {
        router.push('/home');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Failed to sign up with Google!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-custom">
      {/* Left side: Signup form */}
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
              className="bg-primary text-black py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-all"
            >
              I have verified my email
            </button>
            {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
          </div>
        ) : (
          // Signup form
          <>
            {/* Logo */}
            <div className="flex mb-8">
              <Image
                src="/images/logo.png"
                alt="Moodia Logo"
                width={300}
                height={300}
                priority // Ensures the logo loads quickly
              />
            </div>

            <h2 className="text-4xl font-bold text-gray-800 mb-2">Create Your Account 👋</h2>
            <p className="text-gray-600 mb-8">Enter your details to continue using our service.</p>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full p-3 border ${
                    fieldErrors.fullName ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.fullName ? 'focus:ring-red-500' : 'focus:ring-primary'
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Specialization</label>
                <input
                  type="text"
                  placeholder="Your specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className={`w-full p-3 border ${
                    fieldErrors.specialization ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.specialization ? 'focus:ring-red-500' : 'focus:ring-primary'
                  }`}
                />
                {fieldErrors.specialization && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.specialization}</p>
                )}
              </div>

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
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-3 border ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.password ? 'focus:ring-red-500' : 'focus:ring-primary'
                  }`}
                />
                {/* Password Strength Indicator */}
                {password && (
                  <p
                    className={`mt-2 text-sm font-semibold ${
                      passwordStrength === 'Strong'
                        ? 'text-green-600'
                        : passwordStrength === 'Medium'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    Password Strength: {passwordStrength}
                  </p>
                )}
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full p-3 border ${
                    fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.confirmPassword ? 'focus:ring-red-500' : 'focus:ring-primary'
                  }`}
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <input type="checkbox" className="mr-2 mt-1" required />
                <label className="text-gray-600">
                  By signing up, you agree to our{' '}
                  <a href="https://www.moodiaapp.com/terms" target='_blank' className="text-yellow-500 hover:underline">
                    Terms and Conditions
                  </a>
                  .
                </label>
              </div>

              {/* General Error Message */}
              {errorMessage && <p className="text-red-500">{errorMessage}</p>}

              {/* Sign Up Button */}
              <button
                onClick={handleSignup}
                className="w-full bg-primary text-black py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-all"
              >
                Sign Up
              </button>

              {/* Divider */}
              <div className="flex items-center justify-between my-4">
                <hr className="w-full border-gray-300" />
                <span className="mx-2 text-gray-500">OR</span>
                <hr className="w-full border-gray-300" />
              </div>

              {/* Google Sign Up Button */}
              <button
                onClick={handleGoogleSignup}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faGoogle} className="text-primary mr-2" />
                Sign up with Google
              </button>

              {/* Sign In Link */}
              <p className="text-gray-600 text-center mt-4">
                Already have an account?{' '}
                <a href="/login" className="text-yellow-400 hover:underline">
                  Sign In
                </a>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Right side: Image and additional information */}
      <div className="hidden md:flex md:w-1/2 bg-primary p-8 relative">
        <div className="m-auto text-center text-black">
          <h2 className="text-4xl font-bold mb-4">Experience the Best with Us 😎</h2>
          <p className="mb-8">
            A dedicated virtual consultation platform for doctors and patients to connect across
            various channels.
          </p>
          <img
            src="/images/doctor-log.png"
            alt="Doctors"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default SignupPage;