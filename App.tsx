
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import useLocalStorage from './hooks/useLocalStorage';
import { 
  Lead, Sale, Customer, Order, Note, CskhItem, CustomerData, 
  StatusConfig, AppView, RoleDefinition, Permission 
} from './types';
import { 
  INITIAL_STATUSES, INITIAL_CSKH_STATUSES, INITIAL_SALES, INITIAL_LEADS 
} from './constants';

import Sidebar from './components/Sidebar';
import MainHeader from './components/MainHeader';
import ReportsView from './components/ReportsView';
import SaleDashboard from './components/SaleDashboard';
import KanbanBoard from './components/KanbanBoard';
import CskhView from './components/CskhView';
import CustomerList from './components/CustomerList';
import CustomerDetailView from './components/CustomerDetailView';
import OrderList from './components/OrderList';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import ConfirmationModal from './components/ConfirmationModal';
import AddLeadModal from './components/AddLeadModal';
import LeadDetailModal from './components/LeadDetailModal';
import CustomerFormModal from './components/CustomerFormModal';
import AddOrderModal from './components/AddOrderModal';
import ImportOrderModal from './components/ImportOrderModal';
import CompleteLeadModal from './components/CompleteLeadModal';

// Helper to map App Customer Data to Supabase DB columns (snake_case)
const mapAppCustomerDataToDbCustomer = (data: Partial<CustomerData>) => {
  const dbData: any = {};
  if (data.phone !== undefined) dbData.phone = data.phone;
  if (data.name !== undefined) dbData.name = data.name;
  if (data.email !== undefined) dbData.email = data.email;
  if (data.address !== undefined) dbData.address = data.address;
  if (data.location !== undefined) dbData.location = data.location;
  if (data.province !== undefined) dbData.province = data.province;
  if (data.district !== undefined) dbData.district = data.district;
  if (data.ward !== undefined) dbData.ward = data.ward;
  if (data.gender !== undefined) dbData.gender = data.gender;
  if (data.dateOfBirth !== undefined) dbData.date_of_birth = data.dateOfBirth;
  if (data.occupation !== undefined) dbData.occupation = data.occupation;
  if (data.customerGroup !== undefined) dbData.customer_group = data.customerGroup;
  if (data.relationshipStatus !== undefined) dbData.relationship_status = data.relationshipStatus;
  if (data.source !== undefined) dbData.source = data.source;
  if (data.generalNotes !== undefined) dbData.general_notes = data.generalNotes;
  if (data.tags !== undefined) dbData.tags = data.tags;
  if (data.profileCompleteness !== undefined) dbData.profile_completeness = data.profileCompleteness;
  if (data.assignedTo !== undefined) dbData.assigned_to = data.assignedTo;
  
  // Tracking fields
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
  
  return dbData;
};

const formatErrorMessage = (error: any) => {
    if (typeof error === 'string') return error;
    return error?.message || 'Có lỗi xảy ra';
};

const DEFAULT_ROLES: RoleDefinition[] = [
    { 
        id: 'admin', 
        name: 'Quản trị viên', 
        isSystem: true, 
        permissions: ['lead.view', 'lead.create', 'lead.edit', 'lead.delete', 'lead.import', 'customer.view', 'customer.create', 'customer.edit', 'customer.delete', 'order.view', 'order.create', 'order.edit', 'order.delete', 'order.import', 'settings.access', 'user.manage'],
        description: 'Toàn quyền hệ thống'
    },
    { 
        id: 'sale', 
        name: 'Nhân viên Sale', 
        isSystem: true, 
        permissions: ['lead.view', 'lead.create', 'lead.edit', 'customer.view', 'customer.create', 'customer.edit', 'order.view', 'order.create'],
        description: 'Quyền cơ bản để bán hàng'
    }
];

function App() {
  // --- STATE ---
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [useLocalOnly, setUseLocalOnly] = useState(false);

  // Local Storage for Offline/Local Mode
  const [localLeads, setLocalLeads] = useLocalStorage<Lead[]>('leads', INITIAL_LEADS);
  const [localCskh, setLocalCskh] = useLocalStorage<CskhItem[]>('cskh', []);
  const [localCustomers, setLocalCustomers] = useLocalStorage<Record<string, CustomerData>>('customers', {});
  const [localOrders, setLocalOrders] = useLocalStorage<Order[]>('orders', []);
  
  // Main Data State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cskhItems, setCskhItems] = useState<CskhItem[]>([]);
  const [customersData, setCustomersData] = useState<Record<string, CustomerData>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Config State (Fetched from DB)
  const [statuses] = useState<StatusConfig[]>(INITIAL_STATUSES);
  const [cskhStatuses] = useState<StatusConfig[]>(INITIAL_CSKH_STATUSES);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES); // Will fetch from DB profiles
  
  const [sources, setSources] = useState<string[]>(['Facebook', 'Google', 'TikTok', 'Zalo', 'Khách giới thiệu', 'Vãng lai']);
  const [relationships, setRelationships] = useState<string[]>(['Mới', 'Tiềm năng', 'Quan tâm', 'Chốt đơn', 'VIP', 'Hủy']);
  const [customerGroups, setCustomerGroups] = useState<string[]>(['VIP', 'Thân thiết', 'Tiềm năng', 'Vãng lai']);
  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLES);

  // UI State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string | null>(null);
  const [customerViewMode, setCustomerViewMode] = useState<'list' | 'detail'>('list');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isImportOrderModalOpen, setIsImportOrderModalOpen] = useState(false);
  const [leadToComplete, setLeadToComplete] = useState<Lead | null>(null); // New state for completion modal

  const [confirmModal, setConfirmModal] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      isDangerous?: boolean;
      onConfirm: () => void;
  }>({
      isOpen: false,
      title: '',
      message: '',
      isDangerous: false,
      onConfirm: () => {},
  });

  // Derived State
  const currentUser = userProfile?.id || 'offline_admin';
  const isAdmin = userProfile?.role === 'admin' || useLocalOnly;

  // --- PERMISSION CHECK ---
  const currentRoleDefinition = useMemo(() => {
    return roles.find(r => r.id === userProfile?.role);
  }, [roles, userProfile]);

  const hasPermission = (permission: Permission) => {
      if (useLocalOnly) return true; // Offline mode is basically admin
      if (userProfile?.role === 'admin') return true; // Admin always has all permissions
      return currentRoleDefinition?.permissions.includes(permission) || false;
  };

  // Merge Customers Data with Leads & Orders to create full Customer objects
  const customers: Customer[] = useMemo(() => {
    // Get unique phones from everywhere
    const allPhones = new Set([
        ...Object.keys(customersData),
        ...leads.map(l => l.phone),
        ...orders.map(o => o.customerPhone),
        ...cskhItems.map(c => c.customerPhone)
    ]);

    return Array.from(allPhones).map(phone => {
        const data: Partial<CustomerData> = customersData[phone] || {};
        const customerLeads = leads.filter(l => l.phone === phone);
        const customerOrders = orders.filter(o => o.customerPhone === phone);
        // Default name if missing
        const name = data.name || customerLeads[0]?.name || customerOrders[0]?.customerName || cskhItems.find(c => c.customerPhone === phone)?.customerName || phone;

        return {
            ...data,
            phone,
            name,
            leads: customerLeads,
            orders: customerOrders,
            generalNotes: data.generalNotes || '',
            tags: data.tags || []
        } as Customer;
    });
  }, [customersData, leads, orders, cskhItems]);

  // --- EFFECT: AUTH ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
          setUserProfile(null);
          if (!useLocalOnly) setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [useLocalOnly]);

  const fetchUserProfile = async (userId: string) => {
      try {
          const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
          if (error) throw error;
          
          if (data) {
              setUserProfile(data);
          } else {
              // Profile deleted or restricted -> Sign out to enforce security
              if (!useLocalOnly) {
                  await supabase.auth.signOut();
              }
              setUserProfile(null);
          }
      } catch (error) {
          console.error('Error fetching profile:', error);
          if (!useLocalOnly) await supabase.auth.signOut();
      } finally {
          setIsLoading(false);
      }
  };

  // --- EFFECT: FETCH DATA ---
  const fetchData = useCallback(async (force = false, silent = false) => {
      if (useLocalOnly) {
          setLeads(localLeads);
          setCskhItems(localCskh);
          setCustomersData(localCustomers);
          setOrders(localOrders);
          setSales(INITIAL_SALES); // In offline, use constant
          setIsLoading(false);
          return;
      }

      if (!session && !force) return;

      if (!silent) setIsRefreshing(true);
      setConnectionError(null);
      
      try {
          // 1. Fetch Profiles (Sales)
          const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
          if (profilesError) throw profilesError;
          if (profiles) setSales(profiles);

          // 2. Fetch Settings (Sources, Relationships, Groups, Roles)
          const { data: settings, error: settingsError } = await supabase.from('app_settings').select('*');
          if (!settingsError && settings) {
              settings.forEach((s: any) => {
                  if (s.key === 'sources') setSources(s.value);
                  if (s.key === 'relationships') setRelationships(s.value);
                  if (s.key === 'customer_groups') setCustomerGroups(s.value);
                  if (s.key === 'user_roles') setRoles(s.value);
              });
          }

          // 3. Fetch Customers
          const { data: custs, error: custsError } = await supabase.from('customers').select('*');
          if (custsError) throw custsError;
          const custMap: Record<string, CustomerData> = {};
          custs?.forEach((c: any) => {
              // Map DB snake_case to app camelCase
              custMap[c.phone] = {
                  ...c,
                  dateOfBirth: c.date_of_birth,
                  customerGroup: c.customer_group,
                  relationshipStatus: c.relationship_status,
                  generalNotes: c.general_notes,
                  profileCompleteness: c.profile_completeness,
                  userAgent: c.user_agent,
                  sourceUrl: c.source_url,
                  utmSource: c.utm_source,
                  utmMedium: c.utm_medium,
                  eventId: c.event_id,
                  externalId: c.external_id,
                  assignedTo: c.assigned_to,
                  // ... map other fields if necessary
              };
          });
          setCustomersData(custMap);

          // 4. Fetch Leads
          const { data: leadsData, error: leadsError } = await supabase.from('leads').select(`
            *,
            notes (*)
          `).order('created_at', { ascending: false });
          
          if (leadsError) throw leadsError;
          
          const formattedLeads: Lead[] = leadsData.map((l: any) => ({
              id: l.id,
              name: l.name || custMap[l.phone]?.name || l.phone, // Fallback to customer name or phone if lead name is missing
              phone: l.phone,
              source: l.source,
              assignedTo: l.assigned_to,
              status: l.status,
              cskhStatus: l.cskh_status,
              service: l.service,
              description: l.description,
              priority: l.priority,
              potentialRevenue: l.potential_revenue,
              appointmentDate: l.appointment_date,
              projectedAppointmentDate: l.projected_appointment_date,
              createdAt: l.created_at,
              updatedAt: l.updated_at,
              notes: (l.notes || []).map((n: any) => ({
                  id: n.id,
                  content: n.content,
                  createdAt: n.created_at,
                  createdBy: n.created_by
              })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          }));
          setLeads(formattedLeads);

          // 5. Fetch CSKH
          const { data: cskhData, error: cskhError } = await supabase.from('cskh').select('*').order('created_at', { ascending: false });
          if (cskhError) throw cskhError;
          
          const formattedCskh: CskhItem[] = cskhData.map((c: any) => {
              const cust = custMap[c.customer_phone];
              return {
                  id: c.id,
                  customerPhone: c.customer_phone,
                  customerName: cust ? cust.name || c.customer_phone : c.customer_phone,
                  service: c.service,
                  status: c.status,
                  assignedTo: c.assigned_to,
                  originalLeadId: c.original_lead_id,
                  createdAt: c.created_at,
                  updatedAt: c.updated_at
              };
          });
          setCskhItems(formattedCskh);

          // 6. Fetch Orders
          const { data: ordersData, error: ordersError } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (ordersError) throw ordersError;
          
          const formattedOrders: Order[] = ordersData.map((o: any) => {
               const cust = custMap[o.customer_phone];
               return {
                  id: o.id,
                  externalId: o.external_id,
                  customerPhone: o.customer_phone,
                  customerName: cust ? cust.name : undefined,
                  service: o.service,
                  revenue: o.revenue,
                  status: o.status,
                  source: o.source,
                  assignedTo: o.assigned_to,
                  createdAt: o.created_at
              };
          });
          setOrders(formattedOrders);

      } catch (err: any) {
          console.error('Fetch error:', err);
          setConnectionError(formatErrorMessage(err));
      } finally {
          if (!silent) setIsRefreshing(false);
          setIsLoading(false);
      }
  }, [useLocalOnly, session, localLeads, localCskh, localCustomers, localOrders]);

  // Initial fetch
  useEffect(() => {
      fetchData();
  }, [fetchData]);

  // --- REALTIME SUBSCRIPTION ---
  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
      fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    if (useLocalOnly || !session) return;

    const channel = supabase.channel('global-db-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'leads' },
            () => fetchDataRef.current(true, true)
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'customers' },
            () => fetchDataRef.current(true, true)
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => fetchDataRef.current(true, true)
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'cskh' },
            () => fetchDataRef.current(true, true)
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notes' },
            () => fetchDataRef.current(true, true)
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [useLocalOnly, session]);

  const selectedCustomer = useMemo(() => customers.find(c => c.phone === selectedCustomerPhone) || null, [customers, selectedCustomerPhone]);

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  // --- HELPERS FOR SETTINGS UPDATE ---
  const handleUpdateSetting = async (key: string, newValue: any[]) => {
      if (!hasPermission('settings.access')) {
          alert('Bạn không có quyền thay đổi cài đặt.');
          return;
      }

      if (key === 'sources') setSources(newValue);
      else if (key === 'relationships') setRelationships(newValue);
      else if (key === 'customer_groups') setCustomerGroups(newValue);
      else if (key === 'user_roles') setRoles(newValue);

      if (useLocalOnly) return;

      try {
          const { error } = await supabase.from('app_settings').upsert({ key, value: newValue });
          if (error) throw error;
      } catch (err: any) {
          alert('Lỗi lưu cài đặt: ' + formatErrorMessage(err));
          fetchData(true);
      }
  };

  // --- ACTIONS ---

  const handleAddNote = async (leadId: string, content: string) => {
      if (!content.trim()) return;

      if (useLocalOnly) {
          const newNote: Note = {
              id: `note_${Date.now()}`,
              content: content,
              createdAt: new Date().toISOString(),
              createdBy: currentUser
          };
          
          const newLeads = leads.map(l => {
              if (l.id === leadId) {
                  return { ...l, notes: [newNote, ...(l.notes || [])], updatedAt: new Date().toISOString() };
              }
              return l;
          });
          setLeads(newLeads);
          setLocalLeads(newLeads);
      } else {
          try {
              const { error } = await supabase.from('notes').insert([{
                  id: `note_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                  lead_id: leadId,
                  content: content,
                  created_by: currentUser
              }]);
              if (error) throw error;
              await supabase.from('leads').update({ updated_at: new Date().toISOString() }).eq('id', leadId);
          } catch (err: any) {
              alert("Lỗi thêm ghi chú: " + formatErrorMessage(err));
          }
      }
  };

  const handleBulkDeleteCustomers = (phones: string[]) => {
      if (!hasPermission('customer.delete')) {
          alert("BẠN KHÔNG CÓ QUYỀN XÓA KHÁCH HÀNG.");
          return;
      }
      if (phones.length === 0) return;

      setConfirmModal({
          isOpen: true,
          title: `XÓA ${phones.length} KHÁCH HÀNG`,
          message: `Bạn sắp xóa vĩnh viễn ${phones.length} khách hàng đã chọn.\n\nTất cả dữ liệu liên quan (cơ hội, đơn hàng, ghi chú) cũng sẽ bị xóa.`,
          isDangerous: true,
          onConfirm: () => executeBulkDeleteCustomers(phones)
      });
  };

  const executeBulkDeleteCustomers = async (phones: string[]) => {
      closeConfirmModal();
      setIsRefreshing(true);
      try {
          if (!useLocalOnly) {
              const { data: leadData } = await supabase.from('leads').select('id').in('phone', phones);
              const leadIds = leadData?.map(l => l.id) || [];
              if (leadIds.length > 0) await supabase.from('notes').delete().in('lead_id', leadIds);
              await supabase.from('cskh').delete().in('customer_phone', phones);
              await supabase.from('leads').delete().in('phone', phones);
              await supabase.from('orders').delete().in('customer_phone', phones);
              const { error } = await supabase.from('customers').delete().in('phone', phones);
              if (error) throw error;
          } else {
              const newLeads = leads.filter(l => !phones.includes(l.phone));
              const newCskh = cskhItems.filter(c => !phones.includes(c.customerPhone));
              const newOrders = orders.filter(o => !phones.includes(o.customerPhone));
              const newCustomers = { ...customersData };
              phones.forEach(p => delete newCustomers[p]);
              setLeads(newLeads); setLocalLeads(newLeads);
              setCskhItems(newCskh); setLocalCskh(newCskh);
              setOrders(newOrders); setLocalOrders(newOrders);
              setCustomersData(newCustomers); setLocalCustomers(newCustomers);
          }
      } catch (err) { alert(formatErrorMessage(err)); } finally { setIsRefreshing(false); }
  };

  const handleBulkDeleteOrders = (orderIds: string[]) => {
      if (!hasPermission('order.delete')) {
          alert("BẠN KHÔNG CÓ QUYỀN XÓA ĐƠN HÀNG.");
          return;
      }
      if (orderIds.length === 0) return;

      setConfirmModal({
          isOpen: true,
          title: `XÓA ${orderIds.length} ĐƠN HÀNG`,
          message: `Bạn có chắc chắn muốn xóa ${orderIds.length} đơn hàng đã chọn?`,
          isDangerous: true,
          onConfirm: () => executeBulkDeleteOrders(orderIds)
      });
  };

  const executeBulkDeleteOrders = async (orderIds: string[]) => {
      closeConfirmModal();
      setIsRefreshing(true);
      try {
          if (!useLocalOnly) {
              const { error } = await supabase.from('orders').delete().in('id', orderIds);
              if (error) throw error;
          } else {
              const newOrders = orders.filter(o => !orderIds.includes(o.id));
              setOrders(newOrders); setLocalOrders(newOrders);
          }
      } catch (err) { alert(formatErrorMessage(err)); } finally { setIsRefreshing(false); }
  };

  const handleDeleteCustomer = (phone: string) => {
    if (!hasPermission('customer.delete')) { alert("BẠN KHÔNG CÓ QUYỀN XÓA KHÁCH HÀNG."); return; }
    const customer = customers.find(c => c.phone === phone);
    if (!customer) return;
    setConfirmModal({
        isOpen: true,
        title: '⚠️ CẢNH BÁO XÓA DỮ LIỆU',
        message: `Bạn sắp xóa khách hàng: ${customer.name}\n\nHành động này không thể hoàn tác.`,
        isDangerous: true,
        onConfirm: () => executeDeleteCustomer(phone)
    });
  };

  const executeDeleteCustomer = async (phone: string) => {
    closeConfirmModal();
    setIsRefreshing(true);
    try {
        if (!useLocalOnly) {
            const { data: leadData } = await supabase.from('leads').select('id').eq('phone', phone);
            const leadIds = leadData?.map(l => l.id) || [];
            if (leadIds.length > 0) await supabase.from('notes').delete().in('lead_id', leadIds);
            await supabase.from('cskh').delete().eq('customer_phone', phone);
            await supabase.from('leads').delete().eq('phone', phone);
            await supabase.from('orders').delete().eq('customer_phone', phone);
            const { error: custError } = await supabase.from('customers').delete().eq('phone', phone);
            if (custError) throw custError;
        } else {
            const newLeads = leads.filter(l => l.phone !== phone);
            const newCskh = cskhItems.filter(c => c.customerPhone !== phone);
            const newOrders = orders.filter(o => o.customerPhone !== phone);
            const newCustomers = { ...customersData };
            delete newCustomers[phone];
            setLeads(newLeads); setLocalLeads(newLeads);
            setCskhItems(newCskh); setLocalCskh(newCskh);
            setOrders(newOrders); setLocalOrders(newOrders);
            setCustomersData(newCustomers); setLocalCustomers(newCustomers);
        }
        if (selectedCustomerPhone === phone) {
            setSelectedCustomerPhone(null);
            setCustomerViewMode('list');
        }
    } catch (err: any) { alert(formatErrorMessage(err)); } finally { setIsRefreshing(false); }
  };

  const handleDeleteLead = (leadId: string) => {
    if (!hasPermission('lead.delete')) { alert("Bạn không có quyền xóa cơ hội này."); return; }
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    setConfirmModal({
        isOpen: true,
        title: 'Xóa cơ hội',
        message: `Bạn có chắc chắn muốn xóa cơ hội "${lead.name}"?`,
        isDangerous: true,
        onConfirm: () => executeDeleteLead(leadId)
    });
  };

  const executeDeleteLead = async (leadId: string) => {
    closeConfirmModal();
    setIsRefreshing(true);
    try {
        if (!useLocalOnly) {
            await supabase.from('notes').delete().eq('lead_id', leadId);
            const { error: leadError } = await supabase.from('leads').delete().eq('id', leadId);
            if (leadError) throw leadError;
        } else {
            const newLeads = leads.filter(l => l.id !== leadId);
            setLeads(newLeads); setLocalLeads(newLeads);
        }
        if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch (err) { alert(formatErrorMessage(err)); } finally { setIsRefreshing(false); }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!hasPermission('order.delete')) { alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC XÓA ĐƠN HÀNG."); return; }
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
      try {
          if (!useLocalOnly) {
              const { error } = await supabase.from('orders').delete().eq('id', orderId);
              if (error) throw error;
          } else {
              const newOrders = orders.filter(o => o.id !== orderId);
              setOrders(newOrders); setLocalOrders(newOrders);
          }
      } catch (err) { alert(formatErrorMessage(err)); } finally { setIsRefreshing(false); }
  };

  const handleUpdateLeadStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'completed') {
        const lead = leads.find(l => l.id === id);
        if (lead) { setLeadToComplete(lead); }
        return;
    }

    if (useLocalOnly) {
         const newLeads = leads.map(l => l.id === id ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l);
         setLeads(newLeads); setLocalLeads(newLeads);
         return;
    }

    try {
        const { error } = await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
    } catch(err) { alert(formatErrorMessage(err)); }
  };

  const executeLeadCompletion = async (data: { actualRevenue: number; actualService: string; note: string }) => {
      if (!leadToComplete) return;
      const targetLead = leadToComplete;
      setLeadToComplete(null);
      
      const { actualRevenue, actualService, note } = data;
      const updatedNoteContent = note ? `[CHỐT ĐƠN] ${note}` : undefined;

      if (useLocalOnly) {
          const now = new Date().toISOString();
          const newLeads = leads.map(l => {
              if (l.id === targetLead.id) {
                  const updatedLead = { 
                      ...l, 
                      status: 'completed', 
                      potentialRevenue: actualRevenue, 
                      service: actualService,
                      updatedAt: now 
                  };
                  if (updatedNoteContent) {
                      updatedLead.notes = [{
                          id: `note_${Date.now()}`,
                          content: updatedNoteContent,
                          createdAt: now,
                          createdBy: currentUser
                      }, ...(updatedLead.notes || [])];
                  }
                  return updatedLead;
              }
              return l;
          });
          setLeads(newLeads); setLocalLeads(newLeads);

          const newCskhItem: CskhItem = {
              id: `cskh_${Date.now()}`,
              customerPhone: targetLead.phone,
              customerName: targetLead.name,
              service: actualService,
              status: 'cskh_new',
              assignedTo: targetLead.assignedTo,
              originalLeadId: targetLead.id,
              createdAt: now,
              updatedAt: now
          };
          const updatedCskh = [newCskhItem, ...cskhItems];
          setCskhItems(updatedCskh); setLocalCskh(updatedCskh);
          if (selectedLead?.id === targetLead.id) setSelectedLead(null);
          return;
      }

      setIsRefreshing(true);
      try {
          const now = new Date().toISOString();
          const { error: leadError } = await supabase.from('leads').update({ 
              status: 'completed', 
              potential_revenue: actualRevenue,
              service: actualService,
              updated_at: now 
          }).eq('id', targetLead.id);
          if (leadError) throw leadError;

          if (updatedNoteContent) {
              await supabase.from('notes').insert([{
                  id: `note_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                  lead_id: targetLead.id,
                  content: updatedNoteContent,
                  created_by: currentUser
              }]);
          }

          await supabase.from('cskh').insert([{
              customer_phone: targetLead.phone,
              service: actualService,
              status: 'cskh_new',
              assigned_to: targetLead.assignedTo,
              original_lead_id: targetLead.id
          }]);
          if (selectedLead?.id === targetLead.id) setSelectedLead(null);
      } catch (err) { alert(formatErrorMessage(err)); } finally { setIsRefreshing(false); }
  };

  const handleUpdateCskhStatus = async (cskhId: string, newStatusId: string) => {
      if (useLocalOnly) {
          const updated = cskhItems.map(item => item.id === cskhId ? { ...item, status: newStatusId, updatedAt: new Date().toISOString() } : item);
          setCskhItems(updated); setLocalCskh(updated);
          return;
      }
      try {
          const { error } = await supabase.from('cskh').update({ status: newStatusId, updated_at: new Date().toISOString() }).eq('id', cskhId);
          if (error) throw error;
      } catch (err) { alert(formatErrorMessage(err)); }
  };

  const handleDeleteCskh = (cskhId: string) => {
      if (!hasPermission('lead.delete')) { alert("Bạn không có quyền xóa phiếu CSKH."); return; }
      const item = cskhItems.find(i => i.id === cskhId);
      if (!item) return;
      setConfirmModal({
        isOpen: true,
        title: 'Xóa phiếu CSKH',
        message: `Bạn có chắc chắn muốn xóa phiếu chăm sóc của "${item.customerName}"?`,
        isDangerous: true,
        onConfirm: () => executeDeleteCskh(cskhId)
      });
  };

  const executeDeleteCskh = async (cskhId: string) => {
      closeConfirmModal();
      setIsRefreshing(true);
      try {
        if (!useLocalOnly) {
            const { error } = await supabase.from('cskh').delete().eq('id', cskhId);
            if (error) throw error;
        } else {
            const updated = cskhItems.filter(item => item.id !== cskhId);
            setCskhItems(updated); setLocalCskh(updated);
        }
        if (selectedLead) {
             const isRelated = (selectedLead.id === `ghost_${cskhId}`) || 
                               (cskhItems.find(i => i.id === cskhId)?.originalLeadId === selectedLead.id);
             if (isRelated) setSelectedLead(null);
        }
      } catch (err) { alert(formatErrorMessage(err)); } finally { setIsRefreshing(false); }
  };

  const handleUpdateCustomer = async (phone: string, data: Partial<CustomerData>) => {
      if (!useLocalOnly) {
          try {
              const dbData = mapAppCustomerDataToDbCustomer(data);
              const { error } = await supabase.from('customers').update(dbData).eq('phone', phone);
              if (error) throw error;
          } catch(err) { alert(formatErrorMessage(err)); }
      } else {
          const updated = { ...customersData, [phone]: { ...customersData[phone], ...data } };
          setCustomersData(updated); setLocalCustomers(updated);
      }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-white text-slate-500 font-semibold animate-pulse text-sm">Đang tải...</div>;
  if (!session && !useLocalOnly) return <LoginView />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased relative">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={closeConfirmModal}
        isDangerous={confirmModal.isDangerous}
      />

      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={false} 
        setIsOpen={() => {}} 
        onAddLead={() => setIsAddModalOpen(true)}
        hasPermission={hasPermission}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeader onAddLead={() => setIsAddModalOpen(true)} onToggleSidebar={() => {}} sales={sales} userProfile={userProfile} />
        {connectionError && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-[11px] text-red-600 flex justify-between items-center">
                <span>{connectionError}</span>
                <button onClick={() => fetchData()} className="font-bold underline">Thử lại</button>
            </div>
        )}
        <main className="flex-1 overflow-auto bg-white">
          {activeView === 'dashboard' && (
              // Logic hiển thị Dashboard: Admin xem ReportsView, Sale xem SaleDashboard
              isAdmin ? (
                  <ReportsView leads={leads} orders={orders} customers={customersData} sources={sources} sales={sales} cskhItems={cskhItems} />
              ) : (
                  <SaleDashboard 
                      leads={leads} 
                      cskhItems={cskhItems} 
                      orders={orders} 
                      customers={customersData} 
                      currentUser={currentUser}
                      onSelectLead={setSelectedLead}
                      onSelectCskh={(item) => {
                          // Tái sử dụng logic mở LeadDetail từ CSKH Item (giống trong CskhView)
                          const lead = leads.find(l => l.id === item.originalLeadId);
                          if (lead) setSelectedLead(lead);
                          else {
                              // Fallback nếu không tìm thấy lead gốc (ghost lead để xem chi tiết)
                              const ghostLead: Lead = {
                                  id: item.originalLeadId || `ghost_${item.id}`,
                                  name: item.customerName, phone: item.customerPhone, source: 'Unknown',
                                  assignedTo: item.assignedTo, status: 'completed', cskhStatus: item.status,
                                  service: item.service, description: 'Dữ liệu CSKH (Không tìm thấy cơ hội gốc)',
                                  priority: null, potentialRevenue: 0, notes: [],
                                  createdAt: item.createdAt, updatedAt: item.updatedAt,
                                  appointmentDate: null, projectedAppointmentDate: null
                              };
                              setSelectedLead(ghostLead);
                          }
                      }}
                      onReceiveLead={async (id) => {
                          if (useLocalOnly) {
                               const newLeads = leads.map(l => l.id === id ? { ...l, assignedTo: currentUser, status: 'contacting', updatedAt: new Date().toISOString() } : l);
                               setLeads(newLeads); setLocalLeads(newLeads);
                          } else {
                              const { error } = await supabase.from('leads').update({ assigned_to: currentUser, status: 'contacting', updated_at: new Date().toISOString() }).eq('id', id);
                              if (error) alert(formatErrorMessage(error));
                          }
                      }}
                  />
              )
          )}
          {activeView === 'sales' && (
            <KanbanBoard 
                leads={leads} sales={sales} statuses={statuses} onSelectLead={setSelectedLead} 
                onUpdateLeadStatus={handleUpdateLeadStatus} onAddLead={() => setIsAddModalOpen(true)} 
                onAcceptLead={async (id) => {
                    const { error } = await supabase.from('leads').update({ assigned_to: currentUser, status: 'contacting' }).eq('id', id);
                    if (error) alert(formatErrorMessage(error));
                }}
                onDeleteLead={hasPermission('lead.delete') ? handleDeleteLead : undefined}
                sources={['all', ...sources]} selectedSource="all" onSourceChange={() => {}} onCustomizeStatuses={() => {}} selectedSale="all" onSaleChange={() => {}} 
            />
          )}
          {activeView === 'cskh' && (
             <CskhView 
                cskhItems={cskhItems} statuses={cskhStatuses} onUpdateCskhStatus={handleUpdateCskhStatus} 
                onDeleteCskh={hasPermission('lead.delete') ? handleDeleteCskh : undefined} 
                onCustomizeStatuses={() => {}} 
                onSelectCskh={(item) => {
                    const lead = leads.find(l => l.id === item.originalLeadId);
                    if (lead) setSelectedLead(lead);
                    else {
                        const ghostLead: Lead = {
                             id: item.originalLeadId || `ghost_${item.id}`,
                             name: item.customerName, phone: item.customerPhone, source: 'Unknown',
                             assignedTo: item.assignedTo, status: 'completed', cskhStatus: item.status,
                             service: item.service, description: 'Dữ liệu CSKH (Không tìm thấy cơ hội gốc)',
                             priority: null, potentialRevenue: 0, notes: [],
                             createdAt: item.createdAt, updatedAt: item.updatedAt,
                             appointmentDate: null, projectedAppointmentDate: null
                         };
                         setSelectedLead(ghostLead);
                    }
                }}
             />
          )}
          {activeView === 'customers' && (
            customerViewMode === 'list' 
                ? <CustomerList 
                    customers={customers} onSelectCustomer={(c) => { setSelectedCustomerPhone(c.phone); setCustomerViewMode('detail'); }} 
                    onAddCustomer={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }} 
                    onDeleteCustomer={hasPermission('customer.delete') ? handleDeleteCustomer : undefined} 
                    onBulkDelete={hasPermission('customer.delete') ? handleBulkDeleteCustomers : undefined}
                    sources={sources} relationships={relationships} customerGroups={customerGroups} sales={sales}
                  />
                : selectedCustomer && <CustomerDetailView customer={selectedCustomer} sales={sales} statuses={statuses} cskhItems={cskhItems.filter(item => item.customerPhone === selectedCustomer.phone)} relationships={relationships} onClose={() => { setCustomerViewMode('list'); setSelectedCustomerPhone(null); }} onSelectLead={setSelectedLead} onUpdateCustomer={handleUpdateCustomer} onEdit={(c) => { setEditingCustomer(c); setIsCustomerModalOpen(true); }} onDelete={hasPermission('customer.delete') ? handleDeleteCustomer : undefined} onAddNote={handleAddNote} currentUser={currentUser} isAdmin={isAdmin} />
          )}
          {activeView === 'orders' && (
            <OrderList 
                orders={orders} customers={customersData} sales={sales} onAddOrder={() => setIsAddOrderModalOpen(true)} 
                onImportOrders={() => { if (hasPermission('order.import')) setIsImportOrderModalOpen(true); else alert("Bạn không có quyền sử dụng tính năng này."); }}
                onDeleteOrder={hasPermission('order.delete') ? handleDeleteOrder : undefined} 
                canImport={hasPermission('order.import')}
                onBulkDelete={hasPermission('order.delete') ? handleBulkDeleteOrders : undefined}
            />
          )}
          {activeView === 'revenue' && <CalendarView leads={leads} onSelectLead={setSelectedLead} />}
          {activeView === 'settings' && hasPermission('settings.access') && (
            <SettingsView 
                sources={sources} relationships={relationships} customerGroups={customerGroups} roles={roles}
                onUpdateSources={(newSources) => handleUpdateSetting('sources', newSources)} 
                onUpdateRelationships={(newRels) => handleUpdateSetting('relationships', newRels)} 
                onUpdateCustomerGroups={(newGroups) => handleUpdateSetting('customer_groups', newGroups)} 
                onUpdateRoles={(newRoles) => handleUpdateSetting('user_roles', newRoles)}
                useLocalOnly={useLocalOnly} sales={sales} onRefresh={() => fetchData(true)}
                isAdmin={isAdmin} canEdit={hasPermission('settings.access')}
            />
          )}
          {activeView === 'settings' && !hasPermission('settings.access') && (
              <div className="flex h-full items-center justify-center text-slate-500">Bạn không có quyền truy cập vào mục này.</div>
          )}
        </main>
      </div>

      {isAddModalOpen && <AddLeadModal sales={sales} customers={customers} sources={sources} onClose={() => setIsAddModalOpen(false)} onSave={async (data) => {
          if (useLocalOnly) {
              const newLead = { 
                  id: `lead_${Date.now()}`, name: data.name, phone: data.phone, source: data.source,
                  assignedTo: data.assignedTo, status: data.status, service: data.service,
                  description: data.description, priority: data.priority, potentialRevenue: data.potentialRevenue,
                  appointmentDate: data.appointmentDate, projectedAppointmentDate: data.projectedAppointmentDate,
                  notes: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
              };
              const customersUpdate = { ...customersData };
              if (!customersUpdate[data.phone]) {
                  customersUpdate[data.phone] = { phone: data.phone, name: data.name, source: data.source, generalNotes: '', tags: [] };
                  setCustomersData(customersUpdate); setLocalCustomers(customersUpdate);
              }
              setLeads([newLead, ...leads]); setLocalLeads([newLead, ...leads]); setIsAddModalOpen(false);
          } else {
              const customerPayload = mapAppCustomerDataToDbCustomer({ phone: data.phone, name: data.name, source: data.source });
              await supabase.from('customers').upsert(customerPayload, { onConflict: 'phone' });
              const { error } = await supabase.from('leads').insert([{ 
                  id: `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                  name: data.name, phone: data.phone, source: data.source, assigned_to: data.assignedTo, status: data.status,
                  service: data.service, description: data.description, potential_revenue: data.potentialRevenue,
                  projected_appointment_date: data.projectedAppointmentDate, appointment_date: data.appointmentDate
              }]);
              if (!error) setIsAddModalOpen(false); else alert(formatErrorMessage(error));
          }
      }} />}
      
      {selectedLead && (
        <LeadDetailModal 
            lead={selectedLead} sales={sales} statuses={statuses} cskhStatuses={cskhStatuses} 
            context={activeView === 'cskh' ? 'cskh' : 'sales'} onClose={() => setSelectedLead(null)} 
            onSave={async (updatedLead) => {
                if (updatedLead.status === 'completed' && selectedLead.status !== 'completed') { setLeadToComplete(updatedLead); return; }
                if (useLocalOnly) {
                    const newLeads = leads.map(l => l.id === updatedLead.id ? updatedLead : l);
                    setLeads(newLeads); setLocalLeads(newLeads); setSelectedLead(null);
                } else {
                    await supabase.from('leads').update({
                         status: updatedLead.status, cskh_status: updatedLead.cskhStatus, assigned_to: updatedLead.assignedTo,
                         potential_revenue: updatedLead.potentialRevenue, service: updatedLead.service,
                         description: updatedLead.description, appointment_date: updatedLead.appointmentDate,
                         projected_appointment_date: updatedLead.projectedAppointmentDate, updated_at: new Date().toISOString()
                    }).eq('id', updatedLead.id);
                    if (updatedLead.notes.length > (selectedLead.notes || []).length) {
                        const newNote = updatedLead.notes[0];
                         await supabase.from('notes').insert([{ id: newNote.id, lead_id: updatedLead.id, content: newNote.content, created_by: currentUser }]);
                    }
                    setSelectedLead(null);
                }
            }}
            onDelete={activeView === 'cskh' ? (hasPermission('lead.delete') ? () => { const item = cskhItems.find(i => i.originalLeadId === selectedLead.id) || cskhItems.find(i => `ghost_${i.id}` === selectedLead.id); if (item) handleDeleteCskh(item.id); else handleDeleteLead(selectedLead.id); } : undefined) : (hasPermission('lead.delete') ? () => handleDeleteLead(selectedLead.id) : undefined)}
            currentUser={currentUser} 
        />
      )}

      {/* Render Lead Completion Popup */}
      {leadToComplete && (
          <CompleteLeadModal 
              lead={leadToComplete} 
              onClose={() => setLeadToComplete(null)} 
              onConfirm={executeLeadCompletion} 
          />
      )}

      {isCustomerModalOpen && <CustomerFormModal customerToEdit={editingCustomer} relationships={relationships} customerGroups={customerGroups} onClose={() => setIsCustomerModalOpen(false)} onSave={async (data) => {
          const dbData = mapAppCustomerDataToDbCustomer(data);
          const { error } = await supabase.from('customers').upsert(dbData, { onConflict: 'phone' });
          if(error) alert(formatErrorMessage(error)); else setIsCustomerModalOpen(false);
      }} />}
      
      {isAddOrderModalOpen && <AddOrderModal sales={sales} customers={customers} onClose={() => setIsAddOrderModalOpen(false)} onSave={async (data) => {
          if (useLocalOnly) { setIsAddOrderModalOpen(false); } else {
              if (data.customerName) {
                  const customerPayload = mapAppCustomerDataToDbCustomer({ phone: data.customerPhone, name: data.customerName, source: 'manual' });
                  await supabase.from('customers').upsert(customerPayload, { onConflict: 'phone' });
              }
              const { error } = await supabase.from('orders').insert([{ customer_phone: data.customerPhone, service: data.service, revenue: data.revenue, assigned_to: data.assignedTo || null, status: data.status, source: data.source }]);
              if (error) alert(formatErrorMessage(error)); else setIsAddOrderModalOpen(false);
          }
      }} />}

      {isImportOrderModalOpen && <ImportOrderModal existingOrders={orders} onClose={() => setIsImportOrderModalOpen(false)} onImport={async (importedData) => {
           if (useLocalOnly) { alert("Chức năng Import chưa hỗ trợ chế độ Offline."); setIsImportOrderModalOpen(false); } else {
               setIsImportOrderModalOpen(false); setIsRefreshing(true);
               try {
                   const uniqueCustomers = new Map();
                   importedData.forEach(o => { if(o.customerPhone && o.customerName) { uniqueCustomers.set(o.customerPhone, { phone: o.customerPhone, name: o.customerName, source: o.source || 'import', relationshipStatus: 'Chốt đơn' }); } });
                   if (uniqueCustomers.size > 0) {
                       const customersToUpsert = Array.from(uniqueCustomers.values()).map(c => mapAppCustomerDataToDbCustomer(c));
                       await supabase.from('customers').upsert(customersToUpsert, { onConflict: 'phone' });
                   }
                   const dbOrders = importedData.map(o => ({ external_id: o.externalId, customer_phone: o.customerPhone, service: o.service, revenue: o.revenue, status: o.status, source: o.source, created_at: o.createdAt }));
                   await supabase.from('orders').insert(dbOrders);
               } catch (err) { alert(formatErrorMessage(err)); } finally { setIsRefreshing(false); }
           }
      }} />}
    </div>
  );
}

export default App;
