import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import SubscriptionSettings from './subscriptionsetting';

interface PaymentMethod {
  method: string;
  cardholder: string;
  cardNumber?: string;
  expiryDate?: string;
}

const PaymentSettings = () => {
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<PaymentMethod[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('creditcard');
  const [cardholder, setCardholder] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const firestore = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchSavedPaymentMethods = async () => {
      if (userId) {
        try {
          const docRef = doc(firestore, 'doctorPaymentMethod', userId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setSavedPaymentMethods(docSnap.data().methods || []);
          }
        } catch (error) {
          console.error('Error fetching payment methods:', error);
        }
      }
    };

    fetchSavedPaymentMethods();
  }, [firestore, userId]);

  const handleDeletePaymentMethod = async (index: number) => {
    if (!userId) return;

    try {
      const updatedMethods = savedPaymentMethods.filter((_, i) => i !== index);
      const docRef = doc(firestore, 'doctorPaymentMethod', userId);
      await updateDoc(docRef, { methods: updatedMethods });
      setSavedPaymentMethods(updatedMethods);
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  const handleEditPaymentMethod = (index: number) => {
    const methodToEdit = savedPaymentMethods[index];
    setEditingIndex(index);
    setSelectedMethod(methodToEdit.method);
    setCardholder(methodToEdit.cardholder);
    setCardNumber(methodToEdit.cardNumber || '');
    setExpiryDate(methodToEdit.expiryDate || '');
  };

  const handleSavePaymentMethod = async () => {
    if (!userId) return;

    try {
      const newMethod: PaymentMethod = {
        method: selectedMethod,
        cardholder,
        ...(selectedMethod === 'creditcard' && { cardNumber, expiryDate }),
      };

      let updatedMethods = [...savedPaymentMethods];

      if (editingIndex !== null) {
        updatedMethods[editingIndex] = newMethod;
      } else {
        updatedMethods.push(newMethod);
      }

      const docRef = doc(firestore, 'doctorPaymentMethod', userId);
      await setDoc(docRef, { methods: updatedMethods }, { merge: true });
      setSavedPaymentMethods(updatedMethods);

      // Reset form
      setEditingIndex(null);
      setSelectedMethod('creditcard');
      setCardholder('');
      setCardNumber('');
      setExpiryDate('');
    } catch (error) {
      console.error('Error saving payment method:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Payment & Subscription</h2>
      
      <Tabs defaultValue="payment-methods" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="payment-methods">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                {editingIndex !== null ? 'Edit Payment Method' : 'Add New Payment Method'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <button
                    className={`px-4 py-2 rounded-lg ${selectedMethod === 'creditcard' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setSelectedMethod('creditcard')}
                  >
                    Credit Card
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg ${selectedMethod === 'paypal' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setSelectedMethod('paypal')}
                  >
                    PayPal
                  </button>
                </div>

                <input
                  type="text"
                  placeholder={selectedMethod === 'paypal' ? 'PayPal Email' : 'Cardholder Name'}
                  value={cardholder}
                  onChange={(e) => setCardholder(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />

                {selectedMethod === 'creditcard' && (
                  <>
                    <input
                      type="text"
                      placeholder="Card Number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Expiry Date (MM/YY)"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                    />
                  </>
                )}

                <button
                  onClick={handleSavePaymentMethod}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  {editingIndex !== null ? 'Update Payment Method' : 'Add Payment Method'}
                </button>
              </div>
            </div>

            {savedPaymentMethods.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Saved Payment Methods</h3>
                <div className="space-y-4">
                  {savedPaymentMethods.map((method, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="mb-2 sm:mb-0">
                        <p className="font-medium">{method.method === 'creditcard' ? 'Credit Card' : 'PayPal'}</p>
                        <p className="text-sm text-gray-600">{method.cardholder}</p>
                        {method.method === 'creditcard' && (
                          <p className="text-sm text-gray-600">**** **** **** {method.cardNumber?.slice(-4)}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPaymentMethod(index)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePaymentMethod(index)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSettings;
