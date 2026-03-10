'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { useAuthStore } from '@/store/authStore';
import { forumApi, messageApi, announcementApi, notificationApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

type Tab = 'forums' | 'messages' | 'announcements' | 'notifications';

export default function CommunicationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('forums');
  const isStaff = ['admin', 'super-admin', 'institute-admin', 'teacher'].includes(user?.role || '');

  return (
    <SidebarLayout pageTitle="Communication" breadcrumbs={[{ label: 'EDYRA' }, { label: 'Communication' }]}>
      <div className="space-y-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
          {(['forums', 'messages', 'announcements', 'notifications'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 min-w-[100px] px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${tab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {tab === 'forums' && <ForumsTab />}
        {tab === 'messages' && <MessagesTab />}
        {tab === 'announcements' && <AnnouncementsTab isStaff={isStaff} />}
        {tab === 'notifications' && <NotificationsTab />}
      </div>
    </SidebarLayout>
  );
}

function ForumsTab() {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', tags: '' });

  useEffect(() => { fetchThreads(); }, []);

  const fetchThreads = async () => {
    try { setLoading(true); const res = await forumApi.getThreads(); setThreads(res.data.data.threads || []); } catch { } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.title || !form.content) { toast.error('Title and content required'); return; }
    try {
      await forumApi.createThread({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
      toast.success('Thread created');
      setShowNew(false);
      setForm({ title: '', content: '', category: 'general', tags: '' });
      fetchThreads();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const catColors: Record<string, string> = { general: 'bg-gray-100 text-gray-700', academic: 'bg-blue-100 text-blue-700', doubt: 'bg-yellow-100 text-yellow-700', announcement: 'bg-red-100 text-red-700', resource: 'bg-green-100 text-green-700', discussion: 'bg-purple-100 text-purple-700' };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">Discussion Forums</h3>
        <button onClick={() => setShowNew(!showNew)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">+ New Thread</button>
      </div>

      {showNew && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Thread title..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
          <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Content..." rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
          <div className="flex gap-3">
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900">
              {['general', 'academic', 'doubt', 'announcement', 'resource', 'discussion'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="Tags (comma-separated)" className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Post Thread</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 dark:text-gray-300">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : threads.length === 0 ? <div className="text-center py-8 text-gray-400">No threads yet</div> : (
        <div className="space-y-3">
          {threads.map((t: any) => (
            <div key={t._id} onClick={() => router.push(`/communication/forums/${t._id}`)} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                {t.isPinned && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">Pinned</span>}
                <span className={`px-2 py-0.5 text-xs rounded ${catColors[t.category] || catColors.general}`}>{t.category}</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{t.title}</h4>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{t.content}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span>{t.author?.firstName || 'Anonymous'}</span>
                <span>{t.replyCount || 0} replies</span>
                <span>{t.views || 0} views</span>
                <span>{t.upvotes?.length || 0} upvotes</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesTab() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    try { setLoading(true); const res = await messageApi.getConversations(); setConversations(res.data.data.conversations || []); } catch { } finally { setLoading(false); }
  };

  const selectConv = async (convId: string) => {
    setActiveConv(convId);
    try { const res = await messageApi.getMessages(convId); setMessages(res.data.data.messages || []); } catch { }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const data: any = { content: newMessage };
      if (showNew && newRecipient) { data.recipient = newRecipient; data.type = 'direct'; }
      else if (activeConv) { data.conversationId = activeConv; }
      await messageApi.send(data);
      setNewMessage('');
      if (activeConv) selectConv(activeConv);
      else { fetchConversations(); setShowNew(false); }
      toast.success('Sent');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to send'); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ minHeight: '500px' }}>
      <div className="grid grid-cols-3 h-full" style={{ minHeight: '500px' }}>
        {/* Conversations */}
        <div className="col-span-1 border-r border-gray-200 dark:border-gray-700">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">Messages</span>
            <button onClick={() => { setShowNew(true); setActiveConv(null); }} className="text-xs text-blue-600">+ New</button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto" style={{ maxHeight: '450px' }}>
            {loading ? <div className="p-4 text-center text-gray-400 text-sm">Loading...</div> : conversations.length === 0 ? <div className="p-4 text-center text-gray-400 text-sm">No conversations</div> : conversations.map((c: any) => (
              <div key={c._id || c.conversationId} onClick={() => { selectConv(c.conversationId || c._id); setShowNew(false); }}
                className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 ${activeConv === (c.conversationId || c._id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.otherUser?.firstName || c.groupName || 'Conversation'}</p>
                <p className="text-xs text-gray-400 truncate mt-1">{c.lastMessage || ''}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="col-span-2 flex flex-col">
          <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{ maxHeight: '400px' }}>
            {showNew ? (
              <div className="space-y-3">
                <input value={newRecipient} onChange={e => setNewRecipient(e.target.value)} placeholder="Recipient User ID" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">Select a conversation or start a new one</div>
            ) : messages.map((m: any, i: number) => (
              <div key={i} className={`max-w-[80%] ${m.isMine ? 'ml-auto' : ''}`}>
                <div className={`p-3 rounded-lg text-sm ${m.isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white'}`}>
                  {!m.isMine && <p className="text-xs font-medium mb-1 opacity-70">{m.sender?.firstName || 'User'}</p>}
                  {m.content}
                </div>
                <p className="text-xs text-gray-400 mt-1">{m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}</p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
            <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnouncementsTab({ isStaff }: { isStaff: boolean }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'general', priority: 'medium', targetAudience: 'all', isPublished: true });

  useEffect(() => { fetch(); }, []);
  const fetch = async () => { try { setLoading(true); const res = await announcementApi.list(); setAnnouncements(res.data.data.announcements || []); } catch { } finally { setLoading(false); } };

  const handleCreate = async () => {
    if (!form.title || !form.content) { toast.error('Title and content required'); return; }
    try { await announcementApi.create(form); toast.success('Announcement created'); setShowForm(false); setForm({ title: '', content: '', type: 'general', priority: 'medium', targetAudience: 'all', isPublished: true }); fetch(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const prioColors: Record<string, string> = { low: 'bg-gray-400', medium: 'bg-blue-400', high: 'bg-orange-400', urgent: 'bg-red-500' };
  const typeColors: Record<string, string> = { general: 'bg-gray-100 text-gray-700', academic: 'bg-blue-100 text-blue-700', exam: 'bg-purple-100 text-purple-700', event: 'bg-green-100 text-green-700', emergency: 'bg-red-100 text-red-700', maintenance: 'bg-yellow-100 text-yellow-700' };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">Announcements</h3>
        {isStaff && <button onClick={() => setShowForm(!showForm)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">+ Create</button>}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
          <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Content..." rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
          <div className="grid grid-cols-3 gap-3">
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900">
              {['general', 'academic', 'exam', 'event', 'emergency', 'maintenance'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900">
              {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={form.targetAudience} onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900">
              {['all', 'students', 'teachers', 'department', 'course'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Publish</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 dark:text-gray-300">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : announcements.length === 0 ? <div className="text-center py-8 text-gray-400">No announcements</div> : (
        <div className="space-y-3">
          {announcements.map((a: any) => (
            <div key={a._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${prioColors[a.priority] || prioColors.medium}`} />
                <span className={`px-2 py-0.5 text-xs rounded ${typeColors[a.type] || typeColors.general}`}>{a.type}</span>
                <span className="text-xs text-gray-400">{a.targetAudience}</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{a.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{a.content}</p>
              <p className="text-xs text-gray-400 mt-2">By {a.author?.firstName || 'Admin'} · {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationsTab() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);
  const fetch = async () => { try { setLoading(true); const res = await notificationApi.list(); setNotifications(res.data.data.notifications || []); } catch { } finally { setLoading(false); } };

  const markRead = async (id: string) => {
    try { await notificationApi.markRead(id); setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n)); } catch { }
  };

  const markAllRead = async () => {
    try { await notificationApi.markAllRead(); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); toast.success('All marked as read'); } catch { }
  };

  const typeIcons: Record<string, string> = { assignment: '📝', grade: '🏆', announcement: '📢', message: '💬', exam: '📋', attendance: '✅', course: '📚', system: '⚙️', reminder: '🔔', fee: '💰' };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline">Mark all read</button>
      </div>
      {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : notifications.length === 0 ? <div className="text-center py-8 text-gray-400">No notifications</div> : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div key={n._id} onClick={() => !n.isRead && markRead(n._id)}
              className={`bg-white dark:bg-gray-800 rounded-xl border p-4 cursor-pointer transition-all ${n.isRead ? 'border-gray-200 dark:border-gray-700 opacity-60' : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{typeIcons[n.type] || '🔔'}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-2" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
