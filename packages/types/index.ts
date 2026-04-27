export type CurrencyCode = 'EUR' | 'USD';

export type Money = {
  amount: number;
  currency: CurrencyCode;
};

export type EntityId = string;
