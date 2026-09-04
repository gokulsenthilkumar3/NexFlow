'use client';
import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWorkItems, useCreateWorkItem, WorkItem } from '@/hooks/useWorkItems';
import apiClient from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { WORK_ITEM_KEYS } from '@/hooks/useWorkItems';
import { AppSidebar } from '@/components/AppSidebar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatDate } from '@/lib/format';

// ── Types ─────────────────────────────────────────────────────────────────────
type Column = { id: string; title: string; status: string; color: string; dot: string };

const COLUMNS: Column[] = [
  { id: 'todo',      title: 'To Do',       status: 'NEW',       color: 'text-slate-300',  dot: 'bg-slate-400'  },
  { id: 'approved',  title: 'Approved',    status: 'APPROVED',  color: 'text-blue-300',   dot: 'bg-blue-400'   },
  { id: 'committed', title: 'In Progress', status: 'COMMITTED', color: 'text-violet-300', dot: 'bg-violet-400' },
  { id: 'done',      title: 'Done',        status: 'DONE',      color: 'text-green-300',  dot: 'bg-green-400'  },
];

const PRIORITY_BADGE: Record<number, string> = {
  1: 'bg-red-500/20 text-red-300 border-red-500/30',
  2: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  3: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  4: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const TYPE_ICON: Record<string, string> = {
  EPIC: '⚡', STORY: '📖', TASK: '✅', BUG: '🐛',
};

// ── KanbanCard ────────────────────────────────────────────────────────────────
function KanbanCard({
  item,
  overlay = false,
  onOpenDetail,
}: {
  item: WorkItem;
  overlay?: boolean;
  onOpenDetail?: (item: WorkItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [didDrag, setDidDrag] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  // Distinguish drag from click: track pointer movement
  const handlePointerDown = () => setDidDrag(false);
  const handlePointerMove = () => setDidDrag(true);
  const handleClick = () => {
    if (!didDrag && onOpenDetail) onOpenDetail(item);
  };

  return (
    <div
      ref={setNodeRef}
      style={overlay ? {} : style}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      className={`group bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 cursor-grab active:cursor-grabbing
        hover:border-violet-500/40 hover:bg-slate-800/80 transition-all
        ${overlay ? 'shadow-2xl shadow-black/40 rotate-1 scale-[1.02] border-violet-500/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-mono text-violet-400/80">{item.id.substring(0, 8)}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE[4]}`}>
          P{item.priority}
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-100 leading-snug mb-2.5">{item.title}</p>
      <div className="flex items-center gap-2">
        <span className="text-[11px]">{TYPE_ICON[item.type] ?? '📝'}</span>
        <span className="text-[10px] text-slate-500 font-medium">{item.type}</span>
      </div>
    </div>
  );
}

// ── BoardColumn ────────────────────────────────────────────────────────────────
function BoardColumn({
  col,
  items,
  onOpenDetail,
}: {
  col: Column;
  items: WorkItem[];
  onOpenDetail: (item: WorkItem) => void;
}) {
  return (
    <div className="flex flex-col min-w-[260px] w-[260px]">
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
        <h3 className={`text-xs font-black uppercase tracking-widest ${col.color}`}>{col.title}</h3>
        <span className="ml-auto bg-slate-800 text-slate-500 text-[10px] font-mono px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 min-h-[120px] p-2 rounded-xl border border-dashed border-slate-700/40 bg-slate-900/20">
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} onOpenDetail={onOpenDetail} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ── New Item Modal ─────────────────────────────────────────────────────────────
function NewItemModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'EPIC' | 'STORY' | 'TASK' | 'BUG'>('TASK');
  const [priority, setPriority] = useState(3);
  const [description, setDescription] = useState('');
  const createWorkItem = useCreateWorkItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createWorkItem.mutateAsync({ title, description, type, projectId, priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="mx-4 w-full max-w-[440px] bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
      >
        <h2 className="text-lg font-black text-white mb-5">New Work Item</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Title *</label>
            <input
              id="new-item-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Describe the work item..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Type</label>
              <select
                id="new-item-type"
                value={type}
                onChange={(e) => setType(e.target.value as 'EPIC' | 'STORY' | 'TASK' | 'BUG')}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {(['EPIC', 'STORY', 'TASK', 'BUG'] as const).map((t) => (
                  <option key={t} value={t}>{`${TYPE_ICON[t] ?? '📝'} ${t}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Priority</label>
              <select
                id="new-item-priority"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value={1}>🔴 Critical</option>
                <option value={2}>🟠 High</option>
                <option value={3}>🟡 Medium</option>
                <option value={4}>⚪ Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Description</label>
            <textarea
              id="new-item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="Additional context..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={createWorkItem.isPending}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
            {createWorkItem.isPending ? 'Creating…' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Work Item Detail Slide-over ────────────────────────────────────────────────
function WorkItemDetailSlideOver({
  item,
  onClose,
}: {
  item: WorkItem;
  onClose: () => void;
}) {
  const PRIORITY_LABEL: Record<number, string> = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[420px] h-full bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-violet-400">{item.id.substring(0, 8)}</span>
            <p className="text-sm font-black text-white mt-0.5">{item.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Type</p>
              <p className="text-sm font-bold text-white">{TYPE_ICON[item.type]} {item.type}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Priority</p>
              <p className="text-sm font-bold text-white">{PRIORITY_LABEL[item.priority] ?? `P${item.priority}`}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <p className="text-sm font-bold text-white">{item.status}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm text-slate-300">{formatDate(item.createdAt)}</p>
            </div>
          </div>
          {item.description && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">Description</p>
              <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
            </div>
          )}
          {item.assignedTo && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">Assigned To</p>
              <p className="text-sm text-slate-300">{item.assignedTo}</p>
            </div>
          )}
          {item.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Board Page ─────────────────────────────────────────────────────────────────
export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const projectKey = params?.key as string;
  const queryClient = useQueryClient();

  const { data, isLoading } = useWorkItems(projectKey);
  const [activeItem, setActiveItem] = useState<WorkItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [detailItem, setDetailItem] = useState<WorkItem | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setItems(data || []); }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = items.find((i) => i.id === event.active.id);
    setActiveItem(item ?? null);
  }, [items]);

  /**
   * handleDragOver — fixed: when over.id is a card (not a column),
   * look up which column that card belongs to as the drop target.
   */
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const overId = String(over.id);

    // Direct column match
    let targetCol = COLUMNS.find((c) => c.id === overId || c.status === overId);

    // Over a card: find which column the card belongs to
    if (!targetCol) {
      const overItem = items.find((i) => i.id === overId);
      if (overItem) {
        targetCol = COLUMNS.find((c) => c.status === overItem.status);
      }
    }

    if (!targetCol) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === active.id ? { ...item, status: targetCol!.status as WorkItem['status'] } : item,
      ),
    );
  }, [items]);

  /**
   * handleDragEnd — uses React Query snapshot-based optimistic update pattern.
   */
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;

    const overId = String(over.id);
    let targetCol = COLUMNS.find((c) => c.id === overId || c.status === overId);
    if (!targetCol) {
      const overItem = items.find((i) => i.id === overId);
      if (overItem) targetCol = COLUMNS.find((c) => c.status === overItem.status);
    }
    if (!targetCol) return;

    const dragged = items.find((i) => i.id === active.id);
    if (!dragged || dragged.status === targetCol.status) return;

    // Snapshot for rollback
    const snapshot = queryClient.getQueryData<WorkItem[]>(WORK_ITEM_KEYS.list(projectKey));

    try {
      await apiClient.patch(`/api/work-items/${active.id}`, {
        item_status: targetCol.status,
      });
      queryClient.invalidateQueries({ queryKey: WORK_ITEM_KEYS.all });
    } catch {
      // Rollback to pre-drag snapshot
      if (snapshot) {
        queryClient.setQueryData(WORK_ITEM_KEYS.list(projectKey), snapshot);
        setItems(snapshot);
      } else {
        setItems(items);
      }
    }
  }, [items, queryClient, projectKey]);

  const colItems = (col: Column) => items.filter((i) => i.status === col.status);

  const boardSubNav = [
    { label: 'Board',   href: `/projects/${projectKey}/board` },
    { label: 'Backlog', href: `/projects/${projectKey}/backlog` },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <AppSidebar
        compact
        backLabel="Back to Dashboard"
        backHref="/dashboard"
        subNav={boardSubNav}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 border-b border-slate-800 flex items-center justify-between gap-3 px-4 sm:px-8 bg-slate-900/30">
          <h1 className="text-xl font-black">
            <span className="text-slate-400 font-normal text-sm mr-2">Board /</span>
            {projectKey}
          </h1>
          <button
            id="board-new-item-btn"
            onClick={() => setShowModal(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-lg shadow-violet-900/30"
          >
            + New Item
          </button>
        </header>

        {/* Board */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size={28} />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto p-4 sm:p-8">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 h-full">
                {COLUMNS.map((col) => (
                  <BoardColumn
                    key={col.id}
                    col={col}
                    items={colItems(col)}
                    onOpenDetail={setDetailItem}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeItem ? <KanbanCard item={activeItem} overlay /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>

      {showModal && (
        <NewItemModal
          projectId={projectKey}
          onClose={() => setShowModal(false)}
        />
      )}

      {detailItem && (
        <WorkItemDetailSlideOver
          item={detailItem}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}
