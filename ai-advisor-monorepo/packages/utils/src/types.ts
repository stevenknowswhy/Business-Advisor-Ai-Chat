/**
 * Subscription plan types
 */
export type PlanType = 'free' | 'base' | 'premium';

/**
 * Advisor types and configurations
 */
export interface AdvisorType {
  id: string;
  name: string;
  title: string;
  description: string;
  imageUrl?: string;
  personality: string;
  expertise: string[];
  model: string;
  systemPrompt: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Conversation types
 */
export interface ConversationType {
  id: string;
  title: string;
  userId: string;
  advisorId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message types
 */
export interface MessageType {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

/**
 * User subscription information
 */
export interface UserSubscription {
  plan: PlanType;
  isActive: boolean;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}
