
import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { DOCTORS } from '../constants';

interface CompleteLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onConfirm: (data: { 
      actualRevenue: number; 
      actualService: string; 
      note: string; 
      doctorName: string; 
      reExaminationDate: string;
      reExamService?: string;
      reExamNote?: string;
      reExamRevenue?: number;
  }) => void;
}

const CompleteLeadModal: React.FC<CompleteLeadModalProps> = ({ lead, onClose, onConfirm }) => {
  const [actualRevenue, setActualRevenue] = useState<string>('');
  const [actualService, setActualService] = useState<string>('');
  const [note, setNote] = useState('');
  const [doctorName, setDoctorName] = useState('');
  
  // Re-examination state
  const [isReExamScheduled, setIsReExamScheduled] = useState(false);
  const [reExaminationDate, setReExaminationDate] = useState('');
  const [reExamService, setReExamService] = useState('');
  const [reExamNote, setReExamNote] = useState('');
  const [reExamRevenue, setReExamRevenue] = useState<string>('');

  useEffect(() => {
    // Fill initial data from the lead prediction
    if (lead) {
        setActualRevenue(lead.potentialRevenue ? lead.potentialRevenue.toString() : '');
        setActualService(lead.service || '');
    }
  }, [lead]);

  // Auto-fill re-exam service when actual service changes, if empty
  useEffect(() => {
      if (actualService && !reExamService) {
          setReExamService(actualService);
      }
  }, [actualService]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualRevenue || !actualService) {
        alert("Vui lòng nhập doanh thu và dịch vụ thực tế.");
        return;
    }
    
    if (isReExamScheduled && !reExaminationDate) {
        alert("Vui lòng chọn ngày tái khám.");
        return;
    }

    onConfirm({
        actualRevenue: parseInt(actualRevenue),
        actualService: actualService,
        note: note,
        doctorName: doctorName,
        reExaminationDate: isReExamScheduled ? reExaminationDate : '',
        reExamService: isReExamScheduled ? reExamService : undefined,
        reExamNote: isReExamScheduled ? reExamNote : undefined,
        reExamRevenue: isReExamScheduled && reExamRevenue ? parseInt(reExamRevenue) : undefined
    });
  };

  const formatCurrency = (val: string) => {
      if (!val) return '';
      return new Intl.NumberFormat('vi-VN').format(parseInt(val));
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <header className="bg-green-600 p-4 flex justify-between items-center text-white shrink-0 rounded-t-lg">
          <h2 className="text-lg font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Xác nhận Chốt đơn
          </h2>
          <button type="button" onClick={onClose} className="text-green-100 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800 mb-4">
                Khách hàng có thể đã mua nhiều hơn hoặc thay đổi dịch vụ so với dự kiến. Vui lòng cập nhật thông tin thực tế để tạo phiếu CSKH chính xác.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dịch vụ thực tế khách làm</label>
              <input 
                type="text" 
                value={actualService} 
                onChange={(e) => setActualService(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 font-medium"
                placeholder="VD: Combo Nặn mụn + Peel da"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Doanh thu thực thu (VND)</label>
              <input 
                type="number" 
                value={actualRevenue} 
                onChange={(e) => setActualRevenue(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 font-bold text-green-700 text-lg"
                placeholder="0"
                required
              />
              {actualRevenue && (
                  <p className="text-xs text-slate-500 mt-1 text-right">{formatCurrency(actualRevenue)} VND</p>
              )}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bác sĩ thực hiện</label>
                <select
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 font-medium"
                >
                    <option value="">-- Chọn bác sĩ --</option>
                    {DOCTORS.map(dr => <option key={dr} value={dr}>{dr}</option>)}
                </select>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4">
                <div className="flex items-center mb-3">
                    <input
                        id="schedule-re-exam"
                        type="checkbox"
                        checked={isReExamScheduled}
                        onChange={(e) => setIsReExamScheduled(e.target.checked)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="schedule-re-exam" className="ml-2 block text-sm font-bold text-slate-700">
                        Hẹn lịch tái khám ngay
                    </label>
                </div>

                {isReExamScheduled && (
                    <div className="pl-6 space-y-3 animate-fade-in">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Ngày hẹn <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={reExaminationDate}
                                onChange={(e) => setReExaminationDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                                required={isReExamScheduled}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Dịch vụ tái khám</label>
                            <input
                                type="text"
                                value={reExamService}
                                onChange={(e) => setReExamService(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                                placeholder="VD: Kiểm tra da, Peel lần 2..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Doanh thu dự kiến (VND)</label>
                            <input
                                type="number"
                                value={reExamRevenue}
                                onChange={(e) => setReExamRevenue(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                                placeholder="0"
                            />
                            {reExamRevenue && (
                                <p className="text-[10px] text-slate-500 mt-1 text-right">{formatCurrency(reExamRevenue)} VND</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Ghi chú cho lần tới</label>
                            <textarea
                                value={reExamNote || ''}
                                onChange={(e) => setReExamNote(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                                placeholder="Lưu ý gì cho lần tái khám sau..."
                            ></textarea>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú thêm (Tùy chọn)</label>
                <textarea 
                    value={note || ''}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                    placeholder="Ghi chú về thanh toán, quà tặng..."
                ></textarea>
            </div>
          </div>

          <footer className="p-4 bg-slate-50 flex justify-end space-x-3 border-t border-slate-100 shrink-0 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
              Huỷ
            </button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-bold shadow-sm">
              Hoàn thành & Tạo CSKH
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CompleteLeadModal;
