'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase"; 
import { doc, setDoc, getDoc } from "firebase/firestore"; 

const SignupPage = () => {
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState(""); // Added specialization field
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    setErrorMessage('');
    try {
      // Check if email already exists in the 'users' collection
      const userDocRef = doc(db, 'users', email);
      const docSnapshot = await getDoc(userDocRef);
      if (docSnapshot.exists()) {
        throw new Error('This email is already registered as a patient.');
      }

      // Proceed with doctor sign-up
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user data to the 'doctors' collection
      await setDoc(doc(db, "doctors", user.uid), {
        fullName: fullName,
        email: email,
        specialization: specialization,
        userType: "doctor", // Specifying the user type as 'doctor'
      });

      router.push("/home");
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Failed to sign up!");
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
        throw new Error('This email is already registered as a patient.');
      }

      // Save user data to the 'doctors' collection (if first-time sign-in)
      const doctorDocRef = doc(db, 'doctors', user.uid);
      const doctorSnapshot = await getDoc(doctorDocRef);
      if (!doctorSnapshot.exists()) {
        await setDoc(doctorDocRef, {
          fullName: user.displayName || "",
          email: user.email,
          specialization: specialization, // Add specialization field here
          userType: "doctor",
        });
      }

      router.push("/home");
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Failed to sign up with Google!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side: Signup form */}
      <div className="md:w-1/2 flex flex-col justify-center p-8 bg-white">
        <h2 className="text-4xl font-bold text-gray-800 mb-2">Sign up your account 👋</h2>
        <p className="text-gray-600 mb-8">Let&apos;s enter your data to continue using our service.</p>

        <input
          type="text"
          placeholder="Input your fullname here"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Input your specialization here"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          placeholder="Input your email here"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Input your password here"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-start mb-4">
          <input type="checkbox" className="mr-2" />
          <label className="text-gray-600">
            By signing up to our service, you agree to all our{" "}
            <a href="#" className="text-blue-500 hover:underline">
              terms and conditions.
            </a>
          </label>
        </div>

        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

        <button
          onClick={handleSignup}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all"
        >
          Sign Up
        </button>

        <div className="flex items-center justify-between my-4">
          <hr className="w-full border-gray-300" />
          <span className="mx-2 text-gray-500">OR</span>
          <hr className="w-full border-gray-300" />
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full bg-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-600 transition-all mb-4"
        >
          Sign up with Google
        </button>

        <p className="text-gray-600 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Sign In
          </a>
        </p>
      </div>

      {/* Right side: Image and additional information */}
      <div className="hidden md:flex md:w-1/2 bg-blue-100 p-8 relative">
        <div className="m-auto text-center">
          <h2 className="text-4xl font-bold text-blue-800 mb-4">We give the best experience 😎</h2>
          <p className="text-blue-700 mb-8">
            Dedicated virtual-consultation platform for doctors and patients to help them consult across various channels.
          </p>
          <img src="/images/doctor-log.png" alt="Doctors" className="w-full h-full  object-contain" /> 
        </div>
      </div>
    </div>
  );
};

export default SignupPage;