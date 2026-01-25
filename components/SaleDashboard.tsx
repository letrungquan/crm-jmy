
import React, { useMemo } from 'react';
import { Lead, Order, CskhItem, CustomerData, StatusConfig, Sale } from '../types';

interface SaleDashboardProps {
  leads: Lead[];
  cskhItems: CskhItem[];
  orders: Order[];
  customers: Record<string, CustomerData>;
  currentUser: string;
  sales?: Sale[];
  onSelectLead: (lead: Lead) => void;
  onSelectCskh: (item: CskhItem) => void;
  onReceiveLead?: (leadId: string) => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

const SaleDashboard: React.FC<SaleDashboardProps> = ({ 
  leads, 
  cskhItems, 
  orders, 
  customers, 
  currentUser,
  sales = [],
  onSelectLead,
  onSelectCskh,
  onReceiveLead
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getSaleName = (id: string | null | undefined) => {
      if (!id) return 'Chưa gán';
      return sales.find(s => s.id === id)?.name || 'Unknown';
  };

  // 1. Dữ liệu cá nhân hóa (Chỉ dùng cho KPI để Sale theo dõi hiệu suất bản thân)
  const myLeads = useMemo(() => leads.filter(l => l.assignedTo === currentUser), [leads, currentUser]);
  const myOrders = useMemo(() => orders.filter(o => o.assignedTo === currentUser), [orders, currentUser]);

  // 2. Tính toán KPI Cá nhân (Tháng này) - Giữ nguyên logic cá nhân
  const kpiStats = useMemo(() => {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const currentRevenue = myOrders
        .filter(o => {
            const d = new Date(o.createdAt);
            return o.status === 'completed' && d >= startOfMonth && d <= endOfMonth;
        })
        .reduce((sum, o) => sum + o.revenue, 0);

    const newLeadsCount = myLeads.filter(l => {
        const d = new Date(l.createdAt);
        return d >= startOfMonth && d <= endOfMonth;
    }).length;

    const conversionRate = newLeadsCount > 0 
        ? (myOrders.filter(o => o.status === 'completed' && new Date(o.createdAt) >= startOfMonth).length / newLeadsCount) * 100 
        : 0;

    return { currentRevenue, newLeadsCount, conversionRate };
  }, [myOrders, myLeads, today]);

  // 3. Phân loại tác vụ (Toàn bộ dữ liệu để hỗ trợ nhau)
  
  // 3.1 Lịch hẹn hôm nay (Tất cả mọi người)
  const todayAppointments = useMemo(() => {
      return leads.filter(l => {
          if (!l.appointmentDate) return false;
          const d = new Date(l.appointmentDate);
          return d.getDate() === today.getDate() && 
                 d.getMonth() === today.getMonth() && 
                 d.getFullYear() === today.getFullYear() &&
                 ['scheduled', 'completed'].includes(l.status);
      }).sort((a, b) => new Date(a.appointmentDate!).getTime() - new Date(b.appointmentDate!).getTime());
  }, [leads, today]);

  // 3.2 Lead mới chưa xử lý (Tất cả lead mới)
  const newLeadsToCall = useMemo(() => {
      return leads.filter(l => l.status === 'new');
  }, [leads]);

  // 3.3 CSKH cần tương tác (Tất cả phiếu chưa xong)
  const cskhTasks = useMemo(() => {
      return cskhItems.filter(c => c.status !== 'cskh_done' && c.status !== 'cskh_complaint');
  }, [cskhItems]);

  // 3.4 Khách hàng sinh nhật trong tháng (Tất cả khách)
  const birthdayCustomers = useMemo(() => {
      const currentMonth = today.getMonth() + 1;
      return Object.values(customers).filter((c: CustomerData) => {
          if (!c.dateOfBirth) return false;
          try {
              const dob = new Date(c.dateOfBirth);
              return (dob.getMonth() + 1) === currentMonth;
          } catch { return false; }
      });
  }, [customers, today]);

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-full space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Xin chào, chúc bạn một ngày bùng nổ doanh số! 👋</h2>
        <p className="text-sm text-slate-500 mt-1">Dưới đây là các công việc của cả team cần ưu tiên xử lý.</p>
      </header>

      {/* KPI Cards (Vẫn giữ KPI cá nhân để tạo động lực) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 text-white shadow-md">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Doanh số cá nhân</p>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(kpiStats.currentRevenue)}</p>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
              </div>
              <div className="mt-4 text-xs text-blue-100">
                  Cố gắng đạt mục tiêu nhé!
              </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Lead mới (Cá nhân)</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{kpiStats.newLeadsCount}</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  </div>
              </div>
              <div className="mt-4 text-xs text-slate-500">
                  Tỷ lệ chuyển đổi: <span className="font-bold text-slate-700">{kpiStats.conversionRate.toFixed(1)}%</span>
              </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Lịch hẹn hôm nay (Team)</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{todayAppointments.length}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
              </div>
              <div className="mt-4 text-xs text-slate-500">
                  Tổng lịch hẹn của cả team.
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột 1: Quan trọng & Khẩn cấp */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Lịch hẹn hôm nay */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-purple-50">
                      <h3 className="font-bold text-purple-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Lịch hẹn hôm nay ({todayAppointments.length})
                      </h3>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                      {todayAppointments.length > 0 ? todayAppointments.map(lead => (
                          <div key={lead.id} onClick={() => onSelectLead(lead)} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center group">
                              <div>
                                  <div className="flex items-center">
                                      <p className="font-bold text-slate-800 text-sm">{lead.name}</p>
                                      <span className="mx-2 text-slate-300">|</span>
                                      <p className="text-sm text-slate-600">{lead.phone}</p>
                                  </div>
                                  <div className="flex items-center mt-1 space-x-2">
                                      <p className="text-xs text-slate-500">{lead.service}</p>
                                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                          👤 {getSaleName(lead.assignedTo)}
                                      </span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-sm font-bold text-purple-600">
                                      {lead.appointmentDate ? new Date(lead.appointmentDate).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                  </p>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${lead.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                      {lead.status === 'completed' ? 'Đã xong' : 'Sắp tới'}
                                  </span>
                              </div>
                          </div>
                      )) : (
                          <div className="p-8 text-center text-slate-400 text-sm">Hôm nay không có lịch hẹn nào.</div>
                      )}
                  </div>
              </div>

              {/* Lead mới cần xử lý */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-red-50">
                      <h3 className="font-bold text-red-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          Lead mới cần gọi ({newLeadsToCall.length})
                      </h3>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                      {newLeadsToCall.length > 0 ? newLeadsToCall.map(lead => (
                          <div key={lead.id} onClick={() => onSelectLead(lead)} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center">
                              <div>
                                  <p className="font-bold text-slate-800 text-sm">{lead.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <p className="text-xs text-slate-500">Nguồn: <span className="font-medium text-slate-700">{lead.source}</span> • <span className="text-slate-400">{new Date(lead.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span></p>
                                      {!lead.assignedTo ? (
                                          <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1 rounded border border-red-100">Chưa gán</span>
                                      ) : (
                                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">👤 {getSaleName(lead.assignedTo)}</span>
                                      )}
                                  </div>
                              </div>
                              {lead.assignedTo ? (
                                  <button className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded shadow-sm transition-colors">
                                      Gọi ngay
                                  </button>
                              ) : (
                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          if (onReceiveLead) onReceiveLead(lead.id);
                                      }}
                                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded shadow-sm transition-colors animate-pulse"
                                  >
                                      Nhận lead
                                  </button>
                              )}
                          </div>
                      )) : (
                          <div className="p-8 text-center text-slate-400 text-sm">Tuyệt vời! Đã xử lý hết lead mới.</div>
                      )}
                  </div>
              </div>

          </div>

          {/* Cột 2: Nhắc nhở & CSKH */}
          <div className="space-y-6">
              
              {/* Sinh nhật khách hàng */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-pink-50">
                      <h3 className="font-bold text-pink-800 text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg>
                          Sinh nhật tháng này ({birthdayCustomers.length})
                      </h3>
                  </div>
                  <div className="p-2 space-y-2 max-h-[200px] overflow-y-auto">
                      {birthdayCustomers.length > 0 ? birthdayCustomers.map(c => (
                          <div key={c.phone} className="flex items-center p-2 bg-slate-50 rounded border border-slate-100">
                              <div className="flex-1">
                                  <p className="text-xs font-bold text-slate-700">{c.name}</p>
                                  <div className="flex justify-between items-center mt-0.5">
                                      <p className="text-[10px] text-slate-500">SN: {new Date(c.dateOfBirth!).toLocaleDateString('vi-VN')}</p>
                                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded border border-slate-200">
                                          {getSaleName(c.assignedTo)}
                                      </span>
                                  </div>
                              </div>
                              <button className="text-[10px] text-blue-600 font-bold hover:underline ml-2" onClick={() => { /* Logic gọi/nhắn tin */ }}>Gửi SMS</button>
                          </div>
                      )) : <p className="text-xs text-slate-400 text-center py-2">Không có khách sinh nhật tháng này.</p>}
                  </div>
              </div>

              {/* Nhiệm vụ CSKH */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-teal-50">
                      <h3 className="font-bold text-teal-800 text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002 2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                          Phiếu CSKH cần xử lý
                      </h3>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                      {cskhTasks.length > 0 ? cskhTasks.map(item => (
                          <div key={item.id} onClick={() => onSelectCskh(item)} className="p-3 hover:bg-slate-50 cursor-pointer">
                              <div className="flex justify-between items-start mb-1">
                                  <p className="text-xs font-bold text-slate-800">{item.customerName}</p>
                                  <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <p className="text-xs text-slate-600 truncate">{item.service}</p>
                              <div className="mt-2 flex justify-between items-center">
                                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                      👤 {getSaleName(item.assignedTo)}
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                      item.status.includes('complaint') ? 'bg-red-50 text-red-600 border-red-100' :
                                      item.status.includes('rebook') ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                      'bg-teal-50 text-teal-600 border-teal-100'
                                  }`}>
                                      {item.status === 'cskh_new' ? 'Mới tiếp nhận' :
                                       item.status === 'cskh_1_3_days' ? 'Hỏi thăm 1-3 ngày' :
                                       item.status === 'cskh_rebook' ? 'Mời tái khám' : 'Đang xử lý'}
                                  </span>
                              </div>
                          </div>
                      )) : <div className="p-6 text-center text-slate-400 text-xs">Không có phiếu CSKH nào cần xử lý.</div>}
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default SaleDashboard;
