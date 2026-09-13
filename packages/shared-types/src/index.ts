// ─── Work Items ───────────────────────────────────────────────────────────────
export enum WorkItemType {
  EPIC   = 'EPIC',
  STORY  = 'STORY',
  TASK   = 'TASK',
  BUG    = 'BUG',
}

export enum WorkItemStatus {
  NEW       = 'NEW',
  APPROVED  = 'APPROVED',
  COMMITTED = 'COMMITTED',
  DONE      = 'DONE',
  REMOVED   = 'REMOVED',
}

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: number; // 1-4
  projectId: string;
  parentItemId?: string;
  assignedTo?: string;
  tags: string[];
  metadata: {
    githubPrUrl?: string;
    linkedTicketId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ─── Helpdesk / Tickets ───────────────────────────────────────────────────────
export enum SLAPriority {
  CRITICAL = 'CRITICAL',
  HIGH     = 'HIGH',
  MEDIUM   = 'MEDIUM',
  LOW      = 'LOW',
}

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  contactEmail: string;
  priority: SLAPriority;
  status: TicketStatus;
  assignedAgentId?: string;
  linkedWorkItemId?: string;
  slaResponseAt?: Date;
  slaResolveAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// ─── Knowledge Base ──────────────────────────────────────────────────────────
export type KbArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface KbCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  category?: Pick<KbCategory, 'id' | 'name' | 'slug'>;
  authorId: string;
  status: KbArticleStatus;
  views: number;
  helpfulYes: number;
  helpfulNo: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KbArticleVersion {
  id: string;
  articleId: string;
  version: number;
  content: string;
  changedBy: string;
  createdAt: Date;
}

// ─── Assets ──────────────────────────────────────────────────────────────────
export type AssetStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'RETIRED'
  | 'DISPOSED';

export interface Asset {
  id: string;
  name: string;
  tag: string;
  categoryId?: string;
  status: AssetStatus;
  serialNumber?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  location?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: Date;
  returnedAt?: Date;
  notes?: string;
}

export interface AssetAuditLog {
  id: string;
  assetId: string;
  action: string;
  actorId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  createdAt: Date;
}

// ─── People & Workplace ─────────────────────────────────────────────────────
export type NexoraRole = 'ADMIN' | 'MANAGER' | 'USER';
export interface Employee { id: string; clerkUserId?: string; email: string; fullName: string; employeeCode?: string; department?: string; designation?: string; managerId?: string; role: NexoraRole; isActive: boolean; createdAt: Date; updatedAt: Date; }
export interface AttendanceLog { id: string; employeeId: string; workDate: Date; clockIn?: Date; clockOut?: Date; status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | 'WFH'; notes?: string; }
export interface LeaveRequest { id: string; employeeId: string; leaveType: string; startDate: Date; endDate: Date; reason?: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; }
export interface Payslip { id: string; employeeId: string; period: string; basicSalary: number; allowances: number; deductions: number; netAmount: number; status: string; }
export interface JobPosting { id: string; title: string; department?: string; location?: string; status: string; }
export interface Applicant { id: string; jobId: string; name: string; email: string; stage: string; }
export interface WorkplaceBooking { id: string; resourceId: string; employeeId: string; startTime: Date; endTime: Date; purpose?: string; }
export interface MaintenanceRecord { id: string; assetId: string; issueType: string; status: string; priority: string; scheduledDate?: Date; }
export interface SyncRecord { id: string; entityType: string; sourceHrmsId: string; syncStatus: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED'; sourceUpdatedAt?: Date; nexoraUpdatedAt?: Date; }

// ─── Reporting ───────────────────────────────────────────────────────────────
export type ReportQueryType =
  | 'WORK_ITEMS'
  | 'TICKETS'
  | 'SLA'
  | 'ASSETS'
  | 'CUSTOM';

export type ReportRunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED';

export interface ReportDefinition {
  id: string;
  name: string;
  description?: string;
  queryType: ReportQueryType;
  config: Record<string, unknown>;
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportRun {
  id: string;
  definitionId: string;
  status: ReportRunStatus;
  triggeredBy: string;
  resultUrl?: string;
  errorMessage?: string;
  rowCount?: number;
  durationMs?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// ─── Guards ───────────────────────────────────────────────────────────────────
export * from './guards/jwt-auth.guard';
export * from './guards/roles.guard';
export * from './guards/project-scope.guard';
