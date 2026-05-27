import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllRequests } from '../lib/api';
import { useToast } from '../context/ToastContext';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

type RequestStatus =
  | 'PENDING_HALL_ADMIN'
  | 'APPROVED_BY_HALL_ADMIN'
  | 'REJECTED_BY_HALL_ADMIN'
  | 'APPROVED_FINAL'
  | 'REJECTED_BY_DEAN'
  | 'CHECKED_OUT'
  | 'CHECKED_IN'
  | '';

interface ExeatRequest {
  id: string;
  student: {
    full_name: string;
    crawford_number: string;
  };
  destination: string;
  reason: string;
  departure_date: string;
  return_date: string;
  status: RequestStatus;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_HALL_ADMIN: 'Pending Hall Admin',
  APPROVED_BY_HALL_ADMIN: 'Awaiting Dean',
  REJECTED_BY_HALL_ADMIN: 'Rejected by Hall Admin',
  APPROVED_FINAL: 'Fully Approved',
  REJECTED_BY_DEAN: 'Rejected by Dean',
  CHECKED_OUT: 'Checked Out',
  CHECKED_IN: 'Checked In',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_HALL_ADMIN: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED_BY_HALL_ADMIN: 'bg-blue-50 text-blue-700 border-blue-200',
  REJECTED_BY_HALL_ADMIN: 'bg-red-50 text-red-700 border-red-200',
  APPROVED_FINAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED_BY_DEAN: 'bg-red-50 text-red-700 border-red-200',
  CHECKED_OUT: 'bg-orange-50 text-orange-700 border-orange-200',
  CHECKED_IN: 'bg-gray-50 text-gray-700 border-gray-200',
};

const PAGE_SIZE = 15;

export default function AdminRequestsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive isToday directly from searchParams
  const isToday = searchParams.get('todayOnly') === 'true';
  const [statusFilter, setStatusFilter] = useState<'' | RequestStatus>(
    (searchParams.get('status') ?? '') as '' | RequestStatus
  );
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState<ExeatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Sync statusFilter from URL params (but not when todayOnly is set)
  useEffect(() => {
    const todayParam = searchParams.get('todayOnly');
    const statusParam = (searchParams.get('status') ?? '') as '' | RequestStatus;
    if (!todayParam) {
      setStatusFilter(statusParam);
    }
    setPage(1);
  }, [searchParams]);

  // Load requests whenever filters change
  useEffect(() => {
    load();
  }, [statusFilter, search, isToday]);

  async function load() {
    setLoading(true);
    try {
      const data = await getAllRequests({
        status: isToday ? undefined : (statusFilter || undefined),
        search,
        todayOnly: isToday,
      });
      setRequests(data);
    } catch {
      showToast('Failed to load requests.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(val: '' | RequestStatus) {
    setStatusFilter(val);
    const next = new URLSearchParams();
    if (val) next.set('status', val);
    setSearchParams(next);
  }

  // Pagination
  const totalPages = Math.ceil(requests.length / PAGE_SIZE);
  const paginated = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageTitle = isToday
    ? "Today's Requests"
    : statusFilter
    ? STATUS_LABELS[statusFilter] ?? 'All Requests'
    : 'All Requests';

  return (
    <div className="flex flex-col gap-6 px-4 md:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {requests.length} request{requests.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or destination…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Status filter (hidden when todayOnly active) */}
        {!isToday && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as '' | RequestStatus)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PENDING_HALL_ADMIN">Pending Hall Admin</option>
              <option value="APPROVED_BY_HALL_ADMIN">Awaiting Dean</option>
              <option value="APPROVED_FINAL">Fully Approved</option>
              <option value="REJECTED_BY_HALL_ADMIN">Rejected by Hall Admin</option>
              <option value="REJECTED_BY_DEAN">Rejected by Dean</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="CHECKED_IN">Checked In</option>
            </select>
          </div>
        )}

        {/* Clear today filter */}
        {isToday && (
          <button
            onClick={() => setSearchParams({})}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 bg-white transition-colors"
          >
            Clear Today Filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Loading requests…
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
            <AlertTriangle className="w-8 h-8 text-gray-300" />
            <p className="text-sm">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Student</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Destination</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Departure</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Return</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Submitted</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{req.student?.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{req.student?.crawford_number ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-[180px] truncate">
                      {req.destination}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(req.departure_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(req.return_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          STATUS_COLORS[req.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {STATUS_LABELS[req.status] ?? req.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/admin/requests/${req.id}`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}