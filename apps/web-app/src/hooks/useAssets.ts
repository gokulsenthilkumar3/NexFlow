'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AssetStatus = 'Available' | 'Assigned' | 'Maintenance' | 'Retired';
export type AssetCategory = 'Laptop' | 'Monitor' | 'Phone' | 'License' | 'Peripheral' | 'Other';

export interface AssetAssignment {
  id: string;
  user_id: string;
  assigned_at: string;
  returned_at?: string;
  assigned_by: string;
  notes?: string;
}

export interface AssetAuditLog {
  id: string;
  action: string;
  performed_by: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Asset {
  id: string;
  name: string;
  serial_number: string;
  category: AssetCategory;
  status: AssetStatus;
  purchase_date?: string;
  warranty_expiry?: string;
  purchase_cost?: number;
  notes?: string;
  qr_code_url?: string;
  linked_ticket_id?: string;
  assignments?: AssetAssignment[];
  audit_logs?: AssetAuditLog[];
  created_at: string;
  updated_at?: string;
}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const ASSET_KEYS = {
  all: ['assets'] as const,
  list: (f?: object) => ['assets', 'list', f] as const,
  detail: (id: string) => ['assets', 'detail', id] as const,
  byTicket: (ticketId: string) => ['assets', 'ticket', ticketId] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useAssets(filters?: { status?: string; category?: string; search?: string }) {
  return useQuery({
    queryKey: ASSET_KEYS.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<Asset[]>('/api/assets', { params: filters });
      return data;
    },
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ASSET_KEYS.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Asset>(`/api/assets/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useAssetsByTicket(ticketId: string) {
  return useQuery({
    queryKey: ASSET_KEYS.byTicket(ticketId),
    queryFn: async () => {
      const { data } = await apiClient.get<Asset[]>(`/api/assets/by-ticket/${ticketId}`);
      return data;
    },
    enabled: Boolean(ticketId),
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<Asset>) => {
      const { data } = await apiClient.post<Asset>('/api/assets', dto);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSET_KEYS.all }),
  });
}

export function useAssignAsset(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { userId: string; assignedBy: string; notes?: string }) => {
      const { data } = await apiClient.post(`/api/assets/${id}/assign`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ASSET_KEYS.all });
      qc.invalidateQueries({ queryKey: ASSET_KEYS.detail(id) });
    },
  });
}

export function useReturnAsset(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/api/assets/${id}/return`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ASSET_KEYS.all });
      qc.invalidateQueries({ queryKey: ASSET_KEYS.detail(id) });
    },
  });
}

export function useMaintenanceAsset(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/api/assets/${id}/maintenance`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSET_KEYS.detail(id) }),
  });
}

export function useRetireAsset(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/api/assets/${id}/retire`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSET_KEYS.detail(id) }),
  });
}

export function useLinkAssetToTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data } = await apiClient.post(`/api/assets/${id}/link-ticket/${ticketId}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSET_KEYS.detail(id) }),
  });
}
