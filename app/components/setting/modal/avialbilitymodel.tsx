import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Switch } from '@headlessui/react';

// Days of the week for selection
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TimeSlot {
  day: string;
  from: string;
  to: string;
  enabled: boolean;
}

interface AvailabilityModalProps {
  onClose: () => void;
}

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({ onClose }) => {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timezone, setTimezone] = useState<string>('UTC'); // Default timezone
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const auth = getAuth();
  const firestore = getFirestore();

  useEffect(() => {
    const fetchAvailability = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const doctorRef = doc(firestore, 'doctors', user.uid);
      const docSnap = await getDoc(doctorRef);

      if (docSnap.exists()) {
        const doctorData = docSnap.data();
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
      } else {
        // Default state for availability (all days disabled, 9 AM to 5 PM)
        setAvailability(
          daysOfWeek.map((day) => ({
            day,
            from: '09:00',
            to: '17:00',
            enabled: false,
          }))
        );
      }
      setLoading(false);
    };

    fetchAvailability();
  }, [auth, firestore]);

  // Toggle day availability
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

  // Handle time change (from/to)
  const handleTimeChange = (day: string, timeType: 'from' | 'to', value: string) => {
    setAvailability((prev) =>
      prev.map((timeSlot) =>
        timeSlot.day === day ? { ...timeSlot, [timeType]: value } : timeSlot
      )
    );
  };

  // Validation: Ensure end time is after start time
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
    if (!validateTimes()) return; // Run validation before saving

    const user = auth.currentUser;
    if (!user) return;

    try {
      const doctorRef = doc(firestore, 'doctors', user.uid);

      // Filter out disabled days before saving to Firebase
      const enabledAvailability = availability
        .filter((slot) => slot.enabled)
        .map((slot) => ({
          day: slot.day,
          from: slot.from,
          to: slot.to,
        }));

      // Save or update the availability in Firebase
      await setDoc(
        doctorRef,
        {
          availability: enabledAvailability,
          timezone,
        },
        { merge: true } // Merging ensures we don't overwrite the entire document
      );

      alert('Availability updated successfully!');
      onClose(); // Close modal after saving
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  if (loading) return <p>Loading availability...</p>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg mx-4 md:mx-0">
        <h2 className="text-2xl font-semibold mb-6">Set Your Weekly Availability</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="UTC">UTC</option>
            <option value="UTC+1">UTC+1</option>
            <option value="UTC+2">UTC+2</option>
            <option value="UTC+3">UTC+3</option>
            <option value="UTC-5">UTC-5 (Eastern Time)</option>
            <option value="UTC-6">UTC-6 (Central Time)</option>
            <option value="UTC-8">UTC-8 (Pacific Time)</option>
            <option value="UTC+5">UTC+5 (Pakistan Standard Time)</option>
            {/* More timezones can be added here */}
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
              <div key={day} className="flex items-center justify-between">
                <Switch.Group>
                  <div className="flex items-center">
                    <Switch.Label className="mr-4 text-gray-900">{day}</Switch.Label>
                    <Switch
                      checked={currentDay.enabled}
                      onChange={() => handleToggleDay(day)}
                      className={`${
                        currentDay.enabled ? 'bg-blue-500' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    >
                      <span
                        className={`${
                          currentDay.enabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform bg-white rounded-full transition-transform`}
                      />
                    </Switch>
                  </div>
                </Switch.Group>

                {currentDay.enabled && (
                  <div className="flex space-x-4">
                    <input
                      type="time"
                      value={currentDay.from}
                      onChange={(e) => handleTimeChange(day, 'from', e.target.value)}
                      className="border border-gray-300 rounded-md p-1"
                      required
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={currentDay.to}
                      onChange={(e) => handleTimeChange(day, 'to', e.target.value)}
                      className="border border-gray-300 rounded-md p-1"
                      required
                    />
                  </div>
                )}

                {/* Display validation error if end time is before start time */}
                {errors[day] && <p className="text-red-500 text-xs mt-1">{errors[day]}</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="mr-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAvailability}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;
