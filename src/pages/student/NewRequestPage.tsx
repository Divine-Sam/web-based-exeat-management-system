import { useState, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { createRequest } from '../../services/requestService';
import { ReasonCategory } from '../../types';
import { Upload, FileText, X, ArrowLeft, Phone, User, Users } from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const CATEGORIES: ReasonCategory[] = ['Medical', 'Family Emergency', 'Official', 'Personal', 'Academic'];
const RELATIONSHIPS = ['Father', 'Mother', 'Guardian', 'Sibling', 'Uncle', 'Aunt', 'Other'];

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
  fontSize: '12px',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '6px',
  display: 'block',
};

const sectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const sectionHeadStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '13px',
  fontWeight: '500',
  color: '#fff',
};

const badgeStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg,#7c3aed,#ec4899)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: '700',
  color: '#fff',
  flexShrink: 0,
};

export function NewRequestPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [destination, setDestination] = useState('');
  const [reasonDescription, setReasonDescription] = useState('');
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory>('Personal');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentRelationship, setParentRelationship] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];

  function handleFile(f: File | null) {
    if (!f) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(f.type)) { showToast('Only PDF, JPG, or PNG files are accepted.', 'error'); return; }
    if (f.size > 10 * 1024 * 1024) { showToast('File must be under 10MB.', 'error'); return; }
    setFile(f);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!destination.trim()) { showToast('Destination is required.', 'warning'); return; }
    if (!reasonDescription.trim()) { showToast('Reason description is required.', 'warning'); return; }
    if (!departureDate) { showToast('Departure date is required.', 'warning'); return; }
    if (!returnDate) { showToast('Return date is required.', 'warning'); return; }
    if (!parentName.trim()) { showToast('Parent/Guardian name is required.', 'warning'); return; }
    if (!parentPhone.trim()) { showToast('Parent/Guardian phone is required.', 'warning'); return; }
    if (!/^\+?\d{10,11}$/.test(parentPhone.replace(/[\s\-]/g, ''))) {
      showToast('Phone number must be between 10 and 11 digits.', 'warning'); return;
    }
    if (!parentRelationship) { showToast('Relationship is required.', 'warning'); return; }
    if (!file) { showToast('Supporting document is required.', 'warning'); return; }

    setLoading(true);
    try {
      await createRequest(user!.id, {
        destination, reason_description: reasonDescription, reason_category: reasonCategory,
        departure_date: departureDate, return_date: returnDate,
        parent_name: parentName, parent_phone: parentPhone, parent_relationship: parentRelationship,
        file: file || undefined,
      });
      showToast('Exeat request submitted successfully!', 'success');
      navigate('/requests');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to submit request.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>New Exeat Request</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Fill out all fields and attach a supporting document</p>
          </div>
        </div>

        {/* Info Banner */}
        <div style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#c4b5fd' }}>
          ℹ️ Maximum 5 requests per academic session · Max duration: 5 days
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Section 1 — Trip Details */}
          <div style={sectionStyle}>
            <div style={sectionHeadStyle}>
              <div style={badgeStyle}>1</div>
              Trip Details
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Destination *</label>
                <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
                  placeholder="e.g. Lagos, Nigeria" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Category *</label>
                <select value={reasonCategory} onChange={e => setReasonCategory(e.target.value as ReasonCategory)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1a2e' }}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Reason Description *</label>
              <textarea value={reasonDescription} onChange={e => setReasonDescription(e.target.value)}
                placeholder="Provide a detailed reason for your request..."
                rows={4}
                style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Departure Date *</label>
                <input type="date" value={departureDate} min={today}
                  onChange={e => setDepartureDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={labelStyle}>Return Date *</label>
                <input type="date" value={returnDate} min={departureDate || today}
                  onChange={e => setReturnDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
            </div>
          </div>

          {/* Section 2 — Parent Contact */}
          <div style={sectionStyle}>
            <div style={sectionHeadStyle}>
              <div style={badgeStyle}>2</div>
              Parent / Guardian Contact
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}><span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User className="w-3 h-3" /> Name *</span></label>
                <input type="text" value={parentName} onChange={e => setParentName(e.target.value)}
                  placeholder="Full name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}><span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users className="w-3 h-3" /> Relationship *</span></label>
                <select value={parentRelationship} onChange={e => setParentRelationship(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a1a2e' }}>Select relationship</option>
                  {RELATIONSHIPS.map(r => <option key={r} value={r} style={{ background: '#1a1a2e' }}>{r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}><span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone className="w-3 h-3" /> Phone Number *</span></label>
              <input type="tel" value={parentPhone} maxLength={11}
                onChange={e => setParentPhone(e.target.value.replace(/[^\d+\s\-]/g, ''))}
                placeholder="e.g. 08023355808" style={inputStyle} />
            </div>
          </div>

          {/* Section 3 — Document Upload */}
          <div style={sectionStyle}>
            <div style={sectionHeadStyle}>
              <div style={badgeStyle}>3</div>
              Supporting Document
            </div>

            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px' }}>
                <FileText className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '13px', color: '#6ee7b7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  style={{ color: 'rgba(16,185,129,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                style={{ border: '2px dashed rgba(124,58,237,0.3)', borderRadius: '12px', padding: '32px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,0.6)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(124,58,237,0.05)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,0.3)'; (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>Drop file here or click to browse</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>PDF, JPG, PNG — max 10MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => handleFile(e.target.files?.[0] ?? null)} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => navigate(-1)}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? <LoadingSpinner size="sm" /> : null}
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
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