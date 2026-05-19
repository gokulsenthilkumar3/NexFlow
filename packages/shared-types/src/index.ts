export enum WorkItemType {
  EPIC = 'EPIC',
  STORY = 'STORY',
  TASK = 'TASK',
  BUG = 'BUG'
}

export enum WorkItemStatus {
  NEW = 'NEW',
  APPROVED = 'APPROVED',
  COMMITTED = 'COMMITTED',
  DONE = 'DONE',
  REMOVED = 'REMOVED'
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

export enum SLAPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  contactEmail: string;
  priority: SLAPriority;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedAgentId?: string;
  linkedWorkItemId?: string;
  slaResponseAt?: Date;
  slaResolveAt?: Date;
  createdAt: Date;
}

export * from './guards/jwt-auth.guard';
export * from './guards/roles.guard';
export * from './guards/project-scope.guard';
