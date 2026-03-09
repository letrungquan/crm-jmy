
import React, { useState, useMemo } from 'react';
import { ReExamination, Sale } from '../types';
import { usePermissions } from '../contexts/PermissionContext';

interface ReExaminationViewProps {
  reExaminations: ReExamination[];
  sales: Sale[];
  onUpdateStatus?: (id: string, status: 'pending' | 'called' | 'completed' | 'cancelled' | 'converted') => void;
  onConvertToLead?: (reExam: ReExamination) => void;
  onAddReExam?: () => void;
  onSelectReExam?: (reExam: ReExamination) => void;
  onDeleteReExam?: (id: string) => void;
}

const ReExaminationView: React.FC<ReExaminationViewProps> = ({ reExaminations, sales, onUpdateStatus, onConvertToLead, onAddReExam, onSelectReExam, onDeleteReExam }) => {
  const { canCreate, canDelete } = usePermissions();
  const [viewMode, setViewMode] = useState<'time' | 'doctor' | 'kanban'>('kanban');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active'>('active');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all');
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  
  const getSaleName = (id: string | null | undefined) => {
      if (!id) return 'Chưa gán';
      return sales.find(s => s.id === id)?.name || 'Unknown';
  };

  // Helper to sort by date and time
  const sortByDateAndTime = (a: ReExamination, b: ReExamination) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      // If dates are equal, sort by time
      if (a.appointmentTime && b.appointmentTime) {
          return a.appointmentTime.localeCompare(b.appointmentTime);
      }
      return 0;
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
      e.dataTransfer.setData('reExamId', id);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: string) => {
      e.preventDefault();
      setDraggedOverColumn(null);
      const id = e.dataTransfer.getData('reExamId');
      if (id && onUpdateStatus) {
          onUpdateStatus(id, status as any);
      }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: string) => {
      e.preventDefault();
      setDraggedOverColumn(status);
  };
  
  const handleDragLeave = () => {
      setDraggedOverColumn(null);
  };

  // Grouping Logic
  const groupedItems = useMemo<Record<string, ReExamination[]>>(() => {
      let activeItems = reExaminations.filter(item => 
          filterStatus === 'all' ? true : ['pending', 'called'].includes(item.status)
      );

      // Apply Date Filter
      const now = new Date();
      now.setHours(0,0,0,0);
      
      if (dateFilter !== 'all') {
          activeItems = activeItems.filter(item => {
              const itemDate = new Date(item.date);
              itemDate.setHours(0,0,0,0);
              
              if (dateFilter === 'today') {
                  return itemDate.getTime() === now.getTime();
              } else if (dateFilter === 'tomorrow') {
                  const tomorrow = new Date(now);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return itemDate.getTime() === tomorrow.getTime();
              } else if (dateFilter === 'week') {
                  const startOfWeek = new Date(now);
                  const day = now.getDay() || 7; // Get current day number, converting Sun (0) to 7
                  if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); // Set to Monday of this week
                  
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(endOfWeek.getDate() + 6);
                  
                  return itemDate.getTime() >= startOfWeek.getTime() && itemDate.getTime() <= endOfWeek.getTime();
              }
              return true;
          });
      }

      if (viewMode === 'doctor') {
          const groups: Record<string, ReExamination[]> = {};
          activeItems.forEach(item => {
              const docName = item.doctorName || 'Chưa gán Bác sĩ';
              if (!groups[docName]) groups[docName] = [];
              groups[docName].push(item);
          });
          Object.keys(groups).forEach(key => groups[key].sort(sortByDateAndTime));
          return groups;
      } else if (viewMode === 'kanban') {
          const groups: Record<string, ReExamination[]> = {
              'pending': [],
              'called': [],
              'completed': [],
              'converted': [],
              'cancelled': []
          };
          
          activeItems.forEach(item => {
              if (groups[item.status]) {
                  groups[item.status].push(item);
              }
          });
          
          Object.keys(groups).forEach(key => groups[key].sort(sortByDateAndTime));
          return groups;
      } else {
          // Time-based grouping
          const groups: Record<string, ReExamination[]> = {
              'Quá hạn': [],
              'Hôm nay': [],
              'Sắp tới (7 ngày)': [],
              'Tương lai xa': [],
              'Đã hoàn thành': []
          };

          activeItems.forEach(item => {
              if (['completed', 'converted', 'cancelled'].includes(item.status)) {
                  groups['Đã hoàn thành'].push(item);
                  return;
              }
              const date = new Date(item.date);
              date.setHours(0,0,0,0);
              
              if (date.getTime() < now.getTime()) {
                  groups['Quá hạn'].push(item);
              } else if (date.getTime() === now.getTime()) {
                  groups['Hôm nay'].push(item);
              } else {
                  const diffTime = Math.abs(date.getTime() - now.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays <= 7) groups['Sắp tới (7 ngày)'].push(item);
                  else groups['Tương lai xa'].push(item);
              }
          });
          // Sort each group
          Object.keys(groups).forEach(key => groups[key].sort(sortByDateAndTime));
          return groups;
      }
  }, [reExaminations, viewMode, filterStatus, dateFilter]);

  const STATUS_CONFIG: Record<string, { name: string, color: { bg: string, text: string } }> = {
      'pending': { name: 'Cần gọi', color: { bg: 'bg-blue-100', text: 'text-blue-800' } },
      'called': { name: 'Đã gọi', color: { bg: 'bg-orange-100', text: 'text-orange-800' } },
      'completed': { name: 'Hoàn thành', color: { bg: 'bg-green-100', text: 'text-green-800' } },
      'converted': { name: 'Đã chuyển Lead', color: { bg: 'bg-purple-100', text: 'text-purple-800' } },
      'cancelled': { name: 'Hủy', color: { bg: 'bg-red-100', text: 'text-red-800' } }
  };

  const getColumnTitle = (key: string) => {
      if (viewMode === 'kanban') {
          return STATUS_CONFIG[key]?.name || key;
      }
      return key;
  };

  const getColumnColor = (key: string) => {
      if (viewMode === 'kanban') {
          return STATUS_CONFIG[key]?.color || { bg: 'bg-slate-100', text: 'text-slate-800' };
      }
      return { bg: 'bg-slate-100', text: 'text-slate-800' };
  };

  const renderCard = (item: ReExamination) => {
      const date = new Date(item.date);
      const today = new Date();
      today.setHours(0,0,0,0);
      const itemDateOnly = new Date(item.date);
      itemDateOnly.setHours(0,0,0,0);

      const isOverdue = item.status === 'pending' && itemDateOnly.getTime() < today.getTime();
      const isToday = itemDateOnly.getTime() === today.getTime();

      return (
          <div 
              key={item.id} 
              draggable={viewMode === 'kanban'}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onClick={() => onSelectReExam && onSelectReExam(item)}
              className={`bg-white rounded-lg p-3 shadow-sm cursor-pointer border border-transparent hover:border-blue-500 group relative transition-all ${isOverdue ? 'border-l-4 border-l-red-500' : ''} ${isToday ? 'border-l-4 border-l-orange-500' : ''}`}
          >
              {/* Delete Button */}
              {onDeleteReExam && (
                  <button 
                      type="button"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                      onPointerDown={(e) => { e.stopPropagation(); }}
                      onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={(e) => { 
                          e.preventDefault();
                          e.stopPropagation(); 
                          onDeleteReExam(item.id); 
                      }}
                      className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 z-10"
                      title="Xóa lịch hẹn"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                  </button>
              )}

              <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-sm text-slate-900 pr-6 flex-1">{item.customerName}</h4>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                      {isOverdue && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full flex items-center bg-red-100 text-red-800">
                              Quá hạn
                          </span>
                      )}
                      {isToday && !isOverdue && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full flex items-center bg-orange-100 text-orange-800">
                              Hôm nay
                          </span>
                      )}
                  </div>
              </div>
              
              <div className="text-xs text-slate-500 mt-1">{item.customerPhone}</div>
              <div className="text-xs font-medium text-slate-700 mt-2 truncate" title={item.service}>
                  DV: {item.service}
              </div>
              
              {item.potentialRevenue && (
                  <div className="text-xs font-bold text-green-600 mt-1">
                      {new Intl.NumberFormat('vi-VN').format(item.potentialRevenue)} VND
                  </div>
              )}

              <div className="text-xs text-blue-600 font-semibold mt-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {date.toLocaleDateString('vi-VN')}
                  {item.appointmentTime && (
                      <span className="ml-2 text-blue-800 font-bold bg-blue-100 px-1.5 rounded">
                          {item.appointmentTime}
                      </span>
                  )}
              </div>

              {item.note && (
                  <div className="mt-2.5 space-y-2">
                      <p className="text-xs text-slate-600 italic line-clamp-2">"{item.note}"</p>
                  </div>
              )}

              <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center text-xs text-slate-500" title={`BS: ${item.doctorName || '---'}`}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                       </svg>
                       <span className="truncate max-w-[80px]">{item.doctorName || '---'}</span>
                  </div>
                  <div className="flex items-center text-xs text-slate-500" title={`Sale: ${getSaleName(item.assignedTo)}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-indigo-600 truncate max-w-[80px]">{getSaleName(item.assignedTo)}</span>
                  </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.status !== 'converted' && item.status !== 'cancelled' && onConvertToLead && (
                       <button 
                          onClick={(e) => { e.stopPropagation(); onConvertToLead(item); }}
                          className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10px] font-bold py-1 px-2 rounded border border-blue-200 text-center"
                       >
                          Upsell
                       </button>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-full flex flex-col">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Lịch Tái Khám</h2>
                <p className="text-sm text-slate-500 mt-1">Quản lý lịch hẹn tái khám của khách hàng cũ.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-wrap">
                {onAddReExam && canCreate('re_exams') && (
                    <button 
                        onClick={onAddReExam}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold shadow-sm flex items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tạo lịch hẹn
                    </button>
                )}

                {/* Date Filter */}
                <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                    <button onClick={() => setDateFilter('today')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateFilter === 'today' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>Hôm nay</button>
                    <button onClick={() => setDateFilter('tomorrow')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateFilter === 'tomorrow' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>Ngày mai</button>
                    <button onClick={() => setDateFilter('week')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateFilter === 'week' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>Tuần này</button>
                    <button onClick={() => setDateFilter('all')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>Tất cả</button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                    <button 
                        onClick={() => setViewMode('kanban')} 
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${viewMode === 'kanban' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                        Kanban
                    </button>
                    <button 
                        onClick={() => setViewMode('doctor')} 
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${viewMode === 'doctor' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Bác sĩ
                    </button>
                    <button 
                        onClick={() => setViewMode('time')} 
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${viewMode === 'time' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Thời gian
                    </button>
                </div>

                {/* Filter Status Toggle */}
                <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                    <button 
                        onClick={() => setFilterStatus('active')} 
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'active' ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Cần xử lý
                    </button>
                    <button 
                        onClick={() => setFilterStatus('all')} 
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'all' ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Tất cả
                    </button>
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-x-auto pb-4">
            {Object.keys(groupedItems).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-dashed border-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    <p className="text-slate-500">Không có lịch tái khám nào phù hợp.</p>
                </div>
            ) : (
                <div className="flex gap-4 min-w-full h-full">
                    {Object.entries(groupedItems).map(([groupTitle, items]) => {
                        const list = items as ReExamination[];
                        const color = getColumnColor(groupTitle);
                        
                        return (
                        <div 
                            key={groupTitle} 
                            onDrop={(e) => viewMode === 'kanban' ? handleDrop(e, groupTitle) : undefined}
                            onDragOver={(e) => viewMode === 'kanban' ? handleDragOver(e, groupTitle) : undefined}
                            onDragLeave={handleDragLeave}
                            className={`w-80 flex-shrink-0 flex flex-col rounded-xl transition-colors max-h-[calc(100vh-180px)] ${draggedOverColumn === groupTitle ? 'bg-blue-50' : ''}`}
                        >
                            <div className={`p-3 rounded-t-xl flex justify-between items-center ${color.bg}`}>
                                <div className="flex items-center">
                                    <span className={`text-sm font-bold ${color.text}`}>{getColumnTitle(groupTitle)}</span>
                                    <span className="ml-2 text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full">{list.length}</span>
                                </div>
                            </div>
                            <div className={`p-2 space-y-3 overflow-y-auto flex-1 custom-scrollbar ${color.bg} bg-opacity-30`}>
                                {list.length > 0 ? (
                                    list.map(item => renderCard(item))
                                ) : (
                                    <div className="text-center py-8 text-xs text-slate-400 italic">Trống</div>
                                )}
                                {viewMode === 'kanban' && groupTitle === 'pending' && onAddReExam && canCreate('re_exams') && (
                                    <button 
                                        onClick={onAddReExam}
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
                    )})}
                </div>
            )}
        </div>
    </div>
  );
};

export default ReExaminationView;
