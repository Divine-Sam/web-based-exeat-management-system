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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 16px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#ffffff',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '4px',
  display: 'block',
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>{icon}</span>
        {value}
      </p>
    </div>
  );
}

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
          if (req.supporting_document_url) setDocUrl(req.supporting_document_url);
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
        destination, reason_description: reasonDescription,
        reason_category: reasonCategory, departure_date: departureDate,
        return_date: returnDate, file: file ?? undefined,
      });
      setRequest(updated);
      setEditing(false);
      showToast('Request updated successfully.', 'success');
      if (updated.supporting_document_url) setDocUrl(updated.supporting_document_url);
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
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.4)' }}>Request not found.</div>
    </DashboardLayout>
  );

  const canEdit = request.status === 'PENDING_HALL_ADMIN' && request.student_id === user?.id;

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '20px',
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)}
            style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>Request Details</h2>
          </div>
          <StatusBadge status={request.status} />
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {/* Edit Form */}
        {editing ? (
          <form onSubmit={handleSave} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Destination</label>
                <input type="text" value={destination} onChange={e => setDestination(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={reasonCategory} onChange={e => setReasonCategory(e.target.value as ReasonCategory)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1a2e' }}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Reason</label>
              <textarea value={reasonDescription} onChange={e => setReasonDescription(e.target.value)} rows={3}
                style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Departure</label>
                <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={labelStyle}>Return</label>
                <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Replace Document (optional)</label>
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px' }}>
                  <FileText className="w-4 h-4" style={{ color: '#10b981' }} />
                  <span style={{ flex: 1, fontSize: '13px', color: '#6ee7b7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(16,185,129,0.7)' }}><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '2px dashed rgba(124,58,237,0.3)', borderRadius: '10px', width: '100%', background: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>
                  <Upload className="w-4 h-4" /> Click to upload new document
                </button>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>

            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button type="button" onClick={() => setEditing(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <X className="w-4 h-4" /> Cancel
              </button>
              <button type="submit" disabled={saving}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Trip Info */}
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Destination" value={request.destination} />
            <InfoRow icon={<Tag className="w-4 h-4" />} label="Category" value={request.reason_category} />

            <div>
              <span style={labelStyle}>Reason</span>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', marginTop: '4px' }}>{request.reason_description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Departure" value={new Date(request.departure_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Return" value={new Date(request.return_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
            </div>

            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Duration" value={`${request.total_days} day(s)`} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Academic Session" value={request.academic_session} />

            {/* Parent Contact */}
            {(request.parent_name || request.parent_phone || request.parent_relationship) && (
              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Parent / Guardian Contact</p>
                <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {request.parent_name && <InfoRow icon={<User className="w-4 h-4" />} label="Name" value={request.parent_name} />}
                  {request.parent_relationship && <InfoRow icon={<User className="w-4 h-4" />} label="Relationship" value={request.parent_relationship} />}
                  {request.parent_phone && <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone Number" value={request.parent_phone} />}
                </div>
              </div>
            )}

            {/* Document */}
            {docUrl && (
              <div>
                <span style={labelStyle}>Supporting Document</span>
                <a href={docUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px', color: '#c4b5fd', fontSize: '13px', fontWeight: '500', textDecoration: 'none', marginTop: '6px' }}>
                  <FileText className="w-4 h-4" />
                  {request.supporting_document_name ?? 'View Document'}
                  <ExternalLink className="w-3.5 h-3.5" style={{ marginLeft: 'auto' }} />
                </a>
              </div>
            )}

            {/* Comments */}
            {(request.hall_admin_comment || request.dean_comment) && (
              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {request.hall_admin_comment && (
                  <div style={{ padding: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '500', color: '#fbbf24', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare className="w-3.5 h-3.5" /> Hall Admin Comment
                    </p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{request.hall_admin_comment}</p>
                  </div>
                )}
                {request.dean_comment && (
                  <div style={{ padding: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '500', color: '#34d399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare className="w-3.5 h-3.5" /> Dean Comment
                    </p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{request.dean_comment}</p>
                  </div>
                )}
              </div>
            )}

            {/* Checkout / Checkin */}
            {(request.checkout_time || request.checkin_time) && (
              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {request.checkout_time && (
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Checked out: {new Date(request.checkout_time).toLocaleString()}</p>
                )}
                {request.checkin_time && (
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Checked in: {new Date(request.checkin_time).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.35); }
        input:focus, textarea:focus, select:focus { border-color: #7c3aed !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; }
        select option { background: #1a1a2e; color: #fff; }
      `}</style>
    </DashboardLayout>
  );
}