'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FaCalendarAlt, FaUserMd, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { FaMessage, FaMoneyBillTrendUp } from 'react-icons/fa6';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase'; // Ensure correct firebase initialization
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';

interface SidebarProps {
  patientId?: string; // Make patientId optional
}

const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); // To track unread messages count

  // Fetch unread messages count
  useEffect(() => {
    const fetchUnreadMessages = () => {
      if (!auth.currentUser) {
        console.error("No current user");
        return;
      }

      const q = query(
        collection(db, 'chats'),
        where('doctorId', '==', auth.currentUser.uid),
        where('unreadMessages', '>', 0)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let totalUnread = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Fetched data:", data); // Log the fetched data to confirm it's working
          totalUnread += data.unreadMessages || 0;
        });

        console.log("Total unread messages:", totalUnread); // Log the total unread messages count
        setUnreadMessagesCount(totalUnread); // Update state with total unread messages
      });

      return unsubscribe;
    };

    const unsubscribe = fetchUnreadMessages();

    return () => {
      if (unsubscribe) {
        unsubscribe(); // Cleanup subscription on unmount
      }
    };
  }, []);

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <aside className="bg-[#8AFFB5] w-[20%] h-screen md:flex flex-col items-center p-12 hidden my-8 ml-8 rounded-lg">
      <nav className="flex flex-col space-y-8">
        <Link href="/home">
          <div
            className={`flex items-center space-x-6 p-4 rounded-lg ${
              pathname === '/home'
                ? 'bg-yellow-400 text-black'
                : 'text-black hover:bg-green-500 hover:text-white'
            }`}
          >
            <FaCalendarAlt className="w-6 h-6" />
            <span>Dashboard</span>
          </div>
        </Link>

        <Link href="/billing">
          <div
            className={`flex items-center space-x-6 p-4 rounded-lg ${
              pathname === '/billing'
                ? 'bg-yellow-400 text-black'
                : 'text-black hover:bg-green-500 hover:text-white'
            }`}
          >
            <FaMoneyBillTrendUp className="w-8 h-6" />
            <span>Earnings & Billing</span>
          </div>
        </Link>

        {/* Messages Link with unread badge */}
        <Link href="/chat">
          <div
            className={`flex items-center space-x-6 p-4 rounded-lg ${
              pathname.includes('/chat')
                ? 'bg-yellow-400 text-black'
                : 'text-black hover:bg-green-500 hover:text-white'
            }`}
          >
            <FaMessage className="w-6 h-6" />
            <span>Messages</span>
            {unreadMessagesCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadMessagesCount}
              </span>
            )}
          </div>
        </Link>

        {/* Appointments Link */}
        <Link href="/appointment">
          <div
            className={`flex items-center space-x-6 p-4 rounded-lg ${
              pathname === '/appointment'
                ? 'bg-yellow-400 text-black'
                : 'text-black hover:bg-green-500 hover:text-white'
            }`}
          >
            <FaUserMd className="w-6 h-6" />
            <span>Appointments</span>
          </div>
        </Link>

        {/* Settings Link */}
        <Link href="/setting">
          <div
            className={`flex items-center space-x-6 p-4 rounded-lg ${
              pathname === '/setting'
                ? 'bg-yellow-400 text-black'
                : 'text-black hover:bg-green-500 hover:text-white'
            }`}
          >
            <FaCog className="w-6 h-6" />
            <span>Settings</span>
          </div>
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`flex items-center space-x-6 p-4 rounded-lg w-full text-left ${
            pathname === '/login'
              ? 'bg-red-400 text-white'
              : 'text-red-600 hover:bg-red-600 hover:text-white'
          }`}
        >
          <FaSignOutAlt className="w-6 h-6" />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
