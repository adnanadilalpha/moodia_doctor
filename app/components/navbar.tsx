"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "../firebase";
import { doc, updateDoc, deleteDoc, collection, query, where, orderBy, limit, getDocs, writeBatch, onSnapshot } from "firebase/firestore";
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
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  doctorId: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
  type: 'message' | 'session' | 'update' | 'daily_summary';
  priority?: 'low' | 'medium' | 'high';
  relatedId?: string; // ID of related item (e.g., messageId, sessionId)
  metadata?: {
    [key: string]: any;
  };
}

const Navbar = () => {
  const [user] = useAuthState(auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Use react-firebase-hooks for real-time user data
  const [userDoc] = useDocument(
    user ? doc(db, "doctors", user.uid) : null
  );

  const userName = userDoc?.data()?.fullName || "Dr. Unknown";
  const profilePicture = userDoc?.data()?.photoURL || null;

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setNotificationsLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('doctorId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification));
        
        setNotifications(newNotifications);
        setNotificationsLoading(false);

        // Play sound for new notifications
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && !change.doc.data().read) {
            playNotificationSound();
          }
        });
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setNotificationsLoading(false);
      }
    );

    return () => unsubscribe();
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

  const markAllAsRead = async () => {
    if (!user) return;
    
    const batch = writeBatch(db);
    notifications.forEach((notification) => {
      if (!notification.read) {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      }
    });
    
    await batch.commit();
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'session':
        if (notification.metadata?.sessionId) {
          router.push(`/appointment?sessionId=${notification.metadata.sessionId}`);
        } else {
          router.push('/appointment');
        }
        break;
      case 'message':
        if (notification.metadata?.chatId) {
          router.push(`/chat/${notification.metadata.chatId}`);
        }
        break;
      case 'daily_summary':
        router.push('/home');
        break;
      default:
        break;
    }
    
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

  const playNotificationSound = () => {
    const audio = new Audio('/notification-sound.mp3'); // Add this sound file to your public folder
    audio.play().catch(error => console.log('Error playing notification sound:', error));
  };

  const renderNotificationContent = (notification: Notification) => {
    const timeAgo = notification.createdAt ? 
      formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), { addSuffix: true }) : 
      'recently';

    return (
      <div
        key={notification.id}
        className={`px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
          !notification.read ? 'bg-blue-50' : ''
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
          </div>
          {notification.priority === 'high' && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              Urgent
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderNotificationsDropdown = () => (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
      <div className="py-2">
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-2">
            <button
              onClick={() => markAllAsRead()}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Mark all read
            </button>
            <button
              onClick={clearAllNotifications}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
        </div>
        
        {notificationsLoading ? (
          <div className="p-4 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map(notification => renderNotificationContent(notification))}
          </div>
        )}
      </div>
    </div>
  );

  const renderNotificationBell = () => (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-2 text-green-500 hover:text-green-700 focus:outline-none"
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      {showNotifications && renderNotificationsDropdown()}
    </div>
  );

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
              {renderNotificationBell()}

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
