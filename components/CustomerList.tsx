
import React, { useState, useMemo } from 'react';
import { Customer, Sale } from '../types';
import { usePermissions } from '../contexts/PermissionContext';

interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: () => void;
  onDeleteCustomer?: (phone: string) => void;
  onBulkDelete?: (phones: string[]) => void;
  onMergeCustomers?: (phones: string[]) => void;
  sources?: string[];
  relationships?: string[];
  customerGroups?: string[];
  sales?: Sale[];
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number') return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

type SortKey = 'name' | 'revenue' | 'leads' | 'orders' | 'lastContact';

const CustomerList: React.FC<CustomerListProps> = ({ 
    customers, 
    onSelectCustomer, 
    onAddCustomer, 
    onDeleteCustomer, 
    onBulkDelete,
    onMergeCustomers,
    sources = [],
    relationships = [],
    customerGroups = [],
    sales = []
}) => {
  const { canCreate, canDelete } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());
  
  // Filters
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterRelationship, setFilterRelationship] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  // Filter & Sort Logic
  const filteredAndSortedCustomers = useMemo(() => {
      let result = customers;

      // 1. Filtering
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          result = result.filter(c => c.name.toLowerCase().includes(lower) || c.phone.includes(searchTerm));
      }
      if (filterSource !== 'all') {
          result = result.filter(c => c.source === filterSource);
      }
      if (filterRelationship !== 'all') {
          result = result.filter(c => {
              const actualStatus = (!c.relationshipStatus || c.relationshipStatus === 'Mới') && c.orders?.length > 0 ? 'Chốt đơn' : (c.relationshipStatus || 'Mới');
              return actualStatus === filterRelationship;
          });
      }
      if (filterGroup !== 'all') {
          result = result.filter(c => c.customerGroup === filterGroup);
      }

      // 2. Sorting
      return [...result].sort((a, b) => {
          let valA: any = a.name;
          let valB: any = b.name;

          if (sortConfig.key === 'revenue') {
              valA = (a.orders || []).reduce((sum, o) => sum + (o.revenue || 0), 0);
              valB = (b.orders || []).reduce((sum, o) => sum + (o.revenue || 0), 0);
          } else if (sortConfig.key === 'leads') {
              valA = a.leads.length;
              valB = b.leads.length;
          } else if (sortConfig.key === 'orders') {
              valA = a.orders?.length || 0;
              valB = b.orders?.length || 0;
          } else if (sortConfig.key === 'lastContact') {
              valA = a.leads.length > 0 ? new Date(a.leads[0].updatedAt).getTime() : 0;
              valB = b.leads.length > 0 ? new Date(b.leads[0].updatedAt).getTime() : 0;
          } else {
              // Default name sort
              valA = a.name.toLowerCase();
              valB = b.name.toLowerCase();
          }

          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }, [customers, searchTerm, filterSource, filterRelationship, filterGroup, sortConfig]);

  // Selection Logic
  const handleToggleSelect = (phone: string) => {
      const newSelected = new Set(selectedPhones);
      if (newSelected.has(phone)) {
          newSelected.delete(phone);
      } else {
          newSelected.add(phone);
      }
      setSelectedPhones(newSelected);
  };

  const handleSelectAll = () => {
      if (selectedPhones.size === filteredAndSortedCustomers.length && filteredAndSortedCustomers.length > 0) {
          setSelectedPhones(new Set());
      } else {
          setSelectedPhones(new Set(filteredAndSortedCustomers.map(c => c.phone)));
      }
  };

  const handleBulkAction = () => {
      if (onBulkDelete) {
          onBulkDelete(Array.from(selectedPhones));
          setSelectedPhones(new Set()); 
      }
  };

  const handleSort = (key: SortKey) => {
      setSortConfig(prev => ({
          key,
          direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
      if (sortConfig.key !== colKey) return <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-300 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
      return sortConfig.direction === 'asc' 
        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-600 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-600 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col overflow-hidden">
       <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
         <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 flex-shrink-0">
            <div>
                <h2 className="text-xl font-bold text-slate-800">Khách hàng ({customers.length})</h2>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                    <input 
                        type="text" 
                        placeholder="Tìm tên, SĐT..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                {canCreate('customers') && (
                    <button onClick={onAddCustomer} className="flex items-center justify-center h-8 px-4 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>THÊM KHÁCH HÀNG</button>
                )}
            </div>
         </div>

         {/* Advanced Filters */}
         <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 mb-3 flex flex-wrap gap-3 items-center flex-shrink-0">
             <div className="flex items-center bg-slate-50 px-2 py-1 rounded border border-slate-100">
                 <span className="text-[10px] font-bold text-slate-400 mr-2 uppercase">Nguồn:</span>
                 <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="text-xs bg-transparent focus:outline-none font-semibold text-slate-700">
                     <option value="all">Tất cả</option>
                     {sources.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
             </div>
             <div className="flex items-center bg-slate-50 px-2 py-1 rounded border border-slate-100">
                 <span className="text-[10px] font-bold text-slate-400 mr-2 uppercase">Mối quan hệ:</span>
                 <select value={filterRelationship} onChange={(e) => setFilterRelationship(e.target.value)} className="text-xs bg-transparent focus:outline-none font-semibold text-slate-700">
                     <option value="all">Tất cả</option>
                     {relationships.map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
             </div>
             <div className="flex items-center bg-slate-50 px-2 py-1 rounded border border-slate-100">
                 <span className="text-[10px] font-bold text-slate-400 mr-2 uppercase">Nhóm:</span>
                 <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="text-xs bg-transparent focus:outline-none font-semibold text-slate-700">
                     <option value="all">Tất cả</option>
                     {customerGroups.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
             </div>
         </div>

         {/* Bulk Action Bar */}
         {selectedPhones.size > 0 && (
             <div className="mb-3 p-1.5 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center animate-fade-in flex-shrink-0">
                 <div className="flex items-center space-x-3">
                     <span className="text-xs font-bold text-blue-800 ml-2">Đã chọn {selectedPhones.size} khách hàng</span>
                     <button onClick={() => setSelectedPhones(new Set())} className="text-[10px] text-blue-600 hover:underline uppercase font-bold">Bỏ chọn</button>
                 </div>
                 <div className="flex items-center space-x-2">
                     {onMergeCustomers && selectedPhones.size === 2 && (
                         <button 
                             onClick={() => {
                                 onMergeCustomers(Array.from(selectedPhones));
                                 setSelectedPhones(new Set());
                             }} 
                             className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-600 rounded text-[10px] font-bold hover:bg-indigo-50 shadow-sm flex items-center uppercase transition-all"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                             Gộp 2 khách hàng
                         </button>
                     )}
                     {onBulkDelete && canDelete('customers') && (
                         <button 
                             onClick={handleBulkAction} 
                             className="px-2.5 py-1 bg-white border border-red-200 text-red-600 rounded text-[10px] font-bold hover:bg-red-50 shadow-sm flex items-center uppercase transition-all"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             Xóa {selectedPhones.size} mục đã chọn
                         </button>
                     )}
                 </div>
             </div>
         )}
         
         <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-lg shadow-sm">
            {filteredAndSortedCustomers.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left w-10">
                                <input 
                                    type="checkbox" 
                                    checked={selectedPhones.size === filteredAndSortedCustomers.length && filteredAndSortedCustomers.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                            </th>
                            <th 
                                className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase cursor-pointer hover:text-blue-600 select-none"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center">Họ và tên <SortIcon colKey="name" /></div>
                            </th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Trạng thái</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Sale phụ trách</th>
                            <th 
                                className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase cursor-pointer hover:text-blue-600 select-none"
                                onClick={() => handleSort('revenue')}
                            >
                                <div className="flex items-center justify-end">Doanh thu <SortIcon colKey="revenue" /></div>
                            </th>
                            <th 
                                className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase cursor-pointer hover:text-blue-600 select-none"
                                onClick={() => handleSort('lastContact')}
                            >
                                <div className="flex items-center justify-center">Liên hệ cuối <SortIcon colKey="lastContact" /></div>
                            </th>
                            <th 
                                className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase cursor-pointer hover:text-blue-600 select-none"
                                onClick={() => handleSort('leads')}
                            >
                                <div className="flex items-center justify-center">Số Lead <SortIcon colKey="leads" /></div>
                            </th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredAndSortedCustomers.map((customer) => {
                            const totalRevenue = (customer.orders || []).reduce((sum, order) => sum + (order.revenue || 0), 0);
                            const isSelected = selectedPhones.has(customer.phone);
                            const lastActivity = customer.leads.length > 0 ? new Date(customer.leads[0].updatedAt).toLocaleDateString('vi-VN') : '---';
                            const sale = sales.find(s => s.id === customer.assignedTo);
                            
                            return (
                                <tr key={customer.phone} onClick={() => onSelectCustomer(customer)} className={`hover:bg-blue-50/40 cursor-pointer transition-colors group ${isSelected ? 'bg-blue-50/70' : ''}`}>
                                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected}
                                            onChange={() => handleToggleSelect(customer.phone)}
                                            className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs mr-3 flex-shrink-0 border border-blue-200">{customer.name.charAt(0)}</div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800 truncate max-w-[160px]">{customer.name}</div>
                                                <div className="text-[10px] font-medium text-slate-400 tracking-tight">{customer.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${((!customer.relationshipStatus || customer.relationshipStatus === 'Mới') && customer.orders?.length > 0) || customer.relationshipStatus === 'Chốt đơn' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                            {(!customer.relationshipStatus || customer.relationshipStatus === 'Mới') && customer.orders?.length > 0 ? 'Chốt đơn' : (customer.relationshipStatus || 'Mới')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="text-xs font-semibold text-slate-600">{sale?.name || '---'}</div>
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm font-bold text-green-600 whitespace-nowrap">{formatCurrency(totalRevenue)}</td>
                                    <td className="px-4 py-2 text-center text-[11px] font-medium text-slate-500 whitespace-nowrap">{lastActivity}</td>
                                    <td className="px-4 py-2 text-center"><span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200">{customer.leads.length}</span></td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onDeleteCustomer && canDelete('customers') && (
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteCustomer(customer.phone); }} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md" title="Xóa khách hàng">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            ) : (
                <div className="text-center py-24">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <p className="text-slate-400 font-medium">Không tìm thấy khách hàng nào phù hợp bộ lọc.</p>
                </div>
            )}
         </div>
       </div>
    </div>
  );
};

export default CustomerList;
