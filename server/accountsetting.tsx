import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { User, Lock, Eye, EyeOff, Save } from 'lucide-react';

export function AccountSettingsPage() {
  const { user, updateName, changePassword } = useAuth();
  const { showToast } = useToast();

  // ── Change Name state ─────────────────────────────────────────────────────
  const [fullName, setFullName]     = useState(user?.profile.full_name ?? '');
  const [savingName, setSavingName] = useState(false);

  // ── Change Password state ─────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [savingPassword, setSavingPassword]     = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleNameSave() {
    if (!fullName.trim()) return showToast('Name cannot be empty.', 'error');
    if (fullName.trim() === user?.profile.full_name) return showToast('No changes detected.', 'info');
    setSavingName(true);
    try {
      await updateName(fullName.trim());
      showToast('Name updated successfully.', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update name.', 'error');
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordSave() {
    if (!currentPassword || !newPassword || !confirmPassword)
      return showToast('All password fields are required.', 'error');
    if (newPassword.length < 6)
      return showToast('New password must be at least 6 characters.', 'error');
    if (newPassword !== confirmPassword)
      return showToast('New passwords do not match.', 'error');
    if (currentPassword === newPassword)
      return showToast('New password must be different from current password.', 'error');

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('Password changed successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to change password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-6">

        <div>
          <h2 className="text-lg font-bold text-slate-800">Account Settings</h2>
          <p className="text-sm text-slate-500">Manage your name and password</p>
        </div>

        {/* ── Change Name ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Change Name</h3>
              <p className="text-xs text-slate-400">Update your display name</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Crawford Number
            </label>
            <input
              type="text"
              value={user?.profile.crawford_number ?? ''}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Crawford number cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          <button
            onClick={handleNameSave}
            disabled={savingName}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {savingName ? 'Saving...' : 'Save Name'}
          </button>
        </div>

        {/* ── Change Password ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>
              <p className="text-xs text-slate-400">Keep your account secure</p>
            </div>
          </div>

          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-all ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-300 focus:ring-red-400'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            onClick={handlePasswordSave}
            disabled={savingPassword}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium text-sm transition-colors"
          >
            <Lock className="w-4 h-4" />
            {savingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}