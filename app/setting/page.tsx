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
  const [activeSection, setActiveSection] = useState<string | null>('availability');

  const settingSections = [
    { id: 'availability', title: 'Manage Your Availability', icon: '🗓️' },
    { id: 'notifications', title: 'Control Notifications', icon: '🔔' },
    { id: 'payment', title: 'Payment and Billing Information', icon: '💳' },
    { id: 'security', title: 'Security & Privacy', icon: '🔒' },
    { id: 'data', title: 'Manage Data and Privacy', icon: '📊' },
    { id: 'help', title: 'Need Assistance?', icon: '❓' },
  ];

  const renderSettingContent = () => {
    switch (activeSection) {
      case 'availability': return <AvailabilitySettings />;
      case 'notifications': return <NotificationSettings />;
      case 'payment': return <PaymentSettings />;
      case 'security': return <SecuritySettings />;
      case 'data': return <DataPrivacySettings />;
      case 'help': return <HelpSupport />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex-grow flex">
        <Sidebar />
        <div className="flex-grow p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
          <div className="bg-white rounded-lg shadow-md">
            <div className="grid grid-cols-12 gap-0">
              <div className="col-span-4 border-r border-gray-200">
                {settingSections.map((section) => (
                  <div
                    key={section.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                      activeSection === section.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{section.icon}</span>
                      <h2 className="text-lg font-medium text-gray-700">{section.title}</h2>
                    </div>
                  </div>
                ))}
              </div>
              <div className="col-span-8 p-6">
                {renderSettingContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
