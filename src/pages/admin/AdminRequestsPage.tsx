import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { getAllRequests, hallApprove, hallReject, deanApprove, deanReject } from '../../services/requestService';
import { ExeatRequest, RequestStatus, Role } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { Search, Filter, Eye, CheckCircle, XCircle, FileText, ExternalLink, Calendar, MapPin, MessageSquare, User, Phone } from 'lucide-react';

const STATUS_FILTERS: { value: '' | RequestStatus; label: string }[] = [
  { value: '',                       label: 'All Active' },
  { value: 'PENDING_HALL_ADMIN',     label: 'Pending Hall Admin' },
  { value: 'APPROVED_BY_HALL_ADMIN', label: 'Pending Dean' },
  { value: 'APPROVED_FINAL',         label: 'Final Approved' },
  { value: 'REJECTED_BY_HALL_ADMIN', label: 'Rejected (Hall)' },
  { value: 'REJECTED_BY_DEAN',       label: 'Rejected (Dean)' },
];

const labelStyle: React.CSSProperties = {
  fontSize: '11px', color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: '4px', display: 'block',
};

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>{icon}</span>{value}
      </p>
    </div>
  );
}

export function AdminRequestsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const role = user?.profile.role as Role;

  const [searchParams, setSearchParams] = useSearchParams();
  const statusFromUrl = (searchParams.get('status') ?? '') as '' | RequestStatus;
  const isToday = searchParams.get('filter') === 'today';

  const [requests, setRequests]           = useState<ExeatRequest[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState<'' | RequestStatus>(statusFromUrl);
  const [selectedRequest, setSelectedRequest] = useState<ExeatRequest | null>(null);
  const [actionModal, setActionModal]     = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment]             = useState('');
  const [acting, setActing]               = useState(false);
  const [docUrl, setDocUrl]               = useState<string | null>(null);
  const [page, setPage]                   = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!isToday) { setStatusFilter(statusFromUrl); setPage(1); }
  }, [statusFromUrl, isToday]);

  const searchParamsString = searchParams.toString();
  useEffect(() => { load(); }, [statusFilter, search, searchParamsString]);

  async function load() {
    setLoading(true);
    try {
      const data = await getAllRequests({ status: isToday ? undefined : (statusFilter || undefined), search, todayOnly: isToday });
      setRequests(data);
    } catch { showToast('Failed to load requests.', 'error'); }
    finally { setLoading(false); }
  }

  function handleFilterChange(val: '' | RequestStatus) {
    setStatusFilter(val); setPage(1);
    if (val) setSearchParams({ status: val }); else setSearchParams({});
  }

  function openRequest(req: ExeatRequest) {
    setSelectedRequest(req);
    setDocUrl(req.supporting_document_url ?? null);
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
      setActionModal(null); setSelectedRequest(null); setComment(''); load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Action failed.', 'error');
    } finally { setActing(false); }
  }

  function canApprove(req: ExeatRequest): boolean {
    if (isToday) return false;
    if (role === 'hall_admin') return req.status === 'PENDING_HALL_ADMIN';
    if (role === 'dean')       return req.status === 'APPROVED_BY_HALL_ADMIN';
    return false;
  }

  const totalPages = Math.ceil(requests.length / PAGE_SIZE);
  const paginated  = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const th: React.CSSProperties = { padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)' };
  const td: React.CSSProperties = { padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>
            {isToday ? "Today's Requests" : 'Review Requests'}
          </h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            {isToday ? 'All exeat requests submitted today — view only'
              : role === 'hall_admin' ? 'Review and process student exeat requests'
              : 'Final approval for Hall Admin reviewed requests'}
          </p>
        </div>

        {isToday && (
          <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#c4b5fd' }}>
            📋 Viewing today's requests — approval actions are disabled in this view
          </div>
        )}

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by student name or Crawford ID..."
              style={{ width: '100%', padding: '11px 16px 11px 40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none' }} />
          </div>
          {!isToday && (
            <div style={{ position: 'relative' }}>
              <Filter className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <select value={statusFilter} onChange={e => handleFilterChange(e.target.value as '' | RequestStatus)}
                style={{ padding: '11px 16px 11px 36px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                {STATUS_FILTERS.map(f => <option key={f.value} value={f.value} style={{ background: '#1a1a2e' }}>{f.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><LoadingSpinner size="lg" /></div>
        ) : paginated.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>{isToday ? 'No requests submitted today' : 'No requests found'}</p>
          </div>
        ) : (
          <>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <th style={th}>Student</th>
                      <th style={{ ...th, display: 'none' }} className="sm-show">Destination</th>
                      <th style={{ ...th, display: 'none' }} className="md-show">Dates</th>
                      <th style={th}>Status</th>
                      <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(req => (
                      <tr key={req.id} style={{ transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                        <td style={td}>
                          <p style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{req.profiles?.full_name ?? '—'}</p>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{req.profiles?.crawford_number ?? '—'}</p>
                        </td>
                        <td style={td}>
                          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{req.destination}</p>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{req.reason_category}</p>
                        </td>
                        <td style={td}>
                          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            {new Date(req.departure_date).toLocaleDateString()} — {new Date(req.return_date).toLocaleDateString()}
                          </p>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{req.total_days} day(s)</p>
                        </td>
                        <td style={td}><StatusBadge status={req.status} /></td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => openRequest(req)} title="View"
                              style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                              <Eye className="w-4 h-4" />
                            </button>
                            {canApprove(req) && (
                              <button onClick={() => { openRequest(req); setActionModal('approve'); setComment(''); }} title="Approve"
                                style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', cursor: 'pointer' }}>
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {canApprove(req) && (
                              <button onClick={() => { openRequest(req); setActionModal('reject'); setComment(''); }} title="Reject"
                                style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i + 1} onClick={() => setPage(i + 1)}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', border: 'none', background: page === i + 1 ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'rgba(255,255,255,0.05)', color: page === i + 1 ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedRequest && !actionModal} onClose={() => { setSelectedRequest(null); setDocUrl(null); }} title="Request Details" size="lg">
        {selectedRequest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <StatusBadge status={selectedRequest.status} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{selectedRequest.academic_session}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <DetailItem icon={<User className="w-4 h-4" />}          label="Student"     value={selectedRequest.profiles?.full_name ?? '—'} />
              <DetailItem icon={<User className="w-4 h-4" />}          label="Crawford No" value={selectedRequest.profiles?.crawford_number ?? '—'} />
              <DetailItem icon={<MapPin className="w-4 h-4" />}        label="Destination" value={selectedRequest.destination} />
              <DetailItem icon={<MessageSquare className="w-4 h-4" />} label="Category"    value={selectedRequest.reason_category} />
              <DetailItem icon={<Calendar className="w-4 h-4" />}      label="Departure"   value={new Date(selectedRequest.departure_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
              <DetailItem icon={<Calendar className="w-4 h-4" />}      label="Return"      value={new Date(selectedRequest.return_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
            </div>
            <div>
              <span style={labelStyle}>Reason</span>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 12px', marginTop: '4px', lineHeight: '1.6' }}>{selectedRequest.reason_description}</p>
            </div>
            {(selectedRequest.parent_name || selectedRequest.parent_phone || selectedRequest.parent_relationship) && (
              <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px', padding: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Parent / Guardian Contact</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {selectedRequest.parent_name && <DetailItem icon={<User className="w-4 h-4" />} label="Name" value={selectedRequest.parent_name} />}
                  {selectedRequest.parent_relationship && <DetailItem icon={<User className="w-4 h-4" />} label="Relationship" value={selectedRequest.parent_relationship} />}
                  {selectedRequest.parent_phone && <DetailItem icon={<Phone className="w-4 h-4" />} label="Phone" value={selectedRequest.parent_phone} />}
                </div>
              </div>
            )}
            {docUrl && (
              <a href={docUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px', color: '#c4b5fd', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>
                <FileText className="w-4 h-4" />
                {selectedRequest.supporting_document_name ?? 'View Document'}
                <ExternalLink className="w-3.5 h-3.5" style={{ marginLeft: 'auto' }} />
              </a>
            )}
            {selectedRequest.hall_admin_comment && (
              <div style={{ padding: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: '500', color: '#fbbf24', marginBottom: '6px' }}>Hall Admin Comment</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{selectedRequest.hall_admin_comment}</p>
              </div>
            )}
            {!isToday && canApprove(selectedRequest) && (
              <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={() => { setActionModal('reject'); setComment(''); }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => { setActionModal('approve'); setComment(''); }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '12px', background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal isOpen={!!selectedRequest && !!actionModal} onClose={() => { setActionModal(null); setComment(''); }}
        title={actionModal === 'approve' ? 'Approve Request' : 'Reject Request'} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            {actionModal === 'approve' ? 'Add an optional comment before approving.' : 'Provide a reason for rejection (required).'}
          </p>
          <div>
            <label style={labelStyle}>Comment {actionModal === 'reject' && <span style={{ color: '#f87171' }}>*</span>}</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder={actionModal === 'reject' ? 'Reason for rejection...' : 'Optional comment...'}
              style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setActionModal(null); setComment(''); }}
              style={{ flex: 1, padding: '11px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleAction} disabled={acting || (actionModal === 'reject' && !comment.trim())}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: acting ? 'not-allowed' : 'pointer', opacity: (acting || (actionModal === 'reject' && !comment.trim())) ? 0.5 : 1, background: actionModal === 'approve' ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#dc2626,#f43f5e)' }}>
              {acting ? <LoadingSpinner size="sm" /> : null}
              {acting ? 'Processing...' : actionModal === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
        input:focus, textarea:focus, select:focus { border-color: #7c3aed !important; }
      `}</style>
    </DashboardLayout>
  );
}