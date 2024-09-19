import React, { useState } from 'react';
import AvailabilityModal from '../setting/modal/avialbilitymodel';  // Modal for updating availability

const AvailabilitySettings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-6">Availability Settings</h2>
      <button
        onClick={openModal}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Update Availability
      </button>

      {isModalOpen && <AvailabilityModal onClose={closeModal} />}
    </div>
  );
};

export default AvailabilitySettings;
