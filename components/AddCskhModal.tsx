import React, { useState } from 'react';
import { Customer, Sale } from '../types';
import { DOCTORS } from '../constants';

interface AddCskhModalProps {
  customers: Customer[];
  sales: Sale[];
  onClose: () => void;
  onAdd: (data: {
    customerPhone: string;
    customerName: string;
    service: string;
    assignedTo: string;
    doctorName?: string;
    reExaminationDate?: string;
    note?: string;
  }) => void;
}

const AddCskhModal: React.FC<AddCskhModalProps> = ({ customers, sales, onClose, onAdd }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [reExaminationDate, setReExaminationDate] = useState('');
  const [note, setNote] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setPhone(newPhone);
    
    if (newPhone.length >= 8) {
      const existingCustomer = customers.find(c => c.phone.includes(newPhone));
      if (existingCustomer) {
        setName(existingCustomer.name);
      } else {
        setName('');
      }
    } else {
        setName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name || !service) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (SĐT, Tên, Dịch vụ).');
      return;
    }

    onAdd({
      customerPhone: phone,
      customerName: name,
      service,
      assignedTo,
      doctorName,
      reExaminationDate,
      note
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0 rounded-t-lg">
          <h2 className="text-lg font-bold">Thêm CSKH Thủ Công</h2>
          <button onClick={onClose} className="text-blue-100 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập SĐT khách hàng"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
                placeholder="Tên khách hàng"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dịch vụ đã làm <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="VD: Trị mụn, Nám..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bác sĩ thực hiện</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày tái khám dự kiến</label>
              <input
                type="date"
                value={reExaminationDate}
                onChange={(e) => setReExaminationDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nhân viên phụ trách</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Chọn nhân viên --</option>
                {sales.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
              <textarea
                value={note || ''}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ghi chú thêm..."
              ></textarea>
            </div>
          </div>

          <footer className="p-4 bg-slate-50 flex justify-end space-x-3 border-t border-slate-100 shrink-0 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Thêm CSKH
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddCskhModal;
