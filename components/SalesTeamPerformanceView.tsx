import React, { useMemo, useState } from 'react';
import { Lead, Order, Sale, Note } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface SalesTeamPerformanceViewProps {
  leads: Lead[];
  orders: Order[];
  sales: Sale[];
}

type TimeRange = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const SalesTeamPerformanceView: React.FC<SalesTeamPerformanceViewProps> = ({ leads, orders, sales }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

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
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        
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

  const performanceData = useMemo(() => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const perf: Record<string, {
      id: string;
      name: string;
      totalAssigned: number;
      leadsContacted: number;
      leadsNoUpdate24h: number;
      messagesToday: number;
      appointmentsCreated: number;
      revenueGenerated: number;
      score: number;
      leads: Lead[];
    }> = {};

    sales.forEach(s => {
      perf[s.id] = {
        id: s.id,
        name: s.name,
        totalAssigned: 0,
        leadsContacted: 0,
        leadsNoUpdate24h: 0,
        messagesToday: 0,
        appointmentsCreated: 0,
        revenueGenerated: 0,
        score: 0,
        leads: []
      };
    });

    // Add unassigned
    perf['unassigned'] = {
      id: 'unassigned',
      name: 'Chưa gán',
      totalAssigned: 0,
      leadsContacted: 0,
      leadsNoUpdate24h: 0,
      messagesToday: 0,
      appointmentsCreated: 0,
      revenueGenerated: 0,
      score: 0,
      leads: []
    };

    leads.forEach(l => {
      const saleId = l.assignedTo || 'unassigned';
      if (!perf[saleId]) return;

      // Only count leads assigned in the period or active leads?
      // "Total leads assigned" - let's count all active leads assigned to them currently
      if (l.status !== 'completed' && l.status !== 'lost') {
        perf[saleId].totalAssigned += 1;
        perf[saleId].leads.push(l);

        // Leads without update in 24 hours
        let lastActivityDate = new Date(l.updatedAt);
        if (l.notes && l.notes.length > 0) {
            const lastNoteDate = new Date(l.notes[l.notes.length - 1].createdAt);
            if (lastNoteDate > lastActivityDate) {
                lastActivityDate = lastNoteDate;
            }
        }
        
        if (lastActivityDate < twentyFourHoursAgo) {
          perf[saleId].leadsNoUpdate24h += 1;
        }
      }

      // Leads contacted in period (has note or update in period)
      let contactedInPeriod = false;
      const upd = new Date(l.updatedAt);
      if (upd >= dateFilter.start && upd <= dateFilter.end) {
        contactedInPeriod = true;
      }
      
      let messagesInPeriod = 0;
      let messagesToday = 0;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      l.notes?.forEach(n => {
        const nDate = new Date(n.createdAt);
        if (nDate >= dateFilter.start && nDate <= dateFilter.end) {
          contactedInPeriod = true;
          messagesInPeriod += 1;
        }
        if (nDate >= todayStart) {
          messagesToday += 1;
        }
      });

      if (contactedInPeriod) {
        perf[saleId].leadsContacted += 1;
      }
      
      perf[saleId].messagesToday += messagesToday;

      // Appointments created in period
      if (['scheduled', 'completed'].includes(l.status) && l.appointmentDate) {
          const apptDate = new Date(l.appointmentDate);
          // We check if the appointment was created in the period? 
          // Since we don't have appointment creation date, we check if lead was updated in period and has appointment.
          // Or we check if appointmentDate is in the period. Let's use appointmentDate in period.
          if (apptDate >= dateFilter.start && apptDate <= dateFilter.end) {
              perf[saleId].appointmentsCreated += 1;
          }
      }
    });

    orders.forEach(o => {
      if (o.status === 'completed') {
        const oDate = new Date(o.createdAt);
        if (oDate >= dateFilter.start && oDate <= dateFilter.end) {
          const saleId = o.assignedTo || 'unassigned';
          if (perf[saleId]) {
            perf[saleId].revenueGenerated += o.revenue;
          }
        }
      }
    });

    // Calculate Score
    Object.values(perf).forEach(p => {
      // Score = (Lead updates × 2) + (Messages × 1) + (Appointments × 3) + (Revenue / 1,000,000)
      // Let's use leadsContacted as Lead updates
      // Messages in period? The formula says "Messages x 1". We calculated messagesToday, but let's calculate messagesInPeriod for the score.
      // Wait, let's recalculate messagesInPeriod per sale.
      let messagesInPeriod = 0;
      leads.forEach(l => {
          l.notes?.forEach(n => {
              if (n.createdBy === p.id) {
                  const nDate = new Date(n.createdAt);
                  if (nDate >= dateFilter.start && nDate <= dateFilter.end) {
                      messagesInPeriod += 1;
                  }
              }
          });
      });

      p.score = (p.leadsContacted * 2) + (messagesInPeriod * 1) + (p.appointmentsCreated * 3) + (p.revenueGenerated / 1000000);
    });

    return Object.values(perf)
      .filter(p => p.id !== 'unassigned' || p.totalAssigned > 0 || p.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [leads, orders, sales, dateFilter]);

  // Chart Data: Daily Sales Activity
  const dailyActivityData = useMemo(() => {
      const days: Record<string, { date: string, updates: number, messages: number, appointments: number }> = {};
      
      // Initialize days in period
      let curr = new Date(dateFilter.start);
      while (curr <= dateFilter.end) {
          const dStr = curr.toLocaleDateString('vi-VN');
          days[dStr] = { date: dStr, updates: 0, messages: 0, appointments: 0 };
          curr.setDate(curr.getDate() + 1);
      }

      leads.forEach(l => {
          const upd = new Date(l.updatedAt);
          if (upd >= dateFilter.start && upd <= dateFilter.end) {
              const dStr = upd.toLocaleDateString('vi-VN');
              if (days[dStr]) days[dStr].updates += 1;
          }

          l.notes?.forEach(n => {
              const nDate = new Date(n.createdAt);
              if (nDate >= dateFilter.start && nDate <= dateFilter.end) {
                  const dStr = nDate.toLocaleDateString('vi-VN');
                  if (days[dStr]) days[dStr].messages += 1;
              }
          });

          if (['scheduled', 'completed'].includes(l.status) && l.appointmentDate) {
              const apptDate = new Date(l.appointmentDate);
              if (apptDate >= dateFilter.start && apptDate <= dateFilter.end) {
                  const dStr = apptDate.toLocaleDateString('vi-VN');
                  if (days[dStr]) days[dStr].appointments += 1;
              }
          }
      });

      return Object.values(days);
  }, [leads, dateFilter]);

  // Chart Data: Conversion Rate per Sales Staff
  const conversionData = useMemo(() => {
      return performanceData.map(p => {
          const total = p.totalAssigned;
          const completed = p.leads.filter(l => l.status === 'completed').length;
          const rate = total > 0 ? (completed / total) * 100 : 0;
          return {
              name: p.name,
              rate: parseFloat(rate.toFixed(1))
          };
      });
  }, [performanceData]);

  // Chart Data: Response Time for New Leads
  const responseTimeData = useMemo(() => {
      return performanceData.map(p => {
          let totalTime = 0;
          let count = 0;
          
          p.leads.forEach(l => {
              // Only consider leads created in the period
              const createdDate = new Date(l.createdAt);
              if (createdDate >= dateFilter.start && createdDate <= dateFilter.end) {
                  // Find first activity (note or update)
                  let firstActivityDate = new Date(l.updatedAt);
                  if (l.notes && l.notes.length > 0) {
                      const firstNoteDate = new Date(l.notes[0].createdAt);
                      if (firstNoteDate < firstActivityDate) {
                          firstActivityDate = firstNoteDate;
                      }
                  }
                  
                  // If the lead was updated after creation, calculate response time in hours
                  if (firstActivityDate > createdDate) {
                      const diffHours = (firstActivityDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
                      totalTime += diffHours;
                      count += 1;
                  }
              }
          });
          
          const avgTime = count > 0 ? totalTime / count : 0;
          return {
              name: p.name,
              responseTime: parseFloat(avgTime.toFixed(1))
          };
      });
  }, [performanceData, dateFilter]);

  // Leads without update in 24h
  const neglectedLeads = useMemo(() => {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      return leads.filter(l => {
          if (l.status === 'completed' || l.status === 'lost') return false;
          
          let lastActivityDate = new Date(l.updatedAt);
          if (l.notes && l.notes.length > 0) {
              const lastNoteDate = new Date(l.notes[l.notes.length - 1].createdAt);
              if (lastNoteDate > lastActivityDate) {
                  lastActivityDate = lastNoteDate;
              }
          }
          return lastActivityDate < twentyFourHoursAgo;
      }).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  }, [leads]);

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-full space-y-6">
      <header className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Hiệu quả làm việc Team Sale</h2>
            <p className="text-sm text-slate-500 mt-1">Đo lường hoạt động và tương tác với khách hàng</p>
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

      {/* Alert Widgets */}
      {neglectedLeads.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-bold text-red-800">Cảnh báo: {neglectedLeads.length} Lead chưa được chăm sóc (&gt;24h)</h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
                {neglectedLeads.slice(0, 10).map(l => (
                    <div key={l.id} className="bg-white p-2 rounded border border-red-100 min-w-[200px] flex-shrink-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{l.name}</p>
                        <p className="text-[10px] text-slate-500">Phụ trách: {sales.find(s => s.id === l.assignedTo)?.name || 'Chưa gán'}</p>
                        <p className="text-[10px] text-red-500 mt-1">Cập nhật cuối: {new Date(l.updatedAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                ))}
                {neglectedLeads.length > 10 && (
                    <div className="bg-white p-2 rounded border border-red-100 min-w-[100px] flex items-center justify-center flex-shrink-0">
                        <p className="text-xs font-bold text-slate-500">+{neglectedLeads.length - 10} nữa</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Leaderboard */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-tight flex items-center">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
           Bảng Xếp Hạng Hoạt Động (Leaderboard)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="p-3 font-bold border-b border-slate-200 rounded-tl-lg">Hạng</th>
                <th className="p-3 font-bold border-b border-slate-200">Nhân viên</th>
                <th className="p-3 font-bold border-b border-slate-200 text-center">Điểm Hoạt Động</th>
                <th className="p-3 font-bold border-b border-slate-200 text-center">Lead đang giữ</th>
                <th className="p-3 font-bold border-b border-slate-200 text-center">Lead đã liên hệ</th>
                <th className="p-3 font-bold border-b border-slate-200 text-center">Ghi chú (Hôm nay)</th>
                <th className="p-3 font-bold border-b border-slate-200 text-center">Lịch hẹn tạo</th>
                <th className="p-3 font-bold border-b border-slate-200 text-right rounded-tr-lg">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {performanceData.map((s, i) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center">
                        {i === 0 ? <span className="text-xl">🥇</span> : i === 1 ? <span className="text-xl">🥈</span> : i === 2 ? <span className="text-xl">🥉</span> : <span className="font-bold text-slate-400">{i + 1}</span>}
                    </td>
                    <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                          {s.name.charAt(0).toUpperCase()}
                       </div>
                       {s.name}
                       {s.leadsNoUpdate24h > 0 && (
                           <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1" title="Lead chưa chăm sóc >24h">
                               {s.leadsNoUpdate24h} ⚠️
                           </span>
                       )}
                    </td>
                    <td className="p-3 text-center font-black text-indigo-600 text-sm">{s.score.toFixed(1)}</td>
                    <td className="p-3 text-center font-medium text-slate-600">{s.totalAssigned}</td>
                    <td className="p-3 text-center font-bold text-blue-600">{s.leadsContacted}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{s.messagesToday}</td>
                    <td className="p-3 text-center font-bold text-purple-600">{s.appointmentsCreated}</td>
                    <td className="p-3 text-right font-bold text-green-600">{formatCurrency(s.revenueGenerated)}</td>
                  </tr>
              ))}
              {performanceData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">Không có dữ liệu hoạt động trong kỳ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-tight">Hoạt động Sale theo ngày</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyActivityData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{fontSize: 10}} tickMargin={10} />
                        <YAxis tick={{fontSize: 10}} />
                        <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Legend wrapperStyle={{fontSize: '12px'}} />
                        <Line type="monotone" dataKey="updates" name="Cập nhật Lead" stroke="#3b82f6" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} />
                        <Line type="monotone" dataKey="messages" name="Ghi chú/Tin nhắn" stroke="#10b981" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} />
                        <Line type="monotone" dataKey="appointments" name="Lịch hẹn mới" stroke="#8b5cf6" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-tight">Tỷ lệ chuyển đổi theo nhân viên</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" domain={[0, 100]} tick={{fontSize: 10}} tickFormatter={(val) => `${val}%`} />
                        <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={100} />
                        <Tooltip 
                            formatter={(value: number) => [`${value}%`, 'Tỷ lệ chốt']}
                            contentStyle={{borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                        />
                        <Bar dataKey="rate" name="Tỷ lệ chốt" fill="#6366f1" radius={[0, 4, 4, 0]}>
                            {conversionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-tight">Thời gian phản hồi Lead mới trung bình (Giờ)</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={responseTimeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 10}} />
                        <YAxis tick={{fontSize: 10}} />
                        <Tooltip 
                            formatter={(value: number) => [`${value} giờ`, 'Thời gian phản hồi TB']}
                            contentStyle={{borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                        />
                        <Bar dataKey="responseTime" name="Thời gian phản hồi TB" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                            {responseTimeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </section>
      </div>

    </div>
  );
};

export default SalesTeamPerformanceView;
