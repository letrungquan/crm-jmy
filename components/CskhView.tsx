
import React, { useState } from 'react';
import { CskhItem, StatusConfig } from '../types';
import CskhCard from './CskhCard';
import { usePermissions } from '../contexts/PermissionContext';

interface CskhViewProps {
  cskhItems: CskhItem[];
  statuses: StatusConfig[];
  onUpdateCskhStatus: (cskhId: string, newStatusId: string) => void;
  onDeleteCskh?: (cskhId: string) => void;
  onSelectCskh: (item: CskhItem) => void;
}

const CskhView: React.FC<CskhViewProps> = ({ cskhItems, statuses, onUpdateCskhStatus, onDeleteCskh, onSelectCskh }) => {
  const { canEdit } = usePermissions();
  const [draggedOverColumn, setDraggedOverColumn] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, statusId: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    if (!canEdit('cskh')) return;
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

  const filteredItems = cskhItems.filter(item => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      item.customerName.toLowerCase().includes(lowerQuery) ||
      item.customerPhone.includes(lowerQuery) ||
      (item.service && item.service.toLowerCase().includes(lowerQuery))
    );
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="h-full flex flex-col">
       <div className="px-4 pt-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center flex-wrap gap-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-2xl font-bold text-slate-800">Hành trình CSKH</h2>
          <p className="text-sm text-slate-500 mt-1">
            Kéo thả khách hàng qua các giai đoạn để theo dõi quá trình chăm sóc sau dịch vụ.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Tìm kiếm tên, SĐT, dịch vụ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-slate-900"
          />
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
      </div>

      {viewMode === 'kanban' ? (
        <div className="flex-1 flex overflow-x-auto p-2 sm:p-4 space-x-2 sm:space-x-4">
          {statuses.map(statusConfig => {
            const itemsInStatus = filteredItems.filter(item => (item.status || defaultStatusId) === statusConfig.id);
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
      ) : (
        <div className="flex-1 overflow-hidden p-4 flex flex-col">
          <div className="bg-white rounded-lg shadow overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dịch vụ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bác sĩ</th>
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
                {filteredItems.map(item => {
                  const statusConfig = statuses.find(s => s.id === (item.status || defaultStatusId));
                  return (
                    <tr key={item.id} onClick={() => onSelectCskh(item)} className="hover:bg-slate-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{item.customerName}</div>
                        <div className="text-sm text-slate-500">{item.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 max-w-xs truncate" title={item.service || ''}>{item.service || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig?.color.bg} ${statusConfig?.color.text}`}>
                          {statusConfig?.name || item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {item.doctorName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                Không tìm thấy khách hàng nào phù hợp.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CskhView;
