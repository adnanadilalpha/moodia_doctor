import React, { useState } from 'react';
import { AvailabilityModal } from '../components/AvailabilityModal';
import { PricingModal } from '../components/PricingModal';

const AppointmentsPage = () => {
  const [showAvailability, setShowAvailability] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  return (
    <>
      {/* Your other components */}
      
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