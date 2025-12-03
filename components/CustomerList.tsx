import React from 'react';
import { Customer } from '../types';

interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: () => void;
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number') return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

const CustomerCard: React.FC<{customer: Customer, onClick: () => void}> = ({ customer, onClick }) => {
    const totalRevenue = customer.leads.reduce((sum, lead) => sum + (lead.potentialRevenue || 0), 0);
    const lastActivity = customer.leads.length > 0 ? new Date(customer.leads[0].updatedAt).toLocaleDateString('vi-VN') : 'N/A';

    return (
        <div onClick={onClick} className="bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-blue-500">
            <div className="flex justify-between items-start">
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
                    <p className="text-xs text-slate-400">Tổng doanh thu</p>
                </div>
            </div>
            <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center text-sm">
                <p className="text-slate-400">Số cơ hội: <span className="font-medium text-slate-500">{customer.leads.length}</span></p>
                <p className="text-slate-400">Hoạt động gần nhất: <span className="font-medium text-slate-500">{lastActivity}</span></p>
            </div>
        </div>
    );
};


const CustomerList: React.FC<CustomerListProps> = ({ customers, onSelectCustomer, onAddCustomer }) => {
  return (
    <div className="p-4 sm:p-6">
       <div className="max-w-4xl mx-auto">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Danh sách Khách hàng ({customers.length})</h2>
            <button onClick={onAddCustomer} className="flex items-center justify-center h-9 px-4 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Thêm khách hàng
            </button>
         </div>
         
         {customers.length > 0 ? (
            <div className="space-y-4">
                {customers.map(customer => (
                    <CustomerCard 
                        key={customer.phone}
                        customer={customer}
                        onClick={() => onSelectCustomer(customer)}
                    />
                ))}
            </div>
         ) : (
            <div className="text-center py-10">
                <p className="text-slate-500">Chưa có khách hàng nào.</p>
                <button onClick={onAddCustomer} className="mt-4 text-blue-600 font-semibold">Tạo khách hàng mới</button>
            </div>
         )}
       </div>
    </div>
  );
};

export default CustomerList;