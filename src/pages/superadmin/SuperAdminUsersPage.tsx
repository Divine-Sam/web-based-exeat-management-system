import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { Profile, Role } from '../../types';
import { UserPlus, Trash2, Edit2, Search } from 'lucide-react';

const ROLES: Role[] = ['student', 'hall_admin', 'dean', 'security'];
const ROLE_COLORS: Record<string, string> = {
  student:     'bg-blue-100 text-blue-700',
  hall_admin:  'bg-amber-100 text-amber-700',
  dean:        'bg-emerald-100 text-emerald-700',
  security:    'bg-red-100 text-red-700',
  super_admin: 'bg-purple-100 text-purple-700',
};

export function SuperAdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers]             = useState<Profile[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [editUser, setEditUser]       = useState<Profile | null>(null);
  const [deleteUser, setDeleteUser]   = useState<Profile | null>(null);
  const [saving, setSaving]           = useState(false);

  // Create form state
  const [newName, setNewName]         = useState('');
  const [newCrawford, setNewCrawford] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole]         = useState<Role>('student');
  const [editRole, setEditRole]       = useState<Role>('student');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Profile[]>('/superadmin/users');
      setUsers(data);
    } catch {
      showToast('Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName || !newCrawford || !newPassword) return showToast('All fields required.', 'error');
    setSaving(true);
    try {
      await api.post('/superadmin/users', { full_name: newName, crawford_number: newCrawford, password: newPassword, role: newRole });
      showToast('User created successfully.', 'success');
      setShowCreate(false);
      setNewName(''); setNewCrawford(''); setNewPassword(''); setNewRole('student');
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create user.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditRole() {
    if (!editUser) return;
    setSaving(true);
    try {
      await api.put(`/superadmin/users/${editUser.id}/role`, { role: editRole });
      showToast('Role updated successfully.', 'success');
      setEditUser(null);
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update role.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setSaving(true);
    try {
      await api.delete(`/superadmin/users/${deleteUser.id}`);
      showToast('User deleted.', 'success');
      setDeleteUser(null);
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete user.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.crawford_number.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Manage Users</h2>
            <p className="text-sm text-slate-500">Create, edit roles, and delete accounts</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors">
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, Crawford ID or role..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Crawford No</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-slate-800">{u.full_name}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{u.crawford_number}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditUser(u); setEditRole(u.role as Role); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition-colors" title="Edit role">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {u.role !== 'superadmin' && (
                            <button onClick={() => setDeleteUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
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
        )}
      </div>

      {/* Create User Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New User" size="sm">
        <div className="space-y-4">
          {[
            { label: 'Full Name', value: newName, set: setNewName, placeholder: 'Enter full name' },
            { label: 'Crawford ID', value: newCrawford, set: setNewCrawford, placeholder: 'e.g. CU/21/0001' },
            { label: 'Password', value: newPassword, set: setNewPassword, placeholder: 'Min 6 characters' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
              <input type={f.label === 'Password' ? 'password' : 'text'} value={f.value}
                onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value as Role)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white">
              {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : null}
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Change Role" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Change role for <strong>{editUser?.full_name}</strong></p>
          <select value={editRole} onChange={e => setEditRole(e.target.value as Role)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white">
            {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
          <div className="flex gap-3">
            <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm">Cancel</button>
            <button onClick={handleEditRole} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : 'Save Role'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteUser} onClose={() => setDeleteUser(null)} title="Delete User" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Are you sure you want to delete <strong>{deleteUser?.full_name}</strong>? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteUser(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm">Cancel</button>
            <button onClick={handleDelete} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : 'Delete User'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}