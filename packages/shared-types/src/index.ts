// packages/shared-types/src/index.ts
export * from './work-item';
export * from './ticket';
export * from './incident';

// packages/shared-types/src/work-item.ts
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
  priority: number;
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

// packages/shared-types/src/ticket.ts
export enum TicketStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export interface Ticket {
  id: string;
  subject: string;
  content: string;
  customerEmail: string;
  status: TicketStatus;
  priority: string;
  assignedAgentId?: string;
  linkedWorkItemId?: string;
  slaDeadline: Date;
  createdAt: Date;
}

// packages/shared-types/src/incident.ts
export interface Incident {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  pipelineRunId?: string;
  blastRadiusEstimate: any;
  aiResolutionPlan?: string;
  createdAt: Date;
}
