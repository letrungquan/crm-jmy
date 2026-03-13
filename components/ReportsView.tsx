
import React, { useMemo, useState } from 'react';
import { Lead, Order, CustomerData, Sale, CskhItem, ReExamination, Activity } from '../types';
import DailyCskhReport from './DailyCskhReport';

interface ReportsViewProps {
  leads: Lead[];
  orders: Order[];
  cskhItems: CskhItem[];
  customers: Record<string, CustomerData>;
  sources: string[];
  sales?: Sale[];
  reExaminations?: ReExamination[];
  activities?: Activity[];
}

type TimeRange = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

const getRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Hôm qua ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

const ReportsView: React.FC<ReportsViewProps> = ({ leads, orders, cskhItems, customers, sources, sales = [], reExaminations = [], activities = [] }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // 1. Logic tính toán khoảng thời gian
  const dateFilter = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    
    switch (timeRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this_week':
        const day = now.getDay(); // 0 (Sun) -> 6 (Sat)
        // Tính ngày thứ 2 đầu tuần
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        
        // FIX: Lấy đến hết Chủ Nhật tuần này (thay vì chỉ đến now)
        const endOfWeek = new Date(start);
        endOfWeek.setDate(start.getDate() + 6);
        end.setTime(endOfWeek.getTime());
        end.setHours(23, 59, 59, 999);
        break;
      case 'last_week':
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - now.getDay() - 6);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        start.setTime(lastWeekStart.setHours(0, 0, 0, 0));
        end.setTime(lastWeekEnd.setHours(23, 59, 59, 999));
        break;
      case 'this_month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        
        // FIX: Lấy đến hết ngày cuối cùng của tháng này (thay vì chỉ đến now)
        end.setMonth(now.getMonth() + 1, 0); 
        end.setHours(23, 59, 59, 999);
        break;
      case 'last_month':
        start.setMonth(now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setTime(lastDay.setHours(23, 59, 59, 999));
        break;
      case 'custom':
        if (customRange.start) start.setTime(new Date(customRange.start).setHours(0, 0, 0, 0));
        if (customRange.end) end.setTime(new Date(customRange.end).setHours(23, 59, 59, 999));
        break;
    }
    return { start, end };
  }, [timeRange, customRange]);

  // 2. Lọc dữ liệu theo thời gian (Cho các chỉ số đếm số lượng Lead mới, Đơn hàng thực tế)
  const filteredData = useMemo(() => {
    const fLeads = leads.filter(l => {
      const d = new Date(l.createdAt);
      return d >= dateFilter.start && d <= dateFilter.end;
    });
    const fOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= dateFilter.start && d <= dateFilter.end;
    });
    const fCskh = cskhItems.filter(c => {
      const d = new Date(c.createdAt);
      return d >= dateFilter.start && d <= dateFilter.end;
    });
    return { leads: fLeads, orders: fOrders, cskh: fCskh };
  }, [leads, orders, cskhItems, dateFilter]);

  // 3. Chỉ số CEO Metrics
  const ceoStats = useMemo(() => {
    // 3.1. Revenue & Orders
    const completedOrders = filteredData.orders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.revenue, 0);
    const payingOrders = completedOrders.filter(o => o.revenue > 0);
    const avgOrderValue = payingOrders.length > 0 ? totalRevenue / payingOrders.length : 0;

    // 3.2. Leads & Conversion
    const totalLeads = filteredData.leads.length;
    const completedLeads = filteredData.leads.filter(l => l.status === 'completed').length;
    const conversionRate = totalLeads > 0 ? (completedLeads / totalLeads) * 100 : 0;
    
    // Thống kê theo Trạng thái
    const leadStatusCounts: Record<string, number> = {};
    filteredData.leads.forEach(l => {
      leadStatusCounts[l.status] = (leadStatusCounts[l.status] || 0) + 1;
    });

    // Thống kê theo Nguồn (Source) thực tế
    const leadSourceCounts: Record<string, number> = {};
    filteredData.leads.forEach(l => {
      const src = l.source || 'Không xác định';
      leadSourceCounts[src] = (leadSourceCounts[src] || 0) + 1;
    });

    // Tìm nguồn chính (có số lượng lớn nhất)
    let mainSource = 'Chưa có dữ liệu';
    let maxCount = 0;
    Object.entries(leadSourceCounts).forEach(([src, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mainSource = src;
      }
    });

    // 3.3. Potential Revenue (Dự thu)
    // FIX: Sử dụng logic giống CalendarView để tính tổng dự thu trong khoảng thời gian đã chọn
    // Lọc dựa trên ngày hẹn/dự kiến thay vì ngày tạo
    const getLeadRevenueDate = (lead: Lead): Date | null => {
        let dateStr: string | null = null;
        let isProjected = false;

        // MATCH LOGIC WITH CALENDAR VIEW
        if (['scheduled', 'completed'].includes(lead.status)) {
            dateStr = lead.appointmentDate;
        } else if (lead.status === 'contacting') {
            dateStr = lead.projectedAppointmentDate;
            isProjected = true;
        } else {
            return null; // Exclude new, lost
        }

        if (!dateStr) return null;

        if (isProjected) {
            try {
                // Parse ngày dự kiến (thường là YYYY-MM-DD hoặc ISO)
                const parts = dateStr.split('T');
                if (parts[0].includes('-')) {
                    const [y, m, d] = parts[0].split('-').map(Number);
                    // Dùng mốc 12h trưa để tránh lệch múi giờ
                    return new Date(y, m - 1, d, 12, 0, 0);
                }
            } catch (e) {}
            return new Date(dateStr);
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

    const leadPotentialRevenue = leads.reduce((sum, l) => {
        if (l.status === 'lost') return sum; 
        
        const revDate = getLeadRevenueDate(l);
        // Kiểm tra xem ngày dự thu có nằm trong khoảng lọc không
        if (revDate && revDate >= dateFilter.start && revDate <= dateFilter.end) {
            return sum + (l.potentialRevenue || 0);
        }
        return sum;
    }, 0);

    const reExamPotentialRevenue = reExaminations.reduce((sum, r) => {
        if (!['pending', 'called'].includes(r.status)) return sum;

        const revDate = getReExamDate(r);
        if (revDate && revDate >= dateFilter.start && revDate <= dateFilter.end) {
            return sum + (r.potentialRevenue || 0);
        }
        return sum;
    }, 0);

    const potentialRevenue = leadPotentialRevenue + reExamPotentialRevenue;

    // 3.4. CSKH Stats
    const totalCskhTickets = filteredData.cskh.length;
    const activeCskhTickets = filteredData.cskh.filter(c => c.status !== 'cskh_done');
    const completedCskhTickets = filteredData.cskh.filter(c => c.status === 'cskh_done').length;
    const complaintTickets = filteredData.cskh.filter(c => c.status === 'cskh_complaint').length;
    const cskhCompletionRate = totalCskhTickets > 0 ? (completedCskhTickets / totalCskhTickets) * 100 : 0;

    const cskhStatusCounts: Record<string, number> = {};
    filteredData.cskh.forEach(c => {
      cskhStatusCounts[c.status] = (cskhStatusCounts[c.status] || 0) + 1;
    });

    return { 
      totalRevenue, 
      avgOrderValue, 
      conversionRate, 
      totalLeads, 
      completedLeads, 
      potentialRevenue,
      payingOrderCount: payingOrders.length,
      leadStatusCounts,
      leadSourceCounts,
      mainSource,
      totalCskhTickets,
      activeCskhCount: activeCskhTickets.length,
      complaintTickets,
      cskhCompletionRate,
      cskhStatusCounts
    };
  }, [filteredData, leads, reExaminations, dateFilter]); // Thêm dateFilter vào dependencies để tính toán lại khi đổi ngày

  // 4. Hiệu suất Sale
  const salesPerformance = useMemo(() => {
    const perf: Record<string, number> = {};
    filteredData.orders.filter(o => o.status === 'completed').forEach(o => {
      const saleId = o.assignedTo || 'unassigned';
      perf[saleId] = (perf[saleId] || 0) + o.revenue;
    });

    return Object.entries(perf)
      .map(([id, revenue]) => ({
        id,
        name: sales.find(s => s.id === id)?.name || 'Chưa gán',
        revenue: revenue as number
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData.orders, sales]);



  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-full space-y-6">
      <header className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Bảng điều khiển CEO</h2>
            <p className="text-sm text-slate-500 mt-1">Hệ thống đo lường hiệu suất vận hành Spa</p>
          </div>
          <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Hệ thống thời gian thực</span>
          </div>
        </div>

        {/* Time Filter Bar */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto w-full md:w-auto hide-scrollbar">
            {[
              { id: 'today', label: 'Hôm nay' },
              { id: 'yesterday', label: 'Hôm qua' },
              { id: 'this_week', label: 'Tuần này' },
              { id: 'last_week', label: 'Tuần trước' },
              { id: 'this_month', label: 'Tháng này' },
              { id: 'last_month', label: 'Tháng trước' },
              { id: 'custom', label: 'Tùy chỉnh' },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setTimeRange(btn.id as TimeRange)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === btn.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {timeRange === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 ml-2 animate-fade-in">
              <input type="date" value={customRange.start} onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))} className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:ring-blue-500 outline-none w-[120px]"/>
              <span className="text-slate-400">→</span>
              <input type="date" value={customRange.end} onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))} className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:ring-blue-500 outline-none w-[120px]"/>
            </div>
          )}
          
          <div className="ml-auto text-[10px] font-bold text-slate-400 uppercase pr-2">
            {dateFilter.start.toLocaleDateString('vi-VN')} - {dateFilter.end.toLocaleDateString('vi-VN')}
          </div>
        </div>
      </header>

      {/* KPI Section - Financial */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-green-200 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Doanh Thu</p>
          <p className="text-2xl font-black text-green-600 mt-1">{formatCurrency(ceoStats.totalRevenue)}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium italic">* Doanh số thực thu</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-orange-200 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Dự Thu (Cơ hội)</p>
          <p className="text-2xl font-black text-orange-600 mt-1">{formatCurrency(ceoStats.potentialRevenue)}</p>
          <p className="text-[10px] text-orange-400 mt-2 font-bold uppercase italic">Tổng Lead đang theo</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-blue-200 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Giá trị TB đơn (AOV)</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(ceoStats.avgOrderValue)}</p>
          <p className="text-[10px] text-blue-400 mt-2 font-bold uppercase italic">Loại trừ {ceoStats.leadStatusCounts['completed'] - ceoStats.payingOrderCount || 0} đơn 0đ</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-indigo-200 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tỷ lệ chốt Sale</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{ceoStats.conversionRate.toFixed(1)}%</p>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3">
              <div className="bg-indigo-500 h-1 rounded-full transition-all duration-1000" style={{width: `${ceoStats.conversionRate}%`}}></div>
          </div>
        </div>
      </div>

      {/* KPI Section - Operational CSKH */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-purple-200 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CSKH Đang xử lý</p>
          <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-purple-600 mt-1">{ceoStats.activeCskhCount}</p>
              <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">Phiếu</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Hỏi thăm: {ceoStats.cskhStatusCounts['cskh_1_3_days'] || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-red-200 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khiếu nại chưa xử lý</p>
          <p className="text-2xl font-black text-red-600 mt-1">{ceoStats.complaintTickets}</p>
          <p className="text-[10px] text-red-400 mt-2 font-bold uppercase animate-pulse">Cần giải quyết ngay</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-emerald-200 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tỷ lệ hoàn tất CSKH</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{ceoStats.cskhCompletionRate.toFixed(0)}%</p>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3">
              <div className="bg-emerald-500 h-1 rounded-full transition-all duration-1000" style={{width: `${ceoStats.cskhCompletionRate}%`}}></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-slate-300 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Mới Trong Kỳ</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{ceoStats.totalLeads}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Nguồn chính: <span className="text-blue-600">{ceoStats.mainSource}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Daily CSKH Report & Recent Activities Feed */}
        <div className="lg:col-span-2 space-y-6">
             <DailyCskhReport cskhItems={cskhItems} leads={leads} />

             {/* Recent Activities Feed - Moved back here */}
             <section className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-tight">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Hoạt động gần đây
                  </h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Live Feed</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  {activities.length > 0 ? activities.map((act, i) => {
                    const actDate = new Date(act.time);
                    const isInPeriod = actDate >= dateFilter.start && actDate <= dateFilter.end;

                    return (
                      <div key={`${act.id}-${i}`} className={`flex gap-3 group relative transition-opacity ${isInPeriod ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm bg-white text-slate-600`}>
                            <span className="text-sm">{act.icon}</span>
                          </div>
                          {i !== activities.length - 1 && <div className="w-0.5 h-full bg-slate-100 my-1"></div>}
                        </div>
                        <div className={`flex-1 p-3 rounded-xl border transition-all bg-white border-slate-100 group-hover:border-blue-200 shadow-sm`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {getRelativeTime(act.time)}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 leading-relaxed">
                            {act.user && <span className="text-blue-600 font-black">{act.user}: </span>}
                            {act.message}
                          </p>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="p-8 text-center text-slate-400 text-sm italic">Không có hoạt động nào gần đây.</div>
                  )}
                </div>
             </section>
        </div>

        {/* Right Column (1/3): Sales Perf, Marketing Channels */}
        <div className="space-y-6">
          {/* Top Sales Performance */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-tight flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
               Xếp hạng Sale (Theo doanh thu)
            </h3>
            <div className="space-y-3">
              {salesPerformance.map((s, i) => {
                const maxRevenue = Number(salesPerformance[0]?.revenue) || 1;
                const widthPercent = (Number(s.revenue) / maxRevenue) * 100;
                
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span className="truncate max-w-[100px]">{s.name}</span>
                        <span className="text-green-600">{formatCurrency(s.revenue)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${widthPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {salesPerformance.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Không có doanh thu trong kỳ</p>}
            </div>
          </section>

          {/* Marketing Channels */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-tight flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
               Top nguồn Lead mới
            </h3>
            <div className="space-y-4">
              {Object.entries(ceoStats.leadSourceCounts).length > 0 ? (
                  Object.entries(ceoStats.leadSourceCounts)
                    .sort(([, a], [, b]) => (b as any) - (a as any))
                    .slice(0, 5)
                    .map(([source, count]) => {
                      const percentage = ceoStats.totalLeads > 0 ? (Number(count) / ceoStats.totalLeads) * 100 : 0;
                      return (
                        <div key={source}>
                          <div className="flex justify-between items-center mb-1 text-[11px] font-bold text-slate-600 uppercase">
                            <span className="truncate max-w-[120px]">{source}</span>
                            <span>{count} KH ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-slate-50 rounded-full h-1.5 border border-slate-100">
                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">Không có lead mới trong kỳ</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
