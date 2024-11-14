import React, { useState } from 'react';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { format } from 'date-fns';
import { FiCheckCircle, FiClock, FiAlertCircle, FiX } from 'react-icons/fi';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { PricingModal } from '../pricing/PricingModal';

interface Subscription {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: { seconds: number };
  currentPeriodStart: { seconds: number };
  customerId: string;
  priceId: string;
  status: 'active' | 'cancelled' | 'past_due';
  subscriptionId: string;
  updatedAt: { seconds: number };
}

const SubscriptionSettings = () => {
  const [user] = useAuthState(auth);
  const [doctorDoc, loading] = useDocument(
    user ? doc(db, 'doctors', user.uid) : null
  );
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const subscription = doctorDoc?.data()?.subscription as Subscription | undefined;

  const handleCancelSubscription = async () => {
    // Add your cancellation logic here
    setShowCancelDialog(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
          <p className="text-gray-600 mb-4">You don't have any active subscription plans.</p>
          <Button className="bg-blue-600 text-white hover:bg-blue-700">
            View Plans
          </Button>
        </div>
      </div>
    );
  }

  const currentPeriodEnd = new Date(subscription.currentPeriodEnd.seconds * 1000);
  const currentPeriodStart = new Date(subscription.currentPeriodStart.seconds * 1000);
  const updatedAt = new Date(subscription.updatedAt.seconds * 1000);

  return (
    <>
      <div className="space-y-6">
        {/* Subscription Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Subscription Status</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium
              ${subscription.status === 'active' ? 'bg-green-100 text-green-800' : 
                subscription.status === 'past_due' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}`}
            >
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Current Period</p>
              <p className="font-medium">
                {format(currentPeriodStart, 'MMM d, yyyy')} - {format(currentPeriodEnd, 'MMM d, yyyy')}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Auto Renewal</p>
              <p className="font-medium flex items-center gap-2">
                {subscription.cancelAtPeriodEnd ? (
                  <span className="text-red-600 flex items-center gap-1">
                    <FiAlertCircle /> Cancels on {format(currentPeriodEnd, 'MMM d, yyyy')}
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center gap-1">
                    <FiCheckCircle /> Active
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">{format(updatedAt, 'MMM d, yyyy')}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Subscription ID</p>
              <p className="font-medium font-mono text-sm">{subscription.subscriptionId}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {subscription.cancelAtPeriodEnd ? (
              <Button className="bg-primary text-white hover:bg-primary/90">
                Resume Subscription
              </Button>
            ) : (
              <Button 
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Subscription
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => setShowPricingModal(true)}
            >
              Update Plan
            </Button>
          </div>
        </div>

        {/* Cancel Subscription Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-red-600">
                  <FiAlertCircle className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">Cancel Subscription</h3>
                </div>
                <button 
                  onClick={() => setShowCancelDialog(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to cancel your subscription? This will:
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4 text-red-500" />
                    Stop automatic renewals
                  </li>
                  <li className="flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4 text-red-500" />
                    End your access on {format(new Date(subscription.currentPeriodEnd.seconds * 1000), 'MMMM d, yyyy')}
                  </li>
                  <li className="flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4 text-red-500" />
                    Limit your ability to manage appointments
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCancelDialog(false)}
                >
                  Keep Subscription
                </Button>
                <Button 
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={handleCancelSubscription}
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </div>
        </Dialog>

        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          currentPlanId={subscription?.priceId}
        />

        {/* Billing History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
          {/* Add billing history table here */}
        </div>
      </div>
    </>
  );
};

export default SubscriptionSettings; 