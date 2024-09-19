import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'; // Firebase Firestore
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase Authentication

interface PaymentMethodModalProps {
  onClose: () => void;
  savedMethod?: any | null; // Payment method to edit (if provided)
  onSave: (method: any, isEdit: boolean, index?: number) => void; // Callback to save the payment method
  index?: number; // Index of the method being edited
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ onClose, savedMethod, onSave, index }) => {
  const [selectedMethod, setSelectedMethod] = useState(savedMethod?.method || 'creditcard'); // Default method: credit card
  const [cardholder, setCardholder] = useState(savedMethod?.cardholder || '');
  const [cardNumber, setCardNumber] = useState(savedMethod?.cardNumber || '');
  const [expiryDate, setExpiryDate] = useState(savedMethod?.expiryDate || '');
  const [userId, setUserId] = useState<string | null>(null); // Store the current user's ID
  const firestore = getFirestore();
  const auth = getAuth();

  // Get the current authenticated user's ID
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // Store the user's ID when authenticated
      }
    });

    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, [auth]);

  const handleSavePaymentMethod = async () => {
    if (!userId) {
      console.error('User is not authenticated');
      return;
    }

    try {
      const newMethod = {
        method: selectedMethod,
        cardholder,
        cardNumber,
        expiryDate,
      };

      // Save the payment method and notify the parent whether it's an edit or a new method
      onSave(newMethod, !!savedMethod, index);
      onClose(); // Close the modal after saving
    } catch (error) {
      console.error('Error saving payment method:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{savedMethod ? 'Edit Payment Method' : 'Setup Payment Method'}</h2>

        {/* Payment method selection */}
        <div className="mb-4">
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 rounded-lg border ${selectedMethod === 'creditcard' ? 'border-blue-500' : 'border-gray-300'}`}
              onClick={() => setSelectedMethod('creditcard')}
            >
              Credit Card
            </button>
            <button
              className={`px-4 py-2 rounded-lg border ${selectedMethod === 'paypal' ? 'border-blue-500' : 'border-gray-300'}`}
              onClick={() => setSelectedMethod('paypal')}
            >
              PayPal
            </button>
          </div>
        </div>

        {/* Cardholder and Card Details Input */}
        {selectedMethod === 'creditcard' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Cardholder Name"
              value={cardholder}
              onChange={(e) => setCardholder(e.target.value)}
              className="block w-full p-3 mb-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Card Number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="block w-full p-3 mb-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Expiry Date (MM/YY)"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="block w-full p-3 mb-2 border rounded-lg"
            />
          </div>
        )}

        {/* PayPal or other payment methods can have different inputs */}
        {selectedMethod === 'paypal' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="PayPal Email"
              value={cardholder}
              onChange={(e) => setCardholder(e.target.value)}
              className="block w-full p-3 mb-2 border rounded-lg"
            />
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="mr-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePaymentMethod}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {savedMethod ? 'Update Card' : 'Add Card'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;
