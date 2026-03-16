// ==================== ENUMS ====================

export enum UserRole {
  USER = 'USER',
  RECRUITER = 'RECRUITER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  B2B_CLIENT = 'B2B_CLIENT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  FREELANCE = 'FREELANCE',
  INTERNSHIP = 'INTERNSHIP',
  TEMPORARY = 'TEMPORARY',
}

export enum JobLevel {
  ENTRY = 'ENTRY',
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
  EXECUTIVE = 'EXECUTIVE',
}

export enum JobStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  FILLED = 'FILLED',
  DRAFT = 'DRAFT',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
}

export enum NotificationType {
  JOB_MATCH = 'JOB_MATCH',
  APPLICATION_UPDATE = 'APPLICATION_UPDATE',
  MESSAGE = 'MESSAGE',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
  ALERT = 'ALERT',
}

// ==================== INTERFACES ====================

export interface IUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IRole {
  id: string;
  name: string;
  description?: string;
  permissions: IPermission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  location: string;
  country: string;
  city: string;
  remote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  type: JobType;
  level: JobLevel;
  category: string;
  industry: string;
  skills: string[];
  source: string;
  sourceUrl?: string;
  status: JobStatus;
  views: number;
  applications: number;
  expiresAt?: Date;
  publishedAt?: Date;
  scrapedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: IPagination;
}

export interface IProfile {
  id: string;
  userId: string;
  title?: string;
  company?: string;
  industry?: string;
  experience?: number;
  salary?: number;
  salaryCurrency?: string;
  location?: string;
  country?: string;
  city?: string;
  remote: boolean;
  skills: string[];
  languages: string[];
  education?: any;
  certifications?: any;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
  jobPreferences?: any;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobApplication {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  aiScore?: number;
  aiInsights?: any;
  appliedAt: Date;
  updatedAt: Date;
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface IPayment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  description?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  paypalSubscriptionId?: string;
  amount: number;
  currency: string;
  interval: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt?: Date;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
