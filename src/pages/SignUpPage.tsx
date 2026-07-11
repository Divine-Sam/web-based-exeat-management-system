import { useState, FormEvent, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Role } from '../types';
import { Eye, EyeOff, UserPlus, GraduationCap, Building2, UserCog, Shield, ChevronDown, FileText } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

const ROLE_OPTIONS: { value: Role; label: string; icon: React.ReactNode }[] = [
  { value: 'student',    label: 'Student',    icon: <GraduationCap className="w-4 h-4" /> },
  { value: 'hall_admin', label: 'Hall Admin', icon: <Building2 className="w-4 h-4" /> },
  { value: 'dean',       label: 'Dean',       icon: <UserCog className="w-4 h-4" /> },
  { value: 'security',   label: 'Security',   icon: <Shield className="w-4 h-4" /> },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#ffffff',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
};

function RoleDropdown({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = ROLE_OPTIONS.find(o => o.value === value)!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderColor: open ? '#7c3aed' : 'rgba(255,255,255,0.15)',
        }}
      >
        <span className="flex items-center gap-2 text-white">
          {selected.icon}
          {selected.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-20 bg-[#1a1a2e] border border-purple-500/40 border-t-0 rounded-b-xl overflow-hidden">
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
                ${opt.value === value
                  ? 'bg-purple-500/15 text-purple-300'
                  : 'text-white/70 hover:bg-purple-500/10 hover:text-white'}`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SignUpPage() {
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [crawfordNumber, setCrawfordNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !crawfordNumber.trim() || !password || !confirmPassword) {
      showToast('Please fill in all fields.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }
    setLoading(true);
    try {
      await signUp(fullName.trim(), crawfordNumber.trim(), password, role);
      showToast('Account created successfully! Please sign in.', 'success');
      navigate('/login');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0d0d1a]">
      <div className="absolute w-72 h-72 rounded-full bg-purple-700 opacity-25 blur-[80px] -top-20 -left-16 pointer-events-none" />
      <div className="absolute w-60 h-60 rounded-full bg-pink-500 opacity-20 blur-[80px] top-16 -right-12 pointer-events-none" />
      <div className="absolute w-52 h-52 rounded-full bg-cyan-500 opacity-15 blur-[70px] bottom-0 left-1/3 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 border border-white/15 bg-white/5 rounded-full px-4 py-1.5 text-xs text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Crawford University
        </div>

        <div className="w-14 h-14 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center">
          <FileText className="w-6 h-6 text-purple-400" />
        </div>

        <div className="text-center -mt-2">
          <h1 className="text-2xl font-medium text-white">Create account</h1>
          <p className="text-sm text-white/40 mt-1">Join the Exeat Management System</p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50 tracking-wide">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Adisa Divine"
                style={inputStyle}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50 tracking-wide">Crawford number</label>
              <input
                type="text"
                value={crawfordNumber}
                onChange={e => setCrawfordNumber(e.target.value)}
                placeholder="e.g. 220502012"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/50 tracking-wide">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    style={{ ...inputStyle, paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/50 tracking-wide">Confirm</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50 tracking-wide">Role</label>
              <RoleDropdown value={role} onChange={setRole} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm text-white transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
            >
              {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-xs text-white/30 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
            Sign in
          </Link>
        </p>

        <p className="text-xs text-white/20">Secure login · Crawford University Exeat System</p>
      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.4); }
        input:focus { border-color: #7c3aed !important; }
      `}</style>
    </div>
  );
}