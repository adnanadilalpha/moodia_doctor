'use client';

import { usePathname, useRouter } from 'next/navigation';
import { FaCalendarAlt, FaUserMd, FaCog, FaSignOutAlt, FaMoneyBill } from 'react-icons/fa';
import { FaMessage, FaMoneyBill1, FaMoneyBill1Wave, FaMoneyBillTrendUp, FaMoneyCheckDollar } from 'react-icons/fa6';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase'; // Adjust the path as needed
import Link from 'next/link';

interface SidebarProps {
  patientId?: string; // Make patientId optional
}

const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const router = useRouter();

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
    <aside className="bg-green-50 w-[20%] h-screen md:flex flex-col items-center p-28 hidden">
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

        {/* Messages Link */}
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