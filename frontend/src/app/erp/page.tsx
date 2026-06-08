'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';

type ERPTab = 'admissions' | 'fees' | 'library' | 'hostel' | 'transport' | 'timetable';

export default function ERPPage() {
  const [activeTab, setActiveTab] = useState<ERPTab>('admissions');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'admissions': endpoint = '/erp/admissions'; break;
        case 'fees': endpoint = '/erp/fees'; break;
        case 'library': endpoint = '/erp/library'; break;
        case 'hostel': endpoint = '/erp/hostel'; break;
        case 'transport': endpoint = '/erp/transport'; break;
        case 'timetable': endpoint = '/erp/timetable'; break;
      }
      const res = await api.get(endpoint, { params: { limit: 50 } });
      const d = res.data?.data || [];
      setData(Array.isArray(d) ? d : (d.admissions || d.fees || d.books || d.rooms || d.routes || d.timetables || []));
    } catch { setData([]); } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'admissions': endpoint = '/erp/admissions'; break;
        case 'fees': endpoint = '/erp/fees'; break;
        case 'library': endpoint = '/erp/library'; break;
        case 'hostel': endpoint = '/erp/hostel'; break;
        case 'transport': endpoint = '/erp/transport'; break;
        case 'timetable': endpoint = '/erp/timetable'; break;
      }
      await api.post(endpoint, formData);
      setModal(false);
      setFormData({});
      fetchData();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); } finally { setSaving(false); }
  };

  const ERP_TABS: { key: ERPTab; label: string; icon: string }[] = [
    { key: 'admissions', label: 'Admissions', icon: '' },
    { key: 'fees', label: 'Fees', icon: '' },
    { key: 'library', label: 'Library', icon: '' },
    { key: 'hostel', label: 'Hostel', icon: '' },
    { key: 'transport', label: 'Transport', icon: '' },
    { key: 'timetable', label: 'Timetable', icon: '' },
  ];

  const renderTable = () => {
    if (data.length === 0) {
      return (
        <div className="lms-table-empty" style={{ padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>
            {ERP_TABS.find(t => t.key === activeTab)?.icon}
          </div>
          <div>No {activeTab} records found.</div>
        </div>
      );
    }

    const cols = Object.keys(data[0]).filter(k => !['__v', 'updatedAt'].includes(k)).slice(0, 7);

    return (
      <table className="lms-table">
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c}>{c.replace(/([A-Z])/g, ' $1').trim()}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item: any, i: number) => (
            <tr key={item._id || i}>
              {cols.map(c => (
                <td key={c} style={{ fontSize: 12 }}>
                  {c === 'status' ? (
                    <span className={`lms-status ${item[c] === 'active' || item[c] === 'approved' || item[c] === 'paid' ? 'lms-status-active' : item[c] === 'pending' ? 'lms-status-pending' : 'lms-status-info'}`}>
                      {String(item[c] || '-')}
                    </span>
                  ) : c === 'createdAt' || c === 'dueDate' || c === 'date' ? (
                    item[c] ? format(new Date(item[c]), 'dd/MM/yyyy') : '-'
                  ) : typeof item[c] === 'object' && item[c] !== null ? (
                    item[c]?.firstName ? `${item[c].firstName} ${item[c].lastName}` : item[c]?.title || item[c]?.name || JSON.stringify(item[c]).slice(0, 30)
                  ) : (
                    String(item[c] ?? '-').slice(0, 50)
                  )}
                </td>
              ))}
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="lms-btn lms-btn-sm lms-btn-secondary">View</button>
                  {activeTab === 'fees' && item.status !== 'paid' && (
                    <button
                      onClick={async () => {
                        try {
                          await api.post(`/erp/fees/${item._id}/payment`, { amount: item.amount, method: 'cash' });
                          fetchData();
                        } catch { }
                      }}
                      className="lms-btn lms-btn-sm lms-btn-success"
                    >
                       Pay
                    </button>
                  )}
                  {activeTab === 'library' && (
                    <button
                      onClick={async () => {
                        const sid = prompt('Student ID to issue to:');
                        if (sid) {
                          try { await api.post(`/erp/library/${item._id}/issue`, { studentId: sid }); fetchData(); }
                          catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
                        }
                      }}
                      className="lms-btn lms-btn-sm lms-btn-primary"
                    >
                      Issue
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const getFormFields = (): { name: string; label: string; type?: string; required?: boolean; options?: string[] }[] => {
    switch (activeTab) {
      case 'admissions': return [
        { name: 'studentName', label: 'Student Name', required: true },
        { name: 'program', label: 'Program', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone' },
        { name: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected'] },
      ];
      case 'fees': return [
        { name: 'studentId', label: 'Student ID', required: true },
        { name: 'feeType', label: 'Fee Type', required: true },
        { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
        { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { name: 'semester', label: 'Semester' },
      ];
      case 'library': return [
        { name: 'title', label: 'Book Title', required: true },
        { name: 'author', label: 'Author', required: true },
        { name: 'isbn', label: 'ISBN' },
        { name: 'category', label: 'Category' },
        { name: 'copies', label: 'Copies', type: 'number' },
      ];
      case 'hostel': return [
        { name: 'roomNumber', label: 'Room Number', required: true },
        { name: 'floor', label: 'Floor' },
        { name: 'capacity', label: 'Capacity', type: 'number' },
        { name: 'type', label: 'Type', type: 'select', options: ['single', 'double', 'triple', 'dormitory'] },
        { name: 'rent', label: 'Monthly Rent (₹)', type: 'number' },
      ];
      case 'transport': return [
        { name: 'routeNumber', label: 'Route Number', required: true },
        { name: 'source', label: 'From', required: true },
        { name: 'destination', label: 'To', required: true },
        { name: 'departureTime', label: 'Departure Time' },
        { name: 'vehicleNumber', label: 'Vehicle Number' },
      ];
      case 'timetable': return [
        { name: 'courseId', label: 'Course ID', required: true },
        { name: 'day', label: 'Day', type: 'select', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
        { name: 'startTime', label: 'Start Time', type: 'time' },
        { name: 'endTime', label: 'End Time', type: 'time' },
        { name: 'room', label: 'Room/Location' },
      ];
      default: return [];
    }
  };

  return (
    <LMSLayout pageTitle="ERP Module" breadcrumbs={[{ label: 'ERP' }]}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #243b55 0%, #7c3aed 100%)',
        color: '#fff', borderRadius: 'var(--radius-lg)', padding: '20px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }} className="animate-fadeInDown">
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}> Academic ERP</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Admissions · Fees · Library · Hostel · Transport · Timetable</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {ERP_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="lms-btn"
            style={{
              background: activeTab === t.key ? 'var(--primary)' : 'var(--white)',
              color: activeTab === t.key ? '#fff' : 'var(--text)',
              border: '1px solid var(--border)',
              fontWeight: activeTab === t.key ? 700 : 400,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => { setFormData({}); setModal(true); }} className="lms-btn lms-btn-primary">
           Add {ERP_TABS.find(t => t.key === activeTab)?.label}
        </button>
        <button onClick={fetchData} className="lms-btn lms-btn-default"> Refresh</button>
      </div>

      {/* Data Table */}
      <div className="lms-section">
        <div className="lms-section-title">
          {ERP_TABS.find(t => t.key === activeTab)?.icon} {ERP_TABS.find(t => t.key === activeTab)?.label}
          <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>
            {data.length} records
          </span>
        </div>
        <div className="lms-table-container">
          {loading ? (
            <div className="lms-spinner" style={{ padding: 40 }}><div className="spinner" /></div>
          ) : renderTable()}
        </div>
      </div>

      {/* Add Modal */}
      {modal && (
        <div className="lms-modal-overlay" onClick={() => setModal(false)}>
          <div className="lms-modal" onClick={e => e.stopPropagation()}>
            <div className="lms-modal-header">
               Add {ERP_TABS.find(t => t.key === activeTab)?.label}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="lms-modal-body">
                {getFormFields().map(field => (
                  <div key={field.name} className="lms-form-group">
                    <label className="lms-label">{field.label}{field.required && ' *'}</label>
                    {field.type === 'select' ? (
                      <select
                        className="lms-select"
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={e => setFormData(f => ({ ...f, [field.name]: e.target.value }))}
                      >
                        <option value="">Select...</option>
                        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        className="lms-input"
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={e => setFormData(f => ({ ...f, [field.name]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="lms-modal-footer">
                <button type="button" onClick={() => setModal(false)} className="lms-btn lms-btn-default">Cancel</button>
                <button type="submit" disabled={saving} className="lms-btn lms-btn-primary">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
