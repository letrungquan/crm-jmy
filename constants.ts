
import { StatusConfig, Sale, Lead } from './types';

export const INITIAL_STATUSES: StatusConfig[] = [
  { id: 'new', name: 'Mới', color: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' } },
  { id: 'contacting', name: 'Đang liên hệ', color: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' } },
  { id: 'scheduled', name: 'Đã đặt lịch', color: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' } },
  { id: 'completed', name: 'Đã đến/Xong', color: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' } },
  { id: 'lost', name: 'Thất bại', color: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' } },
];

export const INITIAL_CSKH_STATUSES: StatusConfig[] = [
  { id: 'cskh_new', name: 'Mới tiếp nhận', color: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }, sla_days: 1 },
  { id: 'cskh_1_3_days', name: 'Hỏi thăm 1-3 ngày', color: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' }, sla_days: 3 },
  { id: 'cskh_7_14_days', name: 'Kết quả 7-14 ngày', color: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' }, sla_days: 14 },
  { id: 'cskh_rebook', name: 'Mời tái khám', color: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' }, sla_days: 30 },
  { id: 'cskh_complaint', name: 'Xử lý khiếu nại', color: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' } },
  { id: 'cskh_done', name: 'Hoàn tất', color: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' } },
];

export const DOCTORS = ['BS Vinh', 'BS Nga', 'BS Trầm', 'BS Vũ'];

export const INITIAL_SALES: Sale[] = [
  { id: 'sale1', name: 'Ngọc Trinh', role: 'admin' },
  { id: 'sale2', name: 'Hà Anh', role: 'sale' },
  { id: 'sale3', name: 'Mai Phương', role: 'sale' },
];

export const INITIAL_LEADS: Lead[] = [];
