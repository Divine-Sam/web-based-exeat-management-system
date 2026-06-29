import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { getAllRequests, checkOut, checkIn,} from '../../services/requestService';
import { ExeatRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import {
  Search, Eye, LogOut, LogIn, FileText, ExternalLink,
  Calendar, MapPin, User, Shield, Phone
} from 'lucide-react';

type Tab = 'approved' | 'out' | 'in';

// ✅ Map URL status param to tab key
function statusToTab(status: string | null): Tab {
  if (status === 'CHECKED_IN')    return 'in';
  if (status === 'CHECKED_OUT')   return 'out';
  if (status === 'APPROVED_FINAL') return 'approved';
  return 'approved';
}

export function SecurityDeskPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // ✅ Read ?status= from URL and set initial tab
  const [tab, setTab] = useState<Tab>(statusToTab(searchParams.get('status')));

  const [requests, setRequests]   = useState<ExeatRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<ExeatRequest | null>(null);
  const [action, setAction]       = useState<'checkout' | 'checkin' | null>(null);
  const [acting, setActing]       = useState(false);
  const [docUrl, setDocUrl]       = useState<string | null>(null);

  // ✅ Sync tab when URL param changes (e.g. dashboard card click)
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) setTab(statusToTab(status));
  }, [searchParams]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      // Fetch all statuses for security
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

  // ✅ New
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
      setAction(null);
      setSelected(null);
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Action failed.', 'error');
    } finally {
      setActing(false);
    }
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
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Security Desk</h2>
            <p className="text-sm text-slate-500">Manage student check-in and check-out</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, Crawford number"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">No requests in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="font-semibold text-slate-800">{req.profiles?.full_name ?? '—'}</p>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{req.profiles?.crawford_number}</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{req.destination}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(req.departure_date).toLocaleDateString()} — {new Date(req.return_date).toLocaleDateString()}
                      </span>
                    </div>
                    {req.checkout_time && <p className="text-xs text-slate-400 mt-1">Checked out: {new Date(req.checkout_time).toLocaleString()}</p>}
                    {req.checkin_time  && <p className="text-xs text-slate-400 mt-1">Checked in: {new Date(req.checkin_time).toLocaleString()}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => openRequest(req)}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    {req.status === 'APPROVED_FINAL' && (
                      <button onClick={() => { openRequest(req); setAction('checkout'); }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" /> Check Out
                      </button>
                    )}
                    {req.status === 'CHECKED_OUT' && (
                      <button onClick={() => { openRequest(req); setAction('checkin'); }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors">
                        <LogIn className="w-4 h-4" /> Check In
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selected && !action} onClose={() => { setSelected(null); setDocUrl(null); }} title="Exeat Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2"><StatusBadge status={selected.status} /></div>
            <div className="grid grid-cols-2 gap-4">
              <SecItem icon={<User className="w-4 h-4" />}     label="Student"     value={selected.profiles?.full_name ?? '—'} />
              <SecItem icon={<User className="w-4 h-4" />}     label="Crawford No" value={selected.profiles?.crawford_number ?? '—'} />
              <SecItem icon={<MapPin className="w-4 h-4" />}   label="Destination" value={selected.destination} />
              <SecItem icon={<Calendar className="w-4 h-4" />} label="Duration"    value={`${selected.total_days} day(s)`} />
              <SecItem icon={<Calendar className="w-4 h-4" />} label="Departure"   value={new Date(selected.departure_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
              <SecItem icon={<Calendar className="w-4 h-4" />} label="Return"      value={new Date(selected.return_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
            </div>

            {/* ✅ Parent contact */}
            {(selected.parent_name || selected.parent_phone || selected.parent_relationship) && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Parent / Guardian Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  {selected.parent_name         && <SecItem icon={<User className="w-4 h-4" />}  label="Name"         value={selected.parent_name} />}
                  {selected.parent_relationship  && <SecItem icon={<User className="w-4 h-4" />}  label="Relationship" value={selected.parent_relationship} />}
                  {selected.parent_phone         && <SecItem icon={<Phone className="w-4 h-4" />} label="Phone"        value={selected.parent_phone} />}
                </div>
              </div>
            )}

            {docUrl && (
              <a href={docUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium">
                <FileText className="w-4 h-4" />
                {selected.supporting_document_name ?? 'View Document'}
                <ExternalLink className="w-3.5 h-3.5 ml-auto" />
              </a>
            )}
            {selected.status === 'APPROVED_FINAL' && (
              <button onClick={() => setAction('checkout')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors">
                <LogOut className="w-4 h-4" /> Check Out Student
              </button>
            )}
            {selected.status === 'CHECKED_OUT' && (
              <button onClick={() => setAction('checkin')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors">
                <LogIn className="w-4 h-4" /> Check In Student
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Action Modal */}
      <Modal isOpen={!!selected && !!action} onClose={() => setAction(null)}
        title={action === 'checkout' ? 'Confirm Check-Out' : 'Confirm Check-In'} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {action === 'checkout'
              ? `Confirm that ${selected?.profiles?.full_name ?? 'this student'} is leaving campus.`
              : `Confirm that ${selected?.profiles?.full_name ?? 'this student'} has returned to campus.`}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setAction(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors text-sm">
              Cancel
            </button>
            <button onClick={handleAction} disabled={acting}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-50 ${action === 'checkout' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {acting ? <LoadingSpinner size="sm" /> : action === 'checkout' ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {acting ? 'Processing...' : action === 'checkout' ? 'Confirm Check-Out' : 'Confirm Check-In'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

function SecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

