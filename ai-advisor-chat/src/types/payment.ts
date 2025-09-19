// Payment and subscription types for the AI Advisor application

import { type Id } from "../../convex/_generated/dataModel";

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'canceled';
  client_secret: string;
  metadata: {
    advisorId?: string;
    subscriptionType: 'basic' | 'premium' | 'enterprise';
    userId: string;
  };
  created: number;
}

export interface Subscription {
  id: string;
  userId: Id<"users">;
  advisorId?: Id<"advisors">;
  type: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  metadata: {
    features: string[];
    maxMessages: number;
    prioritySupport: boolean;
  };
  created: number;
  updated: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  bank_account?: {
    bank_name: string;
    last4: string;
  };
  is_default: boolean;
}

export interface Invoice {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  created: number;
  due_date: number;
  paid_at?: number;
  pdf_url?: string;
}

export interface BillingInformation {
  name: string;
  email: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface PaymentFormData {
  advisorId?: string;
  subscriptionType: 'basic' | 'premium' | 'enterprise';
  billingInfo: BillingInformation;
  paymentMethodId?: string;
  savePaymentMethod: boolean;
}

export interface AdvisorPricing {
  basic: {
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
  };
  premium: {
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
  };
  enterprise: {
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
  };
}

export interface PaymentStatus {
  status: 'idle' | 'processing' | 'succeeded' | 'failed' | 'requires_action';
  error?: string;
  paymentIntent?: PaymentIntent;
  subscription?: Subscription;
}

export interface UserSubscription {
  subscription: Subscription;
  advisor?: {
    id: string;
    name: string;
    avatar?: string;
    specialty: string;
  };
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  usage: {
    messagesSent: number;
    messagesRemaining: number;
    periodEnd: number;
  };
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  advisorId?: string;
  subscriptionType: 'basic' | 'premium' | 'enterprise';
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionRequest {
  advisorId?: string;
  subscriptionType: 'basic' | 'premium' | 'enterprise';
  paymentMethodId: string;
  billingInfo: BillingInformation;
}

export interface UpdateSubscriptionRequest {
  subscriptionId: string;
  subscriptionType: 'basic' | 'premium' | 'enterprise';
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

export interface CancelSubscriptionRequest {
  subscriptionId: string;
  cancelAtPeriodEnd: boolean;
}

export interface PaymentApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: number;
}

export interface PaymentEvent {
  type: 'payment.succeeded' | 'payment.failed' | 'subscription.created' | 'subscription.updated' | 'subscription.canceled';
  data: {
    id: string;
    object: any;
    previous_attributes?: any;
  };
  created: number;
}

// RBAC Types
export interface UserRole {
  userId: Id<"users">;
  role: 'user' | 'subscriber' | 'advisor' | 'admin';
  permissions: string[];
  assignedAt: number;
  assignedBy?: Id<"users">;
}

export interface RolePermission {
  role: 'user' | 'subscriber' | 'advisor' | 'admin';
  permissions: string[];
  description: string;
}

export interface AssignRoleRequest {
  userId: Id<"users">;
  role: 'user' | 'subscriber' | 'advisor' | 'admin';
  assignedBy?: Id<"users">;
}

export interface RemoveRoleRequest {
  userId: Id<"users">;
  role: 'user' | 'subscriber' | 'advisor' | 'admin';
}

export interface UserRolesResponse {
  userId: Id<"users">;
  roles: UserRole[];
  permissions: string[];
}