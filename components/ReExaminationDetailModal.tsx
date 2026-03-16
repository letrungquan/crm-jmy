
import React, { useState, useEffect } from 'react';
import { ReExamination, Sale } from '../types';
import { DOCTORS } from '../constants';
import { usePermissions } from '../contexts/PermissionContext';

interface ReExaminationDetailModalProps {
  reExam: ReExamination;
  sales: Sale[];
  onClose: () => void;
  onSave: (updatedReExam: ReExamination) => void;
  onAddNote: (reExamId: string, content: string) => void;
  onDelete?: () => void;
}

const ReExaminationDetailModal: React.FC<ReExaminationDetailModalProps> = ({ reExam, sales, onClose, onSave, onAddNote, onDelete }) => {
  const { canDelete, canEdit } = usePermissions();
  const [currentReExam, setCurrentReExam] = useState<ReExamination>(reExam);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState('');
  
  // Feedback state
  const [isFeedback, setIsFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);

  useEffect(() => {
    setCurrentReExam(reExam);
  }, [reExam]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'potentialRevenue') {
        setCurrentReExam(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
    } else {
        setCurrentReExam(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    onSave(currentReExam);
  };

  const handleAddNote = () => {
    if (newNote.trim() === '') return;
    
    let finalContent = newNote.trim();
    if (isFeedback) {
        finalContent = `[PHẢN HỒI] [${feedbackRating} Sao] ${finalContent}`;
    }

    onAddNote(reExam.id, finalContent);
    setNewNote('');
    setIsFeedback(false);
    setFeedbackRating(5);
  };

  // Helper to format date for date-only input (YYYY-MM-DD)
  const formatForDateInput = (dateString: string) => {
      if (!dateString) return '';
      try {
          return dateString.split('T')[0];
      } catch {
          return '';
      }
  }

  const formatCurrency = (val: number | undefined) => {
      if (!val) return '';
      return new Intl.NumberFormat('vi-VN').format(val);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <header className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0 rounded-t-lg">
          <h2 className="text-lg font-bold">Chi tiết Lịch Tái Khám</h2>
          <button type="button" onClick={onClose} className="text-blue-100 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Customer Info (Read-only) */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-xs text-slate-500 font-bold uppercase">Khách hàng</p>
                <p className="font-bold text-slate-800">{currentReExam.customerName}</p>
                <p className="text-sm text-blue-600">{currentReExam.customerPhone}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dịch vụ tái khám</label>
              <input 
                name="service"
                type="text" 
                value={currentReExam.service} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Doanh thu dự kiến (VND)</label>
              <input 
                name="potentialRevenue"
                type="number" 
                value={currentReExam.potentialRevenue || ''} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-700"
                placeholder="0"
              />
              {currentReExam.potentialRevenue && (
                  <p className="text-xs text-slate-500 mt-1 text-right">{formatCurrency(currentReExam.potentialRevenue)} VND</p>
              )}
            </div>

            <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hẹn</label>
                  <input 
                    name="date"
                    type="date" 
                    value={formatForDateInput(currentReExam.date)} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giờ hẹn</label>
                  <input 
                    name="appointmentTime"
                    type="time" 
                    value={currentReExam.appointmentTime || ''} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                <select
                    name="status"
                    value={currentReExam.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="pending">Cần gọi</option>
                    <option value="called">Đã gọi</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="converted">Đã chuyển Lead</option>
                    <option value="cancelled">Hủy</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bác sĩ (Dự kiến)</label>
                <select
                    name="doctorName"
                    value={currentReExam.doctorName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">-- Chọn bác sĩ --</option>
                    {DOCTORS.map(dr => <option key={dr} value={dr}>{dr}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sale phụ trách</label>
                <select
                    name="assignedTo"
                    value={currentReExam.assignedTo || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">-- Chọn nhân viên --</option>
                    {sales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea 
                    name="note"
                    value={currentReExam.note || ''}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                ></textarea>
            </div>
            
            {/* Notes History Section */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Lịch sử tương tác</h3>
              <div className="space-y-3">
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                     <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  checked={isFeedback} 
                                  onChange={(e) => setIsFeedback(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                              />
                              <span className="text-sm font-bold text-slate-700">Ghi nhận phản hồi</span>
                          </label>
                          {isFeedback && (
                              <div className="flex space-x-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                      <button key={star} onClick={() => setFeedbackRating(star)} className="focus:outline-none" type="button">
                                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${star <= feedbackRating ? 'text-yellow-400' : 'text-slate-300'}`} viewBox="0 0 20 20" fill="currentColor">
                                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                      </button>
                                  ))}
                              </div>
                          )}
                     </div>
                     <div className="flex space-x-2">
                       <textarea
                         value={newNote || ''}
                         onChange={(e) => setNewNote(e.target.value)}
                         placeholder={isFeedback ? "Nhập nội dung phản hồi của khách hàng..." : "Thêm ghi chú tương tác..."}
                         rows={2}
                         className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                       ></textarea>
                       <button onClick={handleAddNote} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-bold" disabled={!newNote.trim()}>
                          Gửi
                       </button>
                     </div>
                 </div>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                   {(currentReExam.notes || []).length > 0 ? (
                      (currentReExam.notes || []).map(note => {
                        const creator = sales.find(s => s.id === note.createdBy);
                        const isFeedbackNote = note.content.includes('[PHẢN HỒI]');
                        let displayContent = note.content;
                        let rating = 0;
                        
                        if (isFeedbackNote) {
                            const parts = note.content.match(/\[(\d+) Sao\] (.*)/);
                            if (parts) {
                                rating = parseInt(parts[1]);
                                displayContent = parts[2];
                            } else {
                                displayContent = note.content.replace('[PHẢN HỒI]', '');
                            }
                        }

                        return (
                        <div key={note.id} className={`p-3 rounded-md border ${isFeedbackNote ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-slate-800">{creator?.name || 'Hệ thống'}</span>
                            <span className="text-slate-400">{new Date(note.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                          {isFeedbackNote && rating > 0 && (
                              <div className="flex text-yellow-400 mb-1">
                                  {[...Array(rating)].map((_, i) => (
                                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                  ))}
                              </div>
                          )}
                          <p className={`text-sm ${isFeedbackNote ? 'text-slate-800 italic' : 'text-slate-700'}`}>{displayContent}</p>
                        </div>
                      )})
                   ) : (
                      <p className="text-sm text-slate-400 text-center py-4">Chưa có ghi chú nào.</p>
                   )}
                 </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 pt-4 border-t border-slate-100">
                <p>Ngày tạo: {new Date(currentReExam.createdAt).toLocaleString('vi-VN')}</p>
            </div>
        </div>

        <footer className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-100 shrink-0 rounded-b-lg">
          <div>
            {onDelete && canDelete('appointments') && (
                <button 
                    type="button"
                    onClick={onDelete} 
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 font-medium text-sm"
                >
                    Xóa lịch hẹn
                </button>
            )}
          </div>
          <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
                Huỷ
              </button>
              {canEdit('appointments') && (
                  <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold shadow-sm">
                    Lưu thay đổi
                  </button>
              )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ReExaminationDetailModal;
