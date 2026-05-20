import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
export type SLAPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
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
  slaResponseAt?: string;
  slaResolveAt?: string;
  createdAt: string;
}

export interface CreateTicketDto {
  subject: string;
  description: string;
  contactEmail: string;
  priority?: SLAPriority;
}

// ── Query Keys ────────────────────────────────────────────────────────────────
export const TICKET_KEYS = {
  all: ['tickets'] as const,
  list: (status?: TicketStatus) =>
    status ? [...TICKET_KEYS.all, status] : TICKET_KEYS.all,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetches helpdesk tickets, optionally filtered by status.
 */
export function useTickets(status?: TicketStatus) {
  return useQuery({
    queryKey: TICKET_KEYS.list(status),
    queryFn: async () => {
      const params = status ? { status } : {};
      const { data } = await apiClient.get<Ticket[]>('/api/tickets/', { params });
      return data;
    },
  });
}

/**
 * Fetches only the highest-priority open tickets (Critical + High, limited to 5).
 * Used by the "Priority Tickets" sidebar widget on the dashboard.
 */
export function usePriorityTickets() {
  return useQuery({
    queryKey: [...TICKET_KEYS.all, 'priority'],
    queryFn: async () => {
      const { data } = await apiClient.get<Ticket[]>('/api/tickets/', {
        params: { priority: 'CRITICAL,HIGH', limit: 5 },
      });
      return data;
    },
    staleTime: 1000 * 15, // 15s — priority tickets refresh more often
  });
}

/**
 * Mutation to create a new helpdesk ticket.
 * On success, invalidates the tickets cache to trigger a list refetch.
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateTicketDto) => {
      const { data } = await apiClient.post<Ticket>('/api/tickets/', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all });
    },
  });
}
