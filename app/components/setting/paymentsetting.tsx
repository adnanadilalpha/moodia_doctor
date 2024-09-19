import React, { useState, useEffect } from 'react';
import PaymentMethodModal from '../setting/modal/paymentmethod';
import { useRouter } from 'next/navigation'; // Assuming Next.js for routing
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'; // Firebase Firestore
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase Authentication

const PaymentSettings = () => {
  const [showModal, setShowModal] = useState(false); // State to control the Payment Method modal
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([]); // State for multiple saved payment methods
  const [userId, setUserId] = useState<string | null>(null); // State to store the current user ID
  const [editMethodIndex, setEditMethodIndex] = useState<number | null>(null); // State to handle editing existing payment method
  const router = useRouter();
  const firestore = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    // Fetch the currently authenticated user
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // Set the current user ID when the user is authenticated
      } else {
        setUserId(null); // Handle the case when the user is not logged in
      }
    });

    return () => unsubscribe(); // Cleanup subscription
  }, [auth]);

  useEffect(() => {
    const fetchSavedPaymentMethods = async () => {
      if (userId) {
        try {
          const docRef = doc(firestore, 'doctorPaymentMethod', userId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            // Fetch the array of payment methods
            setSavedPaymentMethods(docSnap.data().methods || []);
          } else {
            console.log('No saved payment methods found.');
          }
        } catch (error) {
          console.error('Error fetching payment methods:', error);
        }
      }
    };

    fetchSavedPaymentMethods();
  }, [firestore, userId]);

  // Function to delete a payment method
  const handleDeletePaymentMethod = async (index: number) => {
    if (!userId) return;

    try {
      const updatedMethods = savedPaymentMethods.filter((_, i) => i !== index); // Remove the method at the specified index
      const docRef = doc(firestore, 'doctorPaymentMethod', userId);
      await updateDoc(docRef, { methods: updatedMethods }); // Update Firestore with the new array
      setSavedPaymentMethods(updatedMethods); // Update state after deletion
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  // Function to edit a payment method (opens the modal with pre-filled data)
  const handleEditPaymentMethod = (index: number) => {
    setEditMethodIndex(index);
    setShowModal(true);
  };

  // Callback function after saving or updating a payment method
  const handlePaymentMethodSaved = async (newMethod: any) => {
    if (!userId) return;

    try {
      let updatedMethods = [...savedPaymentMethods];

      // If we're editing an existing method, replace it
      if (editMethodIndex !== null) {
        updatedMethods[editMethodIndex] = newMethod;
      } else {
        // Otherwise, add the new method
        updatedMethods.push(newMethod);
      }

      const docRef = doc(firestore, 'doctorPaymentMethod', userId);
      await setDoc(docRef, { methods: updatedMethods }, { merge: true }); // Save to Firestore
      setSavedPaymentMethods(updatedMethods); // Update state

      setEditMethodIndex(null); // Reset the edit index
      setShowModal(false); // Close the modal
    } catch (error) {
      console.error('Error saving payment method:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Payment Settings</h2>

      {/* Button to open the Payment Method Modal */}
      <button
        onClick={() => {
          setEditMethodIndex(null); // Reset edit index when adding a new method
          setShowModal(true);
        }}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4"
      >
        Setup Payment Method
      </button>

      {/* Show saved payment methods */}
      {savedPaymentMethods.length > 0 ? (
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Saved Payment Methods:</h3>
          {savedPaymentMethods.map((method, index) => (
            <div key={index} className="mb-4 border-b pb-4">
              <p><strong>Method:</strong> {method.method === 'creditcard' ? 'Credit Card' : 'PayPal'}</p>
              <p><strong>Cardholder:</strong> {method.cardholder}</p>
              {method.method === 'creditcard' && (
                <>
                  <p><strong>Card Number:</strong> **** **** **** {method.cardNumber.slice(-4)}</p>
                  <p><strong>Expiry Date:</strong> {method.expiryDate}</p>
                </>
              )}
              <div className="mt-2">
                <button
                  className="text-blue-500 mr-4 hover:underline"
                  onClick={() => handleEditPaymentMethod(index)} // Open modal to edit the payment method
                >
                  Edit
                </button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => handleDeletePaymentMethod(index)} // Delete payment method
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No saved payment methods found.</p>
      )}

      {/* Modal for Payment Method Setup */}
      {showModal && (
        <PaymentMethodModal
          onClose={() => setShowModal(false)}
          savedMethod={editMethodIndex !== null ? savedPaymentMethods[editMethodIndex] : null} // Pass the saved method to edit if available
          onSave={handlePaymentMethodSaved} // Callback to handle saving or updating the method
        />
      )}
    </div>
  );
};

export default PaymentSettings;
