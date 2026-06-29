import { useEffect, useState, FormEvent, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { getRequestById, updateRequest } from '../../services/requestService';
import { ExeatRequest, ReasonCategory } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ArrowLeft, CreditCard as Edit2, Save, X, FileText, Upload, ExternalLink, Calendar, MapPin, Tag, MessageSquare, User, Phone } from 'lucide-react';

const CATEGORIES: ReasonCategory[] = ['Medical', 'Family Emergency', 'Official', 'Personal', 'Academic'];

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ExeatRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [destination, setDestination] = useState('');
  const [reasonDescription, setReasonDescription] = useState('');
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory>('Personal');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const req = await getRequestById(id);
        setRequest(req);
        if (req) {
          setDestination(req.destination);
          setReasonDescription(req.reason_description);
          setReasonCategory(req.reason_category as ReasonCategory);
          setDepartureDate(req.departure_date);
          setReturnDate(req.return_date);
          if (req.supporting_document_url) {
            setDocUrl(req.supporting_document_url);
          }
        }
      } catch {
        showToast('Failed to load request.', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!request) return;
    setSaving(true);
    try {
      const updated = await updateRequest(request.id, user!.id, {
        destination,
        reason_description: reasonDescription,
        reason_category: reasonCategory,
        departure_date: departureDate,
        return_date: returnDate,
        file: file ?? undefined,
      });
      setRequest(updated);
      setEditing(false);
      showToast('Request updated successfully.', 'success');
      if (updated.supporting_document_url) {
         setDocUrl(updated.supporting_document_url);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update request.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
    </DashboardLayout>
  );

  if (!request) return (
    <DashboardLayout>
      <div className="text-center py-20 text-slate-500">Request not found.</div>
    </DashboardLayout>
  );

  const canEdit = request.status === 'PENDING_HALL_ADMIN' && request.student_id === user?.id;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">Request Details</h2>
          </div>
          <StatusBadge status={request.status} />
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Destination</label>
                <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <select value={reasonCategory} onChange={e => setReasonCategory(e.target.value as ReasonCategory)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason</label>
              <textarea value={reasonDescription} onChange={e => setReasonDescription(e.target.value)} rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Departure</label>
                <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Return</label>
                <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Replace Document (optional)</label>
              {file ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="flex-1 truncate text-emerald-700">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} className="text-emerald-400 hover:text-emerald-700"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl w-full hover:border-blue-400 hover:bg-blue-50 transition-all text-sm text-slate-500">
                  <Upload className="w-4 h-4" /> Click to upload new document
                </button>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors text-sm flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium transition-colors text-sm flex items-center justify-center gap-2">
                {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">

            {/* Request Info */}
            <InfoRow icon={<MapPin className="w-4 h-4" />}      label="Destination"       value={request.destination} />
            <InfoRow icon={<Tag className="w-4 h-4" />}         label="Category"          value={request.reason_category} />
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Reason</label>
              <p className="mt-1 text-slate-700 text-sm">{request.reason_description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Departure" value={new Date(request.departure_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Return"    value={new Date(request.return_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
            </div>
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Duration"         value={`${request.total_days} day(s)`} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Academic Session" value={request.academic_session} />

            {/* ✅ Parent / Guardian Contact */}
            {(request.parent_name || request.parent_phone || request.parent_relationship) && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Parent / Guardian Contact</p>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                  {request.parent_name && (
                    <InfoRow icon={<User className="w-4 h-4" />}  label="Name"         value={request.parent_name} />
                  )}
                  {request.parent_relationship && (
                    <InfoRow icon={<User className="w-4 h-4" />}  label="Relationship" value={request.parent_relationship} />
                  )}
                  {request.parent_phone && (
                    <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone Number" value={request.parent_phone} />
                  )}
                </div>
              </div>
            )}

            {/* Supporting Document */}
            {docUrl && (
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Supporting Document</label>
                <a href={docUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-1.5 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium">
                  <FileText className="w-4 h-4" />
                  {request.supporting_document_name ?? 'View Document'}
                  <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                </a>
              </div>
            )}

            {/* Comments */}
            {(request.hall_admin_comment || request.dean_comment) && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                {request.hall_admin_comment && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs font-medium text-amber-600 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Hall Admin Comment
                    </p>
                    <p className="text-sm text-slate-700">{request.hall_admin_comment}</p>
                  </div>
                )}
                {request.dean_comment && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-xs font-medium text-emerald-600 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Dean Comment
                    </p>
                    <p className="text-sm text-slate-700">{request.dean_comment}</p>
                  </div>
                )}
              </div>
            )}

            {/* Checkout / Checkin times */}
            {(request.checkout_time || request.checkin_time) && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {request.checkout_time && (
                  <p className="text-xs text-slate-500">Checked out: {new Date(request.checkout_time).toLocaleString()}</p>
                )}
                {request.checkin_time && (
                  <p className="text-xs text-slate-500">Checked in: {new Date(request.checkin_time).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      <p className="mt-0.5 flex items-center gap-1.5 text-slate-700 text-sm">
        <span className="text-slate-400">{icon}</span>
        {value}
      </p>
    </div>
  );
}