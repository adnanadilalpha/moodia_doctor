'use client';

import React, { useState } from 'react';
import Sidebar from '../components/sidebar';
import Navbar from '../components/navbar';
import AvailabilitySettings from '../components/setting/availbility';
import NotificationSettings from '../components/setting/notifications';
import PaymentSettings from '../components/setting/paymentsetting';
import SecuritySettings from '../components/setting/security';
import DataPrivacySettings from '../components/setting/managedate';
import HelpSupport from '../components/setting/needassistence';

function Settings() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow flex flex-col">
        <Navbar />
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">Settings</h1>


          {/* Availability Settings */}
          <div className="border rounded-lg mb-6 shadow">
            <div className="bg-gray-200 p-4 cursor-pointer" onClick={() => toggleSection('availability')}>
              <h2 className="text-xl font-semibold">Manage Your Availability</h2>
            </div>
            {activeSection === 'availability' && <AvailabilitySettings />}
          </div>

          {/* Notification Settings */}
          <div className="border rounded-lg mb-6 shadow">
            <div className="bg-gray-200 p-4 cursor-pointer" onClick={() => toggleSection('notifications')}>
              <h2 className="text-xl font-semibold">Control Notifications</h2>
            </div>
            {activeSection === 'notifications' && <NotificationSettings />}
          </div>

          {/* Payment & Billing Settings */}
          <div className="border rounded-lg mb-6 shadow">
            <div className="bg-gray-200 p-4 cursor-pointer" onClick={() => toggleSection('payment')}>
              <h2 className="text-xl font-semibold">Payment and Billing Information</h2>
            </div>
            {activeSection === 'payment' && <PaymentSettings />}
          </div>

          {/* Security Settings */}
          <div className="border rounded-lg mb-6 shadow">
            <div className="bg-gray-200 p-4 cursor-pointer" onClick={() => toggleSection('security')}>
              <h2 className="text-xl font-semibold">Security & Privacy</h2>
            </div>
            {activeSection === 'security' && <SecuritySettings />}
          </div>

          {/* Data & Privacy Settings */}
          <div className="border rounded-lg mb-6 shadow">
            <div className="bg-gray-200 p-4 cursor-pointer" onClick={() => toggleSection('data')}>
              <h2 className="text-xl font-semibold">Manage Data and Privacy</h2>
            </div>
            {activeSection === 'data' && <DataPrivacySettings />}
          </div>

          {/* Help & Support */}
          <div className="border rounded-lg mb-6 shadow">
            <div className="bg-gray-200 p-4 cursor-pointer" onClick={() => toggleSection('help')}>
              <h2 className="text-xl font-semibold">Need Assistance?</h2>
            </div>
            {activeSection === 'help' && <HelpSupport />}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Settings;
