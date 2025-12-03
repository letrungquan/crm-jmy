import { Sale, Lead, StatusConfig } from './types';

export const INITIAL_STATUSES: StatusConfig[] = [
  { id: 'new', name: 'Cơ hội mới', color: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-400'} },
  { id: 'contacting', name: 'Đang lấy lịch', color: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-400' } },
  { id: 'scheduled', name: 'Đã đặt lịch', color: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-400' } },
  { id: 'completed', name: 'Đã làm dịch vụ', color: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400' } },
  { id: 'lost', name: 'Trượt', color: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-400' } },
];

export const INITIAL_CSKH_STATUSES: StatusConfig[] = [
    { id: 'cskh_1_completed', name: 'Mới hoàn thành', color: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-400' } },
    { id: 'cskh_2_follow1', name: 'Chờ follow 1 ngày', color: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-400' }, sla_days: 1 },
    { id: 'cskh_3_follow7', name: 'Chờ follow 7 ngày', color: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400' }, sla_days: 7 },
    { id: 'cskh_4_remind', name: 'Cần tái khám / nhắc lịch', color: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-400' } },
    { id: 'cskh_5_done', name: 'Đã chăm sóc', color: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400' } },
    { id: 'cskh_6_special', name: 'Cần xử lý đặc biệt', color: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-400' } },
];


export const INITIAL_SALES: Sale[] = [
  { id: 'sale1', name: 'Ngọc Trinh' },
  { id: 'sale2', name: 'Hà Anh' },
  { id: 'sale3', name: 'Mai Phương' },
  { id: 'sale4', name: 'Phùng Thị Tuyết Anh' },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(14, 0, 0, 0);

const threeDaysFromNow = new Date();
threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
threeDaysFromNow.setHours(10, 30, 0, 0);


export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead1',
    name: 'Bảo',
    phone: '0353562623',
    source: 'Tiktok - Ny Skinlab',
    assignedTo: null,
    status: 'new',
    notes: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    appointmentDate: null,
    projectedAppointmentDate: null,
    service: 'Tư vấn Acnezon 990k',
    description: 'Khách bị mụn, lỗ chân lông to, sẹo rỗ thâm...',
    priority: null,
    potentialRevenue: 990000,
  },
  {
    id: 'lead2',
    name: 'Nguyễn Thị Quỳnh Như',
    phone: '0364826072',
    source: 'Tiktok - Ny Skinlab',
    assignedTo: 'sale2',
    status: 'contacting',
    notes: [
      { id: 'note1', content: 'Đã gọi điện, khách hàng bận, hẹn gọi lại sau.', createdAt: new Date().toISOString(), createdBy: 'sale2' }
    ],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    appointmentDate: null,
    projectedAppointmentDate: '2025-10-10T00:00:00',
    service: 'Tư vấn Meso Acneszon 990k',
    description: 'Chị sắp xếp thời gian sẽ báo',
    priority: null,
    potentialRevenue: 990000,
  },
  {
    id: 'lead3',
    name: 'CHI KIM ANH',
    phone: '0907723704',
    source: 'TikTok - Đẹp Cùng Ny',
    assignedTo: 'sale4',
    status: 'scheduled',
    notes: [
      { id: 'note2', content: 'Khách hàng quan tâm dịch vụ trị mụn, đã hẹn lịch.', createdAt: '2025-10-06T10:06:00.000Z', createdBy: 'sale4' }
    ],
    createdAt: '2025-10-06T10:05:00.000Z',
    updatedAt: '2025-10-06T10:06:00.000Z',
    appointmentDate: '2025-10-08T18:00',
    projectedAppointmentDate: null,
    service: 'Tư vấn Meso Acneszon 990k',
    description: '',
    priority: 1,
    potentialRevenue: 990000,
  },
   {
    id: 'lead4',
    name: 'Chị Nhã',
    phone: '0965974279',
    source: 'Facebook',
    assignedTo: 'sale3',
    status: 'contacting',
    notes: [
      { id: 'note3', content: 'Đã xác nhận sẽ đến đúng hẹn.', createdAt: new Date().toISOString(), createdBy: 'sale3' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appointmentDate: null,
    projectedAppointmentDate: '2025-10-12T00:00:00',
    service: 'Tư vấn Meso iluma 990k',
    description: 'Thứ 7 chị còn đi làm, có gì em lấy lịch chủ nhật hoặc buổi tối...',
    priority: null,
    potentialRevenue: 990000,
  },
   {
    id: 'lead5',
    name: 'Vũ Thị E',
    phone: '0945678901',
    source: 'Zalo',
    assignedTo: 'sale2',
    status: 'completed',
    notes: [
      { id: 'note4', content: 'Khách hàng rất hài lòng với dịch vụ.', createdAt: new Date().toISOString(), createdBy: 'sale2' }
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    appointmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    projectedAppointmentDate: null,
    service: 'Triệt lông Diode Laser',
    description: 'Hoàn thành liệu trình 5 buổi.',
    priority: null,
    potentialRevenue: 5000000,
    cskhStatus: 'cskh_1_completed',
  },
];