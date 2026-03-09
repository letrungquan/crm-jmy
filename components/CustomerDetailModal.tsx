import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Sale, StatusConfig, Lead } from '../types';
import { usePermissions } from '../contexts/PermissionContext';

interface CustomerDetailViewProps {
  customer: Customer;
  sales: Sale[];
  statuses: StatusConfig[];
  onClose: () => void;
  onSelectLead: (lead: Lead) => void;
  onUpdateCustomer: (phone: string, data: Partial<Customer>) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (phone: string) => void;
  onAddNote: (leadId: string, noteContent: string) => void;
  currentUser: Sale['id'];
}

const InfoField: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="flex justify-between text-sm py-1.5">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-700 text-right truncate">{value || '(Chưa có dữ liệu)'}</span>
    </div>
);

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-slate-200">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-3 font-semibold text-slate-700 text-left">
                <span>{title}</span>
                <svg className={`w-4 h-4 transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && <div className="pb-2 px-1">{children}</div>}
        </div>
    );
};

const KpiCard: React.FC<{ label: string; value: React.ReactNode; subValue?: string }> = ({ label, value, subValue }) => (
    <div className="text-center md:text-left">
        <p className="text-xs text-green-800 font-semibold">{label}</p>
        <p className="text-xl font-bold text-green-900">{value}</p>
        {subValue && <p className="text-xs text-green-700">{subValue}</p>}
    </div>
);

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ customer, sales, statuses, onClose, onSelectLead, onUpdateCustomer, onEdit, onDelete, onAddNote, currentUser }) => {
    const { canDelete, canEdit } = usePermissions();
    const [activeTab, setActiveTab] = useState('trao_doi');
    const [newNote, setNewNote] = useState('');
    const [selectedLeadForNote, setSelectedLeadForNote] = useState<string>('');

    useEffect(() => {
        if (customer.leads.length > 0) {
            setSelectedLeadForNote(customer.leads[0].id);
        }
    }, [customer.leads]);

    const allNotes = useMemo(() => 
        customer.leads.flatMap(lead => 
            lead.notes.map(note => ({ ...note, leadService: lead.service, leadId: lead.id }))
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), 
    [customer.leads]);

    const interactionCount = allNotes.length;

    const lastContactDays = useMemo(() => {
        if (allNotes.length === 0) return null;
        const lastDate = new Date(allNotes[0].createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, [allNotes]);
    
    const totalRevenue = useMemo(() => 
        customer.leads
            .filter(l => ['completed'].includes(l.status))
            .reduce((sum, l) => sum + (l.potentialRevenue || 0), 0),
    [customer.leads]);

    const assignedSale = sales.find(s => s.id === customer.assignedTo);
    
    const latestPurchaseDate = useMemo(() => {
        const completedLeads = customer.leads.filter(l => l.status === 'completed' && l.appointmentDate);
        if (completedLeads.length === 0) return '(Chưa có dữ liệu)';
        
        const latestDate = completedLeads.reduce((latest, current) => {
            return new Date(current.appointmentDate!) > new Date(latest.appointmentDate!) ? current : latest;
        }).appointmentDate;

        return new Date(latestDate!).toLocaleDateString('vi-VN');
    }, [customer.leads]);

    const handleAddNote = () => {
        if (!newNote.trim() || !selectedLeadForNote) {
            if (customer.leads.length === 0) {
                alert("Khách hàng này chưa có cơ hội nào. Vui lòng tạo cơ hội trước khi thêm ghi chú.");
            } else {
                alert("Vui lòng viết ghi chú và chọn một cơ hội.");
            }
            return;
        }
        onAddNote(selectedLeadForNote, newNote);
        setNewNote('');
    };

    const tabs = [
        { id: 'trao_doi', label: 'Trao đổi' },
        { id: 'phan_hoi', label: 'KH phản hồi' },
        { id: 'giao_dich', label: 'Giao dịch' },
        { id: 'lich_hen', label: 'Lịch hẹn' },
        { id: 'co_hoi', label: 'Cơ hội' },
        { id: 'automation', label: 'Automation' },
        { id: 'gioi_thieu', label: 'Giới thiệu' },
    ];
    
    const getAvatarForSale = (saleId?: string) => {
        const sale = sales.find(s => s.id === saleId);
        const name = sale ? sale.name : 'System';
        return (
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                {name.charAt(0)}
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 h-full flex flex-col bg-white">
            <header className="pb-4 border-b border-slate-200">
                <div className="text-sm text-slate-500 mb-2">
                    <span className="cursor-pointer hover:underline" onClick={onClose}>Quản lý khách hàng</span>
                    <span className="mx-2">\</span>
                    <span className="font-semibold text-slate-700">Chi tiết khách hàng</span>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-600">
                        {customer.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                            ĐL. {customer.name.toUpperCase()} - {customer.location}
                            {canEdit('customers') && (
                                <button onClick={() => onEdit(customer)} className="ml-3 text-slate-400 hover:text-slate-600 p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg></button>
                            )}
                            {canDelete('customers') && (
                                <button onClick={() => onDelete(customer.phone)} className="ml-1 text-slate-400 hover:text-red-600 p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            )}
                        </h2>
                        <p className="text-slate-500">{customer.phone}</p>
                    </div>
                </div>
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 grid grid-cols-2 md:grid-cols-5 gap-y-4 gap-x-2">
                    <div className="col-span-2 md:col-span-1">
                        <p className="text-xs text-green-800 font-semibold mb-1">Mối quan hệ</p>
                        <select defaultValue="chot_don" className="w-full text-sm font-bold bg-transparent text-green-900 focus:outline-none -ml-1">
                            <option value="chot_don">Chốt đơn</option>
                            <option value="tiem_nang">Tiềm năng</option>
                        </select>
                    </div>
                     <div className="col-span-2 md:col-span-1">
                        <p className="text-xs text-green-800 font-semibold mb-1">Người phụ trách</p>
                        <div className="flex items-center space-x-2">
                             {getAvatarForSale(assignedSale?.id)}
                             <div>
                                <p className="text-sm font-bold text-green-900">{assignedSale?.name || 'Chưa gán'}</p>
                                <p className="text-xs text-green-700">Kinh doanh</p>
                             </div>
                        </div>
                    </div>
                    <KpiCard label="Liên hệ lần cuối" value={lastContactDays ? `${lastContactDays}` : 'N/A'} subValue="ngày trước"/>
                    <KpiCard label="Tương tác" value={interactionCount}/>
                    <KpiCard label="Giá trị đơn hàng" value={new Intl.NumberFormat('vi-VN').format(totalRevenue)}/>
                </div>
            </header>
            
            <div className="flex-1 flex mt-4 gap-6 overflow-hidden">
                <aside className="w-80 flex-shrink-0 overflow-y-auto pr-2">
                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-bold text-slate-800 mb-2 flex justify-between items-center">
                          <span>Thông tin khách hàng</span>
                          {canEdit('customers') && (
                              <button onClick={() => onEdit(customer)} className="text-sm font-semibold text-blue-600 hover:underline">Hành động</button>
                          )}
                        </h3>
                        <div className="flex items-center space-x-3 mb-4">
                            <span className="text-yellow-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></span>
                            <div>
                                <p className="font-bold text-slate-800">{customer.name}</p>
                                <p className="text-sm text-slate-500">{customer.phone}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <InfoField label="Nguồn" value={customer.source} />
                            <InfoField label="Người tạo" value={customer.creator} />
                            <InfoField label="Ngày tạo" value={customer.profileCreatedAt ? new Date(customer.profileCreatedAt).toLocaleString('vi-VN') : ''} />
                            <InfoField label="Đã mua" value={`${customer.leads.filter(l => l.status === 'completed').length} lần`} />
                            <InfoField label="Lần mua hàng gần nhất" value={latestPurchaseDate} />
                        </div>
                        <div className="mt-4">
                            <label className="text-sm font-medium text-slate-500">Hoàn thiện hồ sơ</label>
                            <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                                <div className="bg-blue-600 h-2 rounded-full" style={{width: `${customer.profileCompleteness || 0}%`}}></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                       <CollapsibleSection title="Người liên quan"><div className="text-sm text-slate-400 p-2">Chưa có dữ liệu</div></CollapsibleSection>
                       <CollapsibleSection title="Thông tin chính">
                           <div className="space-y-1">
                                <InfoField label="Tên khách hàng" value={`ĐL. ${customer.name.toUpperCase()} - ${customer.location}`} />
                                <InfoField label="Email" value={customer.email} />
                                <InfoField label="Điện thoại" value={customer.phone} />
                                <InfoField label="Địa chỉ" value={customer.address} />
                                <InfoField label="Nhóm khách hàng" value={customer.customerGroup} />
                           </div>
                       </CollapsibleSection>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                    <div className="border-b border-slate-200 px-4">
                        <nav className="flex space-x-4 -mb-px overflow-x-auto">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-1 text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'trao_doi' && (
                            <div className="max-w-3xl mx-auto">
                                <div className="bg-white border rounded-lg p-2">
                                     <textarea 
                                        className="p-2 min-h-[80px] w-full focus:outline-none" 
                                        placeholder="Thêm trao đổi..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                     ></textarea>
                                    <div className="flex justify-between items-center pt-2 mt-2 border-t flex-wrap gap-2">
                                        {customer.leads.length > 0 && (
                                            <div className="flex items-center text-sm">
                                                <span className="text-slate-500 mr-2">Lưu vào cơ hội:</span>
                                                <select value={selectedLeadForNote} onChange={(e) => setSelectedLeadForNote(e.target.value)} className="bg-white border-slate-200 rounded-md p-1 focus:ring-blue-500 focus:border-blue-500 text-sm">
                                                    {customer.leads.map(lead => (
                                                        <option key={lead.id} value={lead.id}>{lead.service || `Cơ hội ngày ${new Date(lead.createdAt).toLocaleDateString()}`}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <button onClick={handleAddNote} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300" disabled={!newNote.trim()}>Gửi</button>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 mt-6">
                                    {allNotes.map(note => {
                                        const creator = sales.find(s => s.id === note.createdBy);
                                        return (
                                            <div key={note.id} className="flex items-start space-x-3">
                                                {getAvatarForSale(note.createdBy)}
                                                <div className="flex-1 bg-white p-3 rounded-lg border">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="font-semibold text-slate-800">{creator?.name || 'Hệ thống'}</span>
                                                        <span className="text-slate-400">{new Date(note.createdAt).toLocaleString('vi-VN')}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1">{note.content}</p>
                                                     <p className="text-xs text-blue-500 font-medium truncate mt-2 cursor-pointer hover:underline" title={note.leadService} onClick={() => onSelectLead(customer.leads.find(l => l.id === note.leadId)!)}>Trong cơ hội: {note.leadService}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {allNotes.length === 0 && (
                                        <p className="text-center text-slate-500 py-6">Chưa có tương tác nào.</p>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'co_hoi' && (
                             <div className="max-w-3xl mx-auto space-y-3">
                                {customer.leads.map(lead => {
                                    const status = statuses.find(s => s.id === lead.status);
                                    return(
                                    <div key={lead.id} onClick={() => onSelectLead(lead)} className="bg-white p-4 rounded-lg border hover:border-blue-500 cursor-pointer">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-slate-800">{lead.service}</p>
                                            {status && <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${status.color.bg} ${status.color.text}`}>{status.name}</span>}
                                        </div>
                                        <p className="text-sm text-green-600 font-bold mt-1">{lead.potentialRevenue ? new Intl.NumberFormat('vi-VN').format(lead.potentialRevenue) + ' VND' : 'Chưa có giá trị'}</p>
                                        <p className="text-xs text-slate-400 mt-2">Tạo ngày: {new Date(lead.createdAt).toLocaleString('vi-VN')}</p>
                                    </div>
                                )})}
                             </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomerDetailView;