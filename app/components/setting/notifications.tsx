import React, { useState } from 'react';

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    app: true,
  });

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  };

  const handleSaveNotifications = () => {
    console.log('Notification Preferences:', notifications);
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <input type="checkbox" name="email" checked={notifications.email} onChange={handleToggle} className="mr-2" />
        <label>Email Notifications</label>
      </div>
      <div className="flex items-center mb-4">
        <input type="checkbox" name="sms" checked={notifications.sms} onChange={handleToggle} className="mr-2" />
        <label>SMS Notifications</label>
      </div>
      <div className="flex items-center mb-4">
        <input type="checkbox" name="app" checked={notifications.app} onChange={handleToggle} className="mr-2" />
        <label>App Notifications</label>
      </div>
      <button onClick={handleSaveNotifications} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        Save Notification Preferences
      </button>
    </div>
  );
};

export default NotificationSettings;
