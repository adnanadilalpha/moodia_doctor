import { auth } from '@/app/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper function to get auth token
const getAuthToken = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('No authentication token available');
  }
  return token;
};

interface CheckoutSessionData {
  priceId: string;
  doctorId: string;
  doctorEmail: string;
  planId: string;
  interval: 'monthly' | 'annually';
}

interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

interface SubscriptionResponse {
  status: 'active' | 'inactive' | 'cancelled';
  planId: string;
  currentPeriodEnd: string;
}

interface AvailabilityData {
  availability: Array<{
    day: string;
    from: string;
    to: string;
  }>;
  timezone: string;
}

export const apiService = {
  // Stripe related endpoints
  createCheckoutSession: async (data: CheckoutSessionData): Promise<CheckoutSessionResponse> => {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to create checkout session');
    }
    
    return response.json();
  },

  // Doctor subscription endpoints
  getDoctorSubscription: async (doctorId: string): Promise<SubscriptionResponse> => {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/doctors/${doctorId}/subscription`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription status');
    }
    return response.json();
  },

  // Availability management
  updateAvailability: async (doctorId: string, data: AvailabilityData): Promise<void> => {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/doctors/${doctorId}/availability`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update availability');
    }
    
    return response.json();
  },

  getAvailability: async (doctorId: string): Promise<AvailabilityData> => {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/doctors/${doctorId}/availability`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch availability');
    }
    return response.json();
  },
}; 