
import React, { useState, useMemo } from 'react';
import { Customer } from '../types';

interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: () => void;
  onDeleteCustomer?: (phone: string) => void;
  onBulkDelete?: (phones: string[]) => void;
  sources?: string[];
  relationships?: string[];
  customerGroups?: string[];
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number') return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

const CustomerCard: React.FC<{
    customer: Customer; 
    onClick: () => void; 
    onDelete?: (e: React.MouseEvent) => void;
    isSelected: boolean;
    onToggleSelect: (e: React.MouseEvent) => void;
}> = ({ customer, onClick, onDelete, isSelected, onToggleSelect }) => {
    const totalRevenue = (customer.orders || []).reduce((sum, order) => sum + (order.revenue || 0), 0);
    const lastActivity = customer.leads.length > 0 ? new Date(customer.leads[0].updatedAt).toLocaleDateString('vi-VN') : 'N/A';

    return (
        <div onClick={onClick} className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-blue-500 relative group ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
            <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={(e) => { e.stopPropagation(); onToggleSelect(e as any); }}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
            </div>
            {onDelete && (
                <button onClick={onDelete} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            )}
            <div className="flex justify-between items-start pr-6 pl-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{customer.name}</h3>
                    <p className="text-sm text-slate-500 flex items-center mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {customer.phone}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs text-slate-400">Doanh thu</p>
                </div>
            </div>
            <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center text-sm pl-6">
                <p className="text-slate-400">Số cơ hội: <span className="font-medium text-slate-500">{customer.leads.length}</span></p>
                <p className="text-slate-400">Đơn hàng: <span className="font-medium text-slate-500">{customer.orders?.length || 0}</span></p>
            </div>
        </div>
    );
};

type SortKey = 'name' | 'revenue' | 'leads' | 'orders';

const CustomerList: React.FC<CustomerListProps> = ({ 
    customers, 
    onSelectCustomer, 
    onAddCustomer, 
    onDeleteCustomer, 
    onBulkDelete,
    sources = [],
    relationships = [],
    customerGroups = []
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
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
          result = result.filter(c => c.relationshipStatus === filterRelationship);
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
    <div className="p-4 sm:p-6 h-full flex flex-col">
       <div className="max-w-6xl mx-auto w-full">
         <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Khách hàng ({customers.length})</h2>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                    <input 
                        type="text" 
                        placeholder="Tìm tên, SĐT..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
                    <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                </div>
                <button onClick={onAddCustomer} className="flex items-center justify-center h-9 px-4 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Thêm</button>
            </div>
         </div>

         {/* Advanced Filters */}
         <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-4 flex flex-wrap gap-3 items-center">
             <div className="flex items-center">
                 <span className="text-xs font-semibold text-slate-500 mr-2 uppercase">Lọc:</span>
                 <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 outline-none">
                     <option value="all">Tất cả Nguồn</option>
                     {sources.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
             </div>
             <div className="flex items-center">
                 <select value={filterRelationship} onChange={(e) => setFilterRelationship(e.target.value)} className="text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 outline-none">
                     <option value="all">Tất cả Mối quan hệ</option>
                     {relationships.map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
             </div>
             <div className="flex items-center">
                 <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 outline-none">
                     <option value="all">Tất cả Nhóm</option>
                     {customerGroups.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
             </div>
             
             {viewMode === 'grid' && (
                 <div className="ml-auto flex items-center">
                     <span className="text-xs font-semibold text-slate-500 mr-2 uppercase">Sắp xếp:</span>
                     <select 
                        value={`${sortConfig.key}-${sortConfig.direction}`} 
                        onChange={(e) => {
                            const [key, direction] = e.target.value.split('-');
                            setSortConfig({ key: key as SortKey, direction: direction as 'asc' | 'desc' });
                        }} 
                        className="text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
                     >
                         <option value="name-asc">Tên (A-Z)</option>
                         <option value="name-desc">Tên (Z-A)</option>
                         <option value="revenue-desc">Doanh thu (Cao - Thấp)</option>
                         <option value="revenue-asc">Doanh thu (Thấp - Cao)</option>
                         <option value="leads-desc">Cơ hội (Nhiều - Ít)</option>
                         <option value="orders-desc">Đơn hàng (Nhiều - Ít)</option>
                     </select>
                 </div>
             )}
         </div>

         {/* Bulk Action Bar */}
         {selectedPhones.size > 0 && (
             <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center animate-fade-in">
                 <div className="flex items-center space-x-3">
                     <span className="text-sm font-semibold text-blue-800 ml-2">Đã chọn {selectedPhones.size} khách hàng</span>
                     <button onClick={() => setSelectedPhones(new Set())} className="text-xs text-blue-600 hover:underline">Bỏ chọn</button>
                 </div>
                 <div>
                     {onBulkDelete && (
                         <button 
                             onClick={handleBulkAction} 
                             className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded text-sm font-semibold hover:bg-red-50 shadow-sm flex items-center"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             Xóa {selectedPhones.size} mục
                         </button>
                     )}
                 </div>
             </div>
         )}
         
         {filteredAndSortedCustomers.length > 0 ? (
            viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAndSortedCustomers.map(customer => (
                        <CustomerCard 
                            key={customer.phone} 
                            customer={customer} 
                            onClick={() => onSelectCustomer(customer)} 
                            onDelete={onDeleteCustomer ? (e) => { e.stopPropagation(); onDeleteCustomer(customer.phone); } : undefined} 
                            isSelected={selectedPhones.has(customer.phone)}
                            onToggleSelect={(e) => handleToggleSelect(customer.phone)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left w-10">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedPhones.size === filteredAndSortedCustomers.length && filteredAndSortedCustomers.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase cursor-pointer hover:text-blue-600 group select-none"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Khách hàng
                                            <SortIcon colKey="name" />
                                        </div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase cursor-pointer hover:text-blue-600 group select-none"
                                        onClick={() => handleSort('revenue')}
                                    >
                                        <div className="flex items-center justify-end">
                                            Doanh thu
                                            <SortIcon colKey="revenue" />
                                        </div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase cursor-pointer hover:text-blue-600 group select-none"
                                        onClick={() => handleSort('leads')}
                                    >
                                        <div className="flex items-center justify-center">
                                            Cơ hội
                                            <SortIcon colKey="leads" />
                                        </div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase cursor-pointer hover:text-blue-600 group select-none"
                                        onClick={() => handleSort('orders')}
                                    >
                                        <div className="flex items-center justify-center">
                                            Đơn hàng
                                            <SortIcon colKey="orders" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredAndSortedCustomers.map((customer) => {
                                    const totalRevenue = (customer.orders || []).reduce((sum, order) => sum + (order.revenue || 0), 0);
                                    const isSelected = selectedPhones.has(customer.phone);
                                    return (
                                        <tr key={customer.phone} onClick={() => onSelectCustomer(customer)} className={`hover:bg-blue-50 cursor-pointer transition-colors group ${isSelected ? 'bg-blue-50' : ''}`}>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelect(customer.phone)}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-4">{customer.name.charAt(0)}</div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">{customer.name}</div>
                                                    <div className="text-xs text-slate-500">{customer.phone}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{customer.customerGroup || customer.source}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-green-600">{formatCurrency(totalRevenue)}</td>
                                            <td className="px-6 py-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded-full text-xs font-semibold">{customer.leads.length}</span></td>
                                            <td className="px-6 py-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded-full text-xs font-semibold">{customer.orders?.length || 0}</span></td>
                                            <td className="px-6 py-4 text-right">
                                                {onDeleteCustomer && (
                                                    <button onClick={(e) => { e.stopPropagation(); onDeleteCustomer(customer.phone); }} className="p-2 text-slate-300 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
         ) : (
            <div className="text-center py-20 text-slate-400">Không tìm thấy khách hàng nào phù hợp bộ lọc.</div>
         )}
       </div>
    </div>
  );
};

export default CustomerList;
