
import React from 'react';
import { Lead, Sale, StatusConfig } from '../types';
import { usePermissions } from '../contexts/PermissionContext';

interface LeadCardProps {
  lead: Lead;
  salesperson?: Sale;
  onClick: () => void;
  statusConfig?: StatusConfig;
  onDelete?: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, salesperson, onClick, statusConfig, onDelete }) => {
  const { canDelete, canEdit } = usePermissions();
  // FIX: Use the passed statusConfig for dynamic colors and names, with a fallback for safety.
  const statusTheme = statusConfig?.color || { bg: 'bg-gray-100', text: 'text-gray-800' };
  const statusName = statusConfig?.name || lead.status;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <div
      draggable={canEdit('leads')}
      onDragStart={(e) => {
        if (canEdit('leads')) {
            e.dataTransfer.setData('leadId', lead.id);
        }
      }}
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-4 ${canEdit('leads') ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} transition-all hover:shadow-lg hover:ring-2 hover:ring-blue-500 relative group`}
    >
      {onDelete && canDelete('leads') && (
        <button 
            onClick={handleDeleteClick}
            className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 z-10"
            title="Xóa cơ hội"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
      )}

      <div className="flex justify-between items-start pr-8">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{lead.name}</h3>
          <p className="text-sm text-slate-500 flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {lead.phone}
          </p>
        </div>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusTheme.bg} ${statusTheme.text}`}>
          {statusName}
        </span>
      </div>
       <div className="mt-3 text-sm">
        <p className="text-slate-600 font-medium">{lead.service}</p>
        <p className="text-slate-500 truncate mt-1">{lead.description}</p>
       </div>
      <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center text-sm">
        <p className="text-slate-400">Nguồn: <span className="font-medium text-slate-500">{lead.source}</span></p>
        {salesperson && (
          <div className="flex items-center">
             <span className="text-slate-400 mr-2">Sale:</span>
             <span className="font-semibold text-indigo-600">{salesperson.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadCard;
