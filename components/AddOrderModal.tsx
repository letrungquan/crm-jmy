
import React, { useState } from 'react';
import { Sale, Customer } from '../types';

interface AddOrderModalProps {
  sales: Sale[];
  customers: Customer[];
  onClose: () => void;
  onSave: (orderData: any) => void;
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({ sales, customers, onClose, onSave }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState(''); // Only used if customer doesn't exist
  const [service, setService] = useState('');
  const [revenue, setRevenue] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'completed' | 'pending' | 'cancelled'>('completed');
  
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [activeSearch, setActiveSearch] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (val.length > 2) {
        const results = customers.filter(c => c.phone.includes(val) || c.name.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
        setSearchResults(results);
        setActiveSearch(true);
    } else {
        setSearchResults([]);
        setActiveSearch(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
      setPhone(customer.phone);
      setName(customer.name);
      setActiveSearch(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !service || !revenue) return;

    onSave({
        customerPhone: phone,
        customerName: name, // Optional, checked in parent
        service,
        revenue: parseInt(revenue),
        assignedTo: assignedTo || null,
        createdAt: new Date(createdAt).toISOString(),
        source: 'manual',
        status: status
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <header className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Tạo đơn hàng mới</h2>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="relative">
                <label className="block text-sm font-medium text-slate-700">Khách hàng (SĐT/Tên)</label>
                <input 
                    type="text" 
                    value={phone} 
                    onChange={handlePhoneChange} 
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập SĐT hoặc tên để tìm..."
                    required
                />
                {activeSearch && searchResults.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                        {searchResults.map(c => (
                            <li key={c.phone} onClick={() => handleSelectCustomer(c)} className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm">
                                <span className="font-bold">{c.name}</span> - {c.phone}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            {/* If new customer (phone not in list), show Name input */}
            {!customers.find(c => c.phone === phone) && phone.length > 9 && (
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Tên khách hàng mới</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700">Dịch vụ/Sản phẩm</label>
                <input type="text" value={service} onChange={(e) => setService(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Thành tiền (VNĐ)</label>
                <input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Ngày tạo</label>
                    <input type="date" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Trạng thái</label>
                    <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value as any)} 
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="completed">Hoàn thành</option>
                        <option value="pending">Đang xử lý</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Người bán</label>
                    <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="">-- Chọn Sale --</option>
                        {sales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
          </div>

          <footer className="p-4 bg-slate-50 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">Huỷ</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Lưu đơn</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddOrderModal;
