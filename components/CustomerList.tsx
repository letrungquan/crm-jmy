
import React, { useState } from 'react';
import { Customer } from '../types';

interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: () => void;
  onDeleteCustomer?: (phone: string) => void;
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number') return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

const CustomerCard: React.FC<{customer: Customer, onClick: () => void, onDelete?: (e: React.MouseEvent) => void}> = ({ customer, onClick, onDelete }) => {
    const totalRevenue = (customer.orders || []).reduce((sum, order) => sum + (order.revenue || 0), 0);
    const lastActivity = customer.leads.length > 0 ? new Date(customer.leads[0].updatedAt).toLocaleDateString('vi-VN') : 'N/A';

    return (
        <div onClick={onClick} className="bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-blue-500 relative group">
            {onDelete && (
                <button onClick={onDelete} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            )}
            <div className="flex justify-between items-start pr-6">
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
            <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center text-sm">
                <p className="text-slate-400">Số cơ hội: <span className="font-medium text-slate-500">{customer.leads.length}</span></p>
                <p className="text-slate-400">Ngày cập nhật: <span className="font-medium text-slate-500">{lastActivity}</span></p>
            </div>
        </div>
    );
};


const CustomerList: React.FC<CustomerListProps> = ({ customers, onSelectCustomer, onAddCustomer, onDeleteCustomer }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  return (
    <div className="p-4 sm:p-6">
       <div className="max-w-6xl mx-auto">
         <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Khách hàng ({customers.length})</h2>
            <div className="flex items-center space-x-3">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
                    <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                </div>
                <button onClick={onAddCustomer} className="flex items-center justify-center h-9 px-4 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Thêm</button>
            </div>
         </div>
         
         {customers.length > 0 ? (
            viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customers.map(customer => (
                        <CustomerCard key={customer.phone} customer={customer} onClick={() => onSelectCustomer(customer)} onDelete={onDeleteCustomer ? (e) => { e.stopPropagation(); onDeleteCustomer(customer.phone); } : undefined} />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Khách hàng</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Doanh thu</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Cơ hội</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {customers.map((customer) => {
                                    const totalRevenue = (customer.orders || []).reduce((sum, order) => sum + (order.revenue || 0), 0);
                                    return (
                                        <tr key={customer.phone} onClick={() => onSelectCustomer(customer)} className="hover:bg-blue-50 cursor-pointer transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-4">{customer.name.charAt(0)}</div>
                                                <div><div className="text-sm font-bold text-slate-900">{customer.name}</div><div className="text-xs text-slate-500">{customer.phone}</div></div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-green-600">{formatCurrency(totalRevenue)}</td>
                                            <td className="px-6 py-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded-full text-xs font-semibold">{customer.leads.length}</span></td>
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
            <div className="text-center py-20 text-slate-400">Chưa có khách hàng nào.</div>
         )}
       </div>
    </div>
  );
};

export default CustomerList;
