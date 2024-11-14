import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { Button } from '../ui/button';
import { PricingModal } from '../pricing/PricingModal';
import { useDocument } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/app/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { apiService } from '@/app/services/api';
import { toast } from 'react-hot-toast';
import { FiClock, FiCalendar, FiGlobe, FiCheck } from 'react-icons/fi';
import { VerificationSteps } from '../shared/VerificationSteps';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TimeSlot {
  day: string;
  from: string;
  to: string;
  enabled: boolean;
}

interface DoctorSubscription {
  status: 'active' | 'inactive' | 'cancelled';
  currentPeriodEnd: Date;
  subscriptionId: string;
}

const AvailabilitySettings = () => {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timezone, setTimezone] = useState<string>('UTC');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [user] = useAuthState(auth);
  const [doctorDoc] = useDocument(
    user ? doc(db, 'doctors', user.uid) : null
  );
  const [isLicenseVerified, setIsLicenseVerified] = useState<boolean>(false);

  const subscription = doctorDoc?.data()?.subscription as DoctorSubscription | undefined;
  const hasActiveSubscription = subscription?.status === 'active';

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!user) return;

      try {
        const doctorRef = doc(db, 'doctors', user.uid);
        const docSnap = await getDoc(doctorRef);

        if (docSnap.exists()) {
          const doctorData = docSnap.data();
          setIsLicenseVerified(doctorData?.licenseStatus === 'approved');
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [user, doctorDoc]);

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!user) return;

      try {
        if (hasActiveSubscription) {
          const response = await apiService.getAvailability(user.uid);
          const existingAvailability = response?.availability || [];
          const availabilityArray = Array.isArray(existingAvailability) ? existingAvailability : [];

          setAvailability(
            daysOfWeek.map((day) => {
              const existingSlot = availabilityArray.find((slot) => slot.day === day);
              return existingSlot
                ? { 
                    day: existingSlot.day,
                    from: existingSlot.from,
                    to: existingSlot.to,
                    enabled: true 
                  }
                : { 
                    day, 
                    from: '09:00', 
                    to: '17:00', 
                    enabled: false 
                  };
            })
          );
          
          setTimezone(response?.timezone || 'UTC');
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error);
        toast.error('Failed to load availability settings');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [user, hasActiveSubscription]);

  const handleToggleDay = (day: string) => {
    setAvailability((prev) =>
      prev.map((timeSlot) =>
        timeSlot.day === day
          ? {
              ...timeSlot,
              enabled: !timeSlot.enabled,
              from: !timeSlot.enabled ? '09:00' : timeSlot.from,
              to: !timeSlot.enabled ? '17:00' : timeSlot.to,
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
    const newErrors: { [key: string]: string } = {};

    availability.forEach((slot) => {
      if (slot.enabled && slot.from && slot.to && slot.from >= slot.to) {
        newErrors[slot.day] = `End time must be after start time on ${slot.day}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateTimes()) {
      toast.error('Please fix the time errors before saving');
      return;
    }

    try {
      if (!user) throw new Error('No authenticated user');

      const enabledAvailability = availability
        .filter((slot) => slot.enabled)
        .map((slot) => ({
          day: slot.day,
          from: slot.from,
          to: slot.to,
        }));

      await apiService.updateAvailability(user.uid, {
        availability: enabledAvailability,
        timezone
      });

      toast.success('Availability updated successfully');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasActiveSubscription || !isLicenseVerified) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Your Availability</h2>
        <VerificationSteps
          hasActiveSubscription={hasActiveSubscription}
          isLicenseVerified={isLicenseVerified}
          onSubscribeClick={() => setShowPricingModal(true)}
        />
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiCalendar className="text-blue-600" />
          Manage Your Availability
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Set your working hours and manage your schedule efficiently.</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 sm:p-6">
          {/* Timezone Selection */}
          <div className="mb-6 sm:mb-8">
            <label className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              <FiGlobe className="text-blue-600" />
              Your Timezone
            </label>
            <div className="relative max-w-md">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full p-2 sm:p-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none text-sm sm:text-base"
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
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <FiClock className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4 sm:mb-6">
              <FiCalendar className="text-blue-600 flex-shrink-0" />
              Weekly Schedule
            </h3>
            
            <div className="grid gap-4">
              {availability.map((timeSlot) => (
                <div
                  key={timeSlot.day}
                  className={`rounded-xl transition-all ${
                    timeSlot.enabled 
                      ? 'bg-blue-50 border border-blue-100' 
                      : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      {/* Day Toggle Section */}
                      <div className="flex items-center min-w-[150px]">
                        <Switch
                          checked={timeSlot.enabled}
                          onChange={() => handleToggleDay(timeSlot.day)}
                          className={`${
                            timeSlot.enabled ? 'bg-blue-600' : 'bg-gray-300'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0`}
                        >
                          <span
                            className={`${
                              timeSlot.enabled ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                        <span className="ml-3 font-medium text-gray-900 whitespace-nowrap">
                          {timeSlot.day}
                        </span>
                      </div>

                      {/* Time Selection Section */}
                      {timeSlot.enabled && (
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto lg:justify-end">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-2 flex-1 sm:flex-none">
                              <FiClock className="text-blue-600 hidden sm:block flex-shrink-0" />
                              <input
                                type="time"
                                value={timeSlot.from}
                                onChange={(e) => handleTimeChange(timeSlot.day, 'from', e.target.value)}
                                className="w-full sm:w-32 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                                required
                              />
                            </div>
                            <span className="text-gray-500 px-1 whitespace-nowrap">to</span>
                            <input
                              type="time"
                              value={timeSlot.to}
                              onChange={(e) => handleTimeChange(timeSlot.day, 'to', e.target.value)}
                              className="w-full sm:w-32 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {errors[timeSlot.day] && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiCheck className="text-red-600 flex-shrink-0" />
                        <span className="break-words">{errors[timeSlot.day]}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Save Button */}
        <div className="border-t bg-white px-4 sm:px-6 py-4 rounded-b-2xl">
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium text-sm sm:text-base"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySettings;
