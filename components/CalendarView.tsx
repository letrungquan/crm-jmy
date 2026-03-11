
import React, { useState, useMemo } from 'react';
import { Lead, ReExamination } from '../types';

interface CalendarViewProps {
  leads: Lead[];
  reExaminations?: ReExamination[];
  onSelectLead: (lead: Lead) => void;
}

const getWeekDays = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); 
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday, week starts on Monday
    const monday = new Date(date.setDate(diff));
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const nextDay = new Date(monday);
        nextDay.setDate(monday.getDate() + i);
        days.push(nextDay);
    }
    return days;
}

// Helper to safely parse lead date for calendar display
const getLeadDate = (lead: Lead): Date | null => {
    let dateStr: string | null = null;
    let isProjected = false;

    // 1. Trạng thái đã có lịch hẹn cụ thể
    if (['scheduled', 'completed'].includes(lead.status)) {
        dateStr = lead.appointmentDate;
    } 
    // 2. Trạng thái đang liên hệ (Dự thu)
    else if (lead.status === 'contacting') {
        dateStr = lead.projectedAppointmentDate;
        isProjected = true;
    } 
    // 3. Trạng thái Mới (new) hoặc Thất bại (lost) -> KHÔNG hiện trên lịch dự thu
    else {
        return null;
    }

    if (!dateStr) return null;
    
    // If it's a projected date (date-only or T12:00:00), parse explicitly to local noon
    if (isProjected) {
        try {
            const parts = dateStr.split('T');
            const [y, m, d] = parts[0].split('-').map(Number);
            return new Date(y, m - 1, d, 12, 0, 0);
        } catch (e) {
            return new Date(dateStr);
        }
    }
    
    return new Date(dateStr);
};

const getReExamDate = (reExam: ReExamination): Date | null => {
    if (!reExam.date) return null;
    try {
        const parts = reExam.date.split('T');
        const [y, m, d] = parts[0].split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0);
    } catch (e) {
        return new Date(reExam.date);
    }
};


const CalendarView: React.FC<CalendarViewProps> = ({ leads, reExaminations = [], onSelectLead }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // --- Memos for Data Calculation ---
  const monthItems = useMemo(() => {
    if (viewMode !== 'month') return { leads: [], reExams: [] };
    
    const filteredLeads = leads.filter(lead => {
        const leadDate = getLeadDate(lead);
        if (!leadDate) return false;
        if (lead.status === 'cancelled') return false;
        return leadDate.getFullYear() === currentDate.getFullYear() &&
               leadDate.getMonth() === currentDate.getMonth();
    });

    const filteredReExams = reExaminations.filter(reExam => {
        const reExamDate = getReExamDate(reExam);
        if (!reExamDate) return false;
        if (reExam.status === 'cancelled') return false;
        return reExamDate.getFullYear() === currentDate.getFullYear() &&
               reExamDate.getMonth() === currentDate.getMonth();
    });

    return { leads: filteredLeads, reExams: filteredReExams };
  }, [leads, reExaminations, currentDate, viewMode]);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const weekItems = useMemo(() => {
    if (viewMode !== 'week') return { leads: [], reExams: [] };
    const start = weekDays[0];
    const end = weekDays[6];
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    const filteredLeads = leads.filter(lead => {
        const date = getLeadDate(lead);
        if (!date) return false;
        if (lead.status === 'cancelled') return false;
        return date >= start && date <= end;
    });

    const filteredReExams = reExaminations.filter(reExam => {
        const date = getReExamDate(reExam);
        if (!date) return false;
        if (reExam.status === 'cancelled') return false;
        return date >= start && date <= end;
    });

    return { leads: filteredLeads, reExams: filteredReExams };
  }, [leads, reExaminations, weekDays, viewMode]);


  const { totalRevenue, scheduledRevenue, contactingRevenue, reExamRevenue } = useMemo(() => {
      const { leads: relevantLeads, reExams: relevantReExams } = viewMode === 'month' ? monthItems : weekItems;
      
      const scheduled = relevantLeads
        .filter(l => ['scheduled', 'completed'].includes(l.status))
        .reduce((total, lead) => total + (lead.potentialRevenue || 0), 0);

      const contacting = relevantLeads
        .filter(l => l.status === 'contacting')
        .reduce((total, lead) => total + (lead.potentialRevenue || 0), 0);
        
      const reExam = relevantReExams
        .reduce((total, item) => total + (item.potentialRevenue || 0), 0);

      return { 
          totalRevenue: scheduled + contacting + reExam, 
          scheduledRevenue: scheduled, 
          contactingRevenue: contacting,
          reExamRevenue: reExam
      };

  }, [monthItems, weekItems, viewMode]);

  // --- Helper Functions ---
  const formatCurrency = (value: number) => {
      if (typeof value !== 'number') return '';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  const changeDate = (offset: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + offset, 1);
        } else {
            newDate.setDate(newDate.getDate() + (offset * 7));
        }
        return newDate;
    });
  };

  const getHeaderText = () => {
    if (viewMode === 'month') {
        return `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;
    }
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.getMonth() + 1;
    const endMonth = end.getMonth() + 1;
    if (startMonth === endMonth) {
         return `Tuần: ${start.getDate()} - ${end.getDate()}/${endMonth}/${end.getFullYear()}`;
    }
    return `Tuần: ${start.getDate()}/${startMonth} - ${end.getDate()}/${endMonth}/${end.getFullYear()}`;
  }
  
  // --- Rendering Month View ---
  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay(); // 0 for Sunday
    const daysInMonth = endOfMonth.getDate();
    const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const today = new Date();
    
    const getItemsForDay = (day: number) => {
        const dailyLeads = monthItems.leads.filter(lead => {
            const leadDate = getLeadDate(lead);
            return leadDate ? leadDate.getDate() === day : false;
        });
        const dailyReExams = monthItems.reExams.filter(reExam => {
            const reExamDate = getReExamDate(reExam);
            return reExamDate ? reExamDate.getDate() === day : false;
        });
        
        const dailyRevenue = dailyLeads.reduce((total, lead) => total + (lead.potentialRevenue || 0), 0) +
                             dailyReExams.reduce((total, item) => total + (item.potentialRevenue || 0), 0);
                             
        return { dailyLeads, dailyReExams, dailyRevenue };
    };

    return (
        <div className="grid grid-cols-7 gap-px bg-slate-200 border-t border-l border-slate-200 rounded-lg overflow-hidden">
            {daysOfWeek.map(day => (
              <div key={day} className="py-2 text-center font-semibold text-xs sm:text-sm text-slate-600 bg-slate-100">
                {day}
              </div>
            ))}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-50 min-h-[120px] sm:min-h-[140px]"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const { dailyLeads, dailyReExams, dailyRevenue } = getItemsForDay(day);
              const isToday = today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth() && today.getDate() === day;
              return (
                <div key={day} className="p-1 sm:p-2 bg-white min-h-[120px] sm:min-h-[140px] flex flex-col transition-colors hover:bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className={`flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full text-xs sm:text-sm font-medium ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                      {day}
                    </span>
                    {dailyRevenue > 0 && (
                         <span className="text-xs font-bold text-green-700 bg-green-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md hidden sm:inline">{formatCurrency(dailyRevenue)}</span>
                    )}
                  </div>
                  <div className="mt-1 sm:mt-2 space-y-1.5 overflow-y-auto flex-1">
                    {(() => {
                      const allEvents = [
                        ...dailyLeads.map(lead => ({ type: 'lead' as const, data: lead })),
                        ...dailyReExams.map(reExam => ({ type: 'reExam' as const, data: reExam }))
                      ];
                      
                      const MAX_VISIBLE = 2;
                      const visibleEvents = allEvents.length <= 3 ? allEvents : allEvents.slice(0, MAX_VISIBLE);
                      const hiddenEvents = allEvents.length <= 3 ? [] : allEvents.slice(MAX_VISIBLE);

                      return (
                        <>
                          {visibleEvents.map(event => {
                            if (event.type === 'lead') {
                              const lead = event.data as Lead;
                              const isScheduled = ['scheduled', 'completed'].includes(lead.status);
                              const theme = {
                                  bg: isScheduled ? 'bg-blue-100' : 'bg-orange-100',
                                  text: isScheduled ? 'text-blue-800' : 'text-orange-800',
                                  border: isScheduled ? 'border-blue-200' : 'border-orange-200',
                                  hoverBg: isScheduled ? 'hover:bg-blue-200' : 'hover:bg-orange-200',
                              };
                              return (
                                <div 
                                  key={lead.id} onClick={() => onSelectLead(lead)}
                                  className={`p-1 sm:p-1.5 text-xs ${theme.bg} ${theme.text} rounded-md cursor-pointer ${theme.hoverBg} border ${theme.border}`}
                                  title={`${lead.name} - ${formatCurrency(lead.potentialRevenue!)}`}
                                >
                                  <p className="font-semibold truncate">{lead.name}</p>
                                  <p className="hidden sm:block truncate">{formatCurrency(lead.potentialRevenue!)}</p>
                                </div>
                              );
                            } else {
                              const reExam = event.data as ReExamination;
                              return (
                                <div 
                                    key={reExam.id}
                                    className="p-1 sm:p-1.5 text-xs bg-purple-100 text-purple-800 rounded-md border border-purple-200"
                                    title={`Tái khám: ${reExam.customerName} - ${formatCurrency(reExam.potentialRevenue!)}`}
                                >
                                    <p className="font-semibold truncate">{reExam.customerName}</p>
                                    <p className="hidden sm:block truncate">{formatCurrency(reExam.potentialRevenue!)}</p>
                                </div>
                              );
                            }
                          })}
                          {hiddenEvents.length > 0 && (
                            <div 
                              className="p-1 sm:p-1.5 text-xs bg-slate-100 text-slate-600 rounded-md border border-slate-200 text-center font-medium cursor-help"
                              title={hiddenEvents.map(e => e.type === 'lead' ? `${(e.data as Lead).name} - ${formatCurrency((e.data as Lead).potentialRevenue!)}` : `Tái khám: ${(e.data as ReExamination).customerName} - ${formatCurrency((e.data as ReExamination).potentialRevenue!)}`).join('\n')}
                            >
                              +{hiddenEvents.length} lịch hẹn
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
        </div>
    );
  };
  
  // --- Rendering Week View ---
  const renderWeekView = () => {
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

    const getItemsForDay = (date: Date) => {
        const dailyLeads = weekItems.leads
            .filter(lead => {
                const leadDate = getLeadDate(lead);
                return leadDate ? leadDate.toDateString() === date.toDateString() : false;
            })
            .sort((a,b) => {
                const aTime = getLeadDate(a)?.getTime() || 0;
                const bTime = getLeadDate(b)?.getTime() || 0;
                return aTime - bTime;
            });

        const dailyReExams = weekItems.reExams
            .filter(reExam => {
                const reExamDate = getReExamDate(reExam);
                return reExamDate ? reExamDate.toDateString() === date.toDateString() : false;
            });

        const dailyRevenue = dailyLeads.reduce((total, lead) => total + (lead.potentialRevenue || 0), 0) +
                             dailyReExams.reduce((total, item) => total + (item.potentialRevenue || 0), 0);
                             
        return { dailyLeads, dailyReExams, dailyRevenue };
    }
    
    return (
        <div className="space-y-4">
            {weekDays.map(day => {
                const { dailyLeads, dailyReExams, dailyRevenue } = getItemsForDay(day);
                return (
                    <div key={day.toISOString()} className="bg-white p-3 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b">
                            <h3 className="font-bold text-slate-800">{daysOfWeek[day.getDay()]}, {day.getDate()}/{day.getMonth() + 1}</h3>
                            <span className="text-sm font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md">{formatCurrency(dailyRevenue)}</span>
                        </div>
                        <div className="space-y-2">
                            {dailyLeads.length > 0 || dailyReExams.length > 0 ? (
                                <>
                                    {dailyLeads.map(lead => {
                                        const isScheduled = ['scheduled', 'completed'].includes(lead.status);
                                        const theme = {
                                            bg: isScheduled ? 'bg-blue-50' : 'bg-orange-50',
                                            text: isScheduled ? 'text-blue-800' : 'text-orange-800',
                                            border: isScheduled ? 'border-blue-300' : 'border-orange-300',
                                            hoverBg: isScheduled ? 'hover:bg-blue-100' : 'hover:bg-orange-100',
                                            revenueText: isScheduled ? 'text-blue-700' : 'text-orange-700',
                                        };
                                        return (
                                            <div key={lead.id} onClick={() => onSelectLead(lead)} className={`p-2.5 text-sm ${theme.bg} ${theme.text} rounded-lg cursor-pointer ${theme.hoverBg} border ${theme.border} flex justify-between items-center`}>
                                                <div>
                                                    <p className="font-bold truncate">{lead.name}</p>
                                                    <p className="text-xs truncate text-slate-500 mt-0.5">{lead.service}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-2">
                                                    <p className={`font-bold ${theme.revenueText}`}>{formatCurrency(lead.potentialRevenue!)}</p>
                                                    {isScheduled && lead.appointmentDate && 
                                                        <p className="text-xs font-semibold text-slate-600">{new Date(lead.appointmentDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p> 
                                                    }
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {dailyReExams.map(reExam => (
                                        <div key={reExam.id} className="p-2.5 text-sm bg-purple-50 text-purple-800 rounded-lg border border-purple-300 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold truncate">{reExam.customerName}</p>
                                                <p className="text-xs truncate text-slate-500 mt-0.5">{reExam.service}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-2">
                                                <p className="font-bold text-purple-700">{formatCurrency(reExam.potentialRevenue!)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : <p className="text-sm text-slate-400 text-center py-2">Không có lịch hẹn.</p>}
                        </div>
                    </div>
                )
            })}
        </div>
    )
  }
  
  return (
    <div className="w-full bg-slate-50 p-2 sm:p-6 rounded-lg">
      <header className="flex flex-col sm:flex-row justify-between items-center pb-4 mb-4 border-b border-slate-200 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
            <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex flex-col sm:flex-row items-center">
                <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mx-2 sm:mx-4 text-center">
                    {getHeaderText()}
                </h2>
                <div className="flex items-center bg-slate-100 p-1 rounded-lg mt-2 sm:mt-0">
                    <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${viewMode === 'month' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'}`}>Tháng</button>
                    <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${viewMode === 'week' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'}`}>Tuần</button>
                </div>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
        <div className="mt-4 sm:mt-0 text-center sm:text-right">
            <p className="text-sm font-medium text-slate-500">TỔNG DỰ THU</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            <div className="text-xs font-medium mt-1">
                <span className="text-blue-600">Đã hẹn: {formatCurrency(scheduledRevenue)}</span>
                <span className="mx-2 text-slate-400">|</span>
                <span className="text-orange-500">Đang hẹn: {formatCurrency(contactingRevenue)}</span>
                <span className="mx-2 text-slate-400">|</span>
                <span className="text-purple-600">Tái khám: {formatCurrency(reExamRevenue)}</span>
            </div>
        </div>
      </header>
      
      {viewMode === 'month' ? renderMonthView() : renderWeekView()}

    </div>
  );
};

export default CalendarView;
