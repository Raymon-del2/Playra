// Build fix: Replaced uuid with crypto.randomUUID()
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ComingSoonItem = {
  id: string;
  title: string;
  description: string | null;
  release_date: string | null;
  is_premier: boolean;
};

const ADMIN_EMAIL = 'wambuiraymond03@gmail.com';

export default function ComingSoonSection({ isCollapsed, activeProfile }: { isCollapsed: boolean, activeProfile: any }) {
  const [items, setItems] = useState<ComingSoonItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    release_date: '',
    is_premier: false
  });

  const isAdmin = activeProfile?.email === ADMIN_EMAIL;

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/coming-soon');
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        console.error('Expected array of items, got:', data);
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      setItems([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const method = editingId ? 'PATCH' : 'POST';
    const payload = {
      ...formData,
      id: editingId,
      user_email: activeProfile?.email
    };

    // Optimistic UI for Adding
    if (!editingId) {
      const optimisticItem: ComingSoonItem = {
        id: crypto.randomUUID(),
        title: formData.title,
        description: formData.description,
        release_date: formData.release_date,
        is_premier: formData.is_premier,
      };
      setItems([optimisticItem, ...items]);
    }

    try {
      const res = await fetch('/api/coming-soon', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ title: '', description: '', release_date: '', is_premier: false });
        fetchItems(); // Sync dev state
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      fetchItems(); // Revert on failure
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    // Optimistic UI for Deleting
    setItems(items.filter(i => i.id !== id));

    try {
      await fetch(`/api/coming-soon?id=${id}&user_email=${activeProfile?.email}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete item:', error);
      fetchItems(); // Revert on failure
    }
  };

  const handleEdit = (item: ComingSoonItem) => {
    setFormData({
      title: item.title,
      description: item.description || '',
      release_date: item.release_date || '',
      is_premier: item.is_premier
    });
    setEditingId(item.id);
    setIsAdding(true);
  };

  if (isCollapsed) return null;

  return (
    <div className="px-3 py-4 mt-2">
      <div className="flex items-center justify-between mb-4 px-3">
        <Link href="/coming-soon" className="hover:opacity-80 transition-opacity flex items-center gap-2 group">
          <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
            Coming Soon
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-[10px] text-black px-1.5 py-0.5 rounded font-black uppercase tracking-tighter animate-pulse">
              Upcoming
            </span>
          </h3>
          <svg className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </Link>
        {isAdmin && (
          <button
            onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}
            className="p-1 px-2 text-[11px] font-bold bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded border border-white/10 transition-all uppercase tracking-widest"
          >
            {isAdding ? 'Close' : 'Add New'}
          </button>
        )}
      </div>

      {isAdding && isAdmin && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <input
            type="text"
            placeholder="Feature Title (e.g., Short-form Video)"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-2 focus:border-blue-500 outline-none"
            required
          />
          <textarea
            placeholder="Brief description of what's coming..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-2 h-20 focus:border-blue-500 outline-none resize-none"
          />
          <div className="flex flex-col gap-2 mb-3">
            <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest px-1">Release Time (Optional)</label>
            <input
              type="datetime-local"
              value={formData.release_date}
              onChange={e => setFormData({ ...formData, release_date: e.target.value })}
              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <label className="flex items-center gap-2 mb-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.is_premier}
              onChange={e => setFormData({ ...formData, is_premier: e.target.checked })}
              className="w-4 h-4 rounded bg-black border-white/20 text-blue-500"
            />
            <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">Mark as Premier Mode</span>
          </label>
          <button
            type="submit"
            className="w-full py-2.5 bg-white text-black rounded-full font-black text-sm hover:bg-zinc-200 active:scale-95 transition-all uppercase tracking-tighter"
          >
            {editingId ? 'Update Feature' : 'Post Announcement'}
          </button>
        </form>
      )}

      <div className="space-y-3 px-1">
        {items.length === 0 && !isAdding && (
          <div className="px-3 py-6 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
            <p className="text-[12px] text-zinc-500 font-medium">No features scheduled yet</p>
          </div>
        )}
        
        {items.map(item => (
          <div key={item.id} className="group relative bg-[#1a1a1a]/40 hover:bg-[#1a1a1a]/80 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300">
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-start justify-between">
                <h4 className="text-[14px] font-bold text-zinc-100 leading-tight pr-12">{item.title}</h4>
                {item.is_premier && (
                  <span className="bg-blue-500/10 text-blue-400 text-[9px] px-1.5 py-0.5 rounded font-black border border-blue-500/20 uppercase">Premier</span>
                )}
              </div>
              <p className="text-[13px] text-zinc-400 leading-snug line-clamp-3 font-medium">
                {item.description || 'No description provided'}
              </p>
            </div>

            {item.release_date && <CountdownTimer targetDate={item.release_date} />}

            {isAdmin && (
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-1.5 bg-black/50 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white border border-white/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 bg-black/50 hover:bg-red-500/20 rounded-full text-zinc-400 hover:text-red-400 border border-white/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return (
    <div className="flex items-center gap-1.5 text-zinc-500">
      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-pulse" />
      <span className="text-[11px] font-bold uppercase tracking-widest">Released</span>
    </div>
  );

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center gap-1.5 text-blue-400">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest">In T-Minus</span>
      </div>
      <div className="flex gap-1.5">
        {timeLeft.d > 0 && <span className="text-zinc-100 text-[12px] font-bold">{timeLeft.d}d</span>}
        <span className="text-zinc-100 text-[12px] font-bold">{timeLeft.h.toString().padStart(2, '0')}h</span>
        <span className="text-zinc-100 text-[12px] font-bold">{timeLeft.m.toString().padStart(2, '0')}m</span>
        <span className="text-[12px] font-bold animate-pulse text-blue-300">{timeLeft.s.toString().padStart(2, '0')}s</span>
      </div>
    </div>
  );
}
