'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssets, useCreateAsset, type AssetCategory, type AssetStatus } from '@/hooks/useAssets';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<AssetCategory, string> = {
  Laptop: '💻', Monitor: '🖥️', Phone: '📱', License: '📋', Peripheral: '🖱️', Other: '📦',
};

const STATUS_STYLES: Record<AssetStatus, string> = {
  Available:   'bg-green-500/15 text-green-300 border-green-500/30',
  Assigned:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Maintenance: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Retired:     'bg-slate-700/50 text-slate-400 border-slate-600',
};

const CATEGORIES: AssetCategory[] = ['Laptop', 'Monitor', 'Phone', 'License', 'Peripheral', 'Other'];
const STATUSES: (AssetStatus | 'All')[] = ['All', 'Available', 'Assigned', 'Maintenance', 'Retired'];

// ── Register Modal ─────────────────────────────────────────────────────────────

function RegisterAssetModal({ onClose }: { onClose: () => void }) {
  const createAsset = useCreateAsset();
  const [form, setForm] = useState({
    name: '', serial_number: '', category: 'Laptop' as AssetCategory,
    purchase_date: '', warranty_expiry: '', purchase_cost: '', notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAsset.mutateAsync({
      name: form.name,
      serial_number: form.serial_number,
      category: form.category,
      purchase_date: form.purchase_date || undefined,
      warranty_expiry: form.warranty_expiry || undefined,
      purchase_cost: form.purchase_cost ? parseFloat(form.purchase_cost) : undefined,
      notes: form.notes || undefined,
    } as any);
    onClose();
  };

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {el}
    </div>
  );

  const inp = (name: keyof typeof form, type = 'text', placeholder = '') => (
    <input
      type={type}
      value={form[name]}
      onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Register New Asset</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {field('Asset Name *', <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none" placeholder="e.g. MacBook Pro 14&quot;" />)}
          {field('Serial Number *', <input required value={form.serial_number} onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white font-mono focus:border-violet-500 focus:outline-none" placeholder="SN-123456" />)}
          {field('Category', (
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as AssetCategory }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
            </select>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {field('Purchase Date', inp('purchase_date', 'date'))}
            {field('Warranty Expiry', inp('warranty_expiry', 'date'))}
          </div>
          {field('Purchase Cost ($)', inp('purchase_cost', 'number', '0.00'))}
          {field('Notes', <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none" placeholder="Optional notes..." />)}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={createAsset.isPending} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors disabled:opacity-50">
              {createAsset.isPending ? 'Registering...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const { data: assets = [], isLoading } = useAssets({
    status: statusFilter === 'All' ? undefined : statusFilter,
    category: categoryFilter || undefined,
    search: search || undefined,
  });

  // Compute stats
  const total = assets.length;
  const available = assets.filter((a) => a.status === 'Available').length;
  const assigned = assets.filter((a) => a.status === 'Assigned').length;
  const maintenance = assets.filter((a) => a.status === 'Maintenance').length;

  const isWarrantyExpired = (d?: string) => d ? new Date(d) < new Date() : false;

  const currentAssignee = (asset: ReturnType<typeof useAssets>['data'][0]) =>
    asset.assignments?.find((a: any) => !a.returned_at)?.user_id ?? '—';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Asset Inventory</h1>
            <p className="text-sm text-slate-500 mt-0.5">{total} assets registered</p>
          </div>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20"
          >
            + Register Asset
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          {[
            { label: 'Total', value: total, color: 'text-white' },
            { label: 'Available', value: available, color: 'text-green-400' },
            { label: 'Assigned', value: assigned, color: 'text-blue-400' },
            { label: 'Maintenance', value: maintenance, color: 'text-amber-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Status pills */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as any)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border
                  ${statusFilter === s
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                    : 'border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
          {/* Category select */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 focus:border-violet-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
          </select>
          {/* Search */}
          <div className="relative ml-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or serial..."
              className="w-56 rounded-lg border border-slate-700 bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1,2,3,4].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-800/50" />)}
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <span className="text-4xl mb-3">📦</span>
              <p className="text-sm">No assets found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr className="text-xs text-slate-500">
                  {['Asset', 'Serial #', 'Category', 'Status', 'Assigned To', 'Warranty', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => router.push(`/assets/${asset.id}`)}
                    className="group cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-white group-hover:text-violet-300 transition-colors">
                      {asset.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{asset.serial_number}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {CATEGORY_ICONS[asset.category]} {asset.category}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[asset.status]}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {currentAssignee(asset)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {asset.warranty_expiry ? (
                        <span className={isWarrantyExpired(asset.warranty_expiry) ? 'text-red-400' : 'text-green-400'}>
                          {isWarrantyExpired(asset.warranty_expiry) ? '✗ Expired' : '✓ '}{new Date(asset.warranty_expiry).toLocaleDateString()}
                        </span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:border-violet-500 hover:text-violet-300 transition-colors opacity-0 group-hover:opacity-100">
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showRegisterModal && (
        <RegisterAssetModal onClose={() => setShowRegisterModal(false)} />
      )}
    </div>
  );
}
