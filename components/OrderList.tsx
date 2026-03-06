
import React, { useState, useMemo } from 'react';
import { Order, Sale, CustomerData } from '../types';

interface OrderListProps {
  orders: Order[];
  customers: Record<string, CustomerData>; // Lookup customer name by phone
  sales: Sale[];
  onAddOrder: () => void;
  onImportOrders: () => void;
  onDeleteOrder?: (orderId: string) => void;
  canImport?: boolean;
  onBulkDelete?: (orderIds: string[]) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

const StatusBadge = ({ status }: { status: Order['status'] }) => {
    switch (status) {
        case 'completed':
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Hoàn thành</span>;
        case 'pending':
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">Đang xử lý</span>;
        case 'cancelled':
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Đã hủy</span>;
        default:
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
    }
};

const SourceBadge = ({ source }: { source?: string }) => {
    if (!source || source === 'manual' || source === 'Thủ công') {
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600">Thủ công</span>;
    }
    if (source === 'kiotviet') {
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">KiotViet</span>;
    }
    if (source === 'import') {
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Excel Import</span>;
    }
    // For custom sources like 'JMY BEAUTY'
    return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800 border border-teal-200">{source}</span>;
};

const OrderList: React.FC<OrderListProps> = ({ orders, customers, sales, onAddOrder, onImportOrders, onDeleteOrder, canImport = false, onBulkDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // 1. Filter & Search
  const filteredOrders = useMemo(() => {
      return orders.filter(order => {
          const customerName = customers[order.customerPhone]?.name || order.customerName || '';
          
          const matchesSearch = 
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerPhone.includes(searchTerm) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.externalId || '').toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
          const matchesSource = sourceFilter === 'all' || (order.source || 'manual') === sourceFilter;

          return matchesSearch && matchesStatus && matchesSource;
      });
  }, [orders, customers, searchTerm, statusFilter, sourceFilter]);

  // 2. Sort (Newest first)
  const sortedOrders = useMemo(() => {
      return [...filteredOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredOrders]);

  // 3. Pagination
  const paginatedOrders = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return sortedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

  // 4. Statistics
  const stats = useMemo(() => {
      const totalRevenue = filteredOrders.reduce((acc, order) => acc + (order.status !== 'cancelled' ? order.revenue : 0), 0);
      const successCount = filteredOrders.filter(o => o.status === 'completed').length;
      return { totalRevenue, count: filteredOrders.length, successCount };
  }, [filteredOrders]);

  // Selection Logic
  const handleToggleSelect = (id: string) => {
      const newSelected = new Set(selectedOrderIds);
      if (newSelected.has(id)) {
          newSelected.delete(id);
      } else {
          newSelected.add(id);
      }
      setSelectedOrderIds(newSelected);
  };

  const handleSelectAll = () => {
      if (selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0) {
          setSelectedOrderIds(new Set());
      } else {
          setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
      }
  };

  const handleBulkAction = () => {
      if (onBulkDelete) {
          onBulkDelete(Array.from(selectedOrderIds));
          setSelectedOrderIds(new Set());
      }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-slate-50">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Quản lý Đơn hàng</h2>
                <p className="text-sm text-slate-500 mt-1">Theo dõi doanh thu và trạng thái đơn hàng</p>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
                {canImport && (
                    <button 
                        onClick={onImportOrders} 
                        className="flex-1 sm:flex-none flex items-center justify-center h-9 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import KiotViet
                    </button>
                )}
                <button 
                    onClick={onAddOrder} 
                    className="flex-1 sm:flex-none flex items-center justify-center h-9 px-4 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Tạo đơn
                </button>
            </div>
       </div>

       {/* Statistics Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
           <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Doanh thu (Hiện tại)</p>
               <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.totalRevenue)}</p>
           </div>
           <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tổng đơn hàng</p>
               <p className="text-2xl font-bold text-slate-800 mt-1">{stats.count}</p>
           </div>
           <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Đơn hoàn thành</p>
               <p className="text-2xl font-bold text-blue-600 mt-1">{stats.successCount}</p>
           </div>
       </div>

       {/* Filters & Search */}
       <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4 flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input 
                    type="text" 
                    placeholder="Tìm mã đơn, SĐT, tên khách..." 
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
           </div>
           <div className="flex gap-4">
               <select 
                   value={statusFilter} 
                   onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                   className="block w-40 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
               >
                   <option value="all">Tất cả trạng thái</option>
                   <option value="completed">Hoàn thành</option>
                   <option value="pending">Đang xử lý</option>
                   <option value="cancelled">Đã hủy</option>
               </select>
               <select 
                   value={sourceFilter} 
                   onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
                   className="block w-40 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
               >
                   <option value="all">Tất cả nguồn</option>
                   <option value="manual">Thủ công</option>
                   <option value="kiotviet">KiotViet</option>
                   <option value="import">Import</option>
               </select>
           </div>
       </div>

       {/* Bulk Action Bar */}
       {selectedOrderIds.size > 0 && (
             <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center animate-fade-in">
                 <div className="flex items-center space-x-3">
                     <span className="text-sm font-semibold text-blue-800 ml-2">Đã chọn {selectedOrderIds.size} đơn hàng</span>
                     <button onClick={() => setSelectedOrderIds(new Set())} className="text-xs text-blue-600 hover:underline">Bỏ chọn</button>
                 </div>
                 <div>
                     {onBulkDelete && (
                         <button 
                             onClick={handleBulkAction} 
                             className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded text-sm font-semibold hover:bg-red-50 shadow-sm flex items-center"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             Xóa {selectedOrderIds.size} đơn
                         </button>
                     )}
                 </div>
             </div>
         )}
       
       {/* Table */}
       <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200 flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left w-10">
                                <input 
                                    type="checkbox" 
                                    checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã Đơn</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Khách hàng</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dịch vụ</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Doanh thu</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nguồn</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phụ trách</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {paginatedOrders.length > 0 ? paginatedOrders.map((order) => {
                            const customer = customers[order.customerPhone];
                            const sale = sales.find(s => s.id === order.assignedTo);
                            const isSelected = selectedOrderIds.has(order.id);
                            
                            return (
                                <tr key={order.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected}
                                            onChange={() => handleToggleSelect(order.id)}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        {order.externalId ? (
                                            <span title={`ID Hệ thống: ${order.id}`}>{order.externalId}</span>
                                        ) : (
                                            <span>{order.id.slice(0, 8).toUpperCase()}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-900">{customer?.name || order.customerName || order.customerPhone}</div>
                                        <div className="text-xs text-slate-500">{order.customerPhone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 max-w-[150px] truncate" title={order.service}>
                                        {order.service}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-800">
                                        {formatCurrency(order.revenue)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <SourceBadge source={order.source} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {sale?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {onDeleteOrder && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }} 
                                                className="text-slate-400 hover:text-red-600 p-1"
                                                title="Xóa đơn hàng"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr>
                                <td colSpan={10} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                        <p className="text-slate-500 text-sm">Không tìm thấy đơn hàng nào phù hợp.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-700">
                                Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedOrders.length)}</span> trong số <span className="font-medium">{sortedOrders.length}</span> đơn hàng
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-300"
                                >
                                    <span className="sr-only">Trước</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1 ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-300"
                                >
                                    <span className="sr-only">Sau</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                     <div className="flex items-center justify-between sm:hidden w-full">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-300"
                        >
                            Trước
                        </button>
                         <span className="text-sm text-slate-700">Trang {currentPage} / {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-300"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};

export default OrderList;
