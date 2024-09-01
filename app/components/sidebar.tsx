"use client"


import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaCalendarAlt, FaUserMd, FaCog, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="bg-green-50 w-64 min-h-screen md:flex flex-col items-center p-28 hidden">
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
        <Link href="/login">
          <div
            className={`flex items-center space-x-6 p-4 rounded-lg ${
              pathname === '/login'
                ? 'bg-red-400 text-white'
                : 'text-red-600 hover:bg-red-600 hover:text-white'
            }`}
          >
            <FaSignOutAlt className="w-6 h-6" />
            <span>Logout</span>
          </div>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;