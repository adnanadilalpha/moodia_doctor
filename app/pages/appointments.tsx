import React, { useState } from 'react';
import { AvailabilityModal } from '../components/AvailabilityModal';
import { PricingModal } from '../components/pricing/PricingModal';
import { apiService } from '@/app/services/api';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-hot-toast';

interface AvailabilityData {
  availability: Array<{
    day: string;
    from: string;
    to: string;
  }>;
  timezone: string;
}

const AppointmentsPage = () => {
  const [showAvailability, setShowAvailability] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const auth = getAuth();

  const handleSaveAvailability = async (data: AvailabilityData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please login to save settings');
        return;
      }

      await apiService.updateAvailability(user.uid, {
        availability: data.availability,
        timezone: data.timezone
      });

      setShowAvailability(false);
    } catch (error) {
      console.error('Error saving availability:', error);
      throw error;
    }
  };

  return (
    <>
      {showAvailability && (
        <AvailabilityModal
          onClose={() => setShowAvailability(false)}
          onSave={handleSaveAvailability}
          onShowPricing={() => {
            setShowPricing(true);
          }}
        />
      )}

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
      />
    </>
  );
};

export default AppointmentsPage; 