"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  FaBars,
  FaCalendarAlt,
  FaCog,
  FaEdit,
  FaSignOutAlt,
  FaUserMd,
  FaTimes,
} from "react-icons/fa";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const [userName, setUserName] = useState<string>("Dr. Unknown");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;

      if (user) {
        const userDocRef = doc(db, "doctors", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData?.fullName || "Dr. Unknown");

          // Check if profilePicture exists, else set to null
          if (userData?.photoURL) {
            setProfilePicture(userData.photoURL);
          } else {
            setProfilePicture(null); // Fallback if no profile picture exists
          }
        } else {
          setUserName("Dr. Unknown");
          setProfilePicture(null);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="px-4 md:px-12">
        <div className=" flex justify-between items-center py-4">
          {/* Logo and profile section */}
          <div className="w-full flex justify-between items-center">
            <Link href='/home'>
            <img src="/images/logo.png" alt="Logo" className="w-32 md:w-40" />
            </Link>
            <div className="hidden md:flex items-center gap-4 ml-4">
              <Link
                href="/profile"
                className="text-green-500 hover:underline flex items-center space-x-1"
              >
                <FaEdit className="w-6 h-6" />
              </Link>
              <h2 className="text-xl font-bold text-black">{userName}</h2>
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white text-lg">
                  {getInitials(userName)}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-black focus:outline-none">
              {menuOpen ? <FaTimes className="w-8 h-8" /> : <FaBars className="w-8 h-8" />}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Menu */}
        <div
          className={`fixed inset-0 bg-white z-50 transform ${menuOpen ? "translate-x-0" : "translate-x-full"
            } transition-transform duration-300 md:hidden`}
        >
          <div className="flex flex-col items-center py-8 relative">
            {/* Close Button */}
            <button
              onClick={toggleMenu}
              className="absolute top-4 right-4 text-black focus:outline-none"
            >
              <FaTimes className="w-8 h-8" />
            </button>

            <img src="/images/logo.png" alt="Logo" className="w-32 mb-8" />
            <div className="flex items-center gap-4 mb-8">
              <Link
                href="/profile"
                className="text-green-500 hover:underline flex items-center space-x-1"
              >
                <FaEdit className="w-6 h-6" />
              </Link>
              <h2 className="text-xl font-bold text-black">{userName}</h2>
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white text-lg">
                  {getInitials(userName)}
                </div>
              )}
            </div>
            <nav className="flex flex-col space-y-8">
              <Link href="/home">
                <div
                  className={`flex items-center space-x-6 p-4 rounded-lg ${pathname === "/home"
                    ? "bg-yellow-400 text-black"
                    : "text-black hover:bg-green-500 hover:text-white"
                    }`}
                >
                  <FaCalendarAlt className="w-6 h-6" />
                  <span>Dashboard</span>
                </div>
              </Link>
              <Link href="/appointment">
                <div
                  className={`flex items-center space-x-6 p-4 rounded-lg ${pathname === "/appointment"
                    ? "bg-yellow-400 text-black"
                    : "text-black hover:bg-green-500 hover:text-white"
                    }`}
                >
                  <FaUserMd className="w-6 h-6" />
                  <span>Appointments</span>
                </div>
              </Link>
              <Link href="/setting">
                <div
                  className={`flex items-center space-x-6 p-4 rounded-lg ${pathname === "/setting"
                    ? "bg-yellow-400 text-black"
                    : "text-black hover:bg-green-500 hover:text-white"
                    }`}
                >
                  <FaCog className="w-6 h-6" />
                  <span>Settings</span>
                </div>
              </Link>
              <Link href="/login">
                <div
                  className={`flex items-center space-x-6 p-4 rounded-lg ${pathname === "/login"
                    ? "bg-red-400 text-white"
                    : "text-red-600 hover:bg-red-600 hover:text-white"
                    }`}
                >
                  <FaSignOutAlt className="w-6 h-6" />
                  <span>Logout</span>
                </div>
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;