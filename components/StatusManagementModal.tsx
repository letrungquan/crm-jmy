import React, { useState, useRef } from 'react';
import { StatusConfig, Lead } from '../types';

interface StatusManagementModalProps {
  statuses: StatusConfig[];
  leads: Lead[];
  onSave: (newStatuses: StatusConfig[]) => void;
  onClose: () => void;
  statusKey?: keyof Lead;
  defaultStatusId?: string;
}

const COLOR_OPTIONS = [
    { name: 'Gray', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-400' },
    { name: 'Orange', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-400' },
    { name: 'Blue', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-400' },
    { name: 'Yellow', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400' },
    { name: 'Green', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400' },
    { name: 'Red', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-400' },
    { name: 'Purple', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-400' },
    { name: 'Pink', bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-400' },
];

const StatusManagementModal: React.FC<StatusManagementModalProps> = ({ statuses, leads, onSave, onClose, statusKey = 'status', defaultStatusId }) => {
  const [localStatuses, setLocalStatuses] = useState<StatusConfig[]>(JSON.parse(JSON.stringify(statuses)));
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const statusesClone = [...localStatuses];
    const [draggedItemContent] = statusesClone.splice(dragItem.current, 1);
    statusesClone.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setLocalStatuses(statusesClone);
  };

  const handleNameChange = (id: string, newName: string) => {
    setLocalStatuses(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };
  
  const handleColorChange = (id: string, newColor: StatusConfig['color']) => {
    setLocalStatuses(prev => prev.map(s => s.id === id ? { ...s, color: newColor } : s));
    setOpenColorPicker(null);
  }

  const handleDelete = (id: string) => {
    const isStatusInUse = leads.some(lead => {
        const leadStatus = lead[statusKey];
        // If a default is provided (for CSKH) and the lead has no explicit status,
        // it's considered to be in the default status.
        if (defaultStatusId && (leadStatus === undefined || leadStatus === null)) {
            return defaultStatusId === id;
        }
        return leadStatus === id;
    });

    if (isStatusInUse) {
      alert('Không thể xóa trạng thái này vì đang có cơ hội/khách hàng sử dụng. Vui lòng chuyển họ sang trạng thái khác trước khi xóa.');
      return;
    }
    setLocalStatuses(prev => prev.filter(s => s.id !== id));
  };
  
  const handleAddStatus = () => {
    const newStatus: StatusConfig = {
      id: `status_${Date.now()}`,
      name: 'Trạng thái mới',
      color: COLOR_OPTIONS[0],
    };
    setLocalStatuses(prev => [...prev, newStatus]);
  }
  
  const handleSave = () => {
    onSave(localStatuses);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-xl h-full max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Tùy chỉnh Trạng thái</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-grow">
            <p className="text-sm text-slate-500 mb-4">Kéo thả <svg xmlns="http://www.w3.org/2000/svg" className="inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg> để sắp xếp thứ tự các cột trên bảng.</p>
            <div className="space-y-3">
                {localStatuses.map((status, index) => (
                    <div 
                        key={status.id} 
                        className="flex items-center p-3 bg-white rounded-lg shadow-sm"
                        draggable
                        onDragStart={() => dragItem.current = index}
                        onDragEnter={() => dragOverItem.current = index}
                        onDragEnd={handleDragSort}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div className="cursor-move text-slate-400 pr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </div>
                        <div className="relative">
                            <button type="button" onClick={() => setOpenColorPicker(openColorPicker === status.id ? null : status.id)} className="w-6 h-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                <span className={`block w-full h-full rounded-full ${status.color.bg} border-2 ${status.color.border}`}></span>
                            </button>
                            {openColorPicker === status.id && (
                                <div className="absolute z-10 top-full mt-2 grid grid-cols-4 gap-2 p-2 bg-white rounded-lg shadow-lg border">
                                    {COLOR_OPTIONS.map(color => (
                                        <button key={color.name} onClick={() => handleColorChange(status.id, color)} className="w-7 h-7 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
                                            <span className={`block w-full h-full rounded-full ${color.bg} border-2 ${color.border}`}></span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <input
                            type="text"
                            value={status.name}
                            onChange={(e) => handleNameChange(status.id, e.target.value)}
                            className="flex-grow mx-4 px-2 py-1 bg-transparent border-b-2 border-transparent focus:border-blue-500 focus:outline-none text-slate-800 font-medium"
                        />
                        <button onClick={() => handleDelete(status.id)} className="text-slate-400 hover:text-red-600">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
            </div>
            <button onClick={handleAddStatus} className="mt-6 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-100 hover:border-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Thêm trạng thái
            </button>
        </div>

        <footer className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">Huỷ</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Lưu thay đổi</button>
        </footer>
      </div>
    </div>
  );
};

export default StatusManagementModal;
