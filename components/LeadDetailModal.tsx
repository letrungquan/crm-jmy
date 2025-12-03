import React, { useState, useEffect } from 'react';
import { Lead, Sale, Note, StatusConfig } from '../types';

interface LeadDetailModalProps {
  lead: Lead;
  sales: Sale[];
  statuses: StatusConfig[];
  cskhStatuses?: StatusConfig[];
  context?: 'sales' | 'cskh';
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
  currentUser: Sale['id'];
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, sales, statuses, cskhStatuses, context = 'sales', onClose, onSave, currentUser }) => {
  const [currentLead, setCurrentLead] = useState<Lead>(lead);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    setCurrentLead(lead);
  }, [lead]);
  
  const isCskh = context === 'cskh';
  const isAppointmentStatus = ['scheduled', 'completed'].includes(currentLead.status);
  const isContactingStatus = currentLead.status === 'contacting';

  const handleSave = () => {
    onSave(currentLead);
  };
  
  const handleAddNote = () => {
    if (newNote.trim() === '') return;
    const note: Note = {
      id: `note_${Date.now()}`,
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser,
    };
    setCurrentLead(prev => ({ ...prev, notes: [note, ...prev.notes], updatedAt: new Date().toISOString() }));
    setNewNote('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'potentialRevenue') {
      setCurrentLead(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
    } else if (name === 'projectedAppointmentDate') {
      // value is "YYYY-MM-DD", convert to ISO string. Append time to avoid timezone issues.
      setCurrentLead(prev => ({ ...prev, [name]: value ? `${value}T00:00:00` : null}));
    } else {
      setCurrentLead(prev => ({...prev, [name]: value}));
    }
  };

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

        <div className="p-6 overflow-y-auto flex-grow">
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
                <label className="block text-sm font-medium text-slate-600 mb-1">Ngày hoàn thành</label>
                 <p className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-700 h-10 flex items-center">
                  {currentLead.appointmentDate ? new Date(currentLead.appointmentDate).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </p>
              </div>
              <div>
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
                    value={currentLead.appointmentDate || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
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
                      className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
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
               </div>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Lịch sử tương tác</h3>
            <div className="space-y-3">
               <div className="flex space-x-2">
                 <textarea
                   value={newNote}
                   onChange={(e) => setNewNote(e.target.value)}
                   placeholder="Thêm ghi chú mới..."
                   rows={2}
                   className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                 ></textarea>
                 <button onClick={handleAddNote} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300" disabled={!newNote.trim()}>
                    Thêm
                 </button>
               </div>
              <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                 {currentLead.notes.length > 0 ? (
                    currentLead.notes.map(note => {
                      const creator = sales.find(s => s.id === note.createdBy);
                      return (
                      <div key={note.id} className="bg-white p-3 rounded-md border border-slate-200">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-slate-800">{creator?.name || 'Hệ thống'}</span>
                          <span className="text-slate-400">{new Date(note.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <p className="text-sm text-slate-700">{note.content}</p>
                      </div>
                    )})
                 ) : (
                    <p className="text-sm text-slate-400 text-center py-4">Chưa có ghi chú nào.</p>
                 )}
               </div>
            </div>
          </div>
        </div>

        <footer className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
            Huỷ
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Lưu thay đổi
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LeadDetailModal;