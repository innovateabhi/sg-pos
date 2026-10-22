import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Edit,
  X
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function StaffManagement() {
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('cashier');
  const [status, setStatus] = useState('active');
  const [password, setPassword] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/staff.php', { action: 'list' });
      if (res?.success) {
        setStaffList(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('cashier');
    setStatus('active');
    setPassword('');
    setShowModal(true);
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setName(staff.name);
    setEmail(staff.email);
    setPhone(staff.phone || '');
    setRole(staff.role);
    setStatus(staff.status);
    setPassword(''); // leave blank if unchanged
    setShowModal(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: editingStaff?.id,
        name,
        email,
        phone,
        role,
        status,
        password: password || undefined,
      };

      const res = await api.post('/api/staff.php?action=save', payload);
      if (res?.success) {
        setShowModal(false);
        fetchStaff();
      }
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  const handleToggleStatus = async (staff) => {
    if (staff.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.post('/api/staff.php?action=toggle-status', {
        id: staff.id,
        status: newStatus,
      });
      if (res?.success) {
        setStaffList((prev) =>
          prev.map((s) => (s.id === staff.id ? { ...s, status: newStatus } : s))
        );
      }
    } catch (err) {
      alert('Status change failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Staff Access & Cashiers</h1>
          <p className="text-xs text-slate-500">Manage cashier and manager accounts, PINs, and active credentials</p>
        </div>

        <button
          onClick={openAddModal}
          className="py-2 px-4 rounded-xl bg-[#E99A24] hover:bg-[#CF7C12] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">Loading staff records...</td>
                </tr>
              ) : staffList.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{st.name}</div>
                    <div className="text-[11px] text-slate-400">{st.email}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{st.phone || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      st.role === 'owner'
                        ? 'bg-amber-100 text-amber-900'
                        : st.role === 'manager'
                        ? 'bg-purple-100 text-purple-900'
                        : 'bg-blue-100 text-blue-900'
                    }`}>
                      {st.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(st)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                        st.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {st.status === 'active' ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                      <span className="capitalize">{st.status}</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openEditModal(st)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{editingStaff ? 'Edit Staff User' : 'Create Staff User'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Ghosh"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@saffrongrill.com"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765..."
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {editingStaff ? 'New Password (Leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-3 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-[#E99A24] text-slate-950 font-bold"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
