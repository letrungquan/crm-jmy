
import React, { useState } from 'react';
import { Customer, Sale, ReExamination } from '../types';
import { DOCTORS } from '../constants';

interface AddReExaminationModalProps {
  customers: Customer[];
  sales: Sale[];
  onClose: () => void;
  onSave: (data: any) => void;
  initialCustomer?: Customer;
}

const AddReExaminationModal: React.FC<AddReExaminationModalProps> = ({ customers, sales, onClose, onSave, initialCustomer }) => {
  const [customerPhone, setCustomerPhone] = useState(initialCustomer?.phone || '');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [note, setNote] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [potentialRevenue, setPotentialRevenue] = useState('');

  // Search logic for customers
  const [searchTerm, setSearchTerm] = useState('');
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  ).slice(0, 5);

  const handleCustomerSelect = (customer: Customer) => {
    setCustomerPhone(customer.phone);
    setSearchTerm(`${customer.name} - ${customer.phone}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCustomer = customers.find(c => c.phone === customerPhone);
    if (!selectedCustomer) {
        alert("Vui lòng chọn khách hàng hợp lệ.");
        return;
    }

    onSave({
        customerPhone,
        customerName: selectedCustomer.name,
        service,
        date,
        appointmentTime,
        doctorName,
        note,
        assignedTo,
        status: 'pending',
        potentialRevenue: potentialRevenue ? parseInt(potentialRevenue) : undefined
    });
  };

  const formatCurrency = (val: string) => {
      if (!val) return '';
      return new Intl.NumberFormat('vi-VN').format(parseInt(val));
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <header className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0 rounded-t-lg">
          <h2 className="text-lg font-bold">Tạo Lịch Tái Khám Mới</h2>
          <button type="button" onClick={onClose} className="text-blue-100 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {/* Customer Selection */}
            <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Khách hàng</label>
                {initialCustomer ? (
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-slate-700 font-bold">
                        {initialCustomer.name} - {initialCustomer.phone}
                    </div>
                ) : (
                    <>
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Tìm tên hoặc SĐT..."
                            required={!customerPhone}
                        />
                        {searchTerm && !customerPhone && (
                            <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                {filteredCustomers.map(c => (
                                    <div 
                                        key={c.phone} 
                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                        onClick={() => handleCustomerSelect(c)}
                                    >
                                        <span className="font-bold">{c.name}</span> - {c.phone}
                                    </div>
                                ))}
                                {filteredCustomers.length === 0 && (
                                    <div className="px-3 py-2 text-slate-400 text-sm">Không tìm thấy</div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dịch vụ tái khám</label>
              <input 
                type="text" 
                value={service} 
                onChange={(e) => setService(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="VD: Kiểm tra mụn, Peel da lần 2..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Doanh thu dự kiến (VND)</label>
              <input 
                type="number" 
                value={potentialRevenue} 
                onChange={(e) => setPotentialRevenue(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-700"
                placeholder="0"
              />
              {potentialRevenue && (
                  <p className="text-xs text-slate-500 mt-1 text-right">{formatCurrency(potentialRevenue)} VND</p>
              )}
            </div>

            <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hẹn</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giờ hẹn</label>
                  <input 
                    type="time" 
                    value={appointmentTime} 
                    onChange={(e) => setAppointmentTime(e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bác sĩ (Dự kiến)</label>
                <select
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">-- Chọn bác sĩ --</option>
                    {DOCTORS.map(dr => <option key={dr} value={dr}>{dr}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sale phụ trách</label>
                <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">-- Chọn nhân viên --</option>
                    {sales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea 
                    value={note || ''}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                ></textarea>
            </div>
          </div>

          <footer className="p-4 bg-slate-50 flex justify-end space-x-3 border-t border-slate-100 shrink-0 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
              Huỷ
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold shadow-sm">
              Tạo lịch hẹn
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddReExaminationModal;
