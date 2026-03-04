
import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Sale, StatusConfig, Lead, CustomerData, CskhItem } from '../types';

interface CustomerDetailViewProps {
  customer: Customer;
  sales: Sale[];
  statuses: StatusConfig[];
  cskhItems: CskhItem[];
  relationships?: string[];
  onClose: () => void;
  onSelectLead: (lead: Lead) => void;
  onUpdateCustomer: (phone: string, data: Partial<CustomerData>) => void;
  onEdit: (customer: Customer) => void;
  onDelete?: (phone: string) => void;
  onAddNote: (leadId: string, noteContent: string) => void;
  currentUser: Sale['id'];
  isAdmin: boolean;
  onAddReExam?: () => void;
}

const InfoField: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-700 text-right truncate max-w-[60%]">
            {(value !== null && value !== undefined && value !== '') ? value : 'Chưa cập nhật'}
        </span>
    </div>
);

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-slate-200 mt-2">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-3 font-semibold text-slate-700 text-left hover:bg-slate-50 px-2 rounded">
                <span>{title}</span>
                <svg className={`w-4 h-4 transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && <div className="pb-2 px-2">{children}</div>}
        </div>
    );
};

const KpiCard: React.FC<{ label: string; value: React.ReactNode; subValue?: string; color?: string }> = ({ label, value, subValue, color = "green" }) => (
    <div className="text-center md:text-left p-2 rounded hover:bg-slate-50 transition-colors">
        <p className={`text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1`}>{label}</p>
        <p className={`text-xl font-bold text-${color}-600 mt-1`}>{value}</p>
        {subValue && <p className={`text-[10px] text-slate-400 mt-0.5 font-bold`}>{subValue}</p>}
    </div>
);

const DEFAULT_RELATIONSHIPS = ['Mới', 'Tiềm năng', 'Quan tâm', 'Chốt đơn', 'VIP', 'Hủy'];

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ customer, sales, statuses, cskhItems, relationships = DEFAULT_RELATIONSHIPS, onClose, onSelectLead, onUpdateCustomer, onEdit, onDelete, onAddNote, currentUser, isAdmin, onAddReExam }) => {
    const [activeTab, setActiveTab] = useState('trao_doi');
    const [newNote, setNewNote] = useState('');
    const [selectedLeadForNote, setSelectedLeadForNote] = useState<string>('');
    const [relationship, setRelationship] = useState(customer.relationshipStatus || relationships[0]);
    
    // State cho tab Phản hồi
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackText, setFeedbackText] = useState('');

    useEffect(() => {
        if (customer.leads.length > 0) {
            setSelectedLeadForNote(customer.leads[0].id);
        }
    }, [customer.leads]);

    useEffect(() => {
        setRelationship(customer.relationshipStatus || relationships[0]);
    }, [customer.relationshipStatus]);

    const handleRelationshipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setRelationship(newStatus);
        onUpdateCustomer(customer.phone, { relationshipStatus: newStatus });
    };

    const allNotes = useMemo(() => 
        customer.leads.flatMap(lead => 
            lead.notes.map(note => ({ ...note, leadService: lead.service, leadId: lead.id }))
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), 
    [customer.leads]);

    // Aggregate diverse timeline items
    const timelineItems = useMemo(() => {
        const notes = allNotes.map(note => ({
            type: 'note' as const,
            id: note.id,
            data: note,
            date: note.createdAt
        }));

        const cskhEvents = cskhItems.map(item => ({
            type: 'cskh' as const,
            id: item.id,
            data: item,
            date: item.createdAt
        }));

        return [...notes, ...cskhEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allNotes, cskhItems]);

    const feedbackList = useMemo(() => 
        allNotes.filter(n => n.content.includes('[PHẢN HỒI]')),
    [allNotes]);

    const interactionCount = timelineItems.length;

    const lastContactDays = useMemo(() => {
        if (timelineItems.length === 0) return null;
        const lastDate = new Date(timelineItems[0].date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }, [timelineItems]);
    
    const orders = customer.orders || [];
    const totalRevenue = useMemo(() => 
        orders.reduce((sum, order) => sum + (order.revenue || 0), 0),
    [orders]);

    const appointments = useMemo(() => {
        const apps = customer.leads
            .filter(l => l.appointmentDate)
            .map(l => ({
                ...l,
                dateObj: new Date(l.appointmentDate!)
            }))
            .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
        
        const now = new Date();
        return {
            upcoming: apps.filter(a => a.dateObj >= now).reverse(),
            past: apps.filter(a => a.dateObj < now)
        };
    }, [customer.leads]);

    const assignedSale = sales.find(s => s.id === customer.assignedTo);
    
    const latestPurchaseDate = useMemo(() => {
        if (orders.length === 0) return '---';
        const latest = orders.reduce((prev, current) => (new Date(prev.createdAt) > new Date(current.createdAt)) ? prev : current);
        return new Date(latest.createdAt).toLocaleDateString('vi-VN');
    }, [orders]);

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

    const handleAddFeedback = () => {
        if (!feedbackText.trim() || !selectedLeadForNote) {
             alert("Vui lòng nhập nội dung phản hồi và chọn cơ hội liên quan.");
             return;
        }
        const content = `[PHẢN HỒI] [${feedbackRating} Sao] ${feedbackText}`;
        onAddNote(selectedLeadForNote, content);
        setFeedbackText('');
        setFeedbackRating(5);
    };

    const tabs = [
        { id: 'trao_doi', label: `Trao đổi (${timelineItems.length})` },
        { id: 'co_hoi', label: `Cơ hội (${customer.leads.length})` },
        { id: 'giao_dich', label: `Giao dịch (${orders.length})` },
        { id: 'lich_hen', label: 'Lịch hẹn' },
        { id: 'phan_hoi', label: `Phản hồi (${feedbackList.length})` },
        { id: 'automation', label: 'Automation' },
    ];
    
    const getAvatarForSale = (saleId?: string) => {
        const sale = sales.find(s => s.id === saleId);
        const name = sale ? sale.name : 'System';
        return (
             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0 border border-slate-200">
                {name.charAt(0)}
            </div>
        )
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN');
    };

    const mapGender = (g?: string) => {
        if (!g) return 'Chưa cập nhật';
        const lower = g.toLowerCase();
        if (lower === 'female' || lower === 'nu' || lower === 'nữ') return 'Nữ';
        if (lower === 'male' || lower === 'nam') return 'Nam';
        if (lower === 'other' || lower === 'khac' || lower === 'khác') return 'Khác';
        return g;
    }

    const formatDateOfBirth = (dob?: string) => {
        if (!dob) return 'Chưa cập nhật';
        try {
            const date = new Date(dob);
            if (isNaN(date.getTime())) return dob;
            return date.toLocaleDateString('vi-VN');
        } catch (e) {
            return dob;
        }
    }

    const calculateAge = (dob?: string) => {
        if (!dob) return 'Chưa cập nhật';
        try {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return isNaN(age) ? 'Chưa cập nhật' : age;
        } catch { return 'Chưa cập nhật'; }
    }

    return (
        <div className="p-0 h-full flex flex-col bg-white">
            {/* Header Sticky */}
            <header className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 border-2 border-blue-200">
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center">
                                <h2 className="text-xl font-bold text-slate-800">
                                    {customer.name.toUpperCase()}
                                </h2>
                                <div className="flex ml-3 space-x-1">
                                    <button onClick={() => onEdit(customer)} className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-100 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                    </button>
                                    {onDelete && (
                                        <button onClick={() => onDelete(customer.phone)} className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center text-slate-500 text-sm mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                {customer.phone}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {onAddReExam && (
                            <button onClick={onAddReExam} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm font-bold flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Hẹn tái khám
                            </button>
                        )}
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 md:grid-cols-5 gap-4 divide-x divide-slate-100 shadow-sm">
                    <div className="col-span-2 md:col-span-1 pr-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Mối quan hệ</p>
                        <select 
                            value={relationship} 
                            onChange={handleRelationshipChange} 
                            className={`w-full text-sm font-bold bg-transparent focus:outline-none cursor-pointer ${relationship === 'Chốt đơn' ? 'text-green-600' : 'text-slate-700'}`}
                        >
                            {relationships.map(rel => (
                                <option key={rel} value={rel}>{rel}</option>
                            ))}
                        </select>
                    </div>
                     <div className="col-span-2 md:col-span-1 px-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Sale Phụ Trách</p>
                        <div className="flex items-center space-x-2">
                             {getAvatarForSale(assignedSale?.id)}
                             <div className="truncate">
                                <p className="text-sm font-bold text-slate-800 truncate">{assignedSale?.name || 'Chưa gán'}</p>
                             </div>
                        </div>
                    </div>
                    <div className="px-4">
                        <KpiCard label="Liên hệ cuối" value={lastContactDays !== null ? `${lastContactDays}` : '-'} subValue="" color="slate"/>
                    </div>
                    <div className="px-4">
                        <KpiCard label="Tương tác" value={interactionCount} color="blue"/>
                    </div>
                    <div className="px-4">
                         <KpiCard label="Tổng giá trị" value={new Intl.NumberFormat('vi-VN').format(totalRevenue)} subValue="VND" color="green"/>
                    </div>
                </div>
            </header>
            
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Thông tin */}
                <aside className="w-80 flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white hidden lg:block">
                    <div className="p-4">
                         {/* Profile Completeness UI */}
                         <div className="mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hồ sơ khách hàng</p>
                                    <p className="text-lg font-bold text-slate-700">{customer.profileCompleteness || 0}%</p>
                                </div>
                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${!customer.profileCompleteness || customer.profileCompleteness < 50 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                    {!customer.profileCompleteness || customer.profileCompleteness < 50 ? 'Cần bổ sung' : 'Hoàn thiện'}
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 relative z-10">
                                <div className={`h-1.5 rounded-full transition-all duration-500 ${!customer.profileCompleteness || customer.profileCompleteness < 50 ? 'bg-orange-400' : 'bg-green-500'}`} style={{width: `${customer.profileCompleteness || 0}%`}}></div>
                            </div>
                         </div>

                        {/* Key Highlights UI */}
                         <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giới tính</span>
                                 <span className="text-sm font-bold text-slate-800">{mapGender(customer.gender)}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tuổi</span>
                                 <span className="text-sm font-bold text-slate-800">{calculateAge(customer.dateOfBirth)}</span>
                            </div>
                             <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between px-4">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nghề nghiệp</span>
                                 <span className="text-sm font-bold text-blue-600 truncate max-w-[120px]">{customer.occupation || 'Chưa cập nhật'}</span>
                            </div>
                        </div>

                         <CollapsibleSection title="Thông tin cá nhân" defaultOpen={true}>
                           <div className="space-y-1 mt-1">
                                <InfoField label="Nguồn" value={customer.source} />
                                <InfoField label="Email" value={customer.email} />
                                <InfoField label="Ngày sinh" value={formatDateOfBirth(customer.dateOfBirth)} />
                                <InfoField label="Nhóm khách" value={customer.customerGroup} />
                           </div>
                       </CollapsibleSection>

                       <CollapsibleSection title="Thông tin liên hệ" defaultOpen={true}>
                           <div className="space-y-1 mt-1">
                                <InfoField label="Điện thoại" value={customer.phone} />
                                <InfoField label="Địa chỉ" value={customer.address} />
                                <InfoField label="Tỉnh/Thành" value={customer.location} />
                           </div>
                       </CollapsibleSection>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                    <div className="bg-white border-b border-slate-200 px-4">
                        <nav className="flex space-x-6 -mb-px overflow-x-auto no-scrollbar">
                            {tabs.map(tab => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setActiveTab(tab.id)} 
                                    className={`py-4 px-1 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700 border-transparent hover:border-slate-300'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {activeTab === 'trao_doi' && (
                            <div className="max-w-3xl mx-auto">
                                <div className="bg-white border border-slate-200 rounded-lg shadow-sm mb-6 overflow-hidden">
                                     <textarea 
                                        className="w-full p-4 min-h-[100px] focus:outline-none text-slate-700 placeholder-slate-400 resize-none" 
                                        placeholder="Nhập nội dung trao đổi, ghi chú..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                     ></textarea>
                                    <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center flex-wrap gap-3">
                                        {customer.leads.length > 0 && (
                                            <div className="flex items-center text-sm">
                                                <span className="text-slate-500 mr-2">Gắn vào cơ hội:</span>
                                                <select value={selectedLeadForNote} onChange={(e) => setSelectedLeadForNote(e.target.value)} className="bg-white border border-slate-300 rounded text-slate-700 text-sm py-1 pl-2 pr-6">
                                                    {customer.leads.map(lead => (
                                                        <option key={lead.id} value={lead.id}>{lead.service || `Cơ hội ${new Date(lead.createdAt).toLocaleDateString()}`}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <button onClick={handleAddNote} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-slate-300" disabled={!newNote.trim()}>Gửi</button>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {timelineItems.map((item, idx) => {
                                        if (item.type === 'note') {
                                            const note = item.data;
                                            const creator = sales.find(s => s.id === note.createdBy);
                                            return (
                                                <div key={`note-${item.id}-${idx}`} className="flex items-start space-x-3">
                                                    {getAvatarForSale(note.createdBy)}
                                                    <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                        <div className="flex justify-between items-center text-xs mb-1">
                                                            <span className="font-bold text-slate-800">{creator?.name || 'Hệ thống'}</span>
                                                            <span className="text-slate-400">{new Date(note.createdAt).toLocaleString('vi-VN')}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600">{note.content}</p>
                                                        {note.leadService && <p className="text-[10px] text-blue-500 font-bold mt-2 truncate">Cơ hội: {note.leadService}</p>}
                                                    </div>
                                                </div>
                                            );
                                        } else if (item.type === 'cskh') {
                                            const cskh = item.data;
                                            const creator = sales.find(s => s.id === cskh.assignedTo);
                                            return (
                                                <div key={`cskh-${item.id}-${idx}`} className="flex items-start space-x-3 opacity-90">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 flex-shrink-0 border border-purple-200">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 bg-purple-50 p-3 rounded-lg border border-purple-200 shadow-sm">
                                                        <div className="flex justify-between items-center text-xs mb-1">
                                                            <span className="font-bold text-purple-800">Hoạt động CSKH</span>
                                                            <span className="text-purple-600">{new Date(cskh.createdAt).toLocaleString('vi-VN')}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-700">
                                                            Tạo phiếu CSKH cho dịch vụ: <strong>{cskh.service}</strong>
                                                        </p>
                                                        <div className="mt-2 flex items-center justify-between">
                                                            <span className="text-xs text-slate-500">Phụ trách: {creator?.name || 'Chưa gán'}</span>
                                                            <span className="px-2 py-0.5 bg-white rounded border border-purple-100 text-[10px] text-purple-600 font-bold uppercase">{cskh.status.replace('cskh_', '')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                    {timelineItems.length === 0 && (
                                        <p className="text-center text-slate-500 py-10">Chưa có lịch sử trao đổi hay CSKH.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'co_hoi' && (
                             <div className="max-w-3xl mx-auto space-y-3">
                                {customer.leads.map(lead => {
                                    const status = statuses.find(s => s.id === lead.status);
                                    return(
                                    <div key={lead.id} onClick={() => onSelectLead(lead)} className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-500 cursor-pointer shadow-sm transition-colors">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-slate-800">{lead.service}</p>
                                            {status && <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${status.color.bg} ${status.color.text} border ${status.color.border}`}>{status.name}</span>}
                                        </div>
                                        <p className="text-sm text-green-600 font-bold mt-1">{lead.potentialRevenue ? formatCurrency(lead.potentialRevenue) : 'Chưa có giá trị'}</p>
                                        <p className="text-[10px] text-slate-400 mt-2">Ngày tạo: {new Date(lead.createdAt).toLocaleString('vi-VN')}</p>
                                    </div>
                                )})}
                                {customer.leads.length === 0 && <p className="text-center text-slate-500 py-10">Chưa có cơ hội nào.</p>}
                             </div>
                        )}

                        {activeTab === 'giao_dich' && (
                             <div className="max-w-5xl mx-auto">
                                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                        <span className="font-bold text-slate-700">Lịch sử đơn hàng</span>
                                        <span className="text-sm font-bold text-green-600">Tổng: {formatCurrency(totalRevenue)}</span>
                                    </div>
                                    {orders.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="text-[10px] text-slate-400 uppercase bg-white border-b border-slate-100 font-bold">
                                                    <tr>
                                                        <th className="px-6 py-4">Mã</th>
                                                        <th className="px-6 py-4">Dịch vụ</th>
                                                        <th className="px-6 py-4">Ngày hoàn thành</th>
                                                        <th className="px-6 py-4">Doanh thu</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {orders.map((order) => {
                                                         return (
                                                        <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="px-6 py-4 text-slate-400 font-medium">#{order.externalId || order.id.slice(0, 8)}</td>
                                                            <td className="px-6 py-4 font-semibold text-slate-700 whitespace-pre-wrap max-w-xs">{order.service}</td>
                                                            <td className="px-6 py-4 text-slate-600">
                                                                <div className="flex flex-col">
                                                                    <span>{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    <span className="text-slate-400 text-[10px]">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(order.revenue)}</td>
                                                        </tr>
                                                    )})}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-10 text-center text-slate-500 italic">
                                            Khách hàng chưa có giao dịch nào.
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}

                        {activeTab === 'lich_hen' && (
                            <div className="max-w-3xl mx-auto space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-700 mb-3 flex items-center text-sm">
                                        Sắp diễn ra ({appointments.upcoming.length})
                                    </h3>
                                    {appointments.upcoming.length > 0 ? (
                                        <div className="space-y-2">
                                            {appointments.upcoming.map(app => (
                                                <div key={app.id} onClick={() => onSelectLead(app)} className="bg-white border-l-4 border-green-500 rounded shadow-sm p-3 cursor-pointer">
                                                    <p className="font-bold text-slate-800">{app.service}</p>
                                                    <p className="text-xs text-green-600 font-bold mt-1">{formatDate(app.appointmentDate!)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Không có lịch hẹn sắp tới.</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-700 mb-3 flex items-center text-sm">
                                        Lịch sử ({appointments.past.length})
                                    </h3>
                                    {appointments.past.map(app => (
                                        <div key={app.id} onClick={() => onSelectLead(app)} className="bg-slate-100 p-2 rounded mb-2 cursor-pointer text-xs flex justify-between">
                                            <span className="text-slate-700">{app.service}</span>
                                            <span className="text-slate-500">{formatDate(app.appointmentDate!)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'phan_hoi' && (
                             <div className="max-w-3xl mx-auto">
                                <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm">
                                    <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">Ghi nhận phản hồi</h3>
                                    <div className="flex space-x-2 mb-4">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} onClick={() => setFeedbackRating(star)} className="focus:outline-none">
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${star <= feedbackRating ? 'text-yellow-400' : 'text-slate-200'}`} viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                    <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} className="w-full p-3 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-sm mb-4" rows={3} placeholder="Nội dung phản hồi..."></textarea>
                                    <div className="flex justify-between items-center">
                                         {customer.leads.length > 0 && (
                                            <select value={selectedLeadForNote} onChange={(e) => setSelectedLeadForNote(e.target.value)} className="bg-white border border-slate-300 rounded text-xs p-1.5 max-w-[200px]">
                                                {customer.leads.map(lead => (
                                                    <option key={lead.id} value={lead.id}>{lead.service}</option>
                                                ))}
                                            </select>
                                        )}
                                        <button onClick={handleAddFeedback} className="px-4 py-2 bg-blue-600 text-white font-bold rounded text-xs disabled:opacity-50" disabled={!feedbackText.trim()}>Lưu</button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {feedbackList.map(note => {
                                        const parts = note.content.match(/\[(\d+) Sao\] (.*)/);
                                        const rating = parts ? parseInt(parts[1]) : 5;
                                        const content = parts ? parts[2] : note.content.replace('[PHẢN HỒI]', '');
                                        return (
                                            <div key={note.id} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(rating)].map((_, i) => (
                                                            <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">{new Date(note.createdAt).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 italic">"{content}"</p>
                                            </div>
                                        )
                                    })}
                                </div>
                             </div>
                        )}

                        {activeTab === 'automation' && (
                             <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-10 opacity-50">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                <p className="text-slate-500 font-bold">Tính năng tự động hóa sắp ra mắt</p>
                             </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomerDetailView;
