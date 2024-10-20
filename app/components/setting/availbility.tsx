import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Switch } from '@headlessui/react';
import Link from 'next/link';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TimeSlot {
  day: string;
  from: string;
  to: string;
  enabled: boolean;
}

const AvailabilitySettings = () => {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timezone, setTimezone] = useState<string>('UTC');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLicenseVerified, setIsLicenseVerified] = useState<boolean>(false);
  const auth = getAuth();
  const firestore = getFirestore();

  useEffect(() => {
    const fetchDoctorData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const doctorRef = doc(firestore, 'doctors', user.uid);
      const docSnap = await getDoc(doctorRef);

      if (docSnap.exists()) {
        const doctorData = docSnap.data();
        setIsLicenseVerified(doctorData?.licenseStatus === 'approved');

        if (doctorData?.licenseStatus === 'approved') {
          // Fetch availability data only if license is verified
          const savedAvailability = doctorData?.availability || [];
          setAvailability(
            daysOfWeek.map((day) => {
              const existingSlot = savedAvailability.find((slot: TimeSlot) => slot.day === day);
              return existingSlot
                ? { ...existingSlot, enabled: true }
                : { day, from: '09:00', to: '17:00', enabled: false };
            })
          );
          setTimezone(doctorData?.timezone || 'UTC');
        }
      }
      setLoading(false);
    };

    fetchDoctorData();
  }, [auth, firestore]);

  const handleToggleDay = (day: string) => {
    setAvailability((prev) =>
      prev.map((timeSlot) =>
        timeSlot.day === day
          ? {
              ...timeSlot,
              enabled: !timeSlot.enabled,
              from: !timeSlot.enabled ? '09:00' : '',
              to: !timeSlot.enabled ? '17:00' : '',
            }
          : timeSlot
      )
    );
  };

  const handleTimeChange = (day: string, timeType: 'from' | 'to', value: string) => {
    setAvailability((prev) =>
      prev.map((timeSlot) =>
        timeSlot.day === day ? { ...timeSlot, [timeType]: value } : timeSlot
      )
    );
  };

  const validateTimes = () => {
    const errors: { [key: string]: string } = {};

    availability.forEach((slot) => {
      if (slot.enabled && slot.from && slot.to && slot.from >= slot.to) {
        errors[slot.day] = `End time must be after start time on ${slot.day}`;
      }
    });

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAvailability = async () => {
    if (!validateTimes()) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const doctorRef = doc(firestore, 'doctors', user.uid);

      const enabledAvailability = availability
        .filter((slot) => slot.enabled)
        .map((slot) => ({
          day: slot.day,
          from: slot.from,
          to: slot.to,
        }));

      await setDoc(
        doctorRef,
        {
          availability: enabledAvailability,
          timezone,
        },
        { merge: true }
      );

      alert('Availability updated successfully!');
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  if (loading) return <p>Loading...</p>;

  if (!isLicenseVerified) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Manage Your Availability</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-red-600 mb-4">
            Your license has not been verified yet. Please submit your license for verification from the profile section.
          </p>
          <Link href="/profile" className="text-blue-600 hover:underline">
            Go to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Manage Your Availability</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="UTC">UTC</option>
            <option value="UTC+1">UTC+1</option>
            <option value="UTC+2">UTC+2</option>
            <option value="UTC+3">UTC+3</option>
            <option value="UTC-5">UTC-5 (Eastern Time)</option>
            <option value="UTC-6">UTC-6 (Central Time)</option>
            <option value="UTC-8">UTC-8 (Pacific Time)</option>
            <option value="UTC+5">UTC+5 (Pakistan Standard Time)</option>
          </select>
        </div>

        <div className="space-y-4">
          {daysOfWeek.map((day) => {
            const currentDay = availability.find((av) => av.day === day) || {
              day,
              enabled: false,
              from: '',
              to: '',
            };
            return (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2 sm:mb-0">
                  <Switch
                    checked={currentDay.enabled}
                    onChange={() => handleToggleDay(day)}
                    className={`${
                      currentDay.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        currentDay.enabled ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                  <span className="ml-3 text-gray-900 font-medium">{day}</span>
                </div>

                {currentDay.enabled && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={currentDay.from}
                      onChange={(e) => handleTimeChange(day, 'from', e.target.value)}
                      className="border border-gray-300 rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={currentDay.to}
                      onChange={(e) => handleTimeChange(day, 'to', e.target.value)}
                      className="border border-gray-300 rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {Object.values(errors).map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleSaveAvailability}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySettings;
