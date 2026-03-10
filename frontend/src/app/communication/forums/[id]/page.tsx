'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { useAuthStore } from '@/store/authStore';
import { forumApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

export default function ForumThreadPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');

  useEffect(() => { if (id) fetchThread(); }, [id]);

  const fetchThread = async () => {
    try { setLoading(true); const res = await forumApi.getThread(id as string); setThread(res.data.data.thread); } catch { toast.error('Failed to load thread'); } finally { setLoading(false); }
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    try { await forumApi.reply(id as string, { content: reply }); toast.success('Reply posted'); setReply(''); fetchThread(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleUpvote = async () => {
    try { await forumApi.upvote(id as string); fetchThread(); } catch { }
  };

  if (loading) return <SidebarLayout><div className="text-center py-12 text-gray-500">Loading...</div></SidebarLayout>;
  if (!thread) return <SidebarLayout><div className="text-center py-12 text-gray-500">Thread not found</div></SidebarLayout>;

  const catColors: Record<string, string> = { general: 'bg-gray-100 text-gray-700', academic: 'bg-blue-100 text-blue-700', doubt: 'bg-yellow-100 text-yellow-700', resource: 'bg-green-100 text-green-700', discussion: 'bg-purple-100 text-purple-700' };

  return (
    <SidebarLayout breadcrumbs={[{ label: 'EDYRA' }, { label: 'Communication', href: '/communication' }, { label: 'Thread' }]}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Thread */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 text-xs rounded ${catColors[thread.category] || catColors.general}`}>{thread.category}</span>
            {thread.isPinned && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">Pinned</span>}
            <span className={`px-2 py-0.5 text-xs rounded ${thread.status === 'resolved' ? 'bg-green-100 text-green-700' : thread.status === 'closed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{thread.status}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{thread.title}</h1>
          <div className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{thread.content}</div>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>By {thread.isAnonymous ? 'Anonymous' : `${thread.author?.firstName || ''} ${thread.author?.lastName || ''}`}</span>
            <span>{thread.createdAt ? new Date(thread.createdAt).toLocaleDateString() : ''}</span>
            <span>{thread.views || 0} views</span>
            <button onClick={handleUpvote} className="flex items-center gap-1 hover:text-blue-600">
              <span>▲</span> {thread.upvotes?.length || 0}
            </button>
          </div>
          {thread.tags?.length > 0 && (
            <div className="mt-3 flex gap-2">{thread.tags.map((t: string, i: number) => <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-400">{t}</span>)}</div>
          )}
        </div>

        {/* Replies */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">{thread.replies?.length || 0} Replies</h3>
          {thread.replies?.map((r: any, i: number) => (
            <div key={i} className={`bg-white dark:bg-gray-800 rounded-xl border p-4 ${r.isAnswer ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              {r.isAnswer && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded mb-2 inline-block">Accepted Answer</span>}
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{r.content}</div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                <span>{r.isAnonymous ? 'Anonymous' : `${r.author?.firstName || ''}`}</span>
                <span>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</span>
                <span>▲ {r.upvotes?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        {thread.status !== 'closed' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Write a reply..." rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
            <button onClick={handleReply} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Post Reply</button>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
