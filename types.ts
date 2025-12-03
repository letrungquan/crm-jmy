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

export interface Sale {
  id: string;
  name: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  assignedTo: Sale['id'] | null;
  status: string; // ID of the StatusConfig
  notes: Note[];
  createdAt: string;
  updatedAt: string;
  appointmentDate: string | null; // YYYY-MM-DDTHH:mm
  projectedAppointmentDate: string | null; // YYYY-MM-DDTHH:mm, for 'Contacting' status
  service: string;
  description: string;
  priority: number | null;
  potentialRevenue: number | null;
  cskhStatus?: string;
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
  taxCode?: string;
  address?: string;
  businessIndustry?: string;
  customerGroup?: string;
  website?: string;
  source?: string;
  creator?: string;
  profileCreatedAt?: string;
  profileCompleteness?: number;
}

export interface Customer extends CustomerData {
    name: string;
    leads: Lead[];
}

export type AppView = 'dashboard' | 'sales' | 'cskh' | 'customers' | 'revenue' | 'hr' | 'guide';