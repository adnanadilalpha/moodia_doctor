import { FiCheckCircle, FiClock } from 'react-icons/fi';
import { Button } from '../ui/button';
import Link from 'next/link';

interface VerificationStepsProps {
  hasActiveSubscription: boolean;
  isLicenseVerified: boolean;
  onSubscribeClick: () => void;
}

export const VerificationSteps = ({ 
  hasActiveSubscription, 
  isLicenseVerified,
  onSubscribeClick 
}: VerificationStepsProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Step 1: Subscription */}
        <div className="flex items-start gap-4 p-4 rounded-lg bg-white border">
          <div className="flex-shrink-0">
            {hasActiveSubscription ? (
              <FiCheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                1
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {hasActiveSubscription ? 'Subscription Active' : 'Activate Subscription'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {hasActiveSubscription 
                ? 'Your subscription is active and you can manage your availability.'
                : 'Choose a subscription plan to start managing your availability.'}
            </p>
            {!hasActiveSubscription && (
              <Button
                onClick={onSubscribeClick}
                className="mt-3 bg-blue-600 text-white hover:bg-blue-700"
              >
                View Plans
              </Button>
            )}
          </div>
        </div>

        {/* Step 2: License Verification */}
        <div className="flex items-start gap-4 p-4 rounded-lg bg-white border">
          <div className="flex-shrink-0">
            {isLicenseVerified ? (
              <FiCheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                {hasActiveSubscription ? '1' : '2'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {isLicenseVerified ? 'License Verified' : 'Verify License'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isLicenseVerified 
                ? 'Your medical license has been verified.'
                : 'Submit your medical license for verification to proceed.'}
            </p>
            {!isLicenseVerified && (
              <Link 
                href="/profile" 
                className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Profile
              </Link>
            )}
          </div>
        </div>
      </div>

      {(!hasActiveSubscription || !isLicenseVerified) && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            Complete the {!hasActiveSubscription && !isLicenseVerified ? 'steps' : 'step'} above to manage your availability.
          </p>
        </div>
      )}
    </div>
  );
}; 