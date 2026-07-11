import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { getStudentRequests, cancelRequest } from '../../services/requestService';
import { ExeatRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { PlusCircle, Eye, Trash2, Calendar, MapPin, Search } from 'lucide-react';

const PENDING_STATUSES  = ['PENDING_HALL_ADMIN', 'APPROVED_BY_HALL_ADMIN'];
const APPROVED_STATUSES = ['APPROVED_FINAL', 'CHECKED_OUT', 'CHECKED_IN'];
const REJECTED_STATUSES = ['REJECTED_BY_HALL_ADMIN', 'REJECTED_BY_DEAN'];

const FILTER_OPTIONS = [
  { label: 'All',      value: '' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export function RequestHistoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests, setRequests]   = useState<ExeatRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);

  const urlStatus = searchParams.get('status') ?? '';

  function resolveFilter(status: string): string {
    if (PENDING_STATUSES.includes(status))  return 'pending';
    if (APPROVED_STATUSES.includes(status)) return 'approved';
    if (REJECTED_STATUSES.includes(status)) return 'rejected';
    if (['pending', 'approved', 'rejected'].includes(status)) return status;
    return '';
  }

  const [activeFilter, setActiveFilter] = useState<string>(() => resolveFilter(urlStatus));

  useEffect(() => { setActiveFilter(resolveFilter(urlStatus)); }, [urlStatus]);
  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getStudentRequests(user!.id);
      setRequests(data);
    } catch {
      showToast('Failed to load requests.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirmId) return;
    setDeletingId(confirmId);
    setConfirmId(null);
    try {
      await cancelRequest(confirmId, user!.id);
      showToast('Request cancelled.', 'success');
      setRequests(prev => prev.filter(r => r.id !== confirmId));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to cancel request.', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  function handleFilterChange(value: string) {
    setActiveFilter(value);
    if (value) setSearchParams({ status: value });
    else setSearchParams({});
  }

  function matchesFilter(req: ExeatRequest): boolean {
    if (!activeFilter) return true;
    if (activeFilter === 'pending')  return PENDING_STATUSES.includes(req.status);
    if (activeFilter === 'approved') return APPROVED_STATUSES.includes(req.status);
    if (activeFilter === 'rejected') return REJECTED_STATUSES.includes(req.status);
    return req.status === activeFilter;
  }

  const filtered = requests.filter(r =>
    matchesFilter(r) &&
    (r.destination.toLowerCase().includes(search.toLowerCase()) ||
     r.reason_category.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    '':       requests.length,
    pending:  requests.filter(r => PENDING_STATUSES.includes(r.status)).length,
    approved: requests.filter(r => APPROVED_STATUSES.includes(r.status)).length,
    rejected: requests.filter(r => REJECTED_STATUSES.includes(r.status)).length,
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>My Requests</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{requests.length} total request(s)</p>
          </div>
          <Link to="/requests/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>
            <PlusCircle className="w-4 h-4" /> New Request
          </Link>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {FILTER_OPTIONS.map(opt => {
            const count = counts[opt.value as keyof typeof counts] ?? 0;
            const isActive = activeFilter === opt.value;
            return (
              <button key={opt.value} onClick={() => handleFilterChange(opt.value)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '500',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: isActive ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'rgba(255,255,255,0.05)',
                  border: isActive ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                }}>
                {opt.label}
                <span style={{
                  fontSize: '11px', fontWeight: '600', padding: '1px 6px', borderRadius: '99px',
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by destination or category..."
            style={{ width: '100%', padding: '11px 16px 11px 40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none' }} />
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg className="w-7 h-7" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p style={{ fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.6)' }}>No requests found</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
              {search || activeFilter ? 'Try clearing the filter or search term' : 'Submit your first exeat request'}
            </p>
            {!search && !activeFilter && (
              <Link to="/requests/new"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', padding: '9px 16px', borderRadius: '12px', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>
                <PlusCircle className="w-4 h-4" /> New Request
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(req => (
              <div key={req.id}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <StatusBadge status={req.status} />
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: '99px' }}>
                      {req.reason_category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      {req.destination}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      {new Date(req.departure_date).toLocaleDateString()} → {new Date(req.return_date).toLocaleDateString()}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>{req.total_days} day(s)</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>
                    Submitted {new Date(req.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <Link to={`/requests/${req.id}`}
                    style={{ padding: '7px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}
                    title="View details">
                    <Eye className="w-4 h-4" />
                  </Link>
                  {req.status === 'PENDING_HALL_ADMIN' && (
                    <button onClick={() => setConfirmId(req.id)} disabled={deletingId === req.id}
                      style={{ padding: '7px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: deletingId === req.id ? 0.5 : 1 }}
                      title="Cancel request">
                      {deletingId === req.id ? <LoadingSpinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={!!confirmId} onClose={() => setConfirmId(null)} title="Cancel Request" size="sm">
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
          Are you sure you want to cancel this request? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={() => setConfirmId(null)}
            style={{ flex: 1, padding: '11px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            Keep Request
          </button>
          <button onClick={handleCancel}
            style={{ flex: 1, padding: '11px', borderRadius: '12px', background: 'linear-gradient(135deg,#dc2626,#f43f5e)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            Cancel Request
          </button>
        </div>
      </Modal>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: #7c3aed !important; }
      `}</style>
    </DashboardLayout>
  );
}