export type UserRole = 'student' | 'seller' | 'service_provider' | 'admin' | 'tutor' | 'centre';

export interface KycDetails {
  panNumber?: string;
  aadhaarLast4?: string;
  businessName?: string;
  bankAccountNo?: string;
  ifscCode?: string;
  upiVpa?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  classLevel: number; // 6 - 12
  stream?: 'Science' | 'Commerce' | 'Arts';
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  badges: Badge[];
  createdAt: string;
  // Auth & Roles
  isRoleSelected?: boolean;
  authProvider?: 'mobile_otp' | 'google' | 'email_password';
  kycStatus?: 'not_submitted' | 'pending_verification' | 'verified' | 'rejected';
  kycDetails?: KycDetails;
  payoutBalance?: number; // 85% net earnings available for payout
  totalEarned?: number;
  totalWithdrawn?: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export type SubjectMaterialType = 'mathematics' | 'business-studies' | 'physics' | 'biology' | 'accountancy';

export interface Subject {
  id: string;
  classLevel: number;
  name: string;
  code: string;
  icon: string;
  color: string;
  chaptersCount: number;
  description: string;
  stream?: 'Science' | 'Commerce' | 'Arts' | 'All';
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PracticeTestQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  marks: number;
  explanation: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  classLevel: number;
  chapterNumber: number;
  title: string;
  description: string;
  overview: string;
  keyConcepts: {
    title: string;
    explanation: string;
    example?: string;
  }[];
  formulas: string[];
  revisionNotes: string[];
  mcqs: MCQQuestion[];
  practiceTest: {
    id: string;
    title: string;
    durationMinutes: number;
    totalMarks: number;
    questions: PracticeTestQuestion[];
  };
}

export interface QuizAttemptResult {
  id: string;
  userId: string;
  chapterId: string;
  subjectId: string;
  score: number;
  total: number;
  percentage: number;
  xpEarned: number;
  passed: boolean;
  date: string;
}

export interface PlannerTask {
  id: string;
  userId: string;
  subject: string;
  chapter: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  isCompleted: boolean;
  reminderEnabled: boolean;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

export type TuitionType = 'centre' | 'home' | 'online';

export interface TuitionProfile {
  id: string;
  type: TuitionType;
  name: string;
  tagLine: string;
  subjects: string[];
  classes: number[];
  fees: number;
  feeFrequency: 'per month' | 'per course';
  timings: string;
  location: string;
  address: string;
  rating: number;
  reviewCount: number;
  availableSeats: number;
  totalSeats: number;
  verified: boolean;
  faculty: string[];
  phone: string;
  email: string;
  description: string;
  referralCode: string;
  highlights: string[];
}

export type AdmissionStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Paid' | 'Enrolled' | 'Rejected';

export interface AdmissionRequest {
  id: string; // e.g. LX-ADM-XXXX
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  studentClass: number;
  tuitionId: string;
  tuitionName: string;
  tuitionType: TuitionType;
  preferredTiming: string;
  message?: string;
  status: AdmissionStatus;
  referralCode?: string;
  feeAmount: number;
  commissionAmount: number; // 15% LearnX platform commission
  commissionPercent: number; // 15
  paymentId?: string;
  qrCodeDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type MarketplaceCategory =
  | 'Used Books'
  | 'Stationery'
  | 'Peer Tutoring'
  | 'Tutoring'
  | 'Presentations & Charts'
  | 'PPT/Design'
  | 'Chart/Diagram'
  | 'Project Guidance'
  | 'Study Notes'
  | 'Notes Organization';

export interface MarketplaceItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerRole: UserRole;
  title: string;
  category: MarketplaceCategory;
  price: number;
  isExchange: boolean;
  condition?: 'Brand New' | 'Like New' | 'Good' | 'Fair';
  description: string;
  classLevel?: number;
  subject?: string;
  contactPhone: string;
  contactEmail: string;
  location: string;
  status: 'active' | 'sold' | 'under_review';
  tags: string[];
  createdAt: string;
}

export type PaymentStatus =
  | 'Pending'
  | 'Processing'
  | 'Paid'
  | 'Failed'
  | 'Cancelled'
  | 'Refunded';

export interface PaymentTransaction {
  id: string; // TXN-UPI-XXXX
  admissionId?: string;
  marketplaceItemId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  vpa: string;
  paymentMethod: 'UPI' | 'QR' | 'Intent';
  status: PaymentStatus;
  commissionAmount: number; // 15% LearnX commission for admissions
  netAmount: number; // amount - commission
  idempotencyKey: string;
  receiptNumber: string;
  createdAt: string;
  paidAt?: string;
  failureReason?: string;
  description: string;
}

export interface WebSearchResult {
  query: string;
  summary: string;
  sources: {
    title: string;
    uri: string;
    snippet?: string;
  }[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'admission' | 'payment' | 'study' | 'quiz' | 'badge' | 'system';
  read: boolean;
  timestamp: string;
  actionLink?: string;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  classLevel: number;
  xp: number;
  streakDays: number;
  level: number;
}

export interface MarketplaceOrder {
  id: string; // ORD-XXXX
  itemId: string;
  itemTitle: string;
  itemCategory: MarketplaceCategory;
  itemPrice: number;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  buyerAddress?: string;
  paymentTransactionId: string;
  status: 'Pending' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';
  trackingNumber?: string;
  grossAmount: number;
  learnxCommission: number; // 15% LearnX platform fee
  sellerPayoutAmount: number; // 85% net to seller
  createdAt: string;
  updatedAt: string;
}

export interface PayoutRecord {
  id: string; // PAYOUT-XXXX
  userId: string;
  userName: string;
  role: UserRole;
  grossAmount: number;
  commissionDeducted: number;
  netPayoutAmount: number;
  destinationType: 'bank_account' | 'upi';
  destinationDetail: string;
  status: 'Pending' | 'Processed' | 'Failed';
  utr?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface GatewayWebhookLog {
  id: string;
  gateway: 'phonepe' | 'razorpay' | 'cashfree' | 'npci_upi';
  event: string;
  transactionId: string;
  amount: number;
  status: string;
  signatureVerified: boolean;
  timestamp: string;
}

export interface AiDiagnosticStatus {
  apiKeyConfigured: boolean;
  primaryModel: string;
  fallbackModels: string[];
  activeModel: string;
  lastCheckedAt: string;
  status: 'connected' | 'degraded' | 'error';
  lastTechnicalError: string | null;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  latencyMs?: number;
}

