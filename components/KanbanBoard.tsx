
import React, { useState } from 'react';
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
  selectedSale,
  onSaleChange
}) => {
  const { canCreate, canEdit } = usePermissions();
  const [draggedOverColumn, setDraggedOverColumn] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

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

  const filteredLeads = leads.filter(lead => {
    // Filter by source
    if (selectedSource !== 'all' && lead.source !== selectedSource) {
      return false;
    }
    
    // Filter by sale
    if (selectedSale !== 'all') {
      if (selectedSale === 'unassigned') {
        if (lead.assignedTo) return false;
      } else {
        if (lead.assignedTo !== selectedSale) return false;
      }
    }

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return (
        lead.name.toLowerCase().includes(lowerQuery) ||
        lead.phone.includes(lowerQuery) ||
        (lead.service && lead.service.toLowerCase().includes(lowerQuery))
      );
    }
    
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const hasActiveFilters = selectedSource !== 'all' || selectedSale !== 'all' || searchQuery !== '';

  const clearFilters = () => {
    onSourceChange('all');
    onSaleChange('all');
    setSearchQuery('');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 flex flex-col sm:flex-row items-start sm:items-center flex-wrap gap-4 justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center flex-wrap gap-4 w-full sm:w-auto">
          <div className="flex items-center w-full sm:w-auto">
            <label htmlFor="source-filter" className="text-sm font-medium text-slate-600 mr-2 whitespace-nowrap">Nguồn:</label>
            <select
              id="source-filter"
              value={selectedSource}
              onChange={(e) => onSourceChange(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-slate-900"
            >
              {sources.map(source => (
                <option key={source} value={source}>
                  {source === 'all' ? 'Tất cả nguồn' : source}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center w-full sm:w-auto">
            <label htmlFor="sale-filter" className="text-sm font-medium text-slate-600 mr-2 whitespace-nowrap">Phụ trách:</label>
            <select
              id="sale-filter"
              value={selectedSale}
              onChange={(e) => onSaleChange(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-slate-900"
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
          <div className="flex items-center w-full sm:w-auto">
            <input
              type="text"
              placeholder="Tìm kiếm tên, SĐT, dịch vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-slate-900"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1.5 rounded-md hover:bg-red-50 transition-colors flex items-center w-full sm:w-auto justify-center sm:justify-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto justify-center">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Danh sách
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="flex-1 flex overflow-x-auto p-2 sm:p-4 space-x-2 sm:space-x-4">
          {statuses.map(statusConfig => {
            const leadsInStatus = filteredLeads.filter(lead => lead.status === statusConfig.id);
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
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dịch vụ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sale phụ trách</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doanh thu dự kiến</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nguồn</th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={toggleSortOrder}
                  >
                    <div className="flex items-center">
                      Ngày tạo
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredLeads.map(lead => {
                  const statusConfig = statuses.find(s => s.id === lead.status);
                  const salesperson = sales.find(s => s.id === lead.assignedTo);
                  return (
                    <tr key={lead.id} onClick={() => onSelectLead(lead)} className="hover:bg-slate-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{lead.name}</div>
                        <div className="text-sm text-slate-500">{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{lead.service || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig?.color.bg} ${statusConfig?.color.text}`}>
                          {statusConfig?.name || lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {salesperson?.name || 'Chưa gán'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {lead.potentialRevenue ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lead.potentialRevenue) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {lead.source || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(lead.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                Không tìm thấy cơ hội nào phù hợp.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
