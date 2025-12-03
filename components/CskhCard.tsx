import React, { useMemo } from 'react';
import { Lead, StatusConfig } from '../types';

interface CskhCardProps {
  lead: Lead;
  onClick: () => void;
  statusConfig?: StatusConfig;
}

const CskhCard: React.FC<CskhCardProps> = ({ lead, onClick, statusConfig }) => {

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('leadId', lead.id);
  };

  const isSlaBreached = useMemo(() => {
    if (!statusConfig?.sla_days) {
      return false;
    }
    const lastUpdate = new Date(lead.updatedAt);
    const now = new Date();
    const diffTime = now.getTime() - lastUpdate.getTime();
    const daysInStatus = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return daysInStatus > statusConfig.sla_days;
  }, [lead.updatedAt, statusConfig]);

  const daysSinceCompletion = useMemo(() => {
    // The CSKH pipeline is only for completed leads, which should have an appointmentDate.
    // Fallback to updatedAt for safety, although appointmentDate is expected.
    const completionDate = new Date(lead.appointmentDate || lead.updatedAt);
    const now = new Date();
    
    // Compare dates only, ignoring time part
    completionDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - completionDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [lead.appointmentDate, lead.updatedAt]);

  return (
    <div
      draggable="true"
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`bg-white rounded-lg p-3 shadow-sm cursor-pointer border hover:border-blue-500 group ${isSlaBreached ? 'border-red-400 ring-1 ring-red-400/50' : 'border-transparent'}`}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-sm text-slate-900 pr-2 flex-1">{lead.name}</h4>
        <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full flex items-center bg-slate-200 text-slate-600" title={`Hoàn thành ${daysSinceCompletion} ngày trước`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {daysSinceCompletion} ngày
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
      <p className="text-xs text-slate-500 mt-1">{lead.phone}</p>
      
      <div className="mt-2.5 space-y-1.5 text-xs">
         <p className="font-medium text-slate-700">{lead.service}</p>
         <p className="text-slate-500">
            Hoàn thành: 
            <span className="font-semibold ml-1">{new Date(lead.appointmentDate || lead.updatedAt).toLocaleDateString('vi-VN')}</span>
        </p>
      </div>
    </div>
  );
};

export default CskhCard;
