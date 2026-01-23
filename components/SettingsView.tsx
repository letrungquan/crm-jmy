
import React, { useState } from 'react';
import { Sale, RoleDefinition, Permission } from '../types';
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
    // Role management is strictly for Admins (handled by parent conditional rendering)
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

// ... UserManagementSection remains similar but handled by parent for access control

const UserManagementSection: React.FC<{ sales: Sale[], roles: RoleDefinition[], onRefresh: () => void, isAdmin: boolean }> = ({ sales, roles, onRefresh, isAdmin }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Sale | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [roleId, setRoleId] = useState<string>('sale');
    const [loading, setLoading] = useState(false);

    const openAddModal = () => { setEditingUser(null); setEmail(''); setPassword(''); setName(''); setRoleId('sale'); setIsModalOpen(true); };
    const openEditModal = (user: Sale) => { setEditingUser(user); setEmail(user.id); setPassword(''); setName(user.name); setRoleId(user.role || 'sale'); setIsModalOpen(true); };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try {
            if (editingUser) {
                const { error } = await supabase.from('profiles').update({ name: name, role: roleId }).eq('id', editingUser.id);
                if (error) throw error;
                alert('Cập nhật thông tin thành công!');
            } else {
                if (password.length < 6) throw new Error("Mật khẩu phải từ 6 ký tự trở lên.");
                const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: name } } });
                if (error) throw error;
                if (data.user) { await supabase.from('profiles').update({ name: name, role: roleId }).eq('id', data.user.id); alert('Tạo nhân viên thành công!'); }
            }
            setIsModalOpen(false); onRefresh();
        } catch (err: any) { alert('Lỗi: ' + (err.message || err)); } finally { setLoading(false); }
    };

    const handleDeleteUser = async (user: Sale) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên "${user.name}"?`)) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', user.id);
            if (error) throw error;
            alert(`Đã xóa nhân viên ${user.name}`); onRefresh();
        } catch(err: any) { alert('Lỗi xóa: ' + err.message); } finally { setLoading(false); }
    };

    const getRoleName = (id: string) => roles.find(r => r.id === id)?.name || id;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
                <div><h3 className="text-lg font-bold text-slate-800">Quản lý nhân sự</h3><p className="text-sm text-slate-500">Danh sách tài khoản truy cập hệ thống</p></div>
                {isAdmin && (<button onClick={openAddModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-semibold">+ Thêm nhân viên</button>)}
            </div>
            <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tên</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vai trò</th><th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Hành động</th></tr></thead>
                    <tbody className="bg-white divide-y divide-slate-200">{sales.map((sale) => (<tr key={sale.id} className="hover:bg-slate-50"><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{sale.name}</td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sale.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>{getRoleName(sale.role)}</span></td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">{isAdmin && (<div className="flex justify-end space-x-3"><button onClick={() => openEditModal(sale)} className="text-blue-600 hover:text-blue-900">Sửa</button><button onClick={() => handleDeleteUser(sale)} className="text-red-600 hover:text-red-900">Xóa</button></div>)}</td></tr>))}</tbody>
                </table>
            </div>
            {isModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"><h3 className="text-lg font-bold text-slate-800 mb-4">{editingUser ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</h3><form onSubmit={handleSaveUser} className="space-y-4"><div><label className="block text-sm font-medium text-slate-700">Tên hiển thị</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" /></div>{!editingUser && (<><div><label className="block text-sm font-medium text-slate-700">Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" /></div><div><label className="block text-sm font-medium text-slate-700">Mật khẩu</label><input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" /></div></>)}<div><label className="block text-sm font-medium text-slate-700">Vai trò</label><select value={roleId} onChange={e => setRoleId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md">{roles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}</select></div><div className="flex justify-end space-x-3 mt-6"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Hủy</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{loading ? 'Đang xử lý...' : (editingUser ? 'Cập nhật' : 'Tạo')}</button></div></form></div></div>)}
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
                  <h3 className="text-yellow-800 font-bold mb-2">9. Tạo Bảng Cấu Hình</h3>
                  <div className="relative mb-3">
                     <textarea readOnly value={props.useLocalOnly ? 'Offline Mode' : `CREATE TABLE IF NOT EXISTS app_settings (key text PRIMARY KEY, value jsonb, updated_at timestamptz DEFAULT now());`} className="w-full h-24 text-[10px] font-mono p-2 border border-yellow-200 rounded bg-white focus:outline-none" />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsView;
