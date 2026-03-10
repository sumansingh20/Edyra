'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { erpApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

type ErpTab = 'admissions' | 'fees' | 'timetable' | 'library' | 'hostel' | 'transport';

export default function ERPPage() {
  const [tab, setTab] = useState<ErpTab>('admissions');

  return (
    <SidebarLayout pageTitle="Admin ERP" breadcrumbs={[{ label: 'EDYRA' }, { label: 'Admin ERP' }]}>
      <div className="space-y-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
          {(['admissions', 'fees', 'timetable', 'library', 'hostel', 'transport'] as ErpTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${tab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {tab === 'admissions' && <AdmissionsTab />}
        {tab === 'fees' && <FeesTab />}
        {tab === 'timetable' && <TimetableTab />}
        {tab === 'library' && <LibraryTab />}
        {tab === 'hostel' && <HostelTab />}
        {tab === 'transport' && <TransportTab />}
      </div>
    </SidebarLayout>
  );
}

function AdmissionsTab() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => { fetchData(); }, [statusFilter, search]);
  const fetchData = async () => {
    try { setLoading(true); const p: any = {}; if (statusFilter) p.status = statusFilter; if (search) p.search = search; const res = await erpApi.getAdmissions(p); setAdmissions(res.data.data.admissions || []); } catch { } finally { setLoading(false); }
  };

  const updateStatus = async (id: string) => {
    try { await erpApi.updateAdmissionStatus(id, { status: newStatus, remarks }); toast.success('Status updated'); setEditingId(null); fetchData(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const statusColors: Record<string, string> = { applied: 'bg-blue-100 text-blue-700', 'under-review': 'bg-yellow-100 text-yellow-700', shortlisted: 'bg-purple-100 text-purple-700', accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', enrolled: 'bg-emerald-100 text-emerald-700', withdrawn: 'bg-gray-100 text-gray-700' };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applicants..." className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900">
          <option value="">All Status</option>
          {['applied', 'under-review', 'shortlisted', 'accepted', 'rejected', 'enrolled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900"><tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">App No</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr> :
              admissions.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No applications</td></tr> :
              admissions.map((a: any) => (
                <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.applicationNumber}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{a.applicantName}</td>
                  <td className="px-4 py-3 text-gray-500">{a.appliedFor?.department}</td>
                  <td className="px-4 py-3 text-gray-500">{a.appliedFor?.program}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${statusColors[a.status] || 'bg-gray-100 text-gray-700'}`}>{a.status}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditingId(a._id); setNewStatus(a.status); setRemarks(''); }} className="text-xs text-blue-600 hover:underline">Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingId && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">Update Status</h4>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900">
            {['applied', 'under-review', 'shortlisted', 'accepted', 'rejected', 'enrolled', 'withdrawn'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Remarks..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
          <div className="flex gap-2">
            <button onClick={() => updateStatus(editingId)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Save</button>
            <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 dark:text-gray-300">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeesTab() {
  const [fees, setFees] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', transactionId: '' });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try { setLoading(true); const res = await erpApi.getFees(); setFees(res.data.data.fees || []); setSummary(res.data.data.summary || {}); } catch { } finally { setLoading(false); }
  };

  const recordPayment = async (id: string) => {
    if (!payForm.amount) { toast.error('Enter amount'); return; }
    try { await erpApi.recordPayment(id, { ...payForm, amount: parseFloat(payForm.amount) }); toast.success('Payment recorded'); setShowPayment(null); fetchData(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', partial: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700', waived: 'bg-gray-100 text-gray-700' };

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Fees', val: `$${summary.total?.toLocaleString() || 0}`, border: 'border-l-blue-500' },
            { label: 'Collected', val: `$${summary.paid?.toLocaleString() || 0}`, border: 'border-l-green-500' },
            { label: 'Pending', val: `$${summary.balance?.toLocaleString() || 0}`, border: 'border-l-yellow-500' },
            { label: 'Records', val: fees.length, border: 'border-l-purple-500' },
          ].map((c, i) => (
            <div key={i} className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 border-l-4 ${c.border}`}>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{c.val}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900"><tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr> :
              fees.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No fee records</td></tr> :
              fees.map((f: any) => (
                <tr key={f._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{f.student?.firstName} {f.student?.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{f.feeType}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">${f.amount}</td>
                  <td className="px-4 py-3 text-green-600">${f.paidAmount}</td>
                  <td className="px-4 py-3 text-red-600">${f.balanceAmount}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${statusColors[f.status] || 'bg-gray-100 text-gray-700'}`}>{f.status}</span></td>
                  <td className="px-4 py-3">{f.status !== 'paid' && <button onClick={() => setShowPayment(f._id)} className="text-xs text-blue-600">Pay</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showPayment && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">Record Payment</h4>
          <div className="grid grid-cols-3 gap-3">
            <input value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} type="number" placeholder="Amount" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
            <select value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900">
              {['cash', 'card', 'bank-transfer', 'upi', 'online'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input value={payForm.transactionId} onChange={e => setPayForm(p => ({ ...p, transactionId: e.target.value }))} placeholder="Transaction ID" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => recordPayment(showPayment)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Record</button>
            <button onClick={() => setShowPayment(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 dark:text-gray-300">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TimetableTab() {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { try { setLoading(true); const res = await erpApi.getTimetables(); setTimetables(res.data.data.timetables || []); } catch { } finally { setLoading(false); } };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const typeColors: Record<string, string> = { lecture: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300', lab: 'bg-green-100 dark:bg-green-900/30 border-green-300', tutorial: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300', seminar: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300', break: 'bg-gray-100 dark:bg-gray-700 border-gray-300' };

  return (
    <div className="space-y-4">
      {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : timetables.length === 0 ? <div className="text-center py-8 text-gray-400">No timetables configured</div> : timetables.map((tt: any) => (
        <div key={tt._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">{tt.name} - {tt.department} Sem {tt.semester}</h3>
            <p className="text-sm text-gray-500">{tt.academicYear}</p>
          </div>
          <div className="overflow-x-auto p-4">
            <div className="grid grid-cols-6 gap-2 min-w-[700px]">
              {days.map(day => (
                <div key={day}>
                  <div className="text-center text-xs font-semibold text-gray-500 uppercase mb-2">{day.slice(0, 3)}</div>
                  <div className="space-y-1">
                    {(tt.slots || []).filter((s: any) => s.day === day).sort((a: any, b: any) => a.startTime?.localeCompare(b.startTime)).map((slot: any, i: number) => (
                      <div key={i} className={`p-2 rounded-lg border text-xs ${typeColors[slot.type] || typeColors.lecture}`}>
                        <div className="font-medium text-gray-900 dark:text-white">{slot.course?.title || slot.course || '-'}</div>
                        <div className="text-gray-500">{slot.startTime}-{slot.endTime}</div>
                        <div className="text-gray-400">{slot.room || ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LibraryTab() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchData(); }, [search]);
  const fetchData = async () => { try { setLoading(true); const p: any = {}; if (search) p.search = search; const res = await erpApi.getBooks(p); setBooks(res.data.data.books || []); } catch { } finally { setLoading(false); } };

  return (
    <div className="space-y-4">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books by title or author..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-3 text-center py-8 text-gray-400">Loading...</div> :
        books.length === 0 ? <div className="col-span-3 text-center py-8 text-gray-400">No books found</div> :
        books.map((b: any) => (
          <div key={b._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">{b.title}</h4>
            <p className="text-sm text-gray-500 mt-1">by {b.author}</p>
            {b.isbn && <p className="text-xs text-gray-400 mt-1">ISBN: {b.isbn}</p>}
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-gray-500">{b.category || 'General'}</span>
              <span className={b.availableCopies > 0 ? 'text-green-600' : 'text-red-600'}>{b.availableCopies}/{b.copies} available</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HostelTab() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { try { setLoading(true); const res = await erpApi.getHostelRooms(); setRooms(res.data.data.rooms || []); } catch { } finally { setLoading(false); } };

  const statusColors: Record<string, string> = { available: 'bg-green-100 text-green-700', occupied: 'bg-red-100 text-red-700', maintenance: 'bg-yellow-100 text-yellow-700', reserved: 'bg-blue-100 text-blue-700' };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-3 text-center py-8 text-gray-400">Loading...</div> :
        rooms.length === 0 ? <div className="col-span-3 text-center py-8 text-gray-400">No rooms configured</div> :
        rooms.map((r: any) => (
          <div key={r._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">{r.hostelName} - {r.roomNumber}</h4>
              <span className={`px-2 py-0.5 text-xs rounded ${statusColors[r.status] || 'bg-gray-100 text-gray-700'}`}>{r.status}</span>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Floor {r.floor} | {r.type} | Capacity: {r.capacity}</p>
              <p>Occupants: {r.occupants?.filter((o: any) => o.status === 'active').length || 0}/{r.capacity}</p>
              {r.monthlyRent > 0 && <p>Rent: ${r.monthlyRent}/mo</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransportTab() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { try { setLoading(true); const res = await erpApi.getRoutes({ active: 'true' }); setRoutes(res.data.data.routes || []); } catch { } finally { setLoading(false); } };

  return (
    <div className="space-y-4">
      {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> :
      routes.length === 0 ? <div className="text-center py-8 text-gray-400">No routes configured</div> :
      routes.map((r: any) => (
        <div key={r._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750" onClick={() => setExpanded(expanded === r._id ? null : r._id)}>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{r.routeName} ({r.routeNumber})</h4>
              <div className="text-sm text-gray-500 mt-1">
                {r.vehicleType} {r.vehicleNumber && `- ${r.vehicleNumber}`} | Capacity: {r.capacity} | Students: {r.assignedStudents?.length || 0}
              </div>
            </div>
            <span className="text-gray-400">{expanded === r._id ? '▲' : '▼'}</span>
          </div>
          {expanded === r._id && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              {r.driver?.name && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Driver: {r.driver.name} ({r.driver.phone})</p>}
              <div className="space-y-2">
                {(r.stops || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full flex items-center justify-center text-xs">{s.order || i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.arrivalTime && `Arr: ${s.arrivalTime}`} {s.departureTime && `Dep: ${s.departureTime}`}</p>
                    </div>
                  </div>
                ))}
                {(!r.stops || r.stops.length === 0) && <p className="text-sm text-gray-400">No stops defined</p>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
