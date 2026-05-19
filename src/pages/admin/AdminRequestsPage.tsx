import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import {
  getAllRequests, hallApprove, hallReject, deanApprove, deanReject, getDocumentUrl
} from '../../services/requestService';
import { ExeatRequest, RequestStatus, Role } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { Search, Filter, Eye, CheckCircle, XCircle, FileText, ExternalLink, Calendar, MapPin, MessageSquare, User } from 'lucide-react';

const STATUS_FILTERS: { value: '' | RequestStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING_HALL_ADMIN', label: 'Pending Hall Admin' },
  { value: 'APPROVED_BY_HALL_ADMIN', label: 'Pending Dean' },
  { value: 'APPROVED_FINAL', label: 'Approved' },
  { value: 'REJECTED_BY_HALL_ADMIN', label: 'Rejected (Hall)' },
  { value: 'REJECTED_BY_DEAN', label: 'Rejected (Dean)' },
  { value: 'CHECKED_OUT', label: 'Checked Out' },
  { value: 'CHECKED_IN', label: 'Checked In' },
];

export function AdminRequestsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const role = user?.profile.role as Role;

  const [requests, setRequests] = useState<ExeatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | RequestStatus>('');
  const [selectedRequest, setSelectedRequest] = useState<ExeatRequest | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getAllRequests({ status: statusFilter || undefined, search });
      setRequests(data);
    } catch {
      showToast('Failed to load requests.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter, search]);

  async function openRequest(req: ExeatRequest) {
    setSelectedRequest(req);
    setDocUrl(null);
    if (req.supporting_document_path) {
      try {
        const url = await getDocumentUrl(req.supporting_document_path);
        setDocUrl(url);
      } catch {
        //
      }
    }
  }

  async function handleAction() {
    if (!selectedRequest || !actionModal) return;
    setActing(true);
    try {
      if (role === 'hall_admin') {
        if (actionModal === 'approve') await hallApprove(selectedRequest.id, user!.id, comment);
        else await hallReject(selectedRequest.id, user!.id, comment);
      } else if (role === 'dean') {
        if (actionModal === 'approve') await deanApprove(selectedRequest.id, user!.id, comment);
        else await deanReject(selectedRequest.id, user!.id, comment);
      }
      showToast(`Request ${actionModal === 'approve' ? 'approved' : 'rejected'} successfully.`, 'success');
      setActionModal(null);
      setSelectedRequest(null);
      setComment('');
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Action failed.', 'error');
    } finally {
      setActing(false);
    }
  }

  function canApprove(req: ExeatRequest): boolean {
    if (role === 'hall_admin') return req.status === 'PENDING_HALL_ADMIN';
    if (role === 'dean') return req.status === 'APPROVED_BY_HALL_ADMIN';
    return false;
  }

  function canReject(req: ExeatRequest): boolean {
    return canApprove(req);
  }

  const filtered = requests;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Review Requests</h2>
          <p className="text-sm text-slate-500">{role === 'hall_admin' ? 'Review and process student exeat requests' : 'Final approval for Hall Admin reviewed requests'}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by student name or Crawford number..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as '' | RequestStatus); setPage(1); }}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {STATUS_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : paginated.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <p className="text-slate-500">No requests found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Destination</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Dates</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginated.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-800">{req.profiles?.full_name ?? '—'}</p>
                          <p className="text-xs text-slate-400">{req.profiles?.crawford_number ?? '—'}</p>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <p className="text-sm text-slate-700">{req.destination}</p>
                          <p className="text-xs text-slate-400">{req.reason_category}</p>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <p className="text-xs text-slate-600">
                            {new Date(req.departure_date).toLocaleDateString()} — {new Date(req.return_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-400">{req.total_days} day(s)</p>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openRequest(req)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canApprove(req) && (
                              <button
                                onClick={() => { openRequest(req); setActionModal('approve'); setComment(''); }}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {canReject(req) && (
                              <button
                                onClick={() => { openRequest(req); setActionModal('reject'); setComment(''); }}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail / Action Modal */}
      <Modal
        isOpen={!!selectedRequest && !actionModal}
        onClose={() => { setSelectedRequest(null); setDocUrl(null); }}
        title="Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={selectedRequest.status} />
              <span className="text-xs text-slate-400">{selectedRequest.academic_session}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem icon={<User className="w-4 h-4" />} label="Student" value={selectedRequest.profiles?.full_name ?? '—'} />
              <DetailItem icon={<User className="w-4 h-4" />} label="Crawford No" value={selectedRequest.profiles?.crawford_number ?? '—'} />
              <DetailItem icon={<MapPin className="w-4 h-4" />} label="Destination" value={selectedRequest.destination} />
              <DetailItem icon={<MessageSquare className="w-4 h-4" />} label="Category" value={selectedRequest.reason_category} />
              <DetailItem icon={<Calendar className="w-4 h-4" />} label="Departure" value={new Date(selectedRequest.departure_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
              <DetailItem icon={<Calendar className="w-4 h-4" />} label="Return" value={new Date(selectedRequest.return_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Reason</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3">{selectedRequest.reason_description}</p>
            </div>
            {docUrl && (
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                {selectedRequest.supporting_document_name ?? 'View Document'}
                <ExternalLink className="w-3.5 h-3.5 ml-auto" />
              </a>
            )}
            {selectedRequest.hall_admin_comment && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-medium text-amber-600 mb-1">Hall Admin Comment</p>
                <p className="text-sm text-slate-700">{selectedRequest.hall_admin_comment}</p>
              </div>
            )}
            {canApprove(selectedRequest) && (
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setActionModal('reject'); setComment(''); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => { setActionModal('approve'); setComment(''); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Action Modal */}
      <Modal
        isOpen={!!selectedRequest && !!actionModal}
        onClose={() => { setActionModal(null); setComment(''); }}
        title={actionModal === 'approve' ? 'Approve Request' : 'Reject Request'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {actionModal === 'approve'
              ? 'Add an optional comment before approving this request.'
              : 'Provide a reason for rejecting this request (required).'}
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Comment {actionModal === 'reject' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder={actionModal === 'reject' ? 'Reason for rejection...' : 'Optional comment...'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setActionModal(null); setComment(''); }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              disabled={acting || (actionModal === 'reject' && !comment.trim())}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-50 ${actionModal === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {acting ? <LoadingSpinner size="sm" /> : null}
              {acting ? 'Processing...' : actionModal === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-700">
        <span className="text-slate-400">{icon}</span>
        {value}
      </p>
    </div>
  );
}
