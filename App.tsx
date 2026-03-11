import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { 
  Lead, Sale, Order, CskhItem, ReExamination, Customer, CustomerData,
  StatusConfig, RoleDefinition, AppView, Permission, Note, Activity
} from './types';
import useLocalStorage from './hooks/useLocalStorage';

// Components
import Sidebar from './components/Sidebar';
import MainHeader from './components/MainHeader';
import LoginView from './components/LoginView';
import KanbanBoard from './components/KanbanBoard';
import LeadList from './components/LeadList';
import CalendarView from './components/CalendarView';
import CskhView from './components/CskhView';
import ReExaminationView from './components/ReExaminationView';
import CustomerList from './components/CustomerList';
import OrderList from './components/OrderList';
import SaleDashboard from './components/SaleDashboard';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import UserGuideView from './components/UserGuideView';

// Modals
import LeadDetailModal from './components/LeadDetailModal';
import AddLeadModal from './components/AddLeadModal';
import AddOrderModal from './components/AddOrderModal';
import ImportOrderModal from './components/ImportOrderModal';
import CustomerFormModal from './components/CustomerFormModal';
import CustomerDetailView from './components/CustomerDetailView';
import CskhDetailModal from './components/CskhDetailModal';
import CompleteLeadModal from './components/CompleteLeadModal';
import StatusManagementModal from './components/StatusManagementModal';
import ConfirmationModal from './components/ConfirmationModal';
import AddReExaminationModal from './components/AddReExaminationModal';
import ReExaminationDetailModal from './components/ReExaminationDetailModal';

// Constants
import { 
  INITIAL_STATUSES, INITIAL_CSKH_STATUSES, INITIAL_SALES 
} from './constants';

import { PermissionProvider, usePermissions } from './contexts/PermissionContext';

function AppContent() {
  const { hasPermission, canView, canCreate, canEdit, canDelete, canImport, isAdmin, isLoading } = usePermissions();
  // --- Auth State ---
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [userProfile, setUserProfile] = useState<Sale | null>(null);

  // --- UI State ---
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // --- Data State ---
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cskhItems, setCskhItems] = useState<CskhItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reExaminations, setReExaminations] = useState<ReExamination[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  
  // --- Config State ---
  const [statuses, setStatuses] = useState<StatusConfig[]>(INITIAL_STATUSES);
  const [cskhStatuses, setCskhStatuses] = useState<StatusConfig[]>(INITIAL_CSKH_STATUSES);
  const [sources, setSources] = useState<string[]>(['Facebook', 'Zalo', 'Website', 'Direct', 'Referral']);
  const [relationships, setRelationships] = useState<string[]>(['Mới', 'Tiềm năng', 'Quan tâm', 'Chốt đơn', 'VIP', 'Hủy']);
  const [customerGroups, setCustomerGroups] = useState<string[]>(['VIP', 'Thân thiết', 'Tiềm năng', 'Vãng lai']);

  // --- Local Storage (Offline Mode) ---
  const [useLocalOnly, setUseLocalOnly] = useState(false);
  const [localLeads, setLocalLeads] = useLocalStorage<Lead[]>('local_leads', []);
  const [localCskh, setLocalCskh] = useLocalStorage<CskhItem[]>('local_cskh', []);
  const [localOrders, setLocalOrders] = useLocalStorage<Order[]>('local_orders', []);
  const [localReExams, setLocalReExams] = useLocalStorage<ReExamination[]>('local_re_exams', []);

  // --- Modals State ---
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [leadToComplete, setLeadToComplete] = useState<Lead | null>(null);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isImportOrderModalOpen, setIsImportOrderModalOpen] = useState(false);

  const [selectedCskh, setSelectedCskh] = useState<CskhItem | null>(null);
  
  const [isAddReExamModalOpen, setIsAddReExamModalOpen] = useState(false);
  const [reExamInitialCustomer, setReExamInitialCustomer] = useState<Customer | undefined>(undefined);
  const [selectedReExam, setSelectedReExam] = useState<ReExamination | null>(null);
  const [deleteCskhTarget, setDeleteCskhTarget] = useState<string | null>(null);
  const [deleteReExamTarget, setDeleteReExamTarget] = useState<string | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'sales' | 'cskh'>('sales');

  const [confirmModal, setConfirmModal] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      isDangerous?: boolean;
      onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // --- Sync Selected Items on Realtime Updates ---
  useEffect(() => {
      if (selectedLead) {
          const updated = leads.find(l => l.id === selectedLead.id);
          if (updated && updated !== selectedLead) setSelectedLead(updated);
      }
  }, [leads]);

  useEffect(() => {
      if (selectedCustomer) {
          const updated = customers.find(c => c.phone === selectedCustomer.phone);
          if (updated && updated !== selectedCustomer) setSelectedCustomer(updated);
      }
  }, [customers]);

  useEffect(() => {
      if (selectedCskh) {
          const updated = cskhItems.find(c => c.id === selectedCskh.id);
          if (updated && updated !== selectedCskh) setSelectedCskh(updated);
      }
  }, [cskhItems]);

  useEffect(() => {
      if (selectedReExam) {
          const updated = reExaminations.find(r => r.id === selectedReExam.id);
          if (updated && updated !== selectedReExam) setSelectedReExam(updated);
      }
  }, [reExaminations]);

  // --- Filter State ---
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSaleFilter, setSelectedSaleFilter] = useState<string>('all');


  const fetchActivities = async () => {
      if (useLocalOnly) return;
      
      try {
          let leadsQ = supabase.from('leads').select('id, name, status, created_at, updated_at, assigned_to').order('created_at', { ascending: false }).limit(15);
          let cskhQ = supabase.from('cskh').select('id, customer_phone, status, created_at, updated_at, assigned_to').order('created_at', { ascending: false }).limit(15);
          let ordersQ = supabase.from('orders').select('id, customer_name, revenue, status, created_at, assigned_to').order('created_at', { ascending: false }).limit(15);
          let reExamsQ = supabase.from('re_examinations').select('id, customer_name, status, created_at, assigned_to').order('created_at', { ascending: false }).limit(15);
          let customersQ = supabase.from('customers').select('phone, name, created_at, creator').order('created_at', { ascending: false }).limit(15);
          let notesQ = supabase.from('notes').select('id, content, created_at, created_by, lead_id').order('created_at', { ascending: false }).limit(20);

          if (!hasPermission('leads', 'view_all')) leadsQ = leadsQ.eq('assigned_to', currentUser);
          if (!hasPermission('cskh', 'view_all')) cskhQ = cskhQ.eq('assigned_to', currentUser);
          if (!hasPermission('orders', 'view_all')) ordersQ = ordersQ.eq('assigned_to', currentUser);
          if (!hasPermission('appointments', 'view_all')) reExamsQ = reExamsQ.eq('assigned_to', currentUser);
          if (!hasPermission('customers', 'view_all')) customersQ = customersQ.eq('creator', currentUser);
          if (!hasPermission('leads', 'view_all')) notesQ = notesQ.eq('created_by', currentUser);

          const [leadsRes, cskhRes, ordersRes, reExamsRes, customersRes, notesRes] = await Promise.all([
              leadsQ, cskhQ, ordersQ, reExamsQ, customersQ, notesQ
          ]);

          const allActivities: Activity[] = [
              ...(leadsRes.data || []).map(l => ({
                  id: `lead-${l.id}`,
                  type: 'lead' as const,
                  icon: '🎯',
                  message: `Lead mới: ${l.name}`,
                  time: l.created_at,
                  user: sales.find(s => s.id === l.assigned_to)?.name
              })),
              ...(cskhRes.data || []).map(c => ({
                  id: `cskh-${c.id}`,
                  type: 'cskh' as const,
                  icon: '💬',
                  message: `CSKH: ${leads.find(l => l.phone === c.customer_phone)?.name || c.customer_phone} - ${c.status}`,
                  time: c.created_at,
                  user: sales.find(s => s.id === c.assigned_to)?.name
              })),
              ...(ordersRes.data || []).map(o => ({
                  id: `order-${o.id}`,
                  type: 'order' as const,
                  icon: '📦',
                  message: `Đơn hàng: ${o.customer_name} - ${new Intl.NumberFormat('vi-VN').format(o.revenue)}đ`,
                  time: o.created_at,
                  user: sales.find(s => s.id === o.assigned_to)?.name
              })),
              ...(reExamsRes.data || []).map(a => ({
                  id: `re-exam-${a.id}`,
                  type: 're_exam' as const,
                  icon: '📅',
                  message: `Lịch tái khám: ${a.customer_name}`,
                  time: a.created_at,
                  user: sales.find(s => s.id === a.assigned_to)?.name
              })),
              ...(customersRes.data || []).map(cust => ({
                  id: `cust-${cust.phone}`,
                  type: 'customer' as const,
                  icon: '👤',
                  message: `Khách hàng mới: ${cust.name}`,
                  time: cust.created_at,
                  user: sales.find(s => s.id === cust.creator)?.name
              })),
              ...(notesRes.data || []).map(n => ({
                  id: `note-${n.id}`,
                  type: 'lead' as const,
                  icon: '📝',
                  message: `Ghi chú: ${n.content.substring(0, 50)}${n.content.length > 50 ? '...' : ''}`,
                  time: n.created_at,
                  user: sales.find(s => s.id === n.created_by)?.name
              }))
          ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 30);

          setActivities(allActivities);
      } catch (err) {
          console.error("Lỗi fetch activities:", err);
      }
  };

  const realtimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchActivitiesDebounced = () => {
      if (realtimeTimeoutRef.current) {
          clearTimeout(realtimeTimeoutRef.current);
      }
      realtimeTimeoutRef.current = setTimeout(() => {
          fetchActivities();
      }, 1000);
  };

  const handleLeadChange = async (payload: any) => {
      if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id !== payload.old.id));
      } else {
          const { data } = await supabase.from('leads').select('*, notes(*)').eq('id', payload.new.id).single();
          if (data) {
              const formatted: Lead = {
                  id: data.id,
                  name: data.name,
                  phone: data.phone,
                  source: data.source,
                  assignedTo: data.assigned_to,
                  status: data.status,
                  notes: (data.notes || []).map((n: any) => ({
                      id: n.id,
                      content: n.content,
                      createdAt: n.created_at,
                      createdBy: n.created_by
                  })),
                  createdAt: data.created_at,
                  updatedAt: data.updated_at,
                  appointmentDate: data.appointment_date,
                  projectedAppointmentDate: data.projected_appointment_date,
                  service: data.service,
                  description: data.description,
                  priority: data.priority,
                  potentialRevenue: data.potential_revenue,
              };
              setLeads(prev => {
                  if (!hasPermission('leads', 'view_all') && formatted.assignedTo !== currentUser) {
                      return prev.filter(l => l.id !== formatted.id);
                  }
                  if (prev.find(l => l.id === formatted.id)) {
                      return prev.map(l => l.id === formatted.id ? formatted : l);
                  }
                  return [formatted, ...prev];
              });
          }
      }
      fetchActivitiesDebounced();
  };

  const handleCskhChange = async (payload: any) => {
      if (payload.eventType === 'DELETE') {
          setCskhItems(prev => prev.filter(c => c.id !== payload.old.id));
      } else {
          const { data } = await supabase.from('cskh').select('*').eq('id', payload.new.id).single();
          if (data) {
              setCskhItems(prev => {
                  if (!hasPermission('cskh', 'view_all') && data.assigned_to !== currentUser) {
                      return prev.filter(c => c.id !== data.id);
                  }
                  const existing = prev.find(c => c.id === data.id);
                  const formatted: CskhItem = {
                      id: data.id,
                      customerPhone: data.customer_phone,
                      customerName: existing?.customerName || 'Khách hàng',
                      service: data.service,
                      status: data.status,
                      assignedTo: data.assigned_to,
                      originalLeadId: data.original_lead_id,
                      createdAt: data.created_at,
                      updatedAt: data.updated_at,
                      doctorName: data.doctor_name,
                      reExaminationDate: data.re_examination_date,
                      note: data.note
                  };
                  if (existing) return prev.map(c => c.id === formatted.id ? formatted : c);
                  return [formatted, ...prev];
              });
          }
      }
      fetchActivitiesDebounced();
  };

  const handleOrderChange = async (payload: any) => {
      if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
      } else {
          const { data } = await supabase.from('orders').select('*').eq('id', payload.new.id).single();
          if (data) {
              const formatted: Order = {
                  id: data.id,
                  customerPhone: data.customer_phone,
                  customerName: data.customer_name,
                  service: data.service,
                  revenue: data.revenue,
                  createdAt: data.created_at,
                  status: data.status,
                  assignedTo: data.assigned_to,
                  externalId: data.external_id,
                  source: data.source
              };
              setOrders(prev => {
                  if (!hasPermission('orders', 'view_all') && formatted.assignedTo !== currentUser) {
                      return prev.filter(o => o.id !== formatted.id);
                  }
                  if (prev.find(o => o.id === formatted.id)) return prev.map(o => o.id === formatted.id ? formatted : o);
                  return [formatted, ...prev];
              });
          }
      }
      fetchActivitiesDebounced();
  };

  const handleReExamChange = async (payload: any) => {
      if (payload.eventType === 'DELETE') {
          setReExaminations(prev => prev.filter(r => r.id !== payload.old.id));
      } else {
          const { data } = await supabase.from('re_examinations').select('*').eq('id', payload.new.id).single();
          if (data) {
              const formatted: ReExamination = {
                  id: data.id,
                  customerPhone: data.customer_phone,
                  customerName: data.customer_name,
                  date: data.date,
                  appointmentTime: data.appointment_time,
                  service: data.service,
                  doctorName: data.doctor_name,
                  assignedTo: data.assigned_to,
                  note: data.note,
                  status: data.status,
                  potentialRevenue: data.potential_revenue,
                  createdAt: data.created_at,
                  updatedAt: data.updated_at
              };
              setReExaminations(prev => {
                  if (!hasPermission('appointments', 'view_all') && formatted.assignedTo !== currentUser) {
                      return prev.filter(r => r.id !== formatted.id);
                  }
                  if (prev.find(r => r.id === formatted.id)) return prev.map(r => r.id === formatted.id ? formatted : r);
                  return [formatted, ...prev];
              });
          }
      }
      fetchActivitiesDebounced();
  };

  const handleCustomerChange = async (payload: any) => {
      if (payload.eventType === 'DELETE') {
          setCustomers(prev => prev.filter(c => c.phone !== payload.old.phone));
      } else {
          const { data } = await supabase.from('customers').select('*').eq('phone', payload.new.phone).single();
          if (data) {
              setCustomers(prev => {
                  const existing = prev.find(c => c.phone === data.phone);
                  const formatted: Customer = {
                      phone: data.phone,
                      name: data.name,
                      email: data.email,
                      address: data.address,
                      location: data.location,
                      customerGroup: data.customer_group,
                      relationshipStatus: data.relationship_status,
                      gender: data.gender,
                      dateOfBirth: data.date_of_birth,
                      occupation: data.occupation,
                      profileCompleteness: data.profile_completeness,
                      source: data.source,
                      assignedTo: data.assigned_to,
                      leads: existing?.leads || [],
                      orders: existing?.orders || [],
                      generalNotes: data.general_notes || '',
                      tags: data.tags || []
                  };
                  if (existing) return prev.map(c => c.phone === formatted.phone ? formatted : c);
                  return [formatted, ...prev];
              });
          }
      }
      fetchActivitiesDebounced();
  };

  const handleNoteChange = async (payload: any) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const leadId = payload.new.lead_id;
          if (leadId) {
              const { data } = await supabase.from('leads').select('*, notes(*)').eq('id', leadId).single();
              if (data) {
                  setLeads(prev => prev.map(l => l.id === leadId ? {
                      ...l,
                      notes: (data.notes || []).map((n: any) => ({
                          id: n.id,
                          content: n.content,
                          createdAt: n.created_at,
                          createdBy: n.created_by
                      }))
                  } : l));
              }
          }
      }
      fetchActivitiesDebounced();
  };

  useEffect(() => {
      if (useLocalOnly || !session) return;

      const channel = supabase.channel('dashboard-activities')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, handleLeadChange)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'cskh' }, handleCskhChange)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleOrderChange)
          .on('postgres_changes', { event: '*', schema: 'public', table: 're_examinations' }, handleReExamChange)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, handleCustomerChange)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, handleNoteChange)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchActivitiesDebounced)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
              const newSetting = payload.new as any;
              if (!newSetting) return;
              if (newSetting.key === 'sources' && Array.isArray(newSetting.value)) {
                  setSources(newSetting.value);
              } else if (newSetting.key === 'relationships' && Array.isArray(newSetting.value)) {
                  setRelationships(newSetting.value);
              } else if (newSetting.key === 'customer_groups' && Array.isArray(newSetting.value)) {
                  setCustomerGroups(newSetting.value);
              } else if (newSetting.key === 'statuses' && Array.isArray(newSetting.value)) {
                  setStatuses(newSetting.value);
              } else if (newSetting.key === 'cskh_statuses' && Array.isArray(newSetting.value)) {
                  setCskhStatuses(newSetting.value);
              }
          })
          .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                  console.log('Realtime connected successfully');
              }
          });
      
      return () => {
          supabase.removeChannel(channel);
      };
  }, [useLocalOnly, session, currentUser, isAdmin, hasPermission]);

  // --- Helper Functions ---
  const formatErrorMessage = (err: any) => {
    return err?.message || JSON.stringify(err);
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // --- Data Fetching ---
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Nếu đang ở chế độ Local hoặc mất kết nối, dùng dữ liệu local ngay lập tức
    if (useLocalOnly) {
        setLeads(localLeads);
        setCskhItems(localCskh);
        setOrders(localOrders);
        setReExaminations(localReExams);
        // Build customer map from local data
        const customerMap = new Map<string, Customer>();
        localLeads.forEach(l => {
             if(!customerMap.has(l.phone)) {
                 customerMap.set(l.phone, {
                     name: l.name, phone: l.phone, leads: [], orders: [], generalNotes: '', tags: [], source: l.source
                 });
             }
             customerMap.get(l.phone)?.leads.push(l);
        });
        localOrders.forEach(o => {
             if(!customerMap.has(o.customerPhone)) {
                 customerMap.set(o.customerPhone, {
                     name: o.customerName || 'Khách hàng', phone: o.customerPhone, leads: [], orders: [], generalNotes: '', tags: [], source: o.source, dateOfBirth: o.dateOfBirth
                 });
             }
             customerMap.get(o.customerPhone)?.orders.push(o);
        });
        setCustomers(Array.from(customerMap.values()));
        setIsRefreshing(false);
        return;
    }

    if (!session && !forceRefresh) return;
    setIsRefreshing(true);

    try {
        // 1. Fetch Sales (Profiles)
        // Dùng try-catch riêng cho từng request để tránh crash toàn bộ
        let profiles = [];
        try {
            const { data, error } = await supabase.from('profiles').select('*');
            if (!error && data) profiles = data;
        } catch (e) { console.warn("Lỗi fetch profiles", e); }
        
        if (profiles.length > 0) setSales(profiles);

        // 2. Fetch Leads
        let leadsQuery = supabase.from('leads').select(`
            *,
            notes (*)
        `);
        if (!hasPermission('leads', 'view_all')) {
            leadsQuery = leadsQuery.eq('assigned_to', currentUser);
        }
        const { data: leadsData, error: leadsError } = await leadsQuery.order('created_at', { ascending: false });
        
        if (leadsError) throw leadsError;
        
        const formattedLeads: Lead[] = (leadsData || []).map(l => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
            source: l.source,
            assignedTo: l.assigned_to,
            status: l.status,
            notes: (l.notes || []).map((n: any) => ({
                id: n.id,
                content: n.content,
                createdAt: n.created_at,
                createdBy: n.created_by
            })),
            createdAt: l.created_at,
            updatedAt: l.updated_at,
            appointmentDate: l.appointment_date,
            projectedAppointmentDate: l.projected_appointment_date,
            service: l.service,
            description: l.description,
            priority: l.priority,
            potentialRevenue: l.potential_revenue,
            cskhStatus: l.cskh_status,
            doctorName: l.doctor_name,
            reExaminationDate: l.re_examination_date
        }));
        setLeads(formattedLeads);

        // 3. Fetch CSKH
        let cskhQuery = supabase.from('cskh').select('*');
        if (!hasPermission('cskh', 'view_all')) {
            cskhQuery = cskhQuery.eq('assigned_to', currentUser);
        }
        const { data: cskhData, error: cskhError } = await cskhQuery.order('created_at', { ascending: false });
        if (cskhError) throw cskhError;
        
        const formattedCskh: CskhItem[] = (cskhData || []).map(c => ({
            id: c.id,
            customerPhone: c.customer_phone,
            customerName: formattedLeads.find(l => l.phone === c.customer_phone)?.name || 'Khách hàng',
            service: c.service,
            status: c.status,
            assignedTo: c.assigned_to,
            originalLeadId: c.original_lead_id,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            doctorName: c.doctor_name,
            reExaminationDate: c.re_examination_date,
            note: c.note
        }));
        setCskhItems(formattedCskh);

        // 4. Fetch Orders
        let ordersQuery = supabase.from('orders').select('*');
        if (!hasPermission('orders', 'view_all')) {
            ordersQuery = ordersQuery.eq('assigned_to', currentUser);
        }
        const { data: ordersData, error: ordersError } = await ordersQuery.order('created_at', { ascending: false });
        if (ordersError) throw ordersError;

        const formattedOrders: Order[] = (ordersData || []).map(o => ({
            id: o.id,
            customerPhone: o.customer_phone,
            customerName: o.customer_name,
            service: o.service,
            revenue: o.revenue,
            createdAt: o.created_at,
            status: o.status,
            assignedTo: o.assigned_to,
            externalId: o.external_id,
            source: o.source
        }));
        setOrders(formattedOrders);
        
        // 5. Fetch Re-examinations
        let reExamQuery = supabase.from('re_examinations').select('*');
        if (!hasPermission('appointments', 'view_all')) {
            reExamQuery = reExamQuery.eq('assigned_to', currentUser);
        }
        const { data: reExamData } = await reExamQuery;
        const formattedReExams: ReExamination[] = (reExamData || []).map(r => ({
           id: r.id,
           customerPhone: r.customer_phone,
           customerName: r.customer_name,
           date: r.date,
           appointmentTime: r.appointment_time,
           service: r.service,
           doctorName: r.doctor_name,
           assignedTo: r.assigned_to,
           note: r.note,
           status: r.status,
           createdAt: r.created_at,
           potentialRevenue: r.potential_revenue
        }));
        setReExaminations(formattedReExams);

        // 6. Fetch Activities
        await fetchActivities();

        // 7. Customers Logic
        const customerMap = new Map<string, Customer>();
        formattedLeads.forEach(l => {
            const existing = customerMap.get(l.phone);
            if (existing) {
                existing.leads.push(l);
            } else {
                customerMap.set(l.phone, {
                    name: l.name,
                    phone: l.phone,
                    leads: [l],
                    orders: [],
                    generalNotes: '',
                    tags: [],
                    source: l.source,
                    assignedTo: l.assignedTo || undefined
                });
            }
        });
        formattedOrders.forEach(o => {
            const existing = customerMap.get(o.customerPhone);
             if (existing) {
                existing.orders.push(o);
            } else {
                 customerMap.set(o.customerPhone, {
                    name: o.customerName || 'Khách hàng',
                    phone: o.customerPhone,
                    leads: [],
                    orders: [o],
                    generalNotes: '',
                    tags: [],
                    assignedTo: o.assignedTo || undefined,
                    source: o.source,
                    dateOfBirth: o.dateOfBirth
                });
            }
        });

        // Enriched Customer Data
        try {
            let customersQuery = supabase.from('customers').select('*');
            if (!hasPermission('customers', 'view_all')) {
                customersQuery = customersQuery.eq('creator', currentUser);
            }
            const { data: customerDetails } = await customersQuery;
            if (customerDetails) {
                customerDetails.forEach(c => {
                     const existing = customerMap.get(c.phone);
                     if (existing) {
                         Object.assign(existing, {
                             name: c.name,
                             email: c.email,
                             address: c.address,
                             location: c.location,
                             customerGroup: c.customer_group,
                             relationshipStatus: c.relationship_status,
                             gender: c.gender,
                             dateOfBirth: c.date_of_birth,
                             occupation: c.occupation,
                             profileCompleteness: c.profile_completeness,
                             source: c.source,
                             assignedTo: c.assigned_to || existing.assignedTo
                         });
                     } else {
                         customerMap.set(c.phone, {
                             name: c.name,
                             phone: c.phone,
                             leads: [],
                             orders: [],
                             generalNotes: '',
                             tags: [],
                             email: c.email,
                             address: c.address,
                             location: c.location,
                             customerGroup: c.customer_group,
                             relationshipStatus: c.relationship_status,
                             gender: c.gender,
                             dateOfBirth: c.date_of_birth,
                             occupation: c.occupation,
                             profileCompleteness: c.profile_completeness,
                             source: c.source,
                             assignedTo: c.assigned_to
                         });
                     }
                });
            }
        } catch (e) { console.warn("Lỗi fetch chi tiết khách hàng", e); }

        // Fetch Settings
        try {
            const { data: settingsData, error } = await supabase.from('app_settings').select('*');
            if (error) {
                if (error.code === '42P01') {
                    alert("LỖI NGHIÊM TRỌNG: Bảng 'app_settings' chưa được tạo trên Supabase!\n\nVui lòng vào mục Cài đặt -> Công cụ sửa lỗi Database và chạy đoạn mã SQL số 9 để tạo bảng. Nếu không, các cài đặt (Nguồn, Mối quan hệ, Nhóm KH) sẽ bị mất khi tải lại trang.");
                }
                throw error;
            }
            if (settingsData) {
                settingsData.forEach(setting => {
                    if (setting.key === 'sources' && Array.isArray(setting.value)) {
                        setSources(setting.value);
                    } else if (setting.key === 'relationships' && Array.isArray(setting.value)) {
                        setRelationships(setting.value);
                    } else if (setting.key === 'customer_groups' && Array.isArray(setting.value)) {
                        setCustomerGroups(setting.value);
                    } else if (setting.key === 'statuses' && Array.isArray(setting.value)) {
                        setStatuses(setting.value);
                    } else if (setting.key === 'cskh_statuses' && Array.isArray(setting.value)) {
                        setCskhStatuses(setting.value);
                    }
                });
            }
        } catch (e) { console.warn("Lỗi fetch settings", e); }

        setCustomers(Array.from(customerMap.values()));

    } catch (err: any) {
        console.error("Fetch Data Error - Switching to Local Mode:", err);
        // TỰ ĐỘNG CHUYỂN SANG LOCAL MODE KHI API LỖI
        setUseLocalOnly(true);
        setLeads(localLeads);
        setCskhItems(localCskh);
        setOrders(localOrders);
        setReExaminations(localReExams);
        // Mock customers again for local fallback...
        const customerMap = new Map<string, Customer>();
        localLeads.forEach(l => {
             if(!customerMap.has(l.phone)) customerMap.set(l.phone, { name: l.name, phone: l.phone, leads: [l], orders: [], generalNotes: '', tags: [] });
             else customerMap.get(l.phone)?.leads.push(l);
        });
        setCustomers(Array.from(customerMap.values()));
    } finally {
        setIsRefreshing(false);
    }
  }, [session, useLocalOnly, localLeads, localCskh, localOrders, localReExams, currentUser, isAdmin, hasPermission]);

  // --- Auth Effect ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
            console.error('Error getting session:', error);
            supabase.auth.signOut();
            setSession(null);
            return;
        }
        setSession(session);
        if (session) {
            setCurrentUser(session.user.id);
            // Fetch profile - if fail, fallback to a mock admin for offline test
            supabase.from('profiles').select('*').eq('id', session.user.id).single()
                .then(({ data }) => {
                    if (data) setUserProfile(data);
                    else {
                        // Mock profile if DB fails but Auth works (common in dev with bad RLS)
                        setUserProfile({ id: session.user.id, name: session.user.email || 'User', role: 'admin' });
                    }
                }, () => setUserProfile({ id: session.user.id, name: 'Offline User', role: 'admin' }));
        }
    });

    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
        const event = _event as any;
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            setSession(null);
            setUserProfile(null);
            setCurrentUser('');
            setLeads([]);
            return;
        }
        
        setSession(session);
        if (session) {
            setCurrentUser(session.user.id);
             supabase.from('profiles').select('*').eq('id', session.user.id).single()
                .then(({ data }) => {
                    if (data) setUserProfile(data);
                });
        }
    });

    return () => subscription.unsubscribe();
  }, []); // Auth state only

  // --- Initial Data Fetch Effect ---
  useEffect(() => {
      if (useLocalOnly || (session && currentUser && !isLoading)) {
          fetchData(true);
      }
  }, [session, currentUser, isLoading, fetchData, useLocalOnly]);

  // --- Actions (Giữ nguyên logic, thêm check useLocalOnly) ---

  const updateSetting = async (key: string, value: any, setter: React.Dispatch<React.SetStateAction<any>>) => {
      setter(value);
      if (useLocalOnly) return;
      try {
          const { error } = await supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() });
          if (error) throw error;
      } catch (err: any) {
          console.error(`Lỗi lưu ${key}:`, err);
          if (err.code === '42P01') {
              alert(`Lỗi lưu cài đặt ${key}: Bảng 'app_settings' chưa được tạo! Vui lòng vào Cài đặt -> Công cụ sửa lỗi Database và chạy đoạn mã SQL số 9.`);
          } else {
              alert(`Lỗi lưu cài đặt ${key}: ${err.message || 'Lỗi không xác định'}`);
          }
      }
  };

  const executeDeleteLead = async (leadId: string) => {
    if (!hasPermission('leads', 'delete')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC XÓA CƠ HỘI."); return; }
    closeConfirmModal();
    const prevLeads = [...leads];
    setLeads(current => current.filter(l => l.id !== leadId));
    if (selectedLead?.id === leadId) setSelectedLead(null);

    if (useLocalOnly) {
        const newLeads = leads.filter(l => l.id !== leadId);
        setLocalLeads(newLeads);
        return;
    }

    try {
        await supabase.from('notes').delete().eq('lead_id', leadId);
        const { error } = await supabase.from('leads').delete().eq('id', leadId);
        if (error) throw error;
    } catch (err) { 
        setLeads(prevLeads);
        alert(formatErrorMessage(err)); 
    }
  };

  const executeDeleteCskh = async (cskhId: string, requireConfirm = true) => {
      if (!hasPermission('cskh', 'delete')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC XÓA CSKH."); return; }
      try {
          console.log('Attempting to delete CSKH item:', cskhId);
          
          if (requireConfirm) {
              // Thêm một khoảng trễ nhỏ để tránh xung đột với các sự kiện click/drag khác
              await new Promise(resolve => setTimeout(resolve, 150));
              const confirmed = window.confirm("Bạn có chắc chắn muốn xóa mục CSKH này?");
              console.log('Confirmation result for', cskhId, ':', confirmed);
              if (!confirmed) {
                  console.log('Deletion cancelled by user');
                  return;
              }
          }
          
          if (!cskhItems) {
              console.error('cskhItems is undefined or null');
              return;
          }

          const prevItems = [...cskhItems];
          
          // Optimistic update
          setCskhItems(current => current.filter(item => item.id !== cskhId));
          
          if (selectedCskh && selectedCskh.id === cskhId) {
              setSelectedCskh(null);
          }

          if (useLocalOnly) {
              console.log('Deleting from local storage');
              setLocalCskh(prev => prev.filter(item => item.id !== cskhId));
              return;
          }

          console.log('Deleting from Supabase');
          const { error } = await supabase.from('cskh').delete().eq('id', cskhId);
          
          if (error) {
              console.error('Supabase delete error:', error);
              // Revert optimistic update
              setCskhItems(prevItems);
              throw error;
          }
          console.log('Successfully deleted from Supabase');
      } catch (err) {
          console.error('Delete failed:', err);
          alert(formatErrorMessage(err));
      }
  };

  const handleAddOrder = async (orderData: any) => {
      if (!hasPermission('orders', 'create')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC THÊM ĐƠN HÀNG."); return; }
      setIsAddOrderModalOpen(false);
      setIsRefreshing(true);
      
      const newOrder = {
          ...orderData,
          id: `ord_${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'completed',
          assignedTo: currentUser
      };

      if (useLocalOnly) {
          setOrders(prev => [newOrder, ...prev]);
          setLocalOrders(prev => [newOrder, ...prev]);
          setIsRefreshing(false);
          return;
      }

      try {
          // 1. Đảm bảo khách hàng tồn tại trước khi tạo đơn (tránh lỗi Foreign Key)
          const { error: custError } = await supabase.from('customers').insert([{
              phone: newOrder.customerPhone,
              name: newOrder.customerName || 'Khách hàng',
              source: 'manual',
              relationship_status: 'Chốt đơn',
              creator: currentUser,
              assigned_to: currentUser
          }]);
          
          if (custError && custError.code !== '23505') {
              throw new Error(`Lỗi dữ liệu khách hàng: ${custError.message}`);
          }

          const { error } = await supabase.from('orders').insert([{
              customer_phone: newOrder.customerPhone,
              service: newOrder.service,
              revenue: newOrder.revenue,
              created_at: newOrder.createdAt,
              status: newOrder.status,
              assigned_to: newOrder.assignedTo,
              customer_name: newOrder.customerName
          }]);
          
          if (error) {
              if (error.message?.includes('customer_name') || error.details?.includes('customer_name')) {
                  console.warn("Schema cache error, falling back to old schema");
                  const { error: fallbackError } = await supabase.from('orders').insert([{
                      customer_phone: newOrder.customerPhone,
                      service: newOrder.service,
                      revenue: newOrder.revenue,
                      created_at: newOrder.createdAt,
                      status: newOrder.status,
                      assigned_to: newOrder.assignedTo
                  }]);
                  if (fallbackError) throw fallbackError;
                  alert("Đã tạo đơn hàng! Lưu ý: Database đang thiếu cột 'customer_name'. Vui lòng vào Cài đặt -> Copy mã SQL và chạy trong Supabase để cập nhật.");
              } else {
                  throw error;
              }
          }
          fetchData(true);
      } catch (err) {
          alert(formatErrorMessage(err));
      } finally {
          setIsRefreshing(false);
      }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!hasPermission('orders', 'delete')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC XÓA ĐƠN HÀNG."); return; }
    setConfirmModal({
        isOpen: true,
        title: 'Xóa đơn hàng',
        message: 'Bạn có chắc chắn muốn xóa đơn hàng này không?',
        isDangerous: true,
        onConfirm: () => executeDeleteOrder(orderId)
    });
  };

  const executeDeleteOrder = async (orderId: string) => {
      closeConfirmModal();
      setIsRefreshing(true);
      if (useLocalOnly) {
          const newOrders = orders.filter(o => o.id !== orderId);
          setOrders(newOrders);
          setLocalOrders(newOrders);
          setIsRefreshing(false);
          return;
      }
      try {
          const { error } = await supabase.from('orders').delete().eq('id', orderId);
          if (error) throw error;
          setOrders(prev => prev.filter(o => o.id !== orderId));
      } catch (err) { alert(formatErrorMessage(err)); } finally { setIsRefreshing(false); }
  };

  const handleBulkDeleteOrders = (orderIds: string[]) => {
      if (!hasPermission('orders', 'delete')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC XÓA ĐƠN HÀNG."); return; }
      setConfirmModal({
          isOpen: true,
          title: 'Xóa nhiều đơn hàng',
          message: `Bạn có chắc chắn muốn xóa ${orderIds.length} đơn hàng đã chọn không?`,
          isDangerous: true,
          onConfirm: () => executeBulkDeleteOrders(orderIds)
      });
  };

  const executeBulkDeleteOrders = async (orderIds: string[]) => {
      closeConfirmModal();
      setIsRefreshing(true);
      if (useLocalOnly) {
          const newOrders = orders.filter(o => !orderIds.includes(o.id));
          setOrders(newOrders);
          setLocalOrders(newOrders);
          setIsRefreshing(false);
          return;
      }
      try {
          const { error } = await supabase.from('orders').delete().in('id', orderIds);
          if (error) throw error;
          setOrders(prev => prev.filter(o => !orderIds.includes(o.id)));
      } catch (err) { alert(formatErrorMessage(err)); } finally { setIsRefreshing(false); }
  };

  const handleImportOrders = async (newOrders: any[]) => {
      if (!hasPermission('orders', 'import')) {
          alert("BẠN KHÔNG CÓ QUYỀN NHẬP ĐƠN HÀNG.");
          return;
      }
      setIsImportOrderModalOpen(false);
      setIsRefreshing(true);

      // 0. Cập nhật danh sách nguồn nếu có nguồn mới
      const currentSources = new Set(sources);
      let hasNewSource = false;
      newOrders.forEach(o => {
          if (o.source && !currentSources.has(o.source)) {
              currentSources.add(o.source);
              hasNewSource = true;
          }
      });
      
      if (hasNewSource) {
          updateSetting('sources', Array.from(currentSources), setSources);
      }

      const ordersToInsert = newOrders.map(o => ({
          id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          customerPhone: o.customerPhone,
          service: o.service,
          revenue: isNaN(parseFloat(o.revenue)) ? 0 : parseFloat(o.revenue),
          createdAt: o.createdAt,
          status: o.status,
          assignedTo: currentUser,
          externalId: o.externalId,
          source: o.source || 'import',
          customerName: o.customerName,
          dateOfBirth: o.dateOfBirth
      }));

      if (useLocalOnly) {
          setOrders(prev => [...ordersToInsert, ...prev]);
          setLocalOrders(prev => [...ordersToInsert, ...prev]);
          setIsRefreshing(false);
          return;
      }

      try {
          // 1. Tự động tạo hồ sơ khách hàng cho các số điện thoại mới để tránh lỗi Foreign Key
          const uniqueCustomers = new Map();
          ordersToInsert.forEach(o => {
              if (o.customerPhone) {
                  const existingInImport = uniqueCustomers.get(o.customerPhone);
                  const existingInDb = customers.find(c => c.phone === o.customerPhone);
                  
                  const currentSource = o.source || 'import';
                  const isDefaultSource = currentSource === 'import' || currentSource === 'KiotViet';
                  
                  if (!existingInImport) {
                      const customerData: any = {
                          phone: o.customerPhone,
                          name: o.customerName || existingInDb?.name || 'Khách hàng KiotViet',
                          relationship_status: existingInDb?.relationshipStatus || 'Chốt đơn',
                      };
                      
                      // Chỉ cập nhật source nếu trong DB chưa có hoặc là nguồn mặc định
                      if (!existingInDb?.source || existingInDb.source === 'import' || existingInDb.source === 'KiotViet') {
                          customerData.source = currentSource;
                      } else {
                          customerData.source = existingInDb.source;
                      }
                      
                      // Chỉ cập nhật ngày sinh nếu trong DB chưa có
                      if (o.dateOfBirth && !existingInDb?.dateOfBirth) {
                          customerData.date_of_birth = o.dateOfBirth;
                      } else if (existingInDb?.dateOfBirth) {
                          customerData.date_of_birth = existingInDb.dateOfBirth;
                      }
                      
                      uniqueCustomers.set(o.customerPhone, customerData);
                  } else {
                      let updated = false;
                      const updates: any = {};
                      
                      if (!isDefaultSource && (existingInImport.source === 'import' || existingInImport.source === 'KiotViet')) {
                          updates.source = currentSource;
                          updated = true;
                      }
                      
                      if (o.dateOfBirth && !existingInImport.date_of_birth) {
                          updates.date_of_birth = o.dateOfBirth;
                          updated = true;
                      }
                      
                      if (updated) {
                          uniqueCustomers.set(o.customerPhone, {
                              ...existingInImport,
                              ...updates
                          });
                      }
                  }
              }
          });
          
          const customersArray = Array.from(uniqueCustomers.values());
          if (customersArray.length > 0) {
              const { error: customerError } = await supabase.from('customers').upsert(customersArray, { onConflict: 'phone' });
              if (customerError) {
                  console.warn("Lỗi khi tạo/cập nhật khách hàng từ import:", customerError);
              }
          }

          // 2. Thêm đơn hàng
          const { error } = await supabase.from('orders').insert(ordersToInsert.map(o => ({
              customer_phone: o.customerPhone,
              service: o.service || 'Đơn hàng KiotViet',
              revenue: o.revenue,
              created_at: o.createdAt,
              status: o.status,
              assigned_to: o.assignedTo,
              external_id: o.externalId,
              source: o.source,
              customer_name: o.customerName
          })));
          
          if (error) {
              if (error.message?.includes('customer_name') || error.details?.includes('customer_name') || error.message?.includes('external_id')) {
                  console.warn("Schema cache error, falling back to old schema");
                  const { error: fallbackError } = await supabase.from('orders').insert(ordersToInsert.map(o => ({
                      customer_phone: o.customerPhone,
                      service: o.service || 'Đơn hàng KiotViet',
                      revenue: o.revenue,
                      created_at: o.createdAt,
                      status: o.status,
                      assigned_to: o.assignedTo
                  })));
                  if (fallbackError) throw fallbackError;
                  alert("Đã nhập đơn hàng thành công! Tuy nhiên, database của bạn đang thiếu một số cột mới (customer_name, external_id, source). Vui lòng vào mục Cài đặt -> Copy mã SQL và chạy trong Supabase để cập nhật đầy đủ.");
              } else {
                  throw error;
              }
          }
          fetchData(true);
      } catch (err) {
          alert(formatErrorMessage(err));
      } finally {
          setIsRefreshing(false);
      }
  };

  const handleUpdateLeadStatus = async (id: string, newStatus: string) => {
    if (!hasPermission('leads', 'edit')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC CẬP NHẬT CƠ HỘI."); return; }
    if (newStatus === 'completed') {
        const lead = leads.find(l => l.id === id);
        if (lead) { setLeadToComplete(lead); }
        return;
    }

    const prevLeads = [...leads];
    const now = new Date().toISOString();
    
    setLeads(current => current.map(l => l.id === id ? { ...l, status: newStatus, updatedAt: now } : l));

    if (useLocalOnly) {
         setLocalLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus, updatedAt: now } : l));
         return;
    }

    try {
        const { error } = await supabase.from('leads').update({ status: newStatus, updated_at: now }).eq('id', id);
        if (error) throw error;
    } catch(err) { 
        setLeads(prevLeads);
        alert(formatErrorMessage(err)); 
    }
  };

  const handleReceiveLead = async (id: string) => {
      if (!hasPermission('leads', 'edit')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC NHẬN CƠ HỘI."); return; }
      
      const prevLeads = [...leads];
      const now = new Date().toISOString();
      const nextStatus = statuses.find(s => s.id === 'contacting') ? 'contacting' : (statuses[1]?.id || 'new');
      
      // Update local state first for optimistic UI
      setLeads(current => current.map(l => l.id === id ? { ...l, assignedTo: currentUser, status: nextStatus, updatedAt: now } : l));

      if (useLocalOnly) {
          setLocalLeads(prev => prev.map(l => l.id === id ? { ...l, assignedTo: currentUser, status: nextStatus, updatedAt: now } : l));
          return;
      }

      try {
          const { error } = await supabase.from('leads').update({ assigned_to: currentUser, status: nextStatus, updated_at: now }).eq('id', id);
          if (error) throw error;
      } catch(err) { 
          setLeads(prevLeads);
          alert(formatErrorMessage(err)); 
      }
  };

  const executeLeadCompletion = async (data: { actualRevenue: number; actualService: string; note: string; doctorName: string; reExaminationDate: string; reExamService?: string; reExamNote?: string; reExamRevenue?: number }) => {
      if (!leadToComplete) return;
      const targetLead = leadToComplete;
      setLeadToComplete(null);
      
      const { actualRevenue, actualService, note, doctorName, reExaminationDate, reExamService, reExamNote, reExamRevenue } = data;
      const updatedNoteContent = note ? `[CHỐT ĐƠN] ${note}` : undefined;
      const now = new Date().toISOString();

      const updatedLeadState = { 
          ...targetLead, 
          status: 'completed', 
          potentialRevenue: actualRevenue, 
          service: actualService,
          updatedAt: now,
          notes: updatedNoteContent ? [{
              id: `note_temp_${Date.now()}`,
              content: updatedNoteContent,
              createdAt: now,
              createdBy: currentUser
          }, ...(targetLead.notes || [])] : (targetLead.notes || [])
      };

      setLeads(prev => prev.map(l => l.id === targetLead.id ? updatedLeadState : l));
      if (selectedLead?.id === targetLead.id) setSelectedLead(null);

      // Local update for immediate feedback
      const newCskhItem: CskhItem = {
          id: `cskh_${Date.now()}`,
          customerPhone: targetLead.phone,
          customerName: targetLead.name,
          service: actualService,
          status: 'cskh_new',
          assignedTo: targetLead.assignedTo,
          originalLeadId: targetLead.id,
          createdAt: now,
          updatedAt: now,
          doctorName: doctorName,
          reExaminationDate: reExaminationDate || null
      };
      setCskhItems(prev => [newCskhItem, ...prev]);

      // Also create ReExamination if date is set
      if (reExaminationDate) {
          const newReExam: ReExamination = {
              id: `re_exam_${Date.now()}`,
              customerPhone: targetLead.phone,
              customerName: targetLead.name,
              date: reExaminationDate,
              service: reExamService || actualService,
              doctorName: doctorName,
              assignedTo: targetLead.assignedTo || undefined,
              status: 'pending',
              note: reExamNote || '',
              createdAt: now,
              potentialRevenue: reExamRevenue
          };
          setReExaminations(prev => [...prev, newReExam]);
          if (useLocalOnly) {
             setLocalReExams(prev => [...prev, newReExam]);
          }
      }

      if (useLocalOnly) {
          const newLeads = leads.map(l => l.id === targetLead.id ? updatedLeadState : l);
          setLocalLeads(newLeads);
          setLocalCskh([newCskhItem, ...cskhItems]);
          return;
      }

      setIsRefreshing(true);
      try {
          const { error: leadError } = await supabase.from('leads').update({ 
              status: 'completed', 
              potential_revenue: actualRevenue,
              service: actualService,
              updated_at: now 
          }).eq('id', targetLead.id);
          if (leadError) throw leadError;

          if (updatedNoteContent) {
              const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await supabase.from('notes').insert([{
                  id: noteId,
                  lead_id: targetLead.id,
                  content: updatedNoteContent,
                  created_by: currentUser
              }]);
          }

          const { error: cskhError } = await supabase.from('cskh').insert([{
              id: newCskhItem.id,
              customer_phone: targetLead.phone,
              service: actualService,
              status: 'cskh_new',
              assigned_to: targetLead.assignedTo,
              original_lead_id: targetLead.id,
              doctor_name: doctorName,
              re_examination_date: reExaminationDate || null
          }]);
          if (cskhError) throw cskhError;

          if (reExaminationDate) {
              const { error: reExamError } = await supabase.from('re_examinations').insert([{
                  id: `re_exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  customer_phone: targetLead.phone,
                  customer_name: targetLead.name,
                  date: reExaminationDate,
                  service: reExamService || actualService,
                  doctor_name: doctorName,
                  assigned_to: targetLead.assignedTo,
                  status: 'pending',
                  note: reExamNote || '',
                  potential_revenue: reExamRevenue
              }]);
              if (reExamError) throw reExamError;
          }

      } catch (err) { 
          alert(formatErrorMessage(err));
      } finally { 
          setIsRefreshing(false); 
          fetchData(true);
      }
  };

  const handleUpdateCskhStatus = async (cskhId: string, newStatusId: string) => {
    if (!hasPermission('cskh', 'edit')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC CẬP NHẬT CSKH."); return; }
    const prevItems = [...cskhItems];
    setCskhItems(prev => prev.map(item => item.id === cskhId ? { ...item, status: newStatusId, updatedAt: new Date().toISOString() } : item));

    if (useLocalOnly) {
        setLocalCskh(prev => prev.map(item => item.id === cskhId ? { ...item, status: newStatusId, updatedAt: new Date().toISOString() } : item));
        return;
    }

    try {
        const { error } = await supabase.from('cskh').update({ status: newStatusId, updated_at: new Date().toISOString() }).eq('id', cskhId);
        if (error) throw error;
    } catch (err) {
        alert(formatErrorMessage(err));
        setCskhItems(prevItems);
    }
  };

  const handleUpdateCskhItem = async (updatedItem: CskhItem) => {
      if (!hasPermission('cskh', 'edit')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC CẬP NHẬT CSKH."); return; }
      const now = new Date().toISOString();
      const itemToSave = { ...updatedItem, updatedAt: now };
      
      const originalItem = cskhItems.find(item => item.id === itemToSave.id);
      const noteChanged = itemToSave.note && itemToSave.note !== originalItem?.note;
      
      setCskhItems(prev => prev.map(item => item.id === itemToSave.id ? itemToSave : item));
      setSelectedCskh(null);

      if (noteChanged && itemToSave.originalLeadId) {
          const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newNote = {
              id: noteId,
              content: `[CSKH] ${itemToSave.note}`,
              createdAt: now,
              createdBy: currentUser
          };
          setLeads(prev => prev.map(l => l.id === itemToSave.originalLeadId ? { ...l, notes: [newNote, ...l.notes] } : l));
          
          // Update customers state to keep interaction history in sync
          setCustomers(prev => prev.map(c => ({
              ...c,
              leads: c.leads.map(l => l.id === itemToSave.originalLeadId ? { ...l, notes: [newNote, ...l.notes] } : l)
          })));
          
          if (useLocalOnly) {
              setLocalLeads(prev => prev.map(l => l.id === itemToSave.originalLeadId ? { ...l, notes: [newNote, ...l.notes] } : l));
          } else {
              try {
                  const { error } = await supabase.from('notes').insert([{
                      id: noteId,
                      lead_id: itemToSave.originalLeadId,
                      content: `[CSKH] ${itemToSave.note}`,
                      created_by: currentUser
                  }]);
                  if (error) console.error("Lỗi khi lưu ghi chú CSKH:", error);
              } catch (err) {
                  console.error("Lỗi khi lưu ghi chú CSKH:", err);
              }
          }
      }

      if (useLocalOnly) {
          setLocalCskh(prev => prev.map(item => item.id === itemToSave.id ? itemToSave : item));
          return;
      }

      try {
          const { error } = await supabase.from('cskh').update({
              status: itemToSave.status,
              assigned_to: itemToSave.assignedTo,
              doctor_name: itemToSave.doctorName,
              re_examination_date: itemToSave.reExaminationDate,
              note: itemToSave.note,
              updated_at: now
          }).eq('id', itemToSave.id);
          
          if (error) throw error;
          fetchData(true);
      } catch (err) {
          alert(formatErrorMessage(err));
          fetchData(true);
      }
  };

  const handleUpdateReExamStatus = async (id: string, status: 'pending' | 'called' | 'completed' | 'cancelled' | 'converted') => {
      if (!hasPermission('appointments', 'edit')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC CẬP NHẬT TÁI KHÁM."); return; }
      const prevReExams = [...reExaminations];
      setReExaminations(prev => prev.map(item => item.id === id ? { ...item, status } : item));

      if (useLocalOnly) {
          setLocalReExams(prev => prev.map(item => item.id === id ? { ...item, status } : item));
          return;
      }

      try {
          const { error } = await supabase.from('re_examinations').update({ status }).eq('id', id);
          if (error) throw error;
      } catch (err) {
          alert(formatErrorMessage(err));
          setReExaminations(prevReExams);
      }
  };

  const handleUpdateReExam = async (updatedReExam: ReExamination) => {
      if (!hasPermission('appointments', 'edit')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC CẬP NHẬT TÁI KHÁM."); return; }
      const now = new Date().toISOString();
      const itemToSave = { ...updatedReExam, updatedAt: now };
      
      setReExaminations(prev => prev.map(item => item.id === itemToSave.id ? itemToSave : item));
      setSelectedReExam(null);

      if (useLocalOnly) {
          setLocalReExams(prev => prev.map(item => item.id === itemToSave.id ? itemToSave : item));
          return;
      }

      try {
          const { error } = await supabase.from('re_examinations').update({
              service: itemToSave.service,
              date: itemToSave.date,
              appointment_time: itemToSave.appointmentTime,
              doctor_name: itemToSave.doctorName,
              assigned_to: itemToSave.assignedTo,
              note: itemToSave.note,
              status: itemToSave.status,
              potential_revenue: itemToSave.potentialRevenue,
              updated_at: now
          }).eq('id', itemToSave.id);
          
          if (error) throw error;
      } catch (err) {
          alert(formatErrorMessage(err));
      }
  };

  const executeDeleteReExam = async (reExamId: string, requireConfirm = true) => {
      if (!hasPermission('appointments', 'delete')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC XÓA TÁI KHÁM."); return; }
      if (requireConfirm && !window.confirm("Bạn có chắc chắn muốn xóa lịch tái khám này?")) return;
      
      const prevItems = [...reExaminations];
      setReExaminations(current => current.filter(item => item.id !== reExamId));
      if (selectedReExam?.id === reExamId) setSelectedReExam(null);

      if (useLocalOnly) {
          setLocalReExams(prev => prev.filter(item => item.id !== reExamId));
          return;
      }

      try {
          const { error } = await supabase.from('re_examinations').delete().eq('id', reExamId);
          if (error) throw error;
      } catch (err) {
          setReExaminations(prevItems);
          alert(formatErrorMessage(err));
      }
  };

  const handleAddReExamination = async (data: any) => {
      if (!hasPermission('appointments', 'create')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC THÊM TÁI KHÁM."); return; }
      setIsAddReExamModalOpen(false);
      const now = new Date().toISOString();
      
      const newReExam: ReExamination = {
          id: `re_exam_${Date.now()}`,
          customerPhone: data.customerPhone,
          customerName: data.customerName,
          date: data.date,
          appointmentTime: data.appointmentTime,
          service: data.service,
          doctorName: data.doctorName,
          assignedTo: data.assignedTo,
          note: data.note,
          status: 'pending',
          createdAt: now,
          potentialRevenue: data.potentialRevenue
      };

      setReExaminations(prev => [...prev, newReExam]);

      if (useLocalOnly) {
          setLocalReExams(prev => [...prev, newReExam]);
          return;
      }

      try {
          // Đảm bảo khách hàng tồn tại trước khi tạo lịch tái khám (tránh lỗi Foreign Key)
          const { error: custError } = await supabase.from('customers').insert([{
              phone: data.customerPhone,
              name: data.customerName || 'Khách hàng',
              source: 'manual',
              creator: currentUser,
              assigned_to: data.assignedTo || currentUser
          }]);
          
          if (custError && custError.code !== '23505') {
              throw new Error(`Lỗi dữ liệu khách hàng: ${custError.message}`);
          }

          const { error } = await supabase.from('re_examinations').insert([{
              id: newReExam.id,
              customer_phone: data.customerPhone,
              customer_name: data.customerName,
              date: data.date,
              appointment_time: data.appointmentTime,
              service: data.service,
              doctor_name: data.doctorName,
              assigned_to: data.assignedTo,
              note: data.note,
              status: 'pending',
              potential_revenue: data.potentialRevenue
          }]);
          
          if (error) throw error;
          fetchData(true);
      } catch (err) {
          alert(formatErrorMessage(err));
      }
  };

  const handleConvertReExamToLead = (reExam: ReExamination) => {
      // For now, just open the Add Lead modal. 
      // Ideally we would pre-fill data, but that requires updating AddLeadModal props.
      setIsAddLeadModalOpen(true);
  };

  const handleAddCustomer = async (data: CustomerData) => {
      if (!hasPermission('customers', 'create')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC THÊM KHÁCH HÀNG."); return; }
      const newCustomer: Customer = {
          ...data,
          name: data.name || 'Khách hàng',
          leads: [],
          orders: [],
          tags: data.tags || [],
          generalNotes: data.generalNotes || '',
          source: data.source || 'manual',
          assignedTo: data.assignedTo || currentUser
      };
      
      setCustomers(prev => [newCustomer, ...prev]);
      
      if (useLocalOnly) return;

      try {
          const dbData = {
              name: data.name,
              phone: data.phone,
              email: data.email,
              address: data.address,
              location: data.location,
              province: data.province,
              district: data.district,
              ward: data.ward,
              tags: data.tags,
              general_notes: data.generalNotes,
              source: data.source,
              assigned_to: data.assignedTo,
              customer_group: data.customerGroup,
              profile_completeness: data.profileCompleteness,
              relationship_status: data.relationshipStatus,
              gender: data.gender,
              date_of_birth: data.dateOfBirth,
              occupation: data.occupation,
              ip: data.ip,
              user_agent: data.userAgent,
              fbp: data.fbp,
              fbc: data.fbc,
              ttclid: data.ttclid,
              ttp: data.ttp,
              source_url: data.sourceUrl,
              utm_source: data.utmSource,
              utm_medium: data.utmMedium,
              event_id: data.eventId,
              external_id: data.externalId
          };
          const { error } = await supabase.from('customers').insert([dbData]);
          if (error) throw error;
      } catch (err) {
          alert(formatErrorMessage(err));
      }
  };

  const handleUpdateCustomer = async (phone: string, data: Partial<CustomerData>) => {
      if (!hasPermission('customers', 'edit')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC CẬP NHẬT KHÁCH HÀNG."); return; }
      setCustomers(prev => prev.map(c => c.phone === phone ? { ...c, ...data } : c));
      
      if (selectedCustomer?.phone === phone) {
          setSelectedCustomer(prev => prev ? { ...prev, ...data } : null);
      }
      
      if (useLocalOnly) return;

      try {
          const dbData: any = {};
          if (data.name !== undefined) dbData.name = data.name;
          if (data.phone !== undefined) dbData.phone = data.phone;
          if (data.email !== undefined) dbData.email = data.email;
          if (data.address !== undefined) dbData.address = data.address;
          if (data.location !== undefined) dbData.location = data.location;
          if (data.province !== undefined) dbData.province = data.province;
          if (data.district !== undefined) dbData.district = data.district;
          if (data.ward !== undefined) dbData.ward = data.ward;
          if (data.tags !== undefined) dbData.tags = data.tags;
          if (data.generalNotes !== undefined) dbData.general_notes = data.generalNotes;
          if (data.source !== undefined) dbData.source = data.source;
          if (data.assignedTo !== undefined) dbData.assigned_to = data.assignedTo;
          if (data.customerGroup !== undefined) dbData.customer_group = data.customerGroup;
          if (data.profileCompleteness !== undefined) dbData.profile_completeness = data.profileCompleteness;
          if (data.relationshipStatus !== undefined) dbData.relationship_status = data.relationshipStatus;
          if (data.gender !== undefined) dbData.gender = data.gender;
          if (data.dateOfBirth !== undefined) dbData.date_of_birth = data.dateOfBirth;
          if (data.occupation !== undefined) dbData.occupation = data.occupation;
          if (data.ip !== undefined) dbData.ip = data.ip;
          if (data.userAgent !== undefined) dbData.user_agent = data.userAgent;
          if (data.fbp !== undefined) dbData.fbp = data.fbp;
          if (data.fbc !== undefined) dbData.fbc = data.fbc;
          if (data.ttclid !== undefined) dbData.ttclid = data.ttclid;
          if (data.ttp !== undefined) dbData.ttp = data.ttp;
          if (data.sourceUrl !== undefined) dbData.source_url = data.sourceUrl;
          if (data.utmSource !== undefined) dbData.utm_source = data.utmSource;
          if (data.utmMedium !== undefined) dbData.utm_medium = data.utmMedium;
          if (data.eventId !== undefined) dbData.event_id = data.eventId;
          if (data.externalId !== undefined) dbData.external_id = data.externalId;

          const { error } = await supabase.from('customers').update(dbData).eq('phone', phone);
          if (error) console.error("Error updating customer:", error);
      } catch (err) {
          console.error("Error updating customer:", err);
      }
  };

  const handleDeleteCustomer = async (phone: string) => {
      if (!hasPermission('customers', 'delete')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC XÓA KHÁCH HÀNG."); return; }
      setConfirmModal({
          isOpen: true,
          title: 'Xóa khách hàng',
          message: 'Bạn có chắc chắn muốn xóa khách hàng này? Dữ liệu liên quan (cơ hội, đơn hàng) có thể bị ảnh hưởng.',
          isDangerous: true,
          onConfirm: () => executeDeleteCustomer(phone)
      });
  };

  const executeDeleteCustomer = async (phone: string) => {
      closeConfirmModal();
      setIsRefreshing(true);
      
      if (useLocalOnly) {
          setCustomers(prev => prev.filter(c => c.phone !== phone));
          if (selectedCustomer?.phone === phone) setSelectedCustomer(null);
          setIsRefreshing(false);
          return;
      }

      try {
          // Xóa các dữ liệu liên quan trước (để tránh lỗi foreign key)
          await supabase.from('cskh').delete().eq('customer_phone', phone);
          await supabase.from('orders').delete().eq('customer_phone', phone);
          await supabase.from('re_examinations').delete().eq('customer_phone', phone);

          const customerLeads = leads.filter(l => l.phone === phone);
          const leadIds = customerLeads.map(l => l.id);
          
          if (leadIds.length > 0) {
              await supabase.from('notes').delete().in('lead_id', leadIds);
              await supabase.from('leads').delete().in('id', leadIds);
          }

          const { error } = await supabase.from('customers').delete().eq('phone', phone);
          if (error) throw error;
          setCustomers(prev => prev.filter(c => c.phone !== phone));
          if (selectedCustomer?.phone === phone) setSelectedCustomer(null);
      } catch (err) {
          alert(formatErrorMessage(err));
      } finally {
          setIsRefreshing(false);
      }
  };

  const handleBulkDeleteCustomers = (phones: string[]) => {
      if (!hasPermission('customers', 'delete')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC XÓA KHÁCH HÀNG."); return; }
      setConfirmModal({
          isOpen: true,
          title: 'Xóa nhiều khách hàng',
          message: `Bạn có chắc chắn muốn xóa ${phones.length} khách hàng đã chọn không? Dữ liệu liên quan (cơ hội, đơn hàng) có thể bị ảnh hưởng.`,
          isDangerous: true,
          onConfirm: () => executeBulkDeleteCustomers(phones)
      });
  };

  const executeBulkDeleteCustomers = async (phones: string[]) => {
      closeConfirmModal();
      setIsRefreshing(true);
      
      if (useLocalOnly) {
          setCustomers(prev => prev.filter(c => !phones.includes(c.phone)));
          if (selectedCustomer && phones.includes(selectedCustomer.phone)) setSelectedCustomer(null);
          setIsRefreshing(false);
          return;
      }

      try {
          // Xóa các dữ liệu liên quan trước (để tránh lỗi foreign key)
          await supabase.from('cskh').delete().in('customer_phone', phones);
          await supabase.from('orders').delete().in('customer_phone', phones);
          await supabase.from('re_examinations').delete().in('customer_phone', phones);

          const customerLeads = leads.filter(l => phones.includes(l.phone));
          const leadIds = customerLeads.map(l => l.id);
          
          if (leadIds.length > 0) {
              await supabase.from('notes').delete().in('lead_id', leadIds);
              await supabase.from('leads').delete().in('id', leadIds);
          }

          const { error } = await supabase.from('customers').delete().in('phone', phones);
          if (error) throw error;
          setCustomers(prev => prev.filter(c => !phones.includes(c.phone)));
          if (selectedCustomer && phones.includes(selectedCustomer.phone)) setSelectedCustomer(null);
      } catch (err) {
          alert(formatErrorMessage(err));
      } finally {
          setIsRefreshing(false);
      }
  };

  const handleAddNoteToLead = async (leadId: string, content: string) => {
      if (!hasPermission('leads', 'edit')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC THÊM GHI CHÚ CHO CƠ HỘI."); return; }
      const now = new Date().toISOString();
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newNote: Note = {
          id: noteId,
          content,
          createdAt: now,
          createdBy: currentUser
      };

      setLeads(prev => prev.map(l => {
          if (l.id === leadId) {
              return { ...l, notes: [newNote, ...l.notes] };
          }
          return l;
      }));

      // Update customers state to keep interaction history in sync
      setCustomers(prev => prev.map(c => ({
          ...c,
          leads: c.leads.map(l => l.id === leadId ? { ...l, notes: [newNote, ...l.notes] } : l)
      })));

      if (useLocalOnly) {
           setLocalLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: [newNote, ...l.notes] } : l));
           return;
      }

      try {
          const { error } = await supabase.from('notes').insert([{
              id: noteId,
              lead_id: leadId,
              content: content,
              created_by: currentUser
          }]);
          if (error) throw error;
      } catch (err) {
          alert(formatErrorMessage(err));
      }
  };

  const handleAddLead = async (leadData: any) => {
    if (!hasPermission('leads', 'create')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC THÊM CƠ HỘI."); return; }
    const now = new Date().toISOString();
    const newLeadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newLead = { 
        ...leadData, 
        id: newLeadId, 
        createdAt: now, 
        updatedAt: now, 
        notes: [] 
    };
    
    setLeads(prev => [newLead, ...prev]);
    setIsAddLeadModalOpen(false);
    
    if (useLocalOnly) {
        setLocalLeads(prev => [newLead, ...prev]);
        return;
    }
    
    try {
        // Đảm bảo khách hàng tồn tại trước khi tạo lead (tránh lỗi Foreign Key)
        const { error: custError } = await supabase.from('customers').insert([{
            phone: leadData.phone,
            name: leadData.name || 'Khách hàng',
            source: leadData.source || 'manual',
            creator: currentUser,
            assigned_to: leadData.assignedTo || currentUser
        }]);
        
        if (custError && custError.code !== '23505') {
            throw new Error(`Lỗi dữ liệu khách hàng: ${custError.message}`);
        }

        const { error } = await supabase.from('leads').insert([{
            id: newLeadId,
            name: leadData.name,
            phone: leadData.phone,
            source: leadData.source,
            assigned_to: leadData.assignedTo,
            status: leadData.status,
            service: leadData.service,
            description: leadData.description,
            potential_revenue: leadData.potentialRevenue,
            projected_appointment_date: leadData.projectedAppointmentDate,
            appointment_date: leadData.appointmentDate,
            created_at: now,
            updated_at: now
        }]);
        if (error) throw error;
        fetchData(true);
    } catch (err) {
        alert(formatErrorMessage(err));
        setLeads(prev => prev.filter(l => l.id !== newLeadId)); // Rollback
    }
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
      if (!hasPermission('leads', 'edit')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC CẬP NHẬT CƠ HỘI."); return; }
      const now = new Date().toISOString();
      const leadToSave = { ...updatedLead, updatedAt: now };
      
      setLeads(prev => prev.map(l => l.id === leadToSave.id ? leadToSave : l));
      setSelectedLead(null); // Close modal

      if (useLocalOnly) {
          setLocalLeads(prev => prev.map(l => l.id === leadToSave.id ? leadToSave : l));
          return;
      }

      try {
          const { error } = await supabase.from('leads').update({
              name: leadToSave.name,
              phone: leadToSave.phone,
              source: leadToSave.source,
              assigned_to: leadToSave.assignedTo,
              status: leadToSave.status,
              service: leadToSave.service,
              description: leadToSave.description,
              potential_revenue: leadToSave.potentialRevenue,
              projected_appointment_date: leadToSave.projectedAppointmentDate,
              appointment_date: leadToSave.appointmentDate,
              updated_at: now
          }).eq('id', leadToSave.id);
          
          if (error) throw error;
          
          fetchData(true);
      } catch (err) {
          alert(formatErrorMessage(err));
      }
  };

  if (!session && !useLocalOnly) {
      return <LoginView />;
  }

  // Determine Dashboard View based on Role
  const renderDashboard = () => {
      // Ưu tiên hiển thị theo role trong profile
      if (userProfile?.role === 'admin') {
          return (
            <ReportsView
                leads={leads}
                orders={orders}
                cskhItems={cskhItems}
                customers={customers.reduce((acc, c) => ({...acc, [c.phone]: c}), {})}
                sources={sources}
                sales={sales}
                reExaminations={reExaminations}
                activities={activities}
            />
          );
      }
      return (
        <SaleDashboard 
            leads={leads} 
            cskhItems={cskhItems} 
            orders={orders} 
            customers={customers.reduce((acc, c) => ({...acc, [c.phone]: c}), {})} 
            currentUser={currentUser}
            sales={sales}
            onSelectLead={setSelectedLead}
            onSelectCskh={setSelectedCskh}
            onReceiveLead={handleReceiveLead}
        />
      );
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        onAddLead={() => setIsAddLeadModalOpen(true)}
        hasPermission={hasPermission}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MainHeader 
            onAddLead={() => setIsAddLeadModalOpen(true)}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            sales={sales}
            userProfile={userProfile}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative">
            {isRefreshing && (
                 <div className="absolute top-0 left-0 right-0 h-1 bg-blue-200 overflow-hidden z-20">
                     <div className="h-full bg-blue-600 animate-progress"></div>
                 </div>
            )}
            
            {/* Warning Banner for Local Mode */}
            {useLocalOnly && (
                <div className="bg-yellow-50 text-yellow-800 text-xs px-4 py-1 text-center border-b border-yellow-200">
                    Đang chạy chế độ Offline (Dữ liệu lưu trên trình duyệt). Kết nối server gặp sự cố.
                </div>
            )}
            
            {activeView === 'dashboard' && renderDashboard()}
            
            {activeView === 'sales' && (
               viewMode === 'kanban' ? (
                <KanbanBoard 
                    leads={leads}
                    sales={sales}
                    statuses={statuses}
                    onSelectLead={setSelectedLead}
                    onUpdateLeadStatus={handleUpdateLeadStatus}
                    onAddLead={() => setIsAddLeadModalOpen(true)}
                    onAcceptLead={handleReceiveLead} 
                    onDeleteLead={executeDeleteLead}
                    sources={sources}
                    selectedSource={selectedSource}
                    onSourceChange={setSelectedSource}
                    onCustomizeStatuses={() => { setStatusModalType('sales'); setIsStatusModalOpen(true); }}
                    selectedSale={selectedSaleFilter}
                    onSaleChange={setSelectedSaleFilter}
                />
               ) : (
                   <LeadList 
                        leads={leads} 
                        sales={sales} 
                        onSelectLead={setSelectedLead} 
                        sources={sources}
                        selectedSource={selectedSource}
                        onSourceChange={setSelectedSource}
                        onDeleteLead={executeDeleteLead}
                   />
               )
            )}

            {activeView === 'cskh' && (
                <CskhView 
                    cskhItems={cskhItems}
                    statuses={cskhStatuses}
                    onUpdateCskhStatus={handleUpdateCskhStatus}
                    onCustomizeStatuses={() => { setStatusModalType('cskh'); setIsStatusModalOpen(true); }}
                    onSelectCskh={setSelectedCskh}
                    onDeleteCskh={setDeleteCskhTarget}
                />
            )}

            {activeView === 're_exam' && (
                <ReExaminationView 
                    reExaminations={reExaminations}
                    sales={sales}
                    onUpdateStatus={handleUpdateReExamStatus}
                    onConvertToLead={handleConvertReExamToLead}
                    onAddReExam={() => setIsAddReExamModalOpen(true)}
                    onSelectReExam={setSelectedReExam}
                    onDeleteReExam={setDeleteReExamTarget}
                />
            )}

            {activeView === 'customers' && (
                <CustomerList 
                    customers={customers}
                    onSelectCustomer={(c) => { setSelectedCustomer(c); }}
                    onAddCustomer={() => { setCustomerToEdit(null); setIsCustomerFormOpen(true); }}
                    onDeleteCustomer={handleDeleteCustomer}
                    onBulkDelete={handleBulkDeleteCustomers}
                    sources={sources}
                    relationships={relationships}
                    customerGroups={customerGroups}
                    sales={sales}
                />
            )}

            {activeView === 'orders' && (
                <OrderList 
                    orders={orders}
                    customers={customers.reduce((acc, c) => ({...acc, [c.phone]: c}), {})}
                    sales={sales}
                    onAddOrder={() => setIsAddOrderModalOpen(true)}
                    onImportOrders={() => {
                        if (!hasPermission('orders', 'import')) {
                            alert("BẠN KHÔNG CÓ QUYỀN NHẬP ĐƠN HÀNG.");
                            return;
                        }
                        setIsImportOrderModalOpen(true);
                    }}
                    onDeleteOrder={handleDeleteOrder}
                    onBulkDelete={handleBulkDeleteOrders}
                    canImport={hasPermission('orders', 'import')}
                />
            )}
            
            {activeView === 'revenue' && (
                 <CalendarView 
                    leads={leads} 
                    reExaminations={reExaminations}
                    onSelectLead={setSelectedLead} 
                 />
            )}
            
            {activeView === 'settings' && (
                <SettingsView 
                    sources={sources}
                    relationships={relationships}
                    customerGroups={customerGroups}
                    onUpdateSources={(v) => updateSetting('sources', v, setSources)}
                    onUpdateRelationships={(v) => updateSetting('relationships', v, setRelationships)}
                    onUpdateCustomerGroups={(v) => updateSetting('customer_groups', v, setCustomerGroups)}
                    useLocalOnly={useLocalOnly}
                    sales={sales}
                    onRefresh={() => fetchData(true)}
                    isAdmin={isAdmin}
                    canEdit={hasPermission('settings', 'edit')}
                />
            )}

            {activeView === 'guide' && (
                <UserGuideView />
            )}
        </main>
      </div>

      {selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-white overflow-hidden animate-fade-in">
              <CustomerDetailView 
                  customer={selectedCustomer}
                  sales={sales}
                  statuses={statuses}
                  cskhItems={cskhItems.filter(c => c.customerPhone === selectedCustomer.phone)}
                  sources={sources}
                  relationships={relationships}
                  onClose={() => setSelectedCustomer(null)}
                  onSelectLead={(lead) => {
                      setSelectedCustomer(null);
                      setSelectedLead(lead);
                  }}
                  onUpdateCustomer={handleUpdateCustomer}
                  onEdit={(c) => {
                      setCustomerToEdit(c);
                      setIsCustomerFormOpen(true);
                  }}
                  onDelete={handleDeleteCustomer}
                  onAddNote={handleAddNoteToLead}
                  currentUser={currentUser}
                  isAdmin={userProfile?.role === 'admin'}
                  onAddReExam={() => {
                      setReExamInitialCustomer(selectedCustomer);
                      setIsAddReExamModalOpen(true);
                  }}
              />
          </div>
      )}

      {/* Custom Confirmation Modal for Re-examination Deletion */}
      {deleteReExamTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận xóa lịch tái khám</h3>
                  <p className="text-slate-600 mb-6">Bạn có chắc chắn muốn xóa lịch hẹn tái khám này không? Hành động này không thể hoàn tác.</p>
                  <div className="flex justify-end space-x-3">
                      <button 
                          onClick={() => setDeleteReExamTarget(null)}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-medium"
                      >
                          Hủy
                      </button>
                      <button 
                          onClick={() => {
                              executeDeleteReExam(deleteReExamTarget, false);
                              setDeleteReExamTarget(null);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold"
                      >
                          Xác nhận xóa
                      </button>
                  </div>
              </div>
          </div>
      )}

      {selectedReExam && (
          <ReExaminationDetailModal 
              reExam={selectedReExam}
              sales={sales}
              onClose={() => setSelectedReExam(null)}
              onSave={handleUpdateReExam}
              onDelete={() => setDeleteReExamTarget(selectedReExam.id)}
          />
      )}

      {/* Custom Confirmation Modal for CSKH Deletion */}
      {deleteCskhTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận xóa</h3>
                  <p className="text-slate-600 mb-6">Bạn có chắc chắn muốn xóa mục CSKH này không? Hành động này không thể hoàn tác.</p>
                  <div className="flex justify-end space-x-3">
                      <button 
                          onClick={() => setDeleteCskhTarget(null)}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-medium"
                      >
                          Hủy
                      </button>
                      <button 
                          onClick={() => {
                              executeDeleteCskh(deleteCskhTarget, false);
                              setDeleteCskhTarget(null);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold"
                      >
                          Xác nhận xóa
                      </button>
                  </div>
              </div>
          </div>
      )}

      {selectedCskh && (
          <CskhDetailModal 
              item={selectedCskh}
              sales={sales}
              statuses={cskhStatuses}
              notes={leads.find(l => l.id === selectedCskh.originalLeadId)?.notes || []}
              onClose={() => setSelectedCskh(null)}
              onSave={handleUpdateCskhItem}
              onAddNote={(content) => {
                  if (selectedCskh.originalLeadId) {
                      handleAddNoteToLead(selectedCskh.originalLeadId, `[CSKH] ${content}`);
                  } else {
                      alert("CSKH này không liên kết với cơ hội nào.");
                  }
              }}
              onViewCustomer={(phone) => {
                  setSelectedCskh(null);
                  const customer = customers.find(c => c.phone === phone);
                  if (customer) setSelectedCustomer(customer);
                  else alert("Không tìm thấy thông tin khách hàng này.");
              }}
              onDelete={() => setDeleteCskhTarget(selectedCskh.id)}
              currentUser={currentUser}
          />
      )}

      {/* Modals */}
      {isCustomerFormOpen && (
          <CustomerFormModal 
              customerToEdit={customerToEdit}
              sources={sources}
              relationships={relationships}
              customerGroups={customerGroups}
              onClose={() => setIsCustomerFormOpen(false)}
              onSave={(data) => {
                  if (customerToEdit) {
                      handleUpdateCustomer(customerToEdit.phone, data);
                  } else {
                      handleAddCustomer(data);
                  }
                  setIsCustomerFormOpen(false);
              }}
          />
      )}

      {isAddLeadModalOpen && (
          <AddLeadModal 
             sales={sales}
             customers={customers}
             sources={sources}
             onClose={() => setIsAddLeadModalOpen(false)}
             onSave={handleAddLead}
          />
      )}

      {isAddOrderModalOpen && (
          <AddOrderModal 
              customers={customers}
              sales={sales}
              onClose={() => setIsAddOrderModalOpen(false)}
              onSave={handleAddOrder}
          />
      )}

      {isAddReExamModalOpen && (
          <AddReExaminationModal 
              customers={customers}
              sales={sales}
              onClose={() => {
                  setIsAddReExamModalOpen(false);
                  setReExamInitialCustomer(undefined);
              }}
              onSave={handleAddReExamination}
              initialCustomer={reExamInitialCustomer}
          />
      )}

      {isImportOrderModalOpen && (
          <ImportOrderModal 
              existingOrders={orders}
              onClose={() => setIsImportOrderModalOpen(false)}
              onImport={handleImportOrders}
          />
      )}
      
      {selectedLead && (
          <LeadDetailModal 
              lead={selectedLead}
              sales={sales}
              statuses={statuses}
              cskhStatuses={cskhStatuses}
              onClose={() => setSelectedLead(null)}
              onSave={handleUpdateLead}
              onAddNote={handleAddNoteToLead}
              currentUser={currentUser}
              onDelete={() => executeDeleteLead(selectedLead.id)}
          />
      )}

      {leadToComplete && (
          <CompleteLeadModal 
              lead={leadToComplete}
              onClose={() => setLeadToComplete(null)}
              onConfirm={executeLeadCompletion}
          />
      )}
      
      {isStatusModalOpen && (
          <StatusManagementModal 
              statuses={statusModalType === 'sales' ? statuses : cskhStatuses}
              leads={leads}
              onClose={() => setIsStatusModalOpen(false)}
              onSave={(newStatuses) => {
                  if (statusModalType === 'sales') {
                      updateSetting('statuses', newStatuses, setStatuses);
                  } else {
                      updateSetting('cskh_statuses', newStatuses, setCskhStatuses);
                  }
                  setIsStatusModalOpen(false);
              }}
              statusKey={statusModalType === 'sales' ? 'status' : 'cskhStatus'}
          />
      )}

      <ConfirmationModal 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onClose={closeConfirmModal}
          isDangerous={confirmModal.isDangerous}
      />

    </div>
  );
}

function App() {
  return (
    <PermissionProvider>
      <AppContent />
    </PermissionProvider>
  );
}

export default App;