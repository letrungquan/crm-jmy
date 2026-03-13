
import React from 'react';
import { Lead, Sale } from '../types';
import { usePermissions } from '../contexts/PermissionContext';

interface KanbanCardProps {
  lead: Lead;
  salesperson?: Sale;
  onClick: () => void;
  onAcceptLead: (leadId: string) => void;
  onDelete?: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ lead, salesperson, onClick, onAcceptLead, onDelete }) => {
  const { canEdit } = usePermissions();
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (canEdit('leads')) {
        e.dataTransfer.setData('leadId', lead.id);
    }
  };
  
  const handleAcceptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAcceptLead(lead.id);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };
  
  const formattedDate = lead.appointmentDate 
    ? (() => {
        const date = new Date(lead.appointmentDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}/${month}/${day} ${hours}:${minutes}`;
      })()
    : null;

  const daysSinceLastUpdate = (() => {
    const lastUpdate = new Date(lead.updatedAt);
    const now = new Date();
    // Reset hours, minutes, seconds, and milliseconds to compare dates only
    lastUpdate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - lastUpdate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  })();
  
  const stalenessIndicator = () => {
    if (['completed', 'lost'].includes(lead.status)) return null;

    let colorClass = '';
    if (daysSinceLastUpdate === 0) {
        colorClass = 'bg-slate-200 text-slate-600';
    } else if (daysSinceLastUpdate <= 3) {
        colorClass = 'bg-yellow-100 text-yellow-800';
    } else {
        colorClass = 'bg-red-100 text-red-800';
    }

    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex items-center ${colorClass}`} title={`Cập nhật lần cuối ${daysSinceLastUpdate} ngày trước`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {daysSinceLastUpdate} ngày
        </span>
    );
  };


  return (
    <div
      draggable={canEdit('leads')}
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`bg-white rounded-lg p-3 shadow-sm border border-transparent hover:border-blue-500 group relative ${canEdit('leads') ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      {onDelete && (
        <button 
            onClick={handleDeleteClick}
            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity border border-slate-100 z-10"
            title="Xóa cơ hội"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
      )}

      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-sm text-slate-900 pr-6 flex-1">{lead.name}</h4>
         <div className="flex items-center space-x-2 flex-shrink-0">
             {stalenessIndicator()}
         </div>
      </div>
      <p className="text-xs text-slate-500 mt-1">{lead.phone}</p>
      <p className="text-xs font-medium text-slate-700 mt-2">{lead.service}</p>
      
      {formattedDate && (
        <div className="text-xs text-blue-600 font-semibold mt-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formattedDate}
        </div>
      )}

      <div className="mt-2.5 space-y-2">
        <p className="text-xs text-slate-600">{lead.description}</p>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
          {lead.source}
        </span>
        <div className="flex items-center text-xs text-slate-500" title={salesperson ? `Sale: ${salesperson.name}` : 'Chưa gán sale'}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {salesperson ? (
                <span className="font-semibold text-indigo-600 truncate">{salesperson.name}</span>
            ) : (
                <span className="italic text-slate-400">Chưa gán</span>
            )}
        </div>
      </div>

      {lead.status === 'new' && (
        <div className="mt-2">
            <button 
                onClick={handleAcceptClick}
                className="w-full text-center px-2 py-1.5 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
                Nhận lead
            </button>
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
