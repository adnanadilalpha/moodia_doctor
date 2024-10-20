import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  app: boolean;
}

const NotificationSettings: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email: true,
    sms: false,
    app: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, 'doctors', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().notificationPreferences) {
            setNotifications(docSnap.data().notificationPreferences);
          }
        }
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
        setError('Failed to load notification preferences. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationPreferences();
  }, [auth]);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'doctors', user.uid);
        await setDoc(docRef, { notificationPreferences: notifications }, { merge: true });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      setError('Failed to save notification preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading notification preferences...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Notification Settings</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">Notification preferences saved successfully!</p>}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="email"
            name="email"
            checked={notifications.email}
            onChange={handleToggle}
            className="mr-2"
          />
          <label htmlFor="email">Email Notifications</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="sms"
            name="sms"
            checked={notifications.sms}
            onChange={handleToggle}
            className="mr-2"
          />
          <label htmlFor="sms">SMS Notifications</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="app"
            name="app"
            checked={notifications.app}
            onChange={handleToggle}
            className="mr-2"
          />
          <label htmlFor="app">In-App Notifications</label>
        </div>
      </div>
      <button
        onClick={handleSaveNotifications}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        disabled={loading}
      >
        Save Preferences
      </button>
    </div>
  );
};

export default NotificationSettings;
