// Family-related types
export interface Family {
  id: number;
  headOfFamily: string;
  parentage?: string;
  successor1st?: string;
  successor2nd?: string;
  address: string;
  houseNo: string;
  mobileNo: string;
  createdAt: string;
}

export interface InsertFamily {
  headOfFamily: string;
  parentage?: string;
  successor1st?: string;
  successor2nd?: string;
  address: string;
  houseNo: string;
  mobileNo: string;
}

// Payment-related types
export interface Payment {
  id: number;
  familyId: number;
  previousBalance: string;
  approvedFundRate: string;
  amountReceived: string;
  receiptNo?: string;
  paymentDate?: string;
  balance: string;
  totalOutstanding: string;
  notes?: string;
  createdAt: string;
}

export interface InsertPayment {
  familyId: number;
  previousBalance: string;
  approvedFundRate: string;
  amountReceived: string;
  receiptNo?: string;
  paymentDate?: string;
  notes?: string;
}

// Combined types
export interface FamilyWithPayments extends Family {
  latestPayment?: Payment | null;
}

// Dashboard statistics
export interface DashboardStats {
  totalFamilies: number;
  totalCollections: number;
  outstandingAmount: number;
  pendingPayments: number;
}

// Activity
export interface Activity {
  id: number;
  type: 'payment' | 'family_added' | 'family_updated' | 'reminder_sent';
  familyId: number;
  paymentId?: number;
  description: string;
  timestamp: string;
}

// Search/filter
export interface SearchParams {
  query?: string;
  page: number;
  limit: number;
}

export interface PaymentStatus {
  id: number;
  status: 'paid' | 'partial' | 'unpaid';
}
