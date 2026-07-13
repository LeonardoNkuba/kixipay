export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  status?: string;
  isDemo?: boolean;
};

export type GroupSettings = {
  id: string;
  groupId: string;
  defaultInterestRate: number | string;
  collectionDay: number;
  maxMembers?: number | null;
  requireLoanApproval: boolean;
};

export type TrustScore = {
  id: string;
  score: number;
  onTimePayments: number;
  latePayments: number;
};

export type Membership = {
  id: string;
  userId: string;
  groupId: string;
  role: "ADMIN" | "TREASURER" | "MEMBER";
  joinedAt: string;
  isActive: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  trustScore?: TrustScore | null;
};

export type Group = {
  id: string;
  name: string;
  description?: string | null;
  monthlyContribution: number | string;
  currency: string;
  maxMembers?: number | null;
  cycleType: "WEEKLY" | "MONTHLY";
  startDate: string;
  status: "ACTIVE" | "PAUSED" | "CLOSED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberships?: Membership[];
  settings?: GroupSettings | null;
};

export type Loan = {
  id: string;
  groupId: string;
  userId: string;
  amount: number | string;
  interestRate: number | string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  dueDate: string;
  createdAt: string;
};

export type Contribution = {
  id: string;
  groupId: string;
  userId: string;
  amount: number | string;
  referenceMonth: string;
  status: "PENDING" | "PAID" | "LATE";
  paidAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type DashboardStats = {
  totalBalance: number;
  totalMembers: number;
  monthlyContributions: number;
  activeLoans: number;
  groupsCount: number;
  chartData: Array<{ name: string; value: number }>;
  loansByStatus: Array<{ status: "PENDING" | "APPROVED" | "REJECTED" | "PAID"; count: number }>;
};

export type ReportsSummary = {
  totals: {
    contributionsCollected: number;
    contributionsPending: number;
    loansOutstanding: number;
    loansIssued: number;
  };
  groups: Array<{
    groupId: string;
    groupName: string;
    currency: string;
    contributionsCollected: number;
    contributionsPending: number;
    loansOutstanding: number;
    loansCount: number;
  }>;
  trustLeaderboard: Array<{
    membershipId: string;
    name: string;
    groupName: string;
    score: number;
    onTimePayments: number;
    latePayments: number;
  }>;
};
