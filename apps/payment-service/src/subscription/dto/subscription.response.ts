import { Plan } from '../plan.enum';
import { SubscriptionStatus } from '../subscription-status.enum';

export class SubscriptionResponse {
  id: string;
  userId: string;
  plan: Plan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}
