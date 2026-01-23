
import React from 'react';
import { CskhItem, StatusConfig } from '../types';
import CskhCard from './CskhCard';

interface CskhViewProps {
  cskhItems: CskhItem[];
  statuses: StatusConfig[];
  onUpdateCskhStatus: (cskhId: string, newStatusId: string) => void;
  onDeleteCskh?: (cskhId: string) => void;
  onCustomizeStatuses: () => void;
  onSelectCskh: (item: CskhItem) => void;
}

const CskhView: React.FC<CskhViewProps> = ({ cskhItems, statuses, onUpdateCskhStatus, onDeleteCskh, onCustomizeStatuses, onSelectCskh }) => {
  const [draggedOverColumn, setDraggedOverColumn] = React.useState<string | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, statusId: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const cskhId = e.dataTransfer.getData('cskhId');
    if (cskhId) {
      onUpdateCskhStatus(cskhId, statusId);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, statusId: string) => {
    e.preventDefault();
    setDraggedOverColumn(statusId);
  };
  
  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };
  
  const defaultStatusId = statuses[0]?.id;

  return (
    <div className="h-full flex flex-col">
       <div className="px-4 pt-4 mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hành trình CSKH</h2>
          <p className="text-sm text-slate-500 mt-1">
            Kéo thả khách hàng qua các giai đoạn để theo dõi quá trình chăm sóc sau dịch vụ.
          </p>
        </div>
         <button 
            onClick={onCustomizeStatuses}
            className="flex items-center text-sm text-blue-600 font-semibold hover:bg-blue-50 p-2 rounded-lg flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Tùy chỉnh trạng thái
          </button>
      </div>
      <div className="flex-1 flex overflow-x-auto p-2 sm:p-4 space-x-2 sm:space-x-4">
        {statuses.map(statusConfig => {
          const itemsInStatus = cskhItems.filter(item => (item.status || defaultStatusId) === statusConfig.id);
          const statusTheme = statusConfig.color;
          
          return (
            <div
              key={statusConfig.id}
              onDrop={(e) => handleDrop(e, statusConfig.id)}
              onDragOver={(e) => handleDragOver(e, statusConfig.id)}
              onDragLeave={handleDragLeave}
              className={`flex-shrink-0 w-72 sm:w-80 h-full flex flex-col rounded-xl transition-colors ${draggedOverColumn === statusConfig.id ? 'bg-blue-50' : ''}`}
            >
              <div className={`flex items-center justify-between p-3 rounded-t-xl ${statusTheme.bg}`}>
                  <div className="flex items-center">
                      <span className={`text-sm font-bold ${statusTheme.text}`}>{statusConfig.name}</span>
                      <span className="ml-2 text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full">{itemsInStatus.length}</span>
                  </div>
              </div>

              <div className={`p-2 space-y-3 overflow-y-auto flex-1 ${statusTheme.bg} bg-opacity-50`}>
                {itemsInStatus.map(item => (
                    <CskhCard
                      key={item.id}
                      item={item}
                      statusConfig={statusConfig}
                      onDelete={onDeleteCskh}
                      onClick={() => onSelectCskh(item)}
                    />
                ))}
                 {itemsInStatus.length === 0 && (
                     <div className="p-4 text-center text-sm text-slate-500">
                        Không có khách hàng.
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CskhView;
