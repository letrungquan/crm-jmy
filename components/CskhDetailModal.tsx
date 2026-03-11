
import React, { useState } from 'react';
import { CskhItem, Sale, StatusConfig, Note } from '../types';
import { DOCTORS } from '../constants';
import { usePermissions } from '../contexts/PermissionContext';

interface CskhDetailModalProps {
  item: CskhItem;
  sales: Sale[];
  statuses: StatusConfig[];
  notes: Note[];
  onClose: () => void;
  onSave: (updatedItem: CskhItem) => void;
  onAddNote: (content: string) => void;
  onViewCustomer?: (phone: string) => void;
  onDelete?: () => void;
  currentUser: Sale['id'];
}

const CskhDetailModal: React.FC<CskhDetailModalProps> = ({ item, sales, statuses, notes, onClose, onSave, onAddNote, onViewCustomer, onDelete, currentUser }) => {
  const { canDelete, canEdit } = usePermissions();
  const [currentItem, setCurrentItem] = useState<CskhItem>(item);
  const [newNote, setNewNote] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(currentItem);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    onAddNote(newNote.trim());
    setNewNote('');
  };

  // Helper to format date for date-only input (YYYY-MM-DD)
  const formatForDateInput = (dateString: string | null | undefined) => {
      if (!dateString) return '';
      try {
          return dateString.split('T')[0];
      } catch {
          return '';
      }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col h-full max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Chi tiết CSKH</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-grow">
            <div className="space-y-4">
                {/* Customer Info */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Khách hàng</p>
                    <p className="text-lg font-bold text-slate-800">{currentItem.customerName}</p>
                    <p className="text-sm text-blue-600 font-semibold">{currentItem.customerPhone}</p>
                    {onViewCustomer && (
                        <button 
                            onClick={() => onViewCustomer(currentItem.customerPhone)}
                            className="mt-2 text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1 rounded hover:bg-blue-50 font-bold flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Xem hồ sơ đầy đủ
                        </button>
                    )}
                </div>

                {/* Service Info */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Dịch vụ</label>
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-medium">
                        {currentItem.service}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Trạng thái</label>
                        <select 
                            name="status" 
                            value={currentItem.status} 
                            onChange={handleInputChange} 
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                        >
                            {statuses.map(status => (
                                <option key={status.id} value={status.id}>{status.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Assigned Sale */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Nhân viên phụ trách</label>
                        <select 
                            name="assignedTo" 
                            value={currentItem.assignedTo || ''} 
                            onChange={handleInputChange} 
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                        >
                            <option value="">-- Chưa gán --</option>
                            {sales.map(sale => (
                                <option key={sale.id} value={sale.id}>{sale.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Doctor */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Bác sĩ thực hiện</label>
                        <select 
                            name="doctorName" 
                            value={currentItem.doctorName || ''} 
                            onChange={handleInputChange} 
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                        >
                            <option value="">-- Chưa gán --</option>
                            {DOCTORS.map(dr => <option key={dr} value={dr}>{dr}</option>)}
                        </select>
                    </div>

                    {/* Re-examination Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Ngày hẹn tái khám</label>
                        <input
                            type="date"
                            name="reExaminationDate"
                            value={formatForDateInput(currentItem.reExaminationDate)}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                        />
                    </div>
                </div>

                {/* Notes History Section */}
                <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-semibold text-slate-700 mb-3">Lịch sử trao đổi</h3>
                    
                    {/* Add Note Input */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                        <div className="flex space-x-2">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Thêm ghi chú tương tác..."
                                rows={2}
                                className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                            ></textarea>
                            <button 
                                onClick={handleAddNote} 
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-bold self-end" 
                                disabled={!newNote.trim()}
                            >
                                Gửi
                            </button>
                        </div>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {notes.length > 0 ? (
                            notes.map(note => {
                                const creator = sales.find(s => s.id === note.createdBy);
                                return (
                                    <div key={note.id} className="p-3 rounded-md border bg-white border-slate-200">
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="font-semibold text-slate-800">{creator?.name || 'Hệ thống'}</span>
                                            <span className="text-slate-400">{new Date(note.createdAt).toLocaleString('vi-VN')}</span>
                                        </div>
                                        <p className="text-sm text-slate-700">{note.content}</p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">Chưa có ghi chú nào.</p>
                        )}
                    </div>
                </div>
                
                <div className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
                    <p>Ngày tạo: {new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                    <p>Cập nhật cuối: {new Date(item.updatedAt).toLocaleString('vi-VN')}</p>
                </div>
            </div>
        </div>

        <footer className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div>
            {onDelete && canDelete('cskh') && (
                <button 
                    type="button"
                    onClick={() => {
                        onDelete();
                    }} 
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 font-medium"
                >
                    Xóa
                </button>
            )}
          </div>
          <div className="flex space-x-3">
              <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
                Huỷ
              </button>
              {canEdit('cskh') && (
                  <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold">
                    Lưu thay đổi
                  </button>
              )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CskhDetailModal;
