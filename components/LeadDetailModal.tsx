
import React, { useState, useEffect } from 'react';
import { Lead, Sale, Note, StatusConfig } from '../types';
import { DOCTORS } from '../constants';
import { usePermissions } from '../contexts/PermissionContext';

interface LeadDetailModalProps {
  lead: Lead;
  sales: Sale[];
  statuses: StatusConfig[];
  cskhStatuses?: StatusConfig[];
  context?: 'sales' | 'cskh';
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
  onAddNote: (leadId: string, content: string) => void;
  onDelete?: () => void;
  currentUser: Sale['id'];
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, sales, statuses, cskhStatuses, context = 'sales', onClose, onSave, onAddNote, onDelete, currentUser }) => {
  const { canDelete, canEdit } = usePermissions();
  const [currentLead, setCurrentLead] = useState<Lead>(lead);
  const [newNote, setNewNote] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Feedback state
  const [isFeedback, setIsFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);

  useEffect(() => {
    setCurrentLead(prev => ({ ...prev, notes: lead.notes }));
  }, [lead.notes]);
  
  const isCskh = context === 'cskh';
  const isAppointmentStatus = ['scheduled', 'completed'].includes(currentLead.status);
  const isContactingStatus = currentLead.status === 'contacting';

  const handleSave = () => {
    // Clean up data to avoid conflicting dates (stale data)
    const leadToSave = { ...currentLead };
    
    if (isContactingStatus) {
        // If in contacting mode, we rely on projected date. 
        // Clear appointmentDate so it doesn't persist and confuse the calendar.
        leadToSave.appointmentDate = null;
    } else if (isAppointmentStatus) {
        // If scheduled, we rely on appointmentDate. 
        // We can optionally clear projected, but keeping it as history is fine.
        // Priority is handled in CalendarView anyway.
    }

    onSave(leadToSave);
  };
  
  const handleDelete = async () => {
      if (!onDelete) return;
      setIsDeleting(true);
      await onDelete(); // Calls parent async function
      setIsDeleting(false); // Reset loading state immediately after parent finishes (success or error)
  }
  
  const handleAddNote = () => {
    if (newNote.trim() === '') return;
    
    let finalContent = newNote.trim();
    if (isFeedback) {
        finalContent = `[PHẢN HỒI] [${feedbackRating} Sao] ${finalContent}`;
    }

    onAddNote(lead.id, finalContent);
    setNewNote('');
    setIsFeedback(false);
    setFeedbackRating(5);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'potentialRevenue') {
      setCurrentLead(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
    } else if (name === 'projectedAppointmentDate') {
      // value is "YYYY-MM-DD", convert to ISO string. 
      // Use 12:00:00 instead of 00:00:00 to prevent timezone shifting issues when viewing on calendar
      setCurrentLead(prev => ({ ...prev, [name]: value ? `${value}T12:00:00` : null}));
    } else if (name === 'reExaminationDate') {
      // Handle re-examination date
      setCurrentLead(prev => ({ ...prev, [name]: value ? `${value}T12:00:00` : null}));
    } else {
      setCurrentLead(prev => ({...prev, [name]: value}));
    }
  };

  // Helper to format date for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatForDateTimeInput = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const pad = (num: number) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper to format date for date-only input (YYYY-MM-DD)
  const formatForDateInput = (dateString: string | null) => {
      if (!dateString) return '';
      try {
          return dateString.split('T')[0];
      } catch {
          return '';
      }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-lg h-full max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">{lead.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
          {isCskh ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Trạng thái CSKH</label>
                <select name="cskhStatus" value={currentLead.cskhStatus || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900">
                  {cskhStatuses?.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sale phụ trách</label>
                <p className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-700 h-10 flex items-center">
                  {sales.find(s => s.id === currentLead.assignedTo)?.name || 'Chưa gán'}
                </p>
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Bác sĩ thực hiện</label>
                <select name="doctorName" value={currentLead.doctorName || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900">
                    <option value="">-- Chưa gán --</option>
                    {DOCTORS.map(dr => <option key={dr} value={dr}>{dr}</option>)}
                </select>
              </div>
              
              {/* New Re-examination Date Field */}
              <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Ngày hẹn tái khám</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="reExaminationDate"
                      value={formatForDateInput(currentLead.reExaminationDate || null)}
                      onChange={handleInputChange}
                      onClick={(e) => {
                        try { (e.target as any).showPicker?.(); } catch (err) {}
                      }}
                      className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 cursor-pointer font-medium"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                  </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Dịch vụ tư vấn</label>
                 <p className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-700 h-10 flex items-center truncate">
                  {currentLead.service}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Doanh thu (VND)</label>
                <p className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-700 h-10 flex items-center">
                  {currentLead.potentialRevenue ? new Intl.NumberFormat('vi-VN').format(currentLead.potentialRevenue) : 'N/A'}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Mô tả/Ghi chú liệu trình</label>
                 <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-700 min-h-[80px]">
                  {currentLead.description || <span className="text-slate-400 italic">Không có.</span>}
                </div>
              </div>
               <div className="md:col-span-2">
                 <p className="text-sm text-slate-500"><strong>SĐT:</strong> {lead.phone}</p>
                 <p className="text-sm text-slate-500"><strong>Nguồn:</strong> {lead.source}</p>
                 <p className="text-sm text-slate-500"><strong>Ngày tạo:</strong> {new Date(lead.createdAt).toLocaleString('vi-VN')}</p>
                 {lead.updatedAt && <p className="text-sm text-slate-500"><strong>Ngày cập nhật:</strong> {new Date(lead.updatedAt).toLocaleString('vi-VN')}</p>}
             </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Trạng thái</label>
                <select name="status" value={currentLead.status} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900">
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sale phụ trách</label>
                <select name="assignedTo" value={currentLead.assignedTo || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900">
                  <option value="">Chưa gán</option>
                  {sales.map(sale => (
                    <option key={sale.id} value={sale.id}>{sale.name}</option>
                  ))}
                </select>
              </div>
              
              {isAppointmentStatus && (
                 <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Ngày hẹn</label>
                   <input
                    type="datetime-local"
                    name="appointmentDate"
                    value={formatForDateTimeInput(currentLead.appointmentDate)}
                    onChange={handleInputChange}
                    onClick={(e) => {
                      try {
                        (e.target as any).showPicker?.();
                      } catch (err) {
                        // showPicker might fail in restricted iframes, simply ignore
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 cursor-pointer"
                  />
                </div>
              )}
              {isContactingStatus && (
                 <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Ngày dự thu</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="projectedAppointmentDate"
                      value={currentLead.projectedAppointmentDate ? currentLead.projectedAppointmentDate.split('T')[0] : ''}
                      onChange={handleInputChange}
                      onClick={(e) => {
                        try {
                          (e.target as any).showPicker?.();
                        } catch (err) {
                          // showPicker might fail in restricted iframes, simply ignore
                        }
                      }}
                      className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 cursor-pointer"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                  </div>
                </div>
              )}
               <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Dịch vụ tư vấn</label>
                   <input
                    type="text"
                    name="service"
                    value={currentLead.service}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Doanh thu dự kiến (VND)</label>
                  <input
                    type="number"
                    name="potentialRevenue"
                    value={currentLead.potentialRevenue ?? ''}
                    onChange={handleInputChange}
                    placeholder="VD: 990000"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Mô tả/Ghi chú nhanh</label>
                   <textarea
                    name="description"
                    rows={3}
                    value={currentLead.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  />
                </div>

               <div className="md:col-span-2">
                   <p className="text-sm text-slate-500"><strong>SĐT:</strong> {lead.phone}</p>
                   <p className="text-sm text-slate-500"><strong>Nguồn:</strong> {lead.source}</p>
                   <p className="text-sm text-slate-500"><strong>Ngày tạo:</strong> {new Date(lead.createdAt).toLocaleString('vi-VN')}</p>
                   {lead.updatedAt && <p className="text-sm text-slate-500"><strong>Ngày cập nhật:</strong> {new Date(lead.updatedAt).toLocaleString('vi-VN')}</p>}
               </div>
            </div>
          )}
          
          <div className="mt-6">
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
                       value={newNote}
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
                 {currentLead.notes.length > 0 ? (
                    currentLead.notes.map(note => {
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
        </div>

        <footer className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
          <div>
            {onDelete && canDelete('leads') && (
                <button 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  className={`px-4 py-2 bg-white border border-red-200 text-red-600 rounded-md text-sm font-medium ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'}`}
                >
                    {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
                Huỷ
            </button>
            {canEdit('leads') && (
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Lưu thay đổi
                </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LeadDetailModal;
