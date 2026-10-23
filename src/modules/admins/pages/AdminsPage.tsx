import React, { useState, useEffect, useCallback } from 'react';
import { Users, Shield, ShieldCheck, Trash2, Power, Mail, Phone, UserPlus } from 'lucide-react';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';
import { Modal } from '../../../common/components/Modal';

export function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'admin',
  });

  const { toast } = useToast();

  const fetchAdmins = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient('/admin/admins');
      const data = res?.data || res || {};
      setAdmins(data.admins || []);
    } catch (err: any) {
      toast('error', 'Failed to load admin team', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast('error', 'Please fill in Name, Email and Password');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient('/admin/admins', {
        method: 'POST',
        data: formData,
      });
      toast('success', 'New admin account created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'admin' });
      fetchAdmins();
    } catch (err: any) {
      toast('error', 'Failed to create admin', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: any) => {
    try {
      await apiClient(`/admin/admins/${admin._id}/toggle`, {
        method: 'PUT',
      });
      toast('success', `Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchAdmins();
    } catch (err: any) {
      toast('error', 'Failed to update status', err.message);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteTargetId) return;
    try {
      await apiClient(`/admin/admins/${deleteTargetId}`, {
        method: 'DELETE',
      });
      toast('success', 'Admin account deleted successfully');
      setDeleteTargetId(null);
      fetchAdmins();
    } catch (err: any) {
      toast('error', 'Failed to delete admin', err.message);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <ShieldCheck className="text-woosh-primary" size={26} />
            Administrators & Team
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage admin users, roles, system privileges, and access credentials
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-woosh-primary hover:bg-woosh-primary/90 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2"
        >
          <UserPlus size={16} />
          <span>Add New Admin</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">TEAM DIRECTORY</span>
            <span className="text-xs bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-full">
              {admins.length} Total
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading administrators...</div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-600">No administrators found</p>
            <p className="text-xs text-gray-400 mt-1">Click Add New Admin above to invite team members.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Admin Member</th>
                  <th className="py-3.5 px-5">Email & Phone</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Registered</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-woosh-primary/10 text-woosh-primary font-bold flex items-center justify-center flex-shrink-0">
                          {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{admin.name}</p>
                          <span className="text-xs text-gray-400 font-mono">ID: {admin._id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <Mail size={12} className="text-gray-400" />
                          <span>{admin.email}</span>
                        </div>
                        {admin.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone size={12} className="text-gray-400" />
                            <span>{admin.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        admin.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        <Shield size={12} />
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      {admin.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-xs text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          title={admin.isActive ? 'Deactivate Account' : 'Activate Account'}
                          className={`p-1.5 rounded-lg border text-xs font-medium transition ${
                            admin.isActive
                              ? 'border-gray-200 text-gray-600 hover:bg-amber-50 hover:text-amber-600'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(admin._id)}
                          title="Delete Admin"
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Administrator"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-woosh-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@woosh.com"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-woosh-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-woosh-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-woosh-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Account Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-woosh-primary bg-white"
            >
              <option value="admin">Admin (Operational Access)</option>
              <option value="super_admin">Super Admin (Full Master Privileges)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-woosh-primary hover:bg-woosh-primary/90 text-white font-bold text-sm px-5 py-2 rounded-xl transition shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        title="Confirm Delete Administrator"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this administrator account? They will permanently lose access to the Woosh Admin Command Center.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => setDeleteTargetId(null)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAdmin}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-5 py-2 rounded-xl transition shadow"
            >
              Delete Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
