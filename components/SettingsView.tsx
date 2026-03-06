
import React, { useState, useEffect } from 'react';
import { Sale, RoleDefinition, Permission, AccessLog } from '../types';
import { supabase } from '../lib/supabaseClient';

interface SettingsViewProps {
  sources: string[];
  relationships: string[];
  customerGroups: string[];
  roles?: RoleDefinition[];
  onUpdateSources: (newSources: string[]) => void;
  onUpdateRelationships: (newRelationships: string[]) => void;
  onUpdateCustomerGroups: (newGroups: string[]) => void;
  onUpdateRoles?: (newRoles: RoleDefinition[]) => void;
  useLocalOnly?: boolean;
  sales?: Sale[];
  onRefresh?: () => void;
  isAdmin?: boolean;
  canEdit?: boolean;
}

const ConfigSection: React.FC<{
  title: string;
  description: string;
  items: string[];
  onUpdate: (items: string[]) => void;
  canEdit?: boolean;
}> = ({ title, description, items, onUpdate, canEdit = true }) => {
  const [newItem, setNewItem] = useState('');
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      
      {canEdit && (
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Nhập tên mới..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => { if(newItem.trim()) { onUpdate([...items, newItem.trim()]); setNewItem(''); } }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold"
            >
              Thêm
            </button>
          </div>
      )}

      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span key={index} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-sm font-medium text-slate-700 flex items-center group hover:bg-white hover:border-blue-300 transition-colors">
            {item}
            {canEdit && (
                <button 
                    onClick={() => { const n = [...items]; n.splice(index, 1); onUpdate(n); }} 
                    className="ml-2 text-slate-400 hover:text-red-500 focus:outline-none"
                    title="Xóa"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

const RoleManagementSection: React.FC<{ roles: RoleDefinition[], onUpdate: (roles: RoleDefinition[]) => void }> = ({ roles, onUpdate }) => {
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    const permissionGroups = [
        { label: 'Cơ hội (Leads)', prefix: 'lead', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Khách hàng (Customers)', prefix: 'customer', actions: ['view', 'create', 'edit', 'delete'] },
        { label: 'Đơn hàng (Orders)', prefix: 'order', actions: ['view', 'create', 'edit', 'delete'] },
        { label: 'Hệ thống', prefix: 'system', actions: ['settings.access', 'user.manage'] },
    ];

    const handleAddRole = () => {
        if (!newRoleName.trim()) return;
        const newRole: RoleDefinition = {
            id: `role_${Date.now()}`,
            name: newRoleName,
            permissions: ['lead.view', 'customer.view', 'order.view'], // Default read-only
            isSystem: false
        };
        onUpdate([...roles, newRole]);
        setNewRoleName('');
        setIsCreating(false);
        setSelectedRoleId(newRole.id);
    };

    const handleDeleteRole = (roleId: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa vai trò này? Các nhân viên đang giữ vai trò này sẽ mất quyền truy cập.')) {
            onUpdate(roles.filter(r => r.id !== roleId));
            if (selectedRoleId === roleId) setSelectedRoleId(null);
        }
    };

    const togglePermission = (roleId: string, perm: string) => {
        const roleIndex = roles.findIndex(r => r.id === roleId);
        if (roleIndex === -1) return;
        
        const role = { ...roles[roleIndex] };
        if (role.isSystem && role.id === 'admin') return; 

        const permSet = new Set(role.permissions);
        if (permSet.has(perm as Permission)) {
            permSet.delete(perm as Permission);
        } else {
            permSet.add(perm as Permission);
        }
        
        role.permissions = Array.from(permSet);
        const newRoles = [...roles];
        newRoles[roleIndex] = role;
        onUpdate(newRoles);
    };

    const selectedRole = roles.find(r => r.id === selectedRoleId);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Phân quyền Vai trò</h3>
                    <p className="text-sm text-slate-500">Tạo và quản lý quyền hạn cho từng nhóm nhân viên</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm font-semibold border border-blue-200"
                >
                    + Thêm vai trò
                </button>
            </div>

            {isCreating && (
                <div className="mb-4 flex gap-2 items-center bg-slate-50 p-3 rounded-md">
                    <input 
                        type="text" 
                        value={newRoleName} 
                        onChange={(e) => setNewRoleName(e.target.value)} 
                        className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Tên vai trò (VD: Sale Admin)" 
                    />
                    <button onClick={handleAddRole} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Lưu</button>
                    <button onClick={() => setIsCreating(false)} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-sm rounded hover:bg-slate-50">Hủy</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 border-r border-slate-100 pr-4 space-y-2">
                    {roles.map(role => (
                        <div 
                            key={role.id} 
                            onClick={() => setSelectedRoleId(role.id)}
                            className={`flex justify-between items-center p-3 rounded-md cursor-pointer transition-colors ${selectedRoleId === role.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
                        >
                            <div>
                                <p className={`text-sm font-semibold ${selectedRoleId === role.id ? 'text-blue-700' : 'text-slate-700'}`}>{role.name}</p>
                                {role.isSystem && <span className="text-[10px] text-slate-400 uppercase font-bold">Hệ thống</span>}
                            </div>
                            {!role.isSystem && (
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }} className="text-slate-300 hover:text-red-500 p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="col-span-2">
                    {selectedRole ? (
                        <div>
                            <div className="mb-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                                <h4 className="font-bold text-slate-800">Quyền hạn: {selectedRole.name}</h4>
                                {selectedRole.id === 'admin' && <span className="text-xs text-orange-500 italic">Admin có toàn quyền (không thể sửa)</span>}
                            </div>
                            <div className="space-y-6">
                                {permissionGroups.map(group => (
                                    <div key={group.prefix}>
                                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{group.label}</h5>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {group.actions.map(action => {
                                                const permKey = group.prefix === 'system' ? action : `${group.prefix}.${action}`;
                                                const isChecked = selectedRole.permissions.includes(permKey as Permission);
                                                const isDisabled = selectedRole.id === 'admin';
                                                
                                                let label = action;
                                                if (action === 'view') label = 'Xem';
                                                if (action === 'create') label = 'Thêm mới';
                                                if (action === 'edit') label = 'Chỉnh sửa';
                                                if (action === 'delete') label = 'Xóa';
                                                if (action === 'import') label = 'Import Excel';
                                                if (action === 'settings.access') label = 'Truy cập Cài đặt';
                                                if (action === 'user.manage') label = 'Quản lý User';

                                                return (
                                                    <label key={permKey} className={`flex items-center space-x-2 text-sm p-2 rounded border ${isChecked ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'} ${isDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'}`}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isChecked}
                                                            onChange={() => togglePermission(selectedRole.id, permKey)}
                                                            disabled={isDisabled}
                                                            className="rounded text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className={isChecked ? 'text-green-800 font-medium' : 'text-slate-600'}>{label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 italic">Chọn một vai trò bên trái để chỉnh sửa quyền</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const UserManagementSection: React.FC<{ sales: Sale[], roles: RoleDefinition[], onRefresh: () => void, isAdmin: boolean }> = ({ sales, roles, onRefresh, isAdmin }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Sale | null>(null);
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    
    // Deletion Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Sale | null>(null);
    const [transferToId, setTransferToId] = useState<string>('unassigned');
    
    // Tab state in detail modal
    const [activeTab, setActiveTab] = useState<'info' | 'logs'>('info');

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [roleId, setRoleId] = useState<string>('sale');
    const [loading, setLoading] = useState(false);

    const fetchAccessLogs = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('access_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            setAccessLogs(data || []);
        } catch (error) {
            console.error("Error fetching access logs:", error);
            setAccessLogs([]);
        }
    }

    const openAddModal = () => { 
        setEditingUser(null); 
        setEmail(''); 
        setPassword(''); 
        setName(''); 
        setRoleId('sale'); 
        setActiveTab('info');
        setAccessLogs([]);
        setIsModalOpen(true); 
    };

    const openEditModal = (user: Sale) => { 
        setEditingUser(user); 
        setEmail(''); 
        setPassword(''); 
        setName(user.name); 
        setRoleId(user.role || 'sale'); 
        setActiveTab('info');
        setIsModalOpen(true); 
        fetchAccessLogs(user.id);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try {
            if (editingUser) {
                const { error: profileError } = await supabase.from('profiles').update({ name: name, role: roleId }).eq('id', editingUser.id);
                if (profileError) throw profileError;

                if (password && password.length >= 6) {
                     const { error: authError } = await supabase.auth.updateUser({ password: password });
                     if (authError) {
                         alert("Lưu ý: Không thể đổi mật khẩu người khác từ client. Cần dùng chức năng Reset Password.");
                     }
                }
                alert('Cập nhật thông tin thành công!');
            } else {
                if (password.length < 6) throw new Error("Mật khẩu phải từ 6 ký tự trở lên.");
                const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: name } } });
                
                // Check if Supabase returned a fake/obfuscated user (happens when user exists)
                // Real users usually have 'identities' array populated. Fake ones often don't or have specific traits.
                // But the most reliable way is: if error says "already registered", data.user is null.
                // If success but user exists, data.user is present but ID is existing ID.
                
                if (error) {
                    if (error.message.includes('already registered')) {
                        throw new Error("Email này đã được đăng ký trong hệ thống (nhưng có thể thiếu hồ sơ). Vui lòng sử dụng công cụ SQL bên dưới để xóa user cũ khỏi Auth, sau đó thử lại.");
                    }
                    throw error;
                }

                // If signUp returns a user, but identities is empty, it might be a fake user response (security feature)
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                     throw new Error("Email đã tồn tại. Hệ thống trả về user ảo. Vui lòng xóa user cũ trong Auth bằng công cụ SQL.");
                }
                
                const userId = data.user?.id;
                if (userId) { 
                    const { error: upsertError } = await supabase.from('profiles').upsert({ 
                        id: userId,
                        name: name, 
                        role: roleId 
                    });
                    
                    if (upsertError) {
                        if (upsertError.message.includes('foreign key constraint')) {
                            throw new Error("Lỗi dữ liệu: User ID không khớp. Vui lòng xóa email này khỏi Authentication (dùng SQL bên dưới) và tạo lại.");
                        }
                        throw upsertError;
                    }
                    alert('Tạo nhân viên thành công!'); 
                } else {
                    throw new Error("Không thể tạo user. Vui lòng thử lại.");
                }
            }
            setIsModalOpen(false); onRefresh();
        } catch (err: any) { alert('Lỗi: ' + (err.message || err)); } finally { setLoading(false); }
    };

    const openDeleteConfirmation = (user: Sale) => {
        setUserToDelete(user);
        setTransferToId('unassigned');
        setDeleteModalOpen(true);
    };

    const executeDeleteUser = async () => {
        if (!userToDelete) return;
        
        setLoading(true);
        try {
            const newAssignee = transferToId === 'unassigned' ? null : transferToId;

            // 0. Clean up access logs
            try { await supabase.from('access_logs').delete().eq('user_id', userToDelete.id); } catch (e) { }

            // 1-5. Reassign Data
            await supabase.from('leads').update({ assigned_to: newAssignee }).eq('assigned_to', userToDelete.id);
            await supabase.from('orders').update({ assigned_to: newAssignee }).eq('assigned_to', userToDelete.id);
            await supabase.from('cskh').update({ assigned_to: newAssignee }).eq('assigned_to', userToDelete.id);
            
            const { error: err4 } = await supabase.from('customers').update({ assigned_to: newAssignee }).eq('assigned_to', userToDelete.id);
            if (err4 && !err4.message.includes('column')) throw new Error("Lỗi cập nhật Khách hàng: " + err4.message);

            try { await supabase.from('notes').update({ created_by: null }).eq('created_by', userToDelete.id); } catch (e) { }

            // 6. Delete Profile
            const { error, count } = await supabase.from('profiles').delete({ count: 'exact' }).eq('id', userToDelete.id);
            if (error) throw error;

            if (count === 0) {
                // If profile not found, maybe it was already deleted. Try deleting from Auth anyway.
                console.warn("Profile not found, attempting to delete auth user anyway.");
            }

            // 7. Try Delete from Auth via RPC (To prevent orphan users)
            const { error: rpcError } = await supabase.rpc('delete_user_by_id', { target_user_id: userToDelete.id });
            
            if (rpcError) {
                console.warn("RPC delete failed:", rpcError);
                alert(`Đã xóa hồ sơ nhân viên ${userToDelete.name}. \n\nTUY NHIÊN: Không thể xóa tài khoản đăng nhập (Auth). \nVui lòng chạy lệnh SQL 'delete_user_by_id' hoặc xóa thủ công trong Supabase Dashboard.`); 
            } else {
                alert(`Đã xóa hoàn toàn nhân viên ${userToDelete.name} (Hồ sơ & Tài khoản).`); 
            }

            onRefresh();
            setDeleteModalOpen(false);
        } catch(err: any) { 
            console.error(err);
            alert(err.message || err); 
        } finally { 
            setLoading(false); 
        }
    };

    const getRoleName = (id: string) => roles.find(r => r.id === id)?.name || id;

    const parseUserAgent = (ua: string) => {
        let device = "Unknown";
        if (/mobile/i.test(ua)) device = "Mobile";
        else if (/iPad|Android|Touch/i.test(ua)) device = "Tablet";
        else device = "Desktop";
        return `${device}`;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
                <div><h3 className="text-lg font-bold text-slate-800">Quản lý nhân sự</h3><p className="text-sm text-slate-500">Danh sách tài khoản truy cập hệ thống</p></div>
                {isAdmin && (<button onClick={openAddModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-semibold">+ Thêm nhân viên</button>)}
            </div>
            <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tên</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vai trò</th><th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Hành động</th></tr></thead>
                    <tbody className="bg-white divide-y divide-slate-200">{sales.map((sale) => (<tr key={sale.id} className="hover:bg-slate-50"><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{sale.name}</td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sale.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>{getRoleName(sale.role)}</span></td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">{isAdmin && (<div className="flex justify-end space-x-3"><button onClick={() => openEditModal(sale)} className="text-blue-600 hover:text-blue-900">Chi tiết</button><button onClick={() => openDeleteConfirmation(sale)} className="text-red-600 hover:text-red-900">Xóa</button></div>)}</td></tr>))}</tbody>
                </table>
            </div>
            
            {/* User Detail Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <header className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">{editingUser ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </header>
                        
                        <div className="border-b border-slate-200 px-4">
                            <nav className="flex space-x-4">
                                <button 
                                    onClick={() => setActiveTab('info')}
                                    className={`py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    Thông tin cá nhân
                                </button>
                                {editingUser && (
                                    <button 
                                        onClick={() => setActiveTab('logs')}
                                        className={`py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Lịch sử đăng nhập
                                    </button>
                                )}
                            </nav>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {activeTab === 'info' ? (
                                <form onSubmit={handleSaveUser} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Tên hiển thị</label>
                                        <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    {!editingUser && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Email đăng nhập</label>
                                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">{editingUser ? 'Đổi mật khẩu (Chỉ nhập nếu muốn đổi)' : 'Mật khẩu'}</label>
                                        <input type="password" minLength={6} required={!editingUser} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="••••••" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Vai trò</label>
                                        <select value={roleId} onChange={e => setRoleId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                            {roles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                                        </select>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Hủy</button>
                                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm">{loading ? 'Đang xử lý...' : (editingUser ? 'Cập nhật' : 'Tạo')}</button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-xs text-yellow-800">
                                        <span className="font-bold">Lưu ý:</span> Theo dõi IP và thiết bị lạ để phát hiện việc chia sẻ tài khoản. 
                                    </div>
                                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-medium text-slate-500">Thời gian</th>
                                                    <th className="px-4 py-2 text-left font-medium text-slate-500">IP</th>
                                                    <th className="px-4 py-2 text-left font-medium text-slate-500">Thiết bị</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {accessLogs.length > 0 ? (
                                                    accessLogs.map(log => (
                                                        <tr key={log.id}>
                                                            <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                                                            <td className="px-4 py-2 font-mono text-slate-600">{log.ip}</td>
                                                            <td className="px-4 py-2 text-slate-600 truncate max-w-xs" title={log.user_agent}>{parseUserAgent(log.user_agent)}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">Chưa có dữ liệu đăng nhập.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE USER & TRANSFER MODAL */}
            {deleteModalOpen && userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-red-600 mb-2">Xóa nhân viên: {userToDelete.name}</h3>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4 text-sm text-orange-800">
                            <p className="font-bold mb-1">Cảnh báo:</p>
                            <p>Hành động này sẽ xóa vĩnh viễn tài khoản và quyền truy cập của nhân viên này.</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Chuyển giao dữ liệu cho:</label>
                            <p className="text-xs text-slate-500 mb-2">Lead, Khách hàng, Đơn hàng, CSKH đang phụ trách sẽ được chuyển sang nhân viên này.</p>
                            <select 
                                value={transferToId} 
                                onChange={(e) => setTransferToId(e.target.value)} 
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="unassigned">-- Không gán (Để trống) --</option>
                                {sales.filter(s => s.id !== userToDelete.id).map(sale => (
                                    <option key={sale.id} value={sale.id}>{sale.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button 
                                onClick={() => setDeleteModalOpen(false)}
                                className="px-4 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={executeDeleteUser} 
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium flex items-center"
                            >
                                {loading && (
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                )}
                                {transferToId === 'unassigned' ? 'Xóa & Hủy gán' : 'Xóa & Chuyển giao'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SettingsView: React.FC<SettingsViewProps> = (props) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Cài đặt hệ thống</h2>
      
      {props.roles && props.onUpdateRoles && props.isAdmin && (
          <RoleManagementSection roles={props.roles} onUpdate={props.onUpdateRoles} />
      )}

      {props.sales && props.onRefresh && props.isAdmin && (
          <UserManagementSection 
            sales={props.sales} 
            onRefresh={props.onRefresh} 
            isAdmin={props.isAdmin} 
            roles={props.roles || []}
          />
      )}

      <ConfigSection title="Nguồn khách hàng" description="Nơi khách hàng biết đến spa" items={props.sources} onUpdate={props.onUpdateSources} canEdit={props.canEdit} />
      <ConfigSection title="Mối quan hệ" description="Phân loại trạng thái quan hệ khách hàng" items={props.relationships} onUpdate={props.onUpdateRelationships} canEdit={props.canEdit} />
      <ConfigSection title="Nhóm khách hàng" description="Phân loại khách hàng theo nhóm" items={props.customerGroups} onUpdate={props.onUpdateCustomerGroups} canEdit={props.canEdit} />

      {props.isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-8 border-t pt-8">
               <div className="col-span-2 text-lg font-bold text-slate-700">Công cụ sửa lỗi Database (Dành cho Dev/Admin)</div>
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 md:col-span-2">
                  <h3 className="text-yellow-800 font-bold mb-2">9. Tạo Bảng Cấu Hình & Logs</h3>
                  <div className="relative mb-3">
                     <textarea readOnly value={props.useLocalOnly ? 'Offline Mode' : `
-- Tạo bảng app_settings nếu chưa có
CREATE TABLE IF NOT EXISTS app_settings (key text PRIMARY KEY, value jsonb, updated_at timestamptz DEFAULT now());

-- Tạo bảng access_logs nếu chưa có
CREATE TABLE IF NOT EXISTS access_logs (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users not null,
  ip text,
  user_agent text,
  created_at timestamptz default now()
);

-- Fix RLS for Profile Deletion & Upsert
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
CREATE POLICY "Admins can delete any profile" ON profiles FOR DELETE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 10. (Quan trọng) Hàm xóa User khỏi Auth (Chạy cái này để Admin có thể xóa triệt để)
create or replace function delete_user_by_id(target_user_id uuid)
returns void as $$
begin
  if (select role from public.profiles where id = auth.uid()) = 'admin' then
    delete from auth.users where id = target_user_id;
  else
    raise exception 'Quyền hạn không đủ';
  end if;
end;
$$ language plpgsql security definer;

-- Fix Missing assigned_to column in customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users;

-- Create Re-examination table with RLS Policies
CREATE TABLE IF NOT EXISTS re_examinations (
  id text PRIMARY KEY,
  customer_phone text NOT NULL, -- Keep loose reference to allow flexibility
  customer_name text,
  date date NOT NULL,
  service text,
  doctor_name text,
  assigned_to text, -- Can store UUID string
  note text,
  status text DEFAULT 'pending',
  potential_revenue numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fix missing columns in orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source text;

-- Add potential_revenue column if it doesn't exist
ALTER TABLE re_examinations ADD COLUMN IF NOT EXISTS potential_revenue numeric;

-- Enable RLS
ALTER TABLE re_examinations ENABLE ROW LEVEL SECURITY;

-- Add generic policies (Modify if strict role-based access is needed)
DROP POLICY IF EXISTS "Allow all for authenticated on re_examinations" ON re_examinations;
CREATE POLICY "Allow all for authenticated on re_examinations" ON re_examinations FOR ALL USING (auth.role() = 'authenticated');
`} className="w-full h-40 text-[10px] font-mono p-2 border border-yellow-200 rounded bg-white focus:outline-none" />
                  </div>
                  <p className="text-xs text-yellow-700 italic">Copy lệnh trên và chạy trong SQL Editor của Supabase để khởi tạo bảng và cấp quyền.</p>
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsView;
