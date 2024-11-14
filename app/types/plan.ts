export interface Plan {
  id: string;
  name: string;
  price: {
    monthly: number;
    annually: number;
  };
  features: string[];
  stripeMonthlyPriceId: string;
  stripeAnnualPriceId: string;
}

export type BillingInterval = 'monthly' | 'annually'; 