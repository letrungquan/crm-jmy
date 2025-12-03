import React, { useState, useEffect } from 'react';
import { Customer, CustomerData } from '../types';

interface CustomerFormModalProps {
  customerToEdit?: Customer | null;
  onClose: () => void;
  onSave: (customerData: CustomerData) => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ customerToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState<CustomerData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    location: '',
    tags: [],
    generalNotes: '',
    source: '',
    assignedTo: undefined,
    businessIndustry: '',
    customerGroup: '',
    profileCompleteness: 0,
    relationshipStatus: '',
    taxCode: '',
    website: '',
  });

  const isEditMode = !!customerToEdit;

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        name: customerToEdit.name || '',
        phone: customerToEdit.phone || '',
        email: customerToEdit.email || '',
        website: customerToEdit.website || '',
        address: customerToEdit.address || '',
        location: customerToEdit.location || '',
        generalNotes: customerToEdit.generalNotes || '',
        source: customerToEdit.source || '',
        tags: customerToEdit.tags || [],
        taxCode: customerToEdit.taxCode || '',
        businessIndustry: customerToEdit.businessIndustry || '',
        customerGroup: customerToEdit.customerGroup || '',
        relationshipStatus: customerToEdit.relationshipStatus || '',
        assignedTo: customerToEdit.assignedTo,
        profileCompleteness: customerToEdit.profileCompleteness || 0,
      });
    }
  }, [customerToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Tên và Số điện thoại là bắt buộc.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <header className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">
              {isEditMode ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới'}
            </h2>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">Tên khách hàng *</label>
                  <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Số điện thoại *</label>
                  <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required disabled={isEditMode} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"/>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                  <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-slate-700">Website</label>
                  <input type="text" name="website" id="website" value={formData.website} onChange={handleChange} placeholder="https://" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                 <div>
                  <label htmlFor="location" className="block text-sm font-medium text-slate-700">Tỉnh/Thành phố</label>
                  <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                 <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700">Địa chỉ</label>
                  <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                 <div className="md:col-span-2">
                  <label htmlFor="generalNotes" className="block text-sm font-medium text-slate-700">Ghi chú chung</label>
                  <textarea name="generalNotes" id="generalNotes" value={formData.generalNotes} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
            </div>
          </div>

          <footer className="p-4 bg-slate-50 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
              Huỷ
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              {isEditMode ? 'Lưu thay đổi' : 'Tạo khách hàng'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;