'use client';

import { useEffect, useState } from 'react';

type Message = {
  id: string;
  type: 'problem' | 'feature';
  message: string;
  created_at?: string;
};

export default function CommunityPage() {
  const [selectedType, setSelectedType] = useState<'problem' | 'feature'>('problem');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'problem' | 'feature'>('all');
  const [error, setError] = useState<string | null>(null);

  const formatTime = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleString();
  };

  const load = async () => {
    try {
      setError(null);
      const res = await fetch('/api/community');
      if (!res.ok) throw new Error('Failed to load messages');
      const json = await res.json();
      setItems(json?.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load messages');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    try {
      setError(null);
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, message: message.trim() }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to submit');
      }
      setMessage('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/community?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b141a]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-200 font-black">
            💬
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Community</h1>
            <p className="text-xs sm:text-sm text-emerald-100/70">
              Drop problems or feature requests. We’ll review every note.
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2">
            <div className="rounded-3xl border border-white/5 bg-[#111b21] shadow-2xl overflow-hidden">
              <div className="bg-[#202c33] px-4 py-3 flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/70 font-semibold">Send as</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedType('problem')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        selectedType === 'problem'
                          ? 'bg-red-500/30 text-red-50 border border-red-400/50 shadow-inner'
                          : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Problem
                    </button>
                    <button
                      onClick={() => setSelectedType('feature')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        selectedType === 'feature'
                          ? 'bg-emerald-500/30 text-emerald-50 border border-emerald-400/50 shadow-inner'
                          : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Feature
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/70 font-semibold">Filter</span>
                  <div className="flex gap-2">
                    {(['all', 'problem', 'feature'] as const).map((val) => (
                      <button
                        key={val}
                        onClick={() => setFilter(val)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                          filter === val
                            ? 'bg-emerald-500/30 text-emerald-50 border border-emerald-400/50 shadow-inner'
                            : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {val === 'all' ? 'All' : val === 'problem' ? 'Problems' : 'Features'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="relative bg-[url('/chat-pattern.png')] bg-cover bg-center"
                style={{ minHeight: '60vh' }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-[#0b141a]/60 to-[#0b141a]/80" />
                <div className="relative z-10 p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                  {items.length === 0 && (
                    <div className="text-center text-sm text-white/60 py-8">
                      No submissions yet. Be the first to send a message.
                    </div>
                  )}
                  {items
                    .filter((item) => (filter === 'all' ? true : item.type === filter))
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`flex ${item.type === 'feature' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-lg border ${
                          item.type === 'feature'
                            ? 'bg-[#005c4b] text-white border-[#0a7b65]'
                            : 'bg-[#202c33] text-white border-[#2a3942]'
                        }`}>
                          <div className="flex items-center gap-2 text-[11px] mb-1 opacity-80">
                            <span
                              className={`font-bold uppercase tracking-widest ${
                                item.type === 'feature' ? 'text-emerald-100' : 'text-red-100'
                              }`}
                            >
                              {item.type === 'feature' ? 'Feature' : 'Problem'}
                            </span>
                            {item.created_at && <span className="text-white/60">{formatTime(item.created_at)}</span>}
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="ml-auto text-white/60 hover:text-white text-[11px]"
                              title="Delete message"
                            >
                              ✕
                            </button>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">{item.message}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-[#202c33] px-4 py-4 flex flex-col gap-2">
                {error && <span className="text-xs text-red-400">{error}</span>}
                <div className="flex items-end gap-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 bg-[#0b141a] border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 min-h-[80px]"
                    placeholder="Type your message..."
                  />
                  <button
                    onClick={submit}
                    disabled={isSubmitting || !message.trim()}
                    className="h-[48px] px-4 rounded-2xl bg-emerald-600 text-white font-semibold shadow-lg hover:bg-emerald-500 transition-colors disabled:opacity-60"
                  >
                    {isSubmitting ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#111b21] border border-white/5 rounded-2xl p-4 text-sm text-white/80 space-y-2">
              <h3 className="text-white font-semibold">Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                <li>Keep it concise and specific.</li>
                <li>Include steps to reproduce problems.</li>
                <li>For features, share the “why” and desired outcome.</li>
              </ul>
            </div>
            <div className="bg-[#0f191f] border border-emerald-500/40 rounded-2xl p-4 text-sm text-emerald-100 space-y-2">
              <h3 className="font-semibold">Status</h3>
              <p>We review submissions periodically. Urgent issues get priority.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
