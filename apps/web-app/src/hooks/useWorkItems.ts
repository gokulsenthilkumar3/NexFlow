import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
export type WorkItemType = 'EPIC' | 'STORY' | 'TASK' | 'BUG';
export type WorkItemStatus = 'NEW' | 'APPROVED' | 'COMMITTED' | 'DONE' | 'REMOVED';

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
  metadata: { githubPrUrl?: string; linkedTicketId?: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkItemDto {
  title: string;
  description: string;
  type: WorkItemType;
  projectId: string;
}

// ── Query Keys ────────────────────────────────────────────────────────────────
export const WORK_ITEM_KEYS = {
  all: ['workItems'] as const,
  list: (projectId?: string) =>
    projectId ? [...WORK_ITEM_KEYS.all, projectId] : WORK_ITEM_KEYS.all,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetches the full list of work items, optionally filtered by projectId.
 */
export function useWorkItems(projectId?: string) {
  return useQuery({
    queryKey: WORK_ITEM_KEYS.list(projectId),
    queryFn: async () => {
      const params = projectId ? { projectId } : {};
      const { data } = await apiClient.get<WorkItem[]>('/api/work-items/', { params });
      return data;
    },
  });
}

/**
 * Mutation to create a new work item.
 * On success, invalidates the work-items cache to trigger a refetch.
 */
export function useCreateWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateWorkItemDto) => {
      const { data } = await apiClient.post<{ id: string; status: string }>('/api/work-items/', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_ITEM_KEYS.all });
    },
  });
}
