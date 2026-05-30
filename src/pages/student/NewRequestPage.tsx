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

export function NewRequestPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [destination, setDestination] = useState('');
  const [reasonDescription, setReasonDescription] = useState('');
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory>('Personal');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  // ── Parent Contact ──────────────────────────────
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentRelationship, setParentRelationship] = useState('');
  // ────────────────────────────────────────────────

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];

  function handleFile(f: File | null) {
    if (!f) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(f.type)) {
      showToast('Only PDF, JPG, or PNG files are accepted.', 'error');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      showToast('File must be under 10MB.', 'error');
      return;
    }
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
        destination,
        reason_description: reasonDescription,
        reason_category: reasonCategory,
        departure_date: departureDate,
        return_date: returnDate,
        parent_name: parentName,
        parent_phone: parentPhone,
        parent_relationship: parentRelationship,
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
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">New Exeat Request</h2>
            <p className="text-sm text-slate-500">Fill out all fields and attach a supporting document</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          Maximum 5 requests per academic session. Max duration: 5 days.
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">

          {/* ── Section 1: Trip Details ─────────────────── */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Trip Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Destination *</label>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="e.g. Lagos, Nigeria"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                <select
                  value={reasonCategory}
                  onChange={e => setReasonCategory(e.target.value as ReasonCategory)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason Description *</label>
              <textarea
                value={reasonDescription}
                onChange={e => setReasonDescription(e.target.value)}
                placeholder="Provide a detailed reason for your request..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Departure Date *</label>
                <input
                  type="date"
                  value={departureDate}
                  min={today}
                  onChange={e => setDepartureDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Return Date *</label>
                <input
                  type="date"
                  value={returnDate}
                  min={departureDate || today}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Parent Contact ───────────────── */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Parent / Guardian Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Parent Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Parent / Guardian Name *
                  </span>
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Relationship *
                  </span>
                </label>
                <select
                  value={parentRelationship}
                  onChange={e => setParentRelationship(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Select relationship</option>
                  {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Phone */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Phone Number *
                  </span>
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  maxLength={11}
                  onChange={e => setParentPhone(e.target.value.replace(/[^\d+\s\-]/g, ''))}
                  placeholder="e.g. 08023355808"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Section 3: Document Upload ──────────────── */}
          <div className="border-t border-slate-100 pt-5 space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Supporting Document
            </h3>

            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Attach Document *
            </label>

            {file ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="flex-1 text-sm text-emerald-700 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-emerald-500 hover:text-emerald-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-medium">Drop file here or click to browse</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — max 10MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* ── Buttons ─────────────────────────────────── */}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
            >
              {loading ? <LoadingSpinner size="sm" /> : null}
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}