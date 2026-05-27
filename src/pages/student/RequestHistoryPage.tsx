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
import { PlusCircle, Eye, Trash2, Calendar, MapPin, Search, Filter } from 'lucide-react';

// Groups for filtering
const PENDING_STATUSES = ['PENDING_HALL_ADMIN', 'APPROVED_BY_HALL_ADMIN'];
const APPROVED_STATUSES = ['APPROVED_FINAL', 'CHECKED_OUT', 'CHECKED_IN'];
const REJECTED_STATUSES = ['REJECTED_BY_HALL_ADMIN', 'REJECTED_BY_DEAN'];

const STATUS_LABELS: Record<string, string> = {
  'PENDING_HALL_ADMIN':    'Pending Review',
  'APPROVED_BY_HALL_ADMIN':'Pending Dean',
  'APPROVED_FINAL':        'Approved',
  'REJECTED_BY_HALL_ADMIN':'Rejected',
  'REJECTED_BY_DEAN':      'Rejected',
  'CHECKED_OUT':           'Checked Out',
  'CHECKED_IN':            'Checked In',
};

const FILTER_OPTIONS = [
  { label: 'All',            value: '' },
  { label: 'Pending Review', value: 'pending' },
  { label: 'Approved',       value: 'approved' },
  { label: 'Rejected',       value: 'rejected' },
];

export function RequestHistoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests, setRequests] = useState<ExeatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Read status filter from URL — e.g. ?status=PENDING_HALL_ADMIN or ?status=approved
  const urlStatus = searchParams.get('status') ?? '';

  // Resolve URL status to a filter group
  function resolveFilter(status: string): string {
    if (PENDING_STATUSES.includes(status))  return 'pending';
    if (APPROVED_STATUSES.includes(status)) return 'approved';
    if (REJECTED_STATUSES.includes(status)) return 'rejected';
    if (['pending', 'approved', 'rejected'].includes(status)) return status;
    return '';
  }

  const [activeFilter, setActiveFilter] = useState<string>(() => resolveFilter(urlStatus));

  // When URL changes (e.g. clicking dashboard card) update filter
  useEffect(() => {
    setActiveFilter(resolveFilter(urlStatus));
  }, [urlStatus]);

  useEffect(() => {
    load();
  }, []);

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
    // Update URL to reflect filter
    if (value) {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
  }

  // Apply status group filter
  function matchesFilter(req: ExeatRequest): boolean {
    if (!activeFilter) return true;
    if (activeFilter === 'pending')  return PENDING_STATUSES.includes(req.status);
    if (activeFilter === 'approved') return APPROVED_STATUSES.includes(req.status);
    if (activeFilter === 'rejected') return REJECTED_STATUSES.includes(req.status);
    return req.status === activeFilter;
  }

  const filtered = requests.filter(r =>
    matchesFilter(r) &&
    (
      r.destination.toLowerCase().includes(search.toLowerCase()) ||
      r.reason_category.toLowerCase().includes(search.toLowerCase())
    )
  );

  // Count per group for filter badges
  const counts = {
    pending:  requests.filter(r => PENDING_STATUSES.includes(r.status)).length,
    approved: requests.filter(r => APPROVED_STATUSES.includes(r.status)).length,
    rejected: requests.filter(r => REJECTED_STATUSES.includes(r.status)).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">My Requests</h2>
            <p className="text-sm text-slate-500">{requests.length} total request(s)</p>
          </div>
          <Link
            to="/requests/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New Request
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map(opt => {
            const count = opt.value === 'pending'
              ? counts.pending
              : opt.value === 'approved'
              ? counts.approved
              : opt.value === 'rejected'
              ? counts.rejected
              : requests.length;

            const isActive = activeFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleFilterChange(opt.value)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {opt.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by destination or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileTextIcon />
            </div>
            <p className="text-slate-600 font-medium">No requests found</p>
            <p className="text-slate-400 text-sm mt-1">
              {search || activeFilter
                ? 'Try clearing the filter or search term'
                : 'Submit your first exeat request'}
            </p>
            {!search && !activeFilter && (
              <Link
                to="/requests/new"
                className="inline-flex items-center gap-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                New Request
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge status={req.status} />
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {req.reason_category}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {req.destination}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(req.departure_date).toLocaleDateString()} → {new Date(req.return_date).toLocaleDateString()}
                      </span>
                      <span className="text-slate-400">{req.total_days} day(s)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Submitted {new Date(req.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/requests/${req.id}`}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {req.status === 'PENDING_HALL_ADMIN' && (
                      <button
                        onClick={() => setConfirmId(req.id)}
                        disabled={deletingId === req.id}
                        className="p-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Cancel request"
                      >
                        {deletingId === req.id
                          ? <LoadingSpinner size="sm" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Cancel Request"
        size="sm"
      >
        <p className="text-slate-600 text-sm">
          Are you sure you want to cancel this request? This action cannot be undone.
        </p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => setConfirmId(null)}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors text-sm"
          >
            Keep Request
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors text-sm"
          >
            Cancel Request
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

function FileTextIcon() {
  return (
    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}