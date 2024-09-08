"use client"

import React, { useState } from 'react';
import Sidebar from '../components/sidebar';
import Navbar from '../components/navbar';

function Settings() {
  // State for managing the expanded/collapsed sections
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className='flex'>
      <Sidebar />
      <div className="flex-grow flex flex-col">
        <Navbar />
        <div className='p-6'>
          <h1 className='text-4xl text-black mb-6'>Settings</h1>

          {/* Profile Settings */}
          <div className='border rounded-lg mb-4'>
            <div
              className='bg-gray-100 p-4 cursor-pointer'
              onClick={() => toggleSection('profile')}
            >
              <h2 className='text-xl font-semibold'>Personalize Your Profile</h2>
            </div>
            {activeSection === 'profile' && (
              <div className='p-4'>
                <input type="text" placeholder="Name" className="block w-full p-2 mb-4 border rounded" />
                <input type="text" placeholder="Specialization" className="block w-full p-2 mb-4 border rounded" />
                <input type="text" placeholder="Clinic/Practice Name" className="block w-full p-2 mb-4 border rounded" />
                <input type="email" placeholder="Email" className="block w-full p-2 mb-4 border rounded" />
                <textarea placeholder="Bio/Professional Description" className="block w-full p-2 mb-4 border rounded" />
                <button className='px-4 py-2 bg-blue-500 text-white rounded'>Save Changes</button>
              </div>
            )}
          </div>

          {/* Availability Settings */}
          <div className='border rounded-lg mb-4'>
            <div
              className='bg-gray-100 p-4 cursor-pointer'
              onClick={() => toggleSection('availability')}
            >
              <h2 className='text-xl font-semibold'>Manage Your Availability</h2>
            </div>
            {activeSection === 'availability' && (
              <div className='p-4'>
                {/* Weekly Calendar or Toggle would go here */}
                <p>Availability settings component here (e.g., calendar, toggle)</p>
                <button className='px-4 py-2 bg-blue-500 text-white rounded'>Update Availability</button>
              </div>
            )}
          </div>

          {/* Notification Settings */}
          <div className='border rounded-lg mb-4'>
            <div
              className='bg-gray-100 p-4 cursor-pointer'
              onClick={() => toggleSection('notifications')}
            >
              <h2 className='text-xl font-semibold'>Control Notifications</h2>
            </div>
            {activeSection === 'notifications' && (
              <div className='p-4'>
                <div className='flex items-center mb-4'>
                  <input type="checkbox" className='mr-2' />
                  <label>Email Notifications</label>
                </div>
                <div className='flex items-center mb-4'>
                  <input type="checkbox" className='mr-2' />
                  <label>SMS Notifications</label>
                </div>
                <div className='flex items-center mb-4'>
                  <input type="checkbox" className='mr-2' />
                  <label>App Notifications</label>
                </div>
                <button className='px-4 py-2 bg-blue-500 text-white rounded'>Save Notification Preferences</button>
              </div>
            )}
          </div>

          {/* Payment & Billing Settings */}
          <div className='border rounded-lg mb-4'>
            <div
              className='bg-gray-100 p-4 cursor-pointer'
              onClick={() => toggleSection('payment')}
            >
              <h2 className='text-xl font-semibold'>Payment and Billing Information</h2>
            </div>
            {activeSection === 'payment' && (
              <div className='p-4'>
                <p>Link to Bank Account or PayPal</p>
                <button className='px-4 py-2 bg-blue-500 text-white rounded'>Update Payment Method</button>
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className='border rounded-lg mb-4'>
            <div
              className='bg-gray-100 p-4 cursor-pointer'
              onClick={() => toggleSection('security')}
            >
              <h2 className='text-xl font-semibold'>Security & Privacy</h2>
            </div>
            {activeSection === 'security' && (
              <div className='p-4'>
                <p>Change Password / Enable 2FA</p>
                <button className='px-4 py-2 bg-blue-500 text-white rounded'>Update Security Settings</button>
              </div>
            )}
          </div>

          {/* Data & Privacy Settings */}
          <div className='border rounded-lg mb-4'>
            <div
              className='bg-gray-100 p-4 cursor-pointer'
              onClick={() => toggleSection('data')}
            >
              <h2 className='text-xl font-semibold'>Manage Data and Privacy</h2>
            </div>
            {activeSection === 'data' && (
              <div className='p-4'>
                <p>Option to download data or delete account</p>
                <button className='px-4 py-2 bg-red-500 text-white rounded'>Delete Account</button>
              </div>
            )}
          </div>

          {/* Help & Support */}
          <div className='border rounded-lg mb-4'>
            <div
              className='bg-gray-100 p-4 cursor-pointer'
              onClick={() => toggleSection('help')}
            >
              <h2 className='text-xl font-semibold'>Need Assistance?</h2>
            </div>
            {activeSection === 'help' && (
              <div className='p-4'>
                <p>Help Center, Live Chat, and Submit a Ticket options</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;