"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { plans } from '@/app/config/plans';
import { BillingInterval, Plan } from '@/app/types/plan';
import { auth, db } from '@/app/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { FiCheck, FiStar, FiX } from 'react-icons/fi';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentPlanId
}) => {
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('monthly');
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'doctors', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const subscription = docSnap.data()?.subscription;
        if (subscription?.priceId) {
          setCurrentPlan(subscription.priceId);
        }
      }
    };

    fetchCurrentPlan();
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user || !user.email) {
        toast.error('Please log in with a valid email to subscribe');
        return;
      }

      const priceId = selectedInterval === 'monthly' ? 
        plan.stripeMonthlyPriceId : 
        plan.stripeAnnualPriceId;

      if (!priceId) {
        toast.error('Invalid price configuration');
        return;
      }

      // Get the auth token
      const token = await user.getIdToken();

      // Create checkout session directly
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceId,
          doctorId: user.uid,
          doctorEmail: user.email,
          planId: plan.id,
          interval: selectedInterval
        })
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', responseText);
        throw new Error(`Server error: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create checkout session');
      }

      const { url } = responseData;
      
      if (!url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to start subscription process. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 lg:p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="text-center flex-1">
                <DialogTitle className="text-3xl font-bold text-gray-900">
                  Choose Your Plan
                </DialogTitle>
                <p className="mt-2 text-gray-600">
                  Select the perfect plan for your practice
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-slate-400 border border-slate-200 p-1 rounded-xl">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setSelectedInterval('monthly')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedInterval === 'monthly'
                        ? 'bg-yellow-500 text-gray-900 shadow'
                        : 'text-gray-50 hover:text-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSelectedInterval('annually')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedInterval === 'annually'
                        ? 'bg-yellow-500 text-gray-900 shadow'
                        : 'text-gray-50 hover:text-gray-200'
                    }`}
                  >
                    Annually
                    <span className="ml-1 text-lime-200 text-xs">Save 17%</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => {
                const isCurrentPlan = currentPlan === (
                  selectedInterval === 'monthly' ? plan.stripeMonthlyPriceId : plan.stripeAnnualPriceId
                );
                
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl p-6 ${
                      plan.id === 'doctor-plus'
                        ? 'border-2 border-primary shadow-primary/10'
                        : 'border border-gray-200'
                    } transition-all hover:shadow-lg`}
                  >
                    {plan.id === 'doctor-plus' && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-black px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                          <FiStar className="w-4 h-4" />
                          Popular
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">
                          £{selectedInterval === 'monthly' ? plan.price.monthly : Math.round(plan.price.annually / 12)}
                        </span>
                        <span className="text-gray-600">/month</span>
                      </div>
                      {selectedInterval === 'annually' && (
                        <p className="mt-1 text-sm text-green-600">
                          £{plan.price.annually} billed annually
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={loading || isCurrentPlan}
                      className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                        isCurrentPlan
                          ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                          : plan.id === 'doctor-plus'
                          ? 'bg-primary text-white hover:bg-primary/90'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {isCurrentPlan ? 'Current Plan' : loading ? 'Processing...' : 'Subscribe Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}; 