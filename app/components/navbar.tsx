"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "../firebase";
import { doc, updateDoc, deleteDoc, collection, query, where, orderBy, limit, getDocs, writeBatch } from "firebase/firestore";
import {
  FaBars,
  FaCalendarAlt,
  FaCog,
  FaEdit,
  FaSignOutAlt,
  FaUserMd,
  FaTimes,
  FaBell,
  FaTrash,
} from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";
import { Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocument } from 'react-firebase-hooks/firestore';

interface Notification {
  id: string;
  doctorId: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
}

const Navbar = () => {
  const [user] = useAuthState(auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  // Use react-firebase-hooks for real-time user data
  const [userDoc] = useDocument(
    user ? doc(db, "doctors", user.uid) : null
  );

  const userName = userDoc?.data()?.fullName || "Dr. Unknown";
  const profilePicture = userDoc?.data()?.photoURL || null;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('doctorId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      try {
        const querySnapshot = await getDocs(q);
        const fetchedNotifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification));
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    // Add any navigation logic here if needed
    setShowNotifications(false);
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifications.forEach((notification) => {
      const notificationRef = doc(db, 'notifications', notification.id);
      batch.delete(notificationRef);
    });
    await batch.commit();
    setNotifications([]);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="px-4 md:px-12">
        <div className="flex justify-between items-center py-4">
          {/* Logo and profile section */}
          <div className="w-full flex justify-between items-center">
            <Link href='/home'>
            <img src="/images/logo.png" alt="Logo" className="w-32 md:w-40" />
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              {/* Notifications Icon */}
              <div className="relative items-center">
                <button
                  onClick={toggleNotifications}
                  className="text-green-500 hover:text-green-600 focus:outline-none flex items-center"
                >
                  <FaBell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
                    <div className="py-2">
                      <div className="flex justify-between items-center px-4 py-2 border-b">
                        <h3 className="font-semibold">Notifications</h3>
                        <button
                          onClick={clearAllNotifications}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          <FaTrash className="inline mr-1" />
                          Clear All
                        </button>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No notifications</p>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-500">
                              {notification.createdAt.toDate().toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
      </div>
    </nav>
  );
};

export default Navbar;
