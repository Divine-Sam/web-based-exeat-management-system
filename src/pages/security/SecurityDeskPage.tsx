import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { getAllRequests, checkOut, checkIn } from '../../services/requestService';
import { ExeatRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { Search, Eye, LogOut, LogIn, FileText, ExternalLink, Calendar, MapPin, User, Shield, Phone } from 'lucide-react';

type Tab = 'approved' | 'out' | 'in';

function statusToTab(status: string | null): Tab {
  if (status === 'CHECKED_IN')     return 'in';
  if (status === 'CHECKED_OUT')    return 'out';
  if (status === 'APPROVED_FINAL') return 'approved';
  return 'approved';
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: '4px', display: 'block',
};

function SecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>{icon}</span>{value}
      </p>
    </div>
  );
}

export function SecurityDeskPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [tab, setTab]         = useState<Tab>(statusToTab(searchParams.get('status')));
  const [requests, setRequests] = useState<ExeatRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<ExeatRequest | null>(null);
  const [action, setAction]     = useState<'checkout' | 'checkin' | null>(null);
  const [acting, setActing]     = useState(false);
  const [docUrl, setDocUrl]     = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) setTab(statusToTab(status));
  }, [searchParams]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [approved, out, checkedIn] = await Promise.all([
        getAllRequests({ status: 'APPROVED_FINAL' as any }),
        getAllRequests({ status: 'CHECKED_OUT' as any }),
        getAllRequests({ status: 'CHECKED_IN' as any }),
      ]);
      setRequests([...approved, ...out, ...checkedIn]);
    } catch {
      showToast('Failed to load requests.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openRequest(req: ExeatRequest) {
    setSelected(req);
    setDocUrl(req.supporting_document_url ?? null);
  }

  async function handleAction() {
    if (!selected || !action) return;
    setActing(true);
    try {
      if (action === 'checkout') await checkOut(selected.id, user!.id);
      else await checkIn(selected.id, user!.id);
      showToast(`Student ${action === 'checkout' ? 'checked out' : 'checked in'} successfully.`, 'success');
      setAction(null); setSelected(null); load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Action failed.', 'error');
    } finally {
      setActing(false); }
  }

  const TAB_STATUS: Record<Tab, string[]> = {
    approved: ['APPROVED_FINAL'],
    out:      ['CHECKED_OUT'],
    in:       ['CHECKED_IN'],
  };

  const filtered = requests
    .filter(r => TAB_STATUS[tab].includes(r.status))
    .filter(r => {
      const s = search.toLowerCase();
      return (
        r.profiles?.full_name?.toLowerCase().includes(s) ||
        r.profiles?.crawford_number?.toLowerCase().includes(s) ||
        r.destination?.toLowerCase().includes(s)
      );
    });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'approved', label: 'Ready for Check-Out', count: requests.filter(r => r.status === 'APPROVED_FINAL').length },
    { key: 'out',      label: 'Checked Out',         count: requests.filter(r => r.status === 'CHECKED_OUT').length },
    { key: 'in',       label: 'Checked In',          count: requests.filter(r => r.status === 'CHECKED_IN').length },
  ];

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield className="w-5 h-5" style={{ color: '#f87171' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>Security Desk</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Manage student check-in and check-out</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '14px', width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: tab === t.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.4)',
              }}>
              {t.label}
              <span style={{ fontSize: '11px', fontWeight: '600', padding: '1px 7px', borderRadius: '99px',
                background: tab === t.key ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'rgba(255,255,255,0.08)',
                color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.4)',
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, Crawford ID..."
            style={{ width: '100%', padding: '11px 16px 11px 40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none' }} />
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '60px 24px', textAlign: 'center' }}>
            <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>No requests in this category</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(req => (
              <div key={req.id}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>{req.profiles?.full_name ?? '—'}</p>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: '99px' }}>{req.profiles?.crawford_number}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />{req.destination}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      {new Date(req.departure_date).toLocaleDateString()} — {new Date(req.return_date).toLocaleDateString()}
                    </span>
                  </div>
                  {req.checkout_time && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>Checked out: {new Date(req.checkout_time).toLocaleString()}</p>}
                  {req.checkin_time  && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>Checked in: {new Date(req.checkin_time).toLocaleString()}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => openRequest(req)} title="View"
                    style={{ padding: '7px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    <Eye className="w-4 h-4" />
                  </button>
                  {req.status === 'APPROVED_FINAL' && (
                    <button onClick={() => { openRequest(req); setAction('checkout'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: 'linear-gradient(135deg,#d97706,#f59e0b)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                      <LogOut className="w-4 h-4" /> Check Out
                    </button>
                  )}
                  {req.status === 'CHECKED_OUT' && (
                    <button onClick={() => { openRequest(req); setAction('checkin'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                      <LogIn className="w-4 h-4" /> Check In
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selected && !action} onClose={() => { setSelected(null); setDocUrl(null); }} title="Exeat Details" size="lg">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusBadge status={selected.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <SecItem icon={<User className="w-4 h-4" />}     label="Student"     value={selected.profiles?.full_name ?? '—'} />
              <SecItem icon={<User className="w-4 h-4" />}     label="Crawford No" value={selected.profiles?.crawford_number ?? '—'} />
              <SecItem icon={<MapPin className="w-4 h-4" />}   label="Destination" value={selected.destination} />
              <SecItem icon={<Calendar className="w-4 h-4" />} label="Duration"    value={`${selected.total_days} day(s)`} />
              <SecItem icon={<Calendar className="w-4 h-4" />} label="Departure"   value={new Date(selected.departure_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
              <SecItem icon={<Calendar className="w-4 h-4" />} label="Return"      value={new Date(selected.return_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
            </div>

            {(selected.parent_name || selected.parent_phone || selected.parent_relationship) && (
              <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px', padding: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Parent / Guardian Contact</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {selected.parent_name         && <SecItem icon={<User className="w-4 h-4" />}  label="Name"         value={selected.parent_name} />}
                  {selected.parent_relationship  && <SecItem icon={<User className="w-4 h-4" />}  label="Relationship" value={selected.parent_relationship} />}
                  {selected.parent_phone         && <SecItem icon={<Phone className="w-4 h-4" />} label="Phone"        value={selected.parent_phone} />}
                </div>
              </div>
            )}

            {docUrl && (
              <a href={docUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px', color: '#c4b5fd', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>
                <FileText className="w-4 h-4" />
                {selected.supporting_document_name ?? 'View Document'}
                <ExternalLink className="w-3.5 h-3.5" style={{ marginLeft: 'auto' }} />
              </a>
            )}

            {selected.status === 'APPROVED_FINAL' && (
              <button onClick={() => setAction('checkout')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg,#d97706,#f59e0b)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                <LogOut className="w-4 h-4" /> Check Out Student
              </button>
            )}
            {selected.status === 'CHECKED_OUT' && (
              <button onClick={() => setAction('checkin')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                <LogIn className="w-4 h-4" /> Check In Student
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Modal */}
      <Modal isOpen={!!selected && !!action} onClose={() => setAction(null)}
        title={action === 'checkout' ? 'Confirm Check-Out' : 'Confirm Check-In'} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            {action === 'checkout'
              ? `Confirm that ${selected?.profiles?.full_name ?? 'this student'} is leaving campus.`
              : `Confirm that ${selected?.profiles?.full_name ?? 'this student'} has returned to campus.`}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setAction(null)}
              style={{ flex: 1, padding: '11px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleAction} disabled={acting}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.7 : 1,
                background: action === 'checkout' ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'linear-gradient(135deg,#059669,#10b981)' }}>
              {acting ? <LoadingSpinner size="sm" /> : action === 'checkout' ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {acting ? 'Processing...' : action === 'checkout' ? 'Confirm Check-Out' : 'Confirm Check-In'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: #7c3aed !important; }
      `}</style>
    </DashboardLayout>
  );
}