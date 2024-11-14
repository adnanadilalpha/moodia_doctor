import { Plan } from '../types/plan';

export const plans: Plan[] = [
  {
    id: 'doctor-starter',
    name: 'Doctor Starter',
    price: {
      monthly: 10,
      annually: 100,
    },
    features: [
      'Up to 50 appointments/month',
      'Basic availability management',
      'Email notifications',
      'Chat with patients',
      'Video consultations'
    ],
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_XXXXX',
    stripeAnnualPriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID || 'price_XXXXX'
  },
  {
    id: 'doctor-plus',
    name: 'Doctor Plus',
    price: {
      monthly: 20,
      annually: 200,
    },
    features: [
      'Unlimited appointments',
      'Advanced availability management',
      'Priority support',
      'Custom branding',
      'Analytics dashboard',
      'All Starter features'
    ],
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID || 'price_XXXXX',
    stripeAnnualPriceId: process.env.NEXT_PUBLIC_STRIPE_PLUS_ANNUAL_PRICE_ID || 'price_XXXXX'
  }
]; 