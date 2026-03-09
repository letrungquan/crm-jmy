
import React from 'react';
import { Lead, Sale, StatusConfig } from '../types';
import KanbanCard from './KanbanCard';
import { usePermissions } from '../contexts/PermissionContext';

interface KanbanBoardProps {
  leads: Lead[];
  sales: Sale[];
  statuses: StatusConfig[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStatus: (leadId: string, newStatusId: string) => void;
  onAddLead: (statusId: string) => void;
  onAcceptLead: (leadId: string) => void;
  onDeleteLead?: (leadId: string) => void;
  sources: string[];
  selectedSource: string;
  onSourceChange: (source: string) => void;
  onCustomizeStatuses: () => void;
  selectedSale: string;
  onSaleChange: (saleId: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  leads, 
  sales, 
  statuses,
  onSelectLead, 
  onUpdateLeadStatus, 
  onAddLead, 
  onAcceptLead,
  onDeleteLead,
  sources,
  selectedSource,
  onSourceChange,
  onCustomizeStatuses,
  selectedSale,
  onSaleChange
}) => {
  const { canCreate, canEdit } = usePermissions();
  const [draggedOverColumn, setDraggedOverColumn] = React.useState<string | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, statusId: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    if (!canEdit('leads')) return;
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      onUpdateLeadStatus(leadId, statusId);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, statusId: string) => {
    e.preventDefault();
    setDraggedOverColumn(statusId);
  };
  
  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 flex items-center flex-wrap gap-4">
          <div className="flex items-center">
            <label htmlFor="source-filter" className="text-sm font-medium text-slate-600 mr-2">Nguồn:</label>
            <select
              id="source-filter"
              value={selectedSource}
              onChange={(e) => onSourceChange(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-slate-900"
            >
              {sources.map(source => (
                <option key={source} value={source}>
                  {source === 'all' ? 'Tất cả nguồn' : source}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label htmlFor="sale-filter" className="text-sm font-medium text-slate-600 mr-2">Người phụ trách:</label>
            <select
              id="sale-filter"
              value={selectedSale}
              onChange={(e) => onSaleChange(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-slate-900"
            >
              <option value="all">Tất cả</option>
              <option value="unassigned">Chưa gán</option>
              {sales.map(sale => (
                <option key={sale.id} value={sale.id}>
                  {sale.name}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={onCustomizeStatuses}
            className="flex items-center text-sm text-blue-600 font-semibold hover:bg-blue-50 p-2 rounded-lg"
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
          const leadsInStatus = leads.filter(lead => lead.status === statusConfig.id);
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
                      <span className="ml-2 text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full">{leadsInStatus.length}</span>
                  </div>
                  <button className="text-slate-500 hover:text-slate-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                  </button>
              </div>

              <div className={`p-2 space-y-3 overflow-y-auto flex-1 ${statusTheme.bg}`}>
                {leadsInStatus.map(lead => {
                  const salesperson = sales.find(s => s.id === lead.assignedTo);
                  return (
                    <KanbanCard
                      key={lead.id}
                      lead={lead}
                      salesperson={salesperson}
                      onClick={() => onSelectLead(lead)}
                      onAcceptLead={onAcceptLead}
                      onDelete={onDeleteLead ? () => onDeleteLead(lead.id) : undefined}
                    />
                  );
                })}
                {canCreate('leads') && (
                  <button 
                    onClick={() => onAddLead(statusConfig.id)}
                    className="w-full text-left text-sm text-slate-500 hover:bg-slate-200 p-2 rounded-lg flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Thêm mới
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
