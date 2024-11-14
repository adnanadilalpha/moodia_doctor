import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Switch } from '@headlessui/react';
import { toast } from 'react-hot-toast';

interface NotificationPreferences {
  email: Record<string, boolean>;
  push: Record<string, boolean>;
  sms: Record<string, boolean>;
  // Add other notification sections as needed
}

const defaultPreferences: NotificationPreferences = {
  email: {
    message: true,
    session: true,
    update: true,
    daily_summary: true
  },
  push: {
    message: true,
    session: true,
    update: true,
    daily_summary: true
  },
  sms: {
    message: true,
    session: true,
    update: true,
    daily_summary: true
  }
};

const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please login to manage notification settings');
        return;
      }

      const docRef = doc(db, 'doctors', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().notificationPreferences) {
        setPreferences({
          ...defaultPreferences,
          ...docSnap.data().notificationPreferences
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (section: keyof NotificationPreferences, subKey: string) => (value: boolean) => {
    setPreferences((prev) => {
      const sectionPreferences = prev[section] || {};
      return {
        ...prev,
        [section]: {
          ...sectionPreferences,
          [subKey]: value
        }
      };
    });
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    setPreferences(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [type]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please login to save settings');
        return;
      }

      const docRef = doc(db, 'doctors', user.uid);
      await setDoc(docRef, { 
        notificationPreferences: preferences 
      }, { merge: true });

      // Test notification sound if enabled
      if (preferences.sound) {
        playTestSound();
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const playTestSound = () => {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5; // Set volume to 50%
    audio.play().catch(error => {
      console.error('Error playing test sound:', error);
      toast.error('Failed to play test sound');
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>

      {/* Delivery Methods */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Delivery Methods</h3>
        <div className="space-y-4">
          <SwitchItem
            label="In-App Notifications"
            enabled={preferences.app}
            onChange={(value) => handleToggle('app', 'value')}
          />
          <SwitchItem
            label="Email Notifications"
            enabled={preferences.email}
            onChange={(value) => handleToggle('email', 'value')}
          />
          <SwitchItem
            label="SMS Notifications"
            enabled={preferences.sms}
            onChange={(value) => handleToggle('sms', 'value')}
          />
          <SwitchItem
            label="Notification Sound"
            enabled={preferences.sound}
            onChange={(value) => handleToggle('sound', 'value')}
          >
            {preferences.sound && (
              <button
                onClick={playTestSound}
                className="ml-4 text-sm text-blue-500 hover:text-blue-700"
              >
                Test Sound
              </button>
            )}
          </SwitchItem>
        </div>
      </section>

      {/* Notification Types */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Notification Types</h3>
        <div className="space-y-4">
          <SwitchItem
            label="Messages"
            enabled={preferences.types.message}
            onChange={(value) => handleToggle('types', 'message', value)}
          />
          <SwitchItem
            label="Appointments"
            enabled={preferences.types.session}
            onChange={(value) => handleToggle('types', 'session', value)}
          />
          <SwitchItem
            label="Updates"
            enabled={preferences.types.update}
            onChange={(value) => handleToggle('types', 'update', value)}
          />
          <SwitchItem
            label="Daily Summary"
            enabled={preferences.types.daily_summary}
            onChange={(value) => handleToggle('types', 'daily_summary', value)}
          />
        </div>
      </section>

      {/* Quiet Hours */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Quiet Hours</h3>
        <div className="space-y-4">
          <SwitchItem
            label="Enable Quiet Hours"
            enabled={preferences.schedule.enabled}
            onChange={(value) => handleToggle('schedule', 'enabled', value)}
          />
          {preferences.schedule.enabled && (
            <div className="ml-8 space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm">Start Time:</label>
                <input
                  type="time"
                  value={preferences.schedule.start}
                  onChange={(e) => handleTimeChange('start', e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="text-sm">End Time:</label>
                <input
                  type="time"
                  value={preferences.schedule.end}
                  onChange={(e) => handleTimeChange('end', e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
};

// Helper component for switches
const SwitchItem: React.FC<{
  label: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  children?: React.ReactNode;
}> = ({ label, enabled, onChange, children }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center">
      <Switch
        checked={enabled}
        onChange={onChange}
        className={`${
          enabled ? 'bg-blue-500' : 'bg-gray-300'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        <span
          className={`${
            enabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
      <span className="ml-3 text-sm">{label}</span>
    </div>
    {children}
  </div>
);

export default NotificationSettings;
