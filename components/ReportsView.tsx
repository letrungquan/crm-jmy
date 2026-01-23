
import React, { useMemo } from 'react';
import { Lead, Order, CustomerData } from '../types';

interface ReportsViewProps {
  leads: Lead[];
  orders: Order[];
  customers: Record<string, CustomerData>;
  sources: string[];
}

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

const ReportsView: React.FC<ReportsViewProps> = ({ leads, orders, customers, sources }) => {
  // 1. Conversion Rates
  const conversionStats = useMemo(() => {
    const total = leads.length;
    const completed = leads.filter(l => l.status === 'completed').length;
    const rate = total > 0 ? (completed / total) * 100 : 0;

    // Breakdown by status
    const statusCounts: Record<string, number> = {};
    leads.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    return { total, completed, rate, statusCounts };
  }, [leads]);

  // 2. Acquisition Sources
  const sourceStats = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(customers).forEach((c: CustomerData) => {
      const src = c.source || 'Không xác định';
      counts[src] = (counts[src] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8); // Top 8 sources

    const totalCustomers = Object.values(customers).length;

    return { counts: sorted, total: totalCustomers };
  }, [customers]);

  // 3. Revenue per Service
  const revenueStats = useMemo(() => {
    const serviceRevenue: Record<string, number> = {};
    orders.forEach(o => {
      if (o.status === 'completed') {
        serviceRevenue[o.service] = (serviceRevenue[o.service] || 0) + o.revenue;
      }
    });

    const sorted = Object.entries(serviceRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 services

    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.revenue, 0);

    return { services: sorted, total: totalRevenue };
  }, [orders]);

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h2 className="text-2xl font-bold text-slate-800">Báo cáo & Phân tích</h2>
          <p className="text-sm text-slate-500 mt-1">Tổng quan về hiệu quả kinh doanh và marketing</p>
        </header>

        {/* Headline KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tổng cơ hội</p>
            <p className="text-3xl font-bold text-slate-800">{conversionStats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tỷ lệ chốt đơn</p>
            <p className="text-3xl font-bold text-blue-600">{conversionStats.rate.toFixed(1)}%</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tổng khách hàng</p>
            <p className="text-3xl font-bold text-indigo-600">{sourceStats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-green-600 truncate">{formatCurrency(revenueStats.total)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Conversion Rate Funnel */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Tỷ lệ chuyển đổi Lead
            </h3>
            <div className="space-y-6">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-100">
                      Conversion Rate
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {conversionStats.rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-blue-50">
                  <div style={{ width: `${conversionStats.rate}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {Object.entries(conversionStats.statusCounts).sort(([,a], [,b]) => (b as number) - (a as number)).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">{status}</span>
                    <span className="text-sm font-bold text-slate-800">{count} lead</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Sources breakdown */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Nguồn khách hàng (Top 8)
            </h3>
            <div className="space-y-4">
              {sourceStats.counts.map(([source, count]) => {
                const percentage = sourceStats.total > 0 ? (count / sourceStats.total) * 100 : 0;
                return (
                  <div key={source} className="group">
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="font-medium text-slate-700">{source}</span>
                      <span className="font-bold text-slate-500">{count} KH ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {sourceStats.counts.length === 0 && (
                <div className="text-center py-10 text-slate-400">Chưa có dữ liệu nguồn khách hàng.</div>
              )}
            </div>
          </section>
        </div>

        {/* Revenue per Service - Bar Chart */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Doanh thu theo Dịch vụ (Top 10)
          </h3>
          <div className="space-y-5">
            {revenueStats.services.map(([service, revenue]) => {
              const maxRevenue = revenueStats.services[0][1];
              const percentage = (revenue / maxRevenue) * 100;
              return (
                <div key={service} className="relative">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-bold text-slate-700 truncate max-w-[70%]">{service}</span>
                    <span className="text-xs font-bold text-green-600">{formatCurrency(revenue)}</span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-lg h-8 overflow-hidden">
                    <div 
                      className="bg-green-100 border-r-4 border-green-500 h-full transition-all duration-1000 flex items-center px-3" 
                      style={{ width: `${percentage}%` }}
                    >
                    </div>
                  </div>
                </div>
              );
            })}
            {revenueStats.services.length === 0 && (
                <div className="text-center py-10 text-slate-400">Chưa có dữ liệu đơn hàng thành công.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportsView;
