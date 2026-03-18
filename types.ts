
export interface StatusConfig {
  id: string;
  name: string;
  color: {
    bg: string;
    text: string;
    border: string;
  };
  sla_days?: number;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  createdBy?: Sale['id'];
}

// Permission strings: "resource.action"
export type Permission = 
  | 'leads.view' | 'leads.view_all' | 'leads.create' | 'leads.edit' | 'leads.delete' | 'leads.import' | 'leads.export'
  | 'customers.view' | 'customers.view_all' | 'customers.create' | 'customers.edit' | 'customers.delete' | 'customers.import' | 'customers.export'
  | 'orders.view' | 'orders.view_all' | 'orders.create' | 'orders.edit' | 'orders.delete' | 'orders.import' | 'orders.export'
  | 'cskh.view' | 'cskh.view_all' | 'cskh.create' | 'cskh.edit' | 'cskh.delete' | 'cskh.import' | 'cskh.export'
  | 'appointments.view' | 'appointments.view_all' | 'appointments.create' | 'appointments.edit' | 'appointments.delete' | 'appointments.import' | 'appointments.export'
  | 'revenue_schedule.view' | 'revenue_schedule.view_all' | 'revenue_schedule.create' | 'revenue_schedule.edit' | 'revenue_schedule.delete' | 'revenue_schedule.import' | 'revenue_schedule.export'
  | 'staff.view' | 'staff.manage' | 'staff.create' | 'staff.edit' | 'staff.delete' | 'staff.import' | 'staff.export'
  | 'settings.view' | 'settings.create' | 'settings.edit' | 'settings.delete' | 'settings.import' | 'settings.export'
  | 'reports.view' | 'reports.create' | 'reports.edit' | 'reports.delete' | 'reports.import' | 'reports.export';

export interface RoleDefinition {
  id: string;
  name: string;
  permissions: Permission[];
  isSystem?: boolean; // Cannot be deleted if true (e.g., admin)
  description?: string;
}

export interface Sale {
  id: string;
  name: string;
  role: string; // References RoleDefinition.id
  email?: string; // Added for display
  phone?: string;
  avatar_url?: string;
}

export interface AccessLog {
  id: number;
  user_id: string;
  ip: string;
  user_agent: string;
  created_at: string;
  location?: string; // Optional geo-location based on IP
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  assignedTo: Sale['id'] | null;
  status: string; // ID of the StatusConfig
  cskhStatus?: string; // Optional CSKH status
  notes: Note[];
  createdAt: string;
  updatedAt: string;
  appointmentDate: string | null; // YYYY-MM-DDTHH:mm
  projectedAppointmentDate: string | null; // YYYY-MM-DDTHH:mm, for 'Contacting' status
  service: string;
  description: string;
  priority: number | null;
  potentialRevenue: number | null;
  doctorName?: string; // Added field for Doctor mapping in CSKH view
  reExaminationDate?: string | null; // Added for Re-examination Schedule
}

export interface CskhItem {
  id: string;
  customerPhone: string;
  customerName: string;
  service: string;
  status: string; // cskh_pending, etc.
  assignedTo: Sale['id'] | null;
  originalLeadId?: string;
  createdAt: string;
  updatedAt: string;
  doctorName?: string; // Added field for Doctor
  reExaminationDate?: string | null; // Added for Re-examination Schedule
  note?: string; // Added field for customer feedback note
  notes?: Note[]; // Interaction history
}

export interface ReExamination {
  id: string;
  customerPhone: string;
  customerName: string;
  date: string; // Ngày hẹn tái khám YYYY-MM-DD
  appointmentTime?: string; // Giờ hẹn HH:mm
  service: string; // Dịch vụ cũ hoặc dự kiến làm
  doctorName?: string;
  assignedTo?: string; // Sale phụ trách
  note?: string;
  notes?: Note[]; // Added for discussion history
  status: 'pending' | 'called' | 'completed' | 'cancelled' | 'converted'; // pending=Cần gọi, called=Đã gọi, completed=Hoàn thành
  createdAt: string;
  updatedAt?: string;
  potentialRevenue?: number; // Doanh thu dự kiến
}

export interface Order {
  id: string;
  customerPhone: string;
  service: string; // Tên dịch vụ/Sản phẩm
  revenue: number;
  createdAt: string;
  status: 'completed' | 'cancelled' | 'pending';
  assignedTo?: string; // Sale ID
  externalId?: string; // Mã đơn từ KiotViet
  source?: string;
  customerName?: string;
  dateOfBirth?: string;
}

export interface CustomerData {
  name?: string;
  phone: string;
  generalNotes: string;
  tags: string[];
  location?: string;
  relationshipStatus?: string;
  assignedTo?: Sale['id'];
  email?: string;
  address?: string;
  customerGroup?: string;
  source?: string;
  creator?: string;
  profileCreatedAt?: string;
  profileCompleteness?: number;
  gender?: string;
  dateOfBirth?: string;
  occupation?: string;
  
  // Address Details
  province?: string;
  district?: string;
  ward?: string;

  // Marketing & Tracking Fields
  ip?: string;
  userAgent?: string;
  fbp?: string;     // Facebook Browser ID
  fbc?: string;     // Facebook Click ID
  ttclid?: string;  // TikTok Click ID
  ttp?: string;     // TikTok Pixel Cookie
  sourceUrl?: string;
  eventId?: string;
  externalId?: string;
  utmSource?: string;
  utmMedium?: string;
  submittedAt?: string;
}

export interface Customer {
    name: string;
    leads: Lead[];
    orders: Order[];
    // Include all fields from CustomerData
    phone: string;
    generalNotes: string;
    tags: string[];
    location?: string;
    relationshipStatus?: string;
    assignedTo?: Sale['id'];
    email?: string;
    address?: string;
    customerGroup?: string;
    source?: string;
    creator?: string;
    profileCreatedAt?: string;
    profileCompleteness?: number;
    gender?: string;
    dateOfBirth?: string;
    occupation?: string;
    province?: string;
    district?: string;
    ward?: string;
    ip?: string;
    userAgent?: string;
    fbp?: string;
    fbc?: string;
    ttclid?: string;
    ttp?: string;
    sourceUrl?: string;
    eventId?: string;
    externalId?: string;
    utmSource?: string;
    utmMedium?: string;
    submittedAt?: string;
}

export interface Activity {
  id: string;
  type: 'lead' | 'cskh' | 'order' | 're_exam' | 'customer';
  icon: string;
  message: string;
  time: string;
  user?: string;
}

export type AppView = 'dashboard' | 'sales_performance' | 'sales' | 'cskh' | 're_exam' | 'customers' | 'orders' | 'revenue' | 'hr' | 'settings' | 'guide';
