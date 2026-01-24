
import React, { useState } from 'react';
import { Lead, Sale, Customer } from '../types';

interface AddLeadModalProps {
  sales: Sale[];
  customers: Customer[];
  sources: string[];
  onClose: () => void;
  onSave: (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => void;
  defaultStatus?: string;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ sales, customers, sources, onClose, onSave, defaultStatus }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');
  const [potentialRevenue, setPotentialRevenue] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [projectedAppointmentDate, setProjectedAppointmentDate] = useState('');

  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [activeSearch, setActiveSearch] = useState<'name' | 'phone' | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    if (id === 'name') {
      setName(value);
    } else if (id === 'phone') {
      setPhone(value);
    }

    if (id === 'name' || id === 'phone') {
        if (value.trim().length > 1) {
            const lowercasedValue = value.toLowerCase();
            const results = customers.filter(c => 
                c.name.toLowerCase().includes(lowercasedValue) || 
                c.phone.includes(value)
            ).slice(0, 5); // Limit results to 5
            setSearchResults(results);
            setActiveSearch(id as 'name' | 'phone');
        } else {
            setSearchResults([]);
            setActiveSearch(null);
        }
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setName(customer.name);
    setPhone(customer.phone);
    setSearchResults([]);
    setActiveSearch(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
        alert("Vui lòng nhập tên và số điện thoại.");
        return;
    }
    
    onSave({
      name,
      phone,
      source: selectedSource,
      assignedTo,
      status: defaultStatus || 'new',
      appointmentDate: null,
      // Use 12:00:00 to prevent timezone shifting issues when viewing on calendar
      projectedAppointmentDate: projectedAppointmentDate ? `${projectedAppointmentDate}T12:00:00` : null,
      service,
      description,
      priority: null,
      potentialRevenue: potentialRevenue ? parseInt(potentialRevenue, 10) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <header className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Thêm Cơ hội mới</h2>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="relative">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Tên khách hàng *</label>
              <input 
                type="text" 
                id="name" 
                value={name} 
                onChange={handleInputChange} 
                onFocus={handleInputChange}
                onBlur={() => setTimeout(() => { if(activeSearch === 'name') setActiveSearch(null) }, 150)}
                autoComplete="off"
                required 
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
               />
               {activeSearch === 'name' && searchResults.length > 0 && (
                  <ul className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                      {searchResults.map(customer => (
                          <li 
                              key={customer.phone} 
                              className="px-4 py-2 hover:bg-slate-100 cursor-pointer"
                              onMouseDown={() => handleSelectCustomer(customer)}
                          >
                              <p className="font-semibold text-slate-800">{customer.name}</p>
                              <p className="text-sm text-slate-500">{customer.phone}</p>
                          </li>
                      ))}
                  </ul>
                )}
            </div>
            <div className="relative">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Số điện thoại *</label>
              <input 
                type="tel" 
                id="phone" 
                value={phone} 
                onChange={handleInputChange} 
                onFocus={handleInputChange}
                onBlur={() => setTimeout(() => { if(activeSearch === 'phone') setActiveSearch(null) }, 150)}
                autoComplete="off"
                required 
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              />
               {activeSearch === 'phone' && searchResults.length > 0 && (
                  <ul className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                      {searchResults.map(customer => (
                          <li 
                              key={customer.phone} 
                              className="px-4 py-2 hover:bg-slate-100 cursor-pointer"
                              onMouseDown={() => handleSelectCustomer(customer)}
                          >
                              <p className="font-semibold text-slate-800">{customer.name}</p>
                              <p className="text-sm text-slate-500">{customer.phone}</p>
                          </li>
                      ))}
                  </ul>
                )}
            </div>
             <div>
              <label htmlFor="service" className="block text-sm font-medium text-slate-700">Dịch vụ tư vấn</label>
              <input type="text" id="service" value={service} onChange={(e) => setService(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"/>
            </div>
            <div>
              <label htmlFor="potentialRevenue" className="block text-sm font-medium text-slate-700">Doanh thu dự kiến (VND)</label>
              <input type="number" id="potentialRevenue" value={potentialRevenue} onChange={(e) => setPotentialRevenue(e.target.value)} placeholder="VD: 990000" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"/>
            </div>
            {defaultStatus === 'contacting' && (
                <div>
                  <label htmlFor="projectedAppointmentDate" className="block text-sm font-medium text-slate-700">Ngày dự thu</label>
                  <input 
                    type="date" 
                    id="projectedAppointmentDate" 
                    value={projectedAppointmentDate} 
                    onChange={(e) => setProjectedAppointmentDate(e.target.value)} 
                    onClick={(e) => {
                      try {
                        (e.target as any).showPicker?.();
                      } catch (err) {
                        // showPicker might fail in restricted iframes, simply ignore
                      }
                    }}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 cursor-pointer"
                  />
                </div>
            )}
             <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">Mô tả</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"/>
            </div>
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-slate-700">Nguồn</label>
              <select 
                id="source" 
                value={selectedSource} 
                onChange={(e) => setSelectedSource(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              >
                <option value="">Chọn nguồn</option>
                {sources.map(src => <option key={src} value={src}>{src}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-slate-700">Gán cho Sale</label>
              <select id="assignedTo" value={assignedTo || ''} onChange={(e) => setAssignedTo(e.target.value || null)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900">
                <option value="">Chưa gán</option>
                {sales.map(sale => (
                  <option key={sale.id} value={sale.id}>{sale.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <footer className="p-4 bg-slate-50 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
              Huỷ
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Tạo
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;
