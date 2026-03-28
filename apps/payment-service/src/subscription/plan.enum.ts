export enum Plan {
  FREE = 'FREE',
  PREMIUM_MONTHLY = 'PREMIUM_MONTHLY',
  PREMIUM_ANNUAL = 'PREMIUM_ANNUAL',
  B2B_STARTER = 'B2B_STARTER',
  B2B_PRO = 'B2B_PRO',
}

export const PLAN_PRICES = {
  [Plan.FREE]: { mad: 0, usd: 0 },
  [Plan.PREMIUM_MONTHLY]: { mad: 49, usd: 5 },
  [Plan.PREMIUM_ANNUAL]: { mad: 399, usd: 40 },
  [Plan.B2B_STARTER]: { mad: 999, usd: 100 },
  [Plan.B2B_PRO]: { mad: 2499, usd: 250 },
};

export const PLAN_FEATURES = {
  [Plan.FREE]: {
    applications: 5,
    bundles: 1,
    emailConfigs: 1,
    aiFeatures: false,
    networking: false,
  },
  [Plan.PREMIUM_MONTHLY]: {
    applications: -1,
    bundles: 10,
    emailConfigs: 5,
    aiFeatures: true,
    networking: true,
    trialDays: 7,
  },
  [Plan.PREMIUM_ANNUAL]: {
    applications: -1,
    bundles: 10,
    emailConfigs: 5,
    aiFeatures: true,
    networking: true,
    priorityAI: true,
    analytics: true,
  },
  [Plan.B2B_STARTER]: {
    apiCalls: 1000,
    webhooks: true,
  },
  [Plan.B2B_PRO]: {
    apiCalls: 10000,
    webhooks: true,
    sla: 99.9,
  },
};
