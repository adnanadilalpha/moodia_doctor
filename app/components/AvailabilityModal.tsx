import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Switch } from '@headlessui/react';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import Link from 'next/link';
import { FiClock, FiCalendar, FiGlobe } from 'react-icons/fi';
import { VerificationSteps } from './shared/VerificationSteps';
import { PricingModal } from './pricing/PricingModal';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [isLicenseVerified, setIsLicenseVerified] = useState<boolean>(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(true);
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [timezone, setTimezone] = useState<string>('UTC');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const auth = getAuth();
  const firestore = getFirestore();

  useEffect(() => {
    const fetchDoctorData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const doctorRef = doc(firestore, 'doctors', user.uid);
        const docSnap = await getDoc(doctorRef);

        if (docSnap.exists()) {
          const doctorData = docSnap.data();
          setIsLicenseVerified(doctorData?.licenseStatus === 'approved');
          setHasActiveSubscription(doctorData?.subscription?.status === 'active');

          if (doctorData?.licenseStatus === 'approved' && doctorData?.subscription?.status === 'active') {
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
      } catch (error) {
        console.error('Error fetching doctor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, []);

  const handleClose = () => {
    setShowAvailabilityDialog(false);
    onClose();
  };

  const handleShowPricing = () => {
    setShowPricingModal(true);
    setShowAvailabilityDialog(false);
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  if (!hasActiveSubscription || !isLicenseVerified) {
    return (
      <>
        <Dialog 
          open={showAvailabilityDialog} 
          onOpenChange={(open) => {
            setShowAvailabilityDialog(open);
            if (!open) onClose();
          }}
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-2xl w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Set Your Availability</h2>
              <VerificationSteps
                hasActiveSubscription={hasActiveSubscription}
                isLicenseVerified={isLicenseVerified}
                onSubscribeClick={handleShowPricing}
              />
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Dialog>

        <PricingModal
          isOpen={showPricingModal}
          onClose={() => {
            setShowPricingModal(false);
            setShowAvailabilityDialog(true);
          }}
        />
      </>
    );
  }

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

  return (
    <Dialog open={showAvailabilityDialog} onOpenChange={handleClose}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FiCalendar className="text-blue-600" />
                  Set Your Availability
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FiGlobe className="text-blue-600" />
                    Your Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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

                <div className="space-y-3">
                  {availability.map((timeSlot) => (
                    <div 
                      key={timeSlot.day}
                      className={`p-4 rounded-lg transition-all ${
                        timeSlot.enabled ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center">
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
                          <span className="ml-3 font-medium">{timeSlot.day}</span>
                        </div>

                        {timeSlot.enabled && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <FiClock className="text-blue-600" />
                              <input
                                type="time"
                                value={timeSlot.from}
                                onChange={(e) => handleTimeChange(timeSlot.day, 'from', e.target.value)}
                                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                required
                              />
                            </div>
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={timeSlot.to}
                              onChange={(e) => handleTimeChange(timeSlot.day, 'to', e.target.value)}
                              className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t bg-white px-4 py-4 mt-6">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => onSave(availability)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Availability
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}; 