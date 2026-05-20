'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAsset, useAssignAsset, useReturnAsset, useMaintenanceAsset, useRetireAsset, useLinkAssetToTicket,
  type AssetStatus,
} from '@/hooks/useAssets';

const STATUS_STYLES: Record<AssetStatus, string> = {
  Available:   'bg-green-500/15 text-green-300 border-green-500/30',
  Assigned:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Maintenance: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Retired:     'bg-slate-700/50 text-slate-400 border-slate-600',
};

const ACTION_BADGE_COLORS: Record<string, string> = {
  CREATED:      'bg-violet-500/20 text-violet-300',
  ASSIGNED:     'bg-blue-500/20 text-blue-300',
  RETURNED:     'bg-green-500/20 text-green-300',
  MAINTENANCE:  'bg-amber-500/20 text-amber-300',
  RETIRED:      'bg-slate-700/50 text-slate-400',
  LINKED_TICKET:'bg-cyan-500/20 text-cyan-300',
  UPDATED:      'bg-slate-600/30 text-slate-300',
};

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [assignForm, setAssignForm] = useState({ userId: '', notes: '' });
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [linkTicketId, setLinkTicketId] = useState('');

  const { data: asset, isLoading, error } = useAsset(id);
  const assignAsset    = useAssignAsset(id);
  const returnAsset    = useReturnAsset(id);
  const maintenance    = useMaintenanceAsset(id);
  const retire         = useRetireAsset(id);
  const linkTicket     = useLinkAssetToTicket(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-800/50" />)}
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Asset not found
      </div>
    );
  }

  const activeAssignment = asset.assignments?.find((a: any) => !a.returned_at);
  const warrantyExpiry = asset.warranty_expiry ? new Date(asset.warranty_expiry) : null;
  const warrantyDaysLeft = warrantyExpiry
    ? Math.floor((warrantyExpiry.getTime() - Date.now()) / 86_400_000)
    : null;
  const warrantyPct = warrantyExpiry && asset.purchase_date
    ? Math.max(0, Math.min(100, (warrantyDaysLeft! / ((warrantyExpiry.getTime() - new Date(asset.purchase_date).getTime()) / 86_400_000)) * 100))
    : null;

  const handleAssign = async () => {
    await assignAsset.mutateAsync({ userId: assignForm.userId, assignedBy: 'agent', notes: assignForm.notes });
    setShowAssignForm(false);
    setAssignForm({ userId: '', notes: '' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => router.push('/assets')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
        >
          ← Back to Assets
        </button>

        {/* Title row */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">{asset.name}</h1>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[asset.status as AssetStatus]}`}>
            {asset.status}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {asset.status === 'Available' && (
            <button
              onClick={() => setShowAssignForm((v) => !v)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              Assign to User
            </button>
          )}
          {asset.status === 'Assigned' && (
            <>
              <button onClick={() => returnAsset.mutate()} disabled={returnAsset.isPending} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors disabled:opacity-50">Return</button>
              <button onClick={() => maintenance.mutate()} disabled={maintenance.isPending} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors disabled:opacity-50">Maintenance</button>
            </>
          )}
          {asset.status === 'Maintenance' && (
            <button onClick={() => retire.mutate()} disabled={retire.isPending} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50">Retire</button>
          )}
        </div>

        {/* Assign form inline */}
        {showAssignForm && (
          <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
            <h3 className="text-sm font-medium text-blue-300 mb-3">Assign Asset</h3>
            <div className="flex gap-3 flex-wrap">
              <input
                value={assignForm.userId}
                onChange={(e) => setAssignForm((f) => ({ ...f, userId: e.target.value }))}
                placeholder="User ID"
                className="flex-1 min-w-32 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
              <input
                value={assignForm.notes}
                onChange={(e) => setAssignForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Notes (optional)"
                className="flex-1 min-w-40 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
              <button onClick={handleAssign} disabled={!assignForm.userId || assignAsset.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50">
                {assignAsset.isPending ? 'Assigning...' : 'Confirm Assign'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Left — main content */}
          <div className="col-span-2 space-y-6">
            {/* QR Code */}
            {asset.qr_code_url && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">QR Code</h3>
                <div className="flex items-center gap-4">
                  <img src={asset.qr_code_url} alt="Asset QR Code" className="w-24 h-24 rounded-lg bg-white p-1" />
                  <div>
                    <p className="text-xs text-slate-500">Scan to view asset on mobile</p>
                    <p className="text-xs font-mono text-slate-400 mt-1">nexflow://assets/{asset.id.slice(0, 8)}…</p>
                  </div>
                </div>
              </div>
            )}

            {/* Assignment history */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <div className="border-b border-slate-800 px-5 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assignment History</h3>
              </div>
              {asset.assignments?.length === 0 ? (
                <p className="px-5 py-4 text-xs text-slate-600">No assignments yet</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-slate-900/50">
                    <tr className="text-slate-500">
                      {['User', 'Assigned At', 'Returned At', 'Assigned By'].map((h) => (
                        <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {asset.assignments?.map((a: any) => (
                      <tr key={a.id}>
                        <td className="px-4 py-2 font-mono text-slate-300">{a.user_id}</td>
                        <td className="px-4 py-2 text-slate-400">{new Date(a.assigned_at).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          {a.returned_at ? (
                            <span className="text-slate-400">{new Date(a.returned_at).toLocaleString()}</span>
                          ) : (
                            <span className="text-blue-400 font-medium">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-2 font-mono text-slate-400">{a.assigned_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Audit log */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <div className="border-b border-slate-800 px-5 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Audit Log</h3>
              </div>
              <div className="divide-y divide-slate-800">
                {asset.audit_logs?.length === 0 ? (
                  <p className="px-5 py-4 text-xs text-slate-600">No audit events</p>
                ) : (
                  asset.audit_logs?.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                      <span className={`mt-0.5 rounded px-2 py-0.5 text-xs font-medium ${ACTION_BADGE_COLORS[log.action] ?? 'bg-slate-700 text-slate-300'}`}>
                        {log.action}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400">
                          by <span className="text-slate-300 font-medium">{log.performed_by}</span>
                        </p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <pre className="mt-1 text-xs font-mono text-slate-500 bg-slate-950 rounded px-2 py-1">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                      <span className="text-xs text-slate-600 flex-shrink-0">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Asset details */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Details</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  ['Serial #', <span className="font-mono">{asset.serial_number}</span>],
                  ['Category', asset.category],
                  ['Purchase Date', asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'],
                  ['Cost', asset.purchase_cost ? `$${Number(asset.purchase_cost).toFixed(2)}` : '—'],
                  ['Created', new Date(asset.created_at).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between gap-2">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-300 text-right">{value as any}</span>
                  </div>
                ))}
                {asset.notes && (
                  <div>
                    <span className="text-slate-500 block mb-1">Notes</span>
                    <p className="text-slate-400">{asset.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Warranty */}
            {warrantyExpiry && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Warranty</h3>
                <p className={`text-xs font-medium mb-2 ${warrantyDaysLeft! < 0 ? 'text-red-400' : warrantyDaysLeft! < 90 ? 'text-amber-400' : 'text-green-400'}`}>
                  {warrantyDaysLeft! < 0 ? `Expired ${Math.abs(warrantyDaysLeft!)} days ago` : `${warrantyDaysLeft} days left`}
                </p>
                {warrantyPct !== null && (
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className={`h-2 rounded-full transition-all ${warrantyDaysLeft! < 0 ? 'bg-red-500' : warrantyDaysLeft! < 90 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.max(2, warrantyPct)}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1">Expires {warrantyExpiry.toLocaleDateString()}</p>
              </div>
            )}

            {/* Linked ticket */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Linked Ticket</h3>
              {asset.linked_ticket_id ? (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Linked to ticket</p>
                  <button
                    onClick={() => router.push(`/helpdesk/tickets/${asset.linked_ticket_id}`)}
                    className="text-xs text-violet-400 hover:text-violet-300 underline font-mono"
                  >
                    {asset.linked_ticket_id.slice(0, 12)}…
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">No ticket linked</p>
                  <input
                    value={linkTicketId}
                    onChange={(e) => setLinkTicketId(e.target.value)}
                    placeholder="Ticket ID"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white font-mono focus:border-violet-500 focus:outline-none"
                  />
                  <button
                    onClick={() => linkTicket.mutate(linkTicketId)}
                    disabled={!linkTicketId || linkTicket.isPending}
                    className="w-full rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    Link Ticket
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
