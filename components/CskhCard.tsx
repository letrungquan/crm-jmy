
import React, { useMemo } from 'react';
import { CskhItem, StatusConfig } from '../types';
import { usePermissions } from '../contexts/PermissionContext';

interface CskhCardProps {
  item: CskhItem;
  statusConfig?: StatusConfig;
  onDelete?: (id: string) => void;
  onClick: () => void;
}

const CskhCard: React.FC<CskhCardProps> = ({ item, statusConfig, onDelete, onClick }) => {
  const { canEdit } = usePermissions();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (canEdit('cskh')) {
        e.dataTransfer.setData('cskhId', item.id);
    }
  };

  const isSlaBreached = useMemo(() => {
    if (!statusConfig?.sla_days) {
      return false;
    }
    const lastUpdate = new Date(item.updatedAt);
    const now = new Date();
    const diffTime = now.getTime() - lastUpdate.getTime();
    const daysInStatus = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return daysInStatus > statusConfig.sla_days;
  }, [item.updatedAt, statusConfig]);

  const daysSinceCreated = useMemo(() => {
    const creationDate = new Date(item.createdAt);
    const now = new Date();
    
    // Compare dates only, ignoring time part
    creationDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - creationDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [item.createdAt]);

  return (
    <div
      onClick={onClick}
      draggable={canEdit('cskh')}
      onDragStart={handleDragStart}
      className={`bg-white rounded-lg p-3 shadow-sm border hover:border-blue-500 group relative ${isSlaBreached ? 'border-red-400 ring-1 ring-red-400/50' : 'border-transparent'} ${canEdit('cskh') ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      {onDelete && (
          <button 
              type="button"
              onMouseDown={(e) => { e.stopPropagation(); }}
              onPointerDown={(e) => { e.stopPropagation(); }}
              onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={(e) => { 
                  console.log('Delete button clicked in CskhCard for:', item.id);
                  e.preventDefault();
                  e.stopPropagation(); 
                  onDelete(item.id); 
              }}
              className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity border border-slate-100 z-10"
              title="Xóa phiếu CSKH"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
          </button>
      )}

      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-sm text-slate-900 pr-6 flex-1">{item.customerName}</h4>
        <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full flex items-center bg-slate-200 text-slate-600" title={`Tạo ${daysSinceCreated} ngày trước`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {daysSinceCreated} ngày
            </span>
            {isSlaBreached && (
                <div className="flex-shrink-0" title={`Quá hạn SLA ${statusConfig.sla_days} ngày`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
        </div>
      </div>
      <div className="flex justify-between items-start mt-1">
          <p className="text-xs text-slate-500">{item.customerPhone}</p>
          {item.doctorName && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  {item.doctorName}
              </span>
          )}
      </div>
      
      <div className="mt-2.5 space-y-1.5 text-xs">
         <p className="font-medium text-slate-700 truncate" title={item.service}>{item.service}</p>
         {item.note && (
             <p className="text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 italic line-clamp-2">
                 "{item.note}"
             </p>
         )}
         <p className="text-slate-500">
            Ngày tạo: 
            <span className="font-semibold ml-1">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
        </p>
      </div>
    </div>
  );
};

export default CskhCard;
