import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Switch } from '@headlessui/react';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TimeSlot {
  day: string;
  from: string;
  to: string;
  enabled: boolean;
}

interface AvailabilityModalProps {
  onClose: () => void;
  onSave: (availability: any) => Promise<void>;
}

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  onClose,
  onSave,
}) => {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timezone, setTimezone] = useState<string>('UTC');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
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

      onSave(enabledAvailability);
      onClose();
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <div className="p-6">
          <p>Loading...</p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Set Your Availability</h2>
        
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
          {availability.map((timeSlot) => (
            <div key={timeSlot.day} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2 sm:mb-0">
                <Switch
                  checked={timeSlot.enabled}
                  onChange={() => handleToggleDay(timeSlot.day)}
                  className={`${
                    timeSlot.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      timeSlot.enabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
                <span className="ml-3 text-gray-900 font-medium">{timeSlot.day}</span>
              </div>

              {timeSlot.enabled && (
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={timeSlot.from}
                    onChange={(e) => handleTimeChange(timeSlot.day, 'from', e.target.value)}
                    className="border border-gray-300 rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={timeSlot.to}
                    onChange={(e) => handleTimeChange(timeSlot.day, 'to', e.target.value)}
                    className="border border-gray-300 rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {Object.values(errors).map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAvailability}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Save Availability
          </Button>
        </div>
      </div>
    </Dialog>
  );
}; 