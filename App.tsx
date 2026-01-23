
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
              notes: l.notes.map((n: any) => ({
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

  // --- REALTIME SUBSCRIPTION (Optimized) ---
  
  // Use a Ref to hold the latest fetchData function. 
  // This allows the subscription to call the latest version without being recreated and triggering a re-subscribe.
  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
      fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    if (useLocalOnly || !session) return;

    // console.log("Initializing Realtime Subscription...");

    const channel = supabase.channel('global-db-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'leads' },
            (payload) => {
                // console.log('Realtime Lead Change:', payload);
                fetchDataRef.current(true, true); // Silent refresh
            }
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
        .subscribe((status) => {
            // if (status === 'SUBSCRIBED') console.log("Realtime Connected!");
        });

    return () => {
        supabase.removeChannel(channel);
    };
  }, [useLocalOnly, session]); // Dependency array is minimal to prevent reconnection loops

  const selectedCustomer = useMemo(() => customers.find(c => c.phone === selectedCustomerPhone) || null, [customers, selectedCustomerPhone]);

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  // --- HELPERS FOR SETTINGS UPDATE ---
  const handleUpdateSetting = async (key: string, newValue: any[]) => {
      if (!hasPermission('settings.access')) {
          alert('Bạn không có quyền thay đổi cài đặt.');
          return;
      }

      // Optimistic update
      if (key === 'sources') setSources(newValue);
      else if (key === 'relationships') setRelationships(newValue);
      else if (key === 'customer_groups') setCustomerGroups(newValue);
      else if (key === 'user_roles') setRoles(newValue);

      if (useLocalOnly) {
          return;
      }

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
                  return { ...l, notes: [newNote, ...l.notes], updatedAt: new Date().toISOString() };
              }
              return l;
          });
          setLeads(newLeads);
          setLocalLeads(newLeads);
      } else {
          try {
              const { error } = await supabase.from('notes').insert([{
                  id: `note_${Date.now()}_${Math.floor(Math.random() * 1000)}`, // Generate ID client-side
                  lead_id: leadId,
                  content: content,
                  created_by: currentUser
              }]);
              if (error) throw error;
              
              // Update lead updated_at to bring it to top if needed
              await supabase.from('leads').update({ updated_at: new Date().toISOString() }).eq('id', leadId);

              // Don't need explicit fetch here as Realtime will catch it, but okay to keep for responsiveness
              // await fetchData(true); 
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
          message: `Bạn sắp xóa vĩnh viễn ${phones.length} khách hàng đã chọn.\n\nTất cả dữ liệu liên quan (cơ hội, đơn hàng, ghi chú) cũng sẽ bị xóa. Hành động này không thể hoàn tác.`,
          isDangerous: true,
          onConfirm: () => executeBulkDeleteCustomers(phones)
      });
  };

  const executeBulkDeleteCustomers = async (phones: string[]) => {
      closeConfirmModal();
      setIsRefreshing(true);
      try {
          if (!useLocalOnly) {
              // 1. Get related lead IDs to delete notes
              const { data: leadData } = await supabase.from('leads').select('id').in('phone', phones);
              const leadIds = leadData?.map(l => l.id) || [];
              
              if (leadIds.length > 0) {
                  await supabase.from('notes').delete().in('lead_id', leadIds);
              }
              
              await supabase.from('cskh').delete().in('customer_phone', phones);
              await supabase.from('leads').delete().in('phone', phones);
              await supabase.from('orders').delete().in('customer_phone', phones);
              
              const { error } = await supabase.from('customers').delete().in('phone', phones);
              if (error) throw error;
          } else {
              // Offline mode logic
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
      } catch (err) {
          alert(formatErrorMessage(err));
      } finally {
          setIsRefreshing(false);
      }
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
          message: `Bạn có chắc chắn muốn xóa ${orderIds.length} đơn hàng đã chọn? Hành động này không thể hoàn tác.`,
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
      } catch (err) {
          alert(formatErrorMessage(err));
      } finally {
          setIsRefreshing(false);
      }
  };

  const handleDeleteCustomer = (phone: string) => {
    if (!hasPermission('customer.delete')) {
        alert("BẠN KHÔNG CÓ QUYỀN XÓA KHÁCH HÀNG.");
        return;
    }
    const customer = customers.find(c => c.phone === phone);
    if (!customer) return;

    setConfirmModal({
        isOpen: true,
        title: '⚠️ CẢNH BÁO XÓA DỮ LIỆU',
        message: `Bạn sắp xóa khách hàng: ${customer.name}\n\nThao tác này sẽ xóa VĨNH VIỄN:\n- ${customer.leads.length} cơ hội\n- ${customer.orders.length} đơn hàng\n- Toàn bộ lịch sử chăm sóc\n\nHành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?`,
        isDangerous: true,
        onConfirm: () => executeDeleteCustomer(phone)
    });
  };

  const executeDeleteCustomer = async (phone: string) => {
    closeConfirmModal();
    setIsRefreshing(true);
    try {
        if (!useLocalOnly) {
            // Delete dependencies first (Notes, Leads, Orders, CSKH)
            const { data: leadData } = await supabase.from('leads').select('id').eq('phone', phone);
            const leadIds = leadData?.map(l => l.id) || [];
            if (leadIds.length > 0) {
                await supabase.from('notes').delete().in('lead_id', leadIds);
            }
            await supabase.from('cskh').delete().eq('customer_phone', phone);
            await supabase.from('leads').delete().eq('phone', phone);
            await supabase.from('orders').delete().eq('customer_phone', phone);
            const { error: custError } = await supabase.from('customers').delete().eq('phone', phone);
            if (custError) throw custError;

            // Realtime will auto-refresh
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
    } catch (err: any) {
        console.error("Delete Error Full:", err);
        alert(formatErrorMessage(err));
    } finally {
        setIsRefreshing(false);
    }
  };

  const handleDeleteLead = (leadId: string) => {
    if (!hasPermission('lead.delete')) {
         alert("Bạn không có quyền xóa cơ hội này.");
         return;
    }

    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setConfirmModal({
        isOpen: true,
        title: 'Xóa cơ hội',
        message: `Bạn có chắc chắn muốn xóa cơ hội "${lead.name}"?\nToàn bộ ghi chú của cơ hội này cũng sẽ bị xóa.`,
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
            // Realtime will update
        } else {
            const newLeads = leads.filter(l => l.id !== leadId);
            setLeads(newLeads); setLocalLeads(newLeads);
        }
        if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch (err) {
        alert(formatErrorMessage(err));
    } finally {
        setIsRefreshing(false);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!hasPermission('order.delete')) {
        alert("CHỈ ADMIN HOẶC NGƯỜI CÓ QUYỀN MỚI ĐƯỢC XÓA ĐƠN HÀNG.");
        return;
    }
    setConfirmModal({
        isOpen: true,
        title: 'Xóa đơn hàng',
        message: 'Bạn có chắc chắn muốn xóa đơn hàng này không?\nHành động này không thể hoàn tác.',
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
              // Realtime update
          } else {
              const newOrders = orders.filter(o => o.id !== orderId);
              setOrders(newOrders); setLocalOrders(newOrders);
          }
      } catch (err) {
          alert(formatErrorMessage(err));
      } finally {
          setIsRefreshing(false);
      }
  };

  const handleUpdateLeadStatus = async (id: string, newStatus: string) => {
    // If status is completed, trigger the confirmation modal instead of immediate update
    if (newStatus === 'completed') {
        const lead = leads.find(l => l.id === id);
        if (lead) {
            setLeadToComplete(lead);
        }
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
        // await fetchData(true); // Let realtime handle it
    } catch(err) { alert(formatErrorMessage(err)); }
  };

  // --- NEW: Execute Lead Completion (DB Logic) ---
  const executeLeadCompletion = async (data: { actualRevenue: number; actualService: string; note: string }) => {
      if (!leadToComplete) return;
      setLeadToComplete(null);
      
      const { actualRevenue, actualService, note } = data;
      const updatedNoteContent = note ? `[CHỐT ĐƠN] ${note}` : undefined;

      if (useLocalOnly) {
          const now = new Date().toISOString();
          
          // 1. Update Lead
          const newLeads = leads.map(l => {
              if (l.id === leadToComplete.id) {
                  const updatedLead = { 
                      ...l, 
                      status: 'completed', 
                      potentialRevenue: actualRevenue, 
                      service: actualService,
                      updatedAt: now 
                  };
                  // Add optional note locally
                  if (updatedNoteContent) {
                      updatedLead.notes = [{
                          id: `note_${Date.now()}`,
                          content: updatedNoteContent,
                          createdAt: now,
                          createdBy: currentUser
                      }, ...updatedLead.notes];
                  }
                  return updatedLead;
              }
              return l;
          });
          setLeads(newLeads); setLocalLeads(newLeads);

          // 3. Create CSKH
          const newCskhItem: CskhItem = {
              id: `cskh_${Date.now()}`,
              customerPhone: leadToComplete.phone,
              customerName: leadToComplete.name,
              service: actualService, // Use actual service
              status: 'cskh_new', // Set to 'Mới tiếp nhận'
              assignedTo: leadToComplete.assignedTo,
              originalLeadId: leadToComplete.id,
              createdAt: now,
              updatedAt: now
          };
          const updatedCskh = [newCskhItem, ...cskhItems];
          setCskhItems(updatedCskh); setLocalCskh(updatedCskh);
          
          alert("Đã hoàn thành cơ hội và tạo phiếu CSKH thành công!");
          // Close detail modal if open
          if (selectedLead?.id === leadToComplete.id) setSelectedLead(null);
          return;
      }

      setIsRefreshing(true);
      try {
          const now = new Date().toISOString();

          // 1. Update Lead with actual values
          const { error: leadError } = await supabase.from('leads').update({ 
              status: 'completed', 
              potential_revenue: actualRevenue,
              service: actualService,
              updated_at: now 
          }).eq('id', leadToComplete.id);
          if (leadError) throw leadError;

          // 1b. Insert Note if exists
          if (updatedNoteContent) {
              await supabase.from('notes').insert([{
                  id: `note_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                  lead_id: leadToComplete.id,
                  content: updatedNoteContent,
                  created_by: currentUser
              }]);
          }

          // 3. Create CSKH
          const { error: cskhError } = await supabase.from('cskh').insert([{
              customer_phone: leadToComplete.phone,
              service: actualService, // Use actual service
              status: 'cskh_new', // Set to 'Mới tiếp nhận'
              assigned_to: leadToComplete.assignedTo,
              original_lead_id: leadToComplete.id
          }]);
          if (cskhError) console.error("Error creating CSKH:", cskhError);

          alert("Đã hoàn thành cơ hội và tạo phiếu CSKH thành công!");
          
          // await fetchData(true); // Let realtime handle it
          // Close detail modal if open
          if (selectedLead?.id === leadToComplete.id) setSelectedLead(null);

      } catch (err) {
          alert(formatErrorMessage(err));
      } finally {
          setIsRefreshing(false);
      }
  };

  // --- CSKH ACTIONS ---
  
  const handleUpdateCskhStatus = async (cskhId: string, newStatusId: string) => {
      if (useLocalOnly) {
          const updated = cskhItems.map(item => item.id === cskhId ? { ...item, status: newStatusId, updatedAt: new Date().toISOString() } : item);
          setCskhItems(updated); setLocalCskh(updated);
          return;
      }
      try {
          const { error } = await supabase.from('cskh').update({ status: newStatusId, updated_at: new Date().toISOString() }).eq('id', cskhId);
          if (error) throw error;
          // await fetchData(true);
      } catch (err) { alert(formatErrorMessage(err)); }
  };

  const handleDeleteCskh = (cskhId: string) => {
      if (!hasPermission('lead.delete')) { // Assuming CSKH deletion requires lead deletion rights for now
          alert("Bạn không có quyền xóa phiếu CSKH.");
          return;
      }

      const item = cskhItems.find(i => i.id === cskhId);
      if (!item) return;

      setConfirmModal({
        isOpen: true,
        title: 'Xóa phiếu CSKH',
        message: `Bạn có chắc chắn muốn xóa phiếu chăm sóc của "${item.customerName}"?\nLịch sử chăm sóc và cơ hội gốc vẫn sẽ được giữ lại.`,
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
            // Realtime update
        } else {
            const updated = cskhItems.filter(item => item.id !== cskhId);
            setCskhItems(updated); setLocalCskh(updated);
        }

        // Close modal if the deleted item is currently viewed
        if (selectedLead) {
             const isRelated = (selectedLead.id === `ghost_${cskhId}`) || 
                               (cskhItems.find(i => i.id === cskhId)?.originalLeadId === selectedLead.id);
             if (isRelated) setSelectedLead(null);
        }

      } catch (err) { 
          alert(formatErrorMessage(err)); 
      } finally {
          setIsRefreshing(false);
      }
  };


  const handleUpdateCustomer = async (phone: string, data: Partial<CustomerData>) => {
      if (!useLocalOnly) {
          try {
              const dbData = mapAppCustomerDataToDbCustomer(data);
              const { error } = await supabase.from('customers').update(dbData).eq('phone', phone);
              if (error) throw error;
              // Realtime update
          } catch(err) { alert(formatErrorMessage(err)); }
      } else {
          const updated = { ...customersData, [phone]: { ...customersData[phone], ...data } };
          setCustomersData(updated); setLocalCustomers(updated);
      }
  };

  // --- RENDER LOGIC ---

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-white text-slate-500 font-semibold animate-pulse text-sm">Đang tải...</div>;

  if (!session && !useLocalOnly) {
      return <LoginView />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased relative">
      {isRefreshing && (
        <div className="fixed inset-0 bg-white/50 z-[100] flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3 border border-slate-100">
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                 <span className="text-sm font-medium text-slate-700">Đang xử lý...</span>
            </div>
        </div>
      )}
      
      {leadToComplete && (
          <CompleteLeadModal 
            lead={leadToComplete} 
            onClose={() => setLeadToComplete(null)} 
            onConfirm={executeLeadCompletion} 
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

      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={false} 
        setIsOpen={() => {}} 
        onAddLead={() => setIsAddModalOpen(true)}
        hasPermission={hasPermission}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeader 
            onAddLead={() => setIsAddModalOpen(true)} 
            onToggleSidebar={() => {}} 
            sales={sales} 
            userProfile={userProfile}
        />
        {connectionError && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-[11px] text-red-600 flex justify-between items-center">
                <span>{connectionError}</span>
                <button onClick={() => fetchData()} className="font-bold underline">Thử lại</button>
            </div>
        )}
        <main className="flex-1 overflow-auto bg-white">
          {activeView === 'dashboard' && <ReportsView leads={leads} orders={orders} customers={customersData} sources={sources} />}
          {activeView === 'sales' && (
            <KanbanBoard 
                leads={leads} 
                sales={sales} 
                statuses={statuses} 
                onSelectLead={setSelectedLead} 
                onUpdateLeadStatus={handleUpdateLeadStatus} 
                onAddLead={() => setIsAddModalOpen(true)} 
                onAcceptLead={async (id) => {
                    const { error } = await supabase.from('leads').update({ assigned_to: currentUser, status: 'contacting' }).eq('id', id);
                    if (!error) { /* Realtime handles fetch */ }
                    else alert(formatErrorMessage(error));
                }}
                onDeleteLead={hasPermission('lead.delete') ? handleDeleteLead : undefined}
                sources={['all', ...sources]} selectedSource="all" onSourceChange={() => {}} onCustomizeStatuses={() => {}} selectedSale="all" onSaleChange={() => {}} 
            />
          )}
          {activeView === 'cskh' && (
             <CskhView 
                cskhItems={cskhItems} 
                statuses={cskhStatuses} 
                onUpdateCskhStatus={handleUpdateCskhStatus} 
                onDeleteCskh={hasPermission('lead.delete') ? handleDeleteCskh : undefined} 
                onCustomizeStatuses={() => {}} 
                onSelectCskh={(item) => {
                    const lead = leads.find(l => l.id === item.originalLeadId);
                    if (lead) {
                        setSelectedLead(lead);
                    } else {
                        // Fallback: Create ghost lead object to view basic details
                        const ghostLead: Lead = {
                             id: item.originalLeadId || `ghost_${item.id}`,
                             name: item.customerName,
                             phone: item.customerPhone,
                             source: 'Unknown',
                             assignedTo: item.assignedTo,
                             status: 'completed',
                             cskhStatus: item.status,
                             service: item.service,
                             description: 'Dữ liệu CSKH (Không tìm thấy cơ hội gốc)',
                             priority: null,
                             potentialRevenue: 0,
                             notes: [],
                             createdAt: item.createdAt,
                             updatedAt: item.updatedAt,
                             appointmentDate: null,
                             projectedAppointmentDate: null
                         };
                         setSelectedLead(ghostLead);
                    }
                }}
             />
          )}
          {activeView === 'customers' && (
            customerViewMode === 'list' 
                ? <CustomerList 
                    customers={customers} 
                    onSelectCustomer={(c) => { setSelectedCustomerPhone(c.phone); setCustomerViewMode('detail'); }} 
                    onAddCustomer={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }} 
                    onDeleteCustomer={hasPermission('customer.delete') ? handleDeleteCustomer : undefined} 
                    onBulkDelete={hasPermission('customer.delete') ? handleBulkDeleteCustomers : undefined}
                    sources={sources}
                    relationships={relationships}
                    customerGroups={customerGroups}
                  />
                : selectedCustomer && <CustomerDetailView customer={selectedCustomer} sales={sales} statuses={statuses} cskhItems={cskhItems.filter(item => item.customerPhone === selectedCustomer.phone)} relationships={relationships} onClose={() => { setCustomerViewMode('list'); setSelectedCustomerPhone(null); }} onSelectLead={setSelectedLead} onUpdateCustomer={handleUpdateCustomer} onEdit={(c) => { setEditingCustomer(c); setIsCustomerModalOpen(true); }} onDelete={hasPermission('customer.delete') ? handleDeleteCustomer : undefined} onAddNote={handleAddNote} currentUser={currentUser} isAdmin={isAdmin} />
          )}
          {activeView === 'orders' && (
            <OrderList 
                orders={orders} 
                customers={customersData} 
                sales={sales} 
                onAddOrder={() => setIsAddOrderModalOpen(true)} 
                onImportOrders={() => {
                    if (hasPermission('order.import')) {
                        setIsImportOrderModalOpen(true);
                    } else {
                        alert("Bạn không có quyền sử dụng tính năng này.");
                    }
                }}
                onDeleteOrder={hasPermission('order.delete') ? handleDeleteOrder : undefined} 
                canImport={hasPermission('order.import')}
                onBulkDelete={hasPermission('order.delete') ? handleBulkDeleteOrders : undefined}
            />
          )}
          {activeView === 'revenue' && <CalendarView leads={leads} onSelectLead={setSelectedLead} />}
          {activeView === 'settings' && hasPermission('settings.access') && (
            <SettingsView 
                sources={sources} 
                relationships={relationships} 
                customerGroups={customerGroups} 
                roles={roles}
                onUpdateSources={(newSources) => handleUpdateSetting('sources', newSources)} 
                onUpdateRelationships={(newRels) => handleUpdateSetting('relationships', newRels)} 
                onUpdateCustomerGroups={(newGroups) => handleUpdateSetting('customer_groups', newGroups)} 
                onUpdateRoles={(newRoles) => handleUpdateSetting('user_roles', newRoles)}
                useLocalOnly={useLocalOnly}
                sales={sales}
                onRefresh={() => fetchData(true)}
                isAdmin={isAdmin}
                canEdit={hasPermission('settings.access')}
            />
          )}
          {activeView === 'settings' && !hasPermission('settings.access') && (
              <div className="flex h-full items-center justify-center text-slate-500">
                  Bạn không có quyền truy cập vào mục này.
              </div>
          )}
        </main>
      </div>

      {isAddModalOpen && <AddLeadModal sales={sales} customers={customers} sources={sources} onClose={() => setIsAddModalOpen(false)} onSave={async (data) => {
          if (useLocalOnly) {
              const newLead = { 
                  id: `lead_${Date.now()}`, 
                  name: data.name,
                  phone: data.phone,
                  source: data.source,
                  assignedTo: data.assignedTo,
                  status: data.status,
                  service: data.service,
                  description: data.description,
                  priority: data.priority,
                  potentialRevenue: data.potentialRevenue,
                  appointmentDate: data.appointmentDate,
                  projectedAppointmentDate: data.projectedAppointmentDate,
                  notes: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
              };
              const customersUpdate = { ...customersData };
              if (!customersUpdate[data.phone]) {
                  customersUpdate[data.phone] = {
                      phone: data.phone,
                      name: data.name,
                      source: data.source,
                      generalNotes: '',
                      tags: []
                  };
                  setCustomersData(customersUpdate);
                  setLocalCustomers(customersUpdate);
              }
              setLeads([newLead, ...leads]); setLocalLeads([newLead, ...leads]); setIsAddModalOpen(false);
          } else {
              const customerPayload = mapAppCustomerDataToDbCustomer({ phone: data.phone, name: data.name, source: data.source });
              const { error: custError } = await supabase.from('customers').upsert(customerPayload, { onConflict: 'phone' });
              if (custError) { alert("Lỗi tạo khách hàng: " + formatErrorMessage(custError)); return; }

              const { error } = await supabase.from('leads').insert([{ 
                  id: `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                  name: data.name,
                  phone: data.phone, 
                  source: data.source, 
                  assigned_to: data.assignedTo, 
                  status: data.status, 
                  service: data.service, 
                  description: data.description, 
                  potential_revenue: data.potentialRevenue, 
                  projected_appointment_date: data.projectedAppointmentDate, 
                  appointment_date: data.appointmentDate
              }]);
              if (!error) { setIsAddModalOpen(false); /* Fetch handled by realtime */ } else { alert(formatErrorMessage(error)); }
          }
      }} />}
      
      {selectedLead && (
        <LeadDetailModal 
            lead={selectedLead} 
            sales={sales} 
            statuses={statuses} 
            cskhStatuses={cskhStatuses} 
            context={activeView === 'cskh' ? 'cskh' : 'sales'}
            onClose={() => setSelectedLead(null)} 
            onSave={async (updatedLead) => {
                // Intercept 'completed' status change here to show confirmation modal
                if (updatedLead.status === 'completed' && selectedLead.status !== 'completed') {
                    setLeadToComplete(updatedLead);
                    return;
                }

                if (useLocalOnly) {
                    const newLeads = leads.map(l => l.id === updatedLead.id ? updatedLead : l);
                    setLeads(newLeads); setLocalLeads(newLeads); setSelectedLead(null);
                    
                    // Sync local CSKH item if exists
                    if (cskhItems.some(c => c.originalLeadId === updatedLead.id)) {
                        const newCskh = cskhItems.map(c => c.originalLeadId === updatedLead.id ? { ...c, status: updatedLead.cskhStatus || c.status, updatedAt: new Date().toISOString() } : c);
                        setCskhItems(newCskh); setLocalCskh(newCskh);
                    }
                } else {
                    const { error } = await supabase.from('leads').update({
                         status: updatedLead.status, 
                         cskh_status: updatedLead.cskhStatus,
                         assigned_to: updatedLead.assignedTo, 
                         potential_revenue: updatedLead.potentialRevenue, 
                         service: updatedLead.service, 
                         description: updatedLead.description, 
                         appointment_date: updatedLead.appointmentDate, 
                         projected_appointment_date: updatedLead.projectedAppointmentDate, 
                         updated_at: new Date().toISOString()
                    }).eq('id', updatedLead.id);
                    if (error) { alert(formatErrorMessage(error)); return; }

                    if (updatedLead.notes.length > selectedLead.notes.length) {
                        const newNote = updatedLead.notes[0];
                         await supabase.from('notes').insert([{ id: newNote.id, lead_id: updatedLead.id, content: newNote.content, created_by: currentUser }]);
                    }
                    
                    // Sync CSKH Status to cskh table
                    if (updatedLead.cskhStatus) {
                        await supabase.from('cskh').update({
                            status: updatedLead.cskhStatus,
                            updated_at: new Date().toISOString()
                        }).eq('original_lead_id', updatedLead.id);
                    }

                    // fetchData(true); // Handled by realtime
                    setSelectedLead(null);
                }
            }}
            onDelete={
                activeView === 'cskh' 
                ? (hasPermission('lead.delete') 
                    ? () => {
                        const item = cskhItems.find(i => i.originalLeadId === selectedLead.id) || 
                                     cskhItems.find(i => `ghost_${i.id}` === selectedLead.id);
                        if (item) handleDeleteCskh(item.id);
                        else handleDeleteLead(selectedLead.id);
                    } 
                    : undefined)
                : (hasPermission('lead.delete') ? () => handleDeleteLead(selectedLead.id) : undefined)
            }
            currentUser={currentUser} 
        />
      )}
      {/* ... Other Modals ... */}
      {isCustomerModalOpen && <CustomerFormModal customerToEdit={editingCustomer} relationships={relationships} customerGroups={customerGroups} onClose={() => setIsCustomerModalOpen(false)} onSave={async (data) => {
          const dbData = mapAppCustomerDataToDbCustomer(data);
          const { error } = await supabase.from('customers').upsert(dbData, { onConflict: 'phone' });
          if(error) alert(formatErrorMessage(error)); else { setIsCustomerModalOpen(false); /* fetch by realtime */ }
      }} />}
      
      {isAddOrderModalOpen && <AddOrderModal sales={sales} customers={customers} onClose={() => setIsAddOrderModalOpen(false)} onSave={async (data) => {
          if (useLocalOnly) { setIsAddOrderModalOpen(false); } else {
              if (data.customerName) {
                  const customerPayload = mapAppCustomerDataToDbCustomer({ phone: data.customerPhone, name: data.customerName, source: 'manual' });
                  const { error: cErr } = await supabase.from('customers').upsert(customerPayload, { onConflict: 'phone' });
                   if (cErr) { alert(formatErrorMessage(cErr)); return; }
              }
              const { error } = await supabase.from('orders').insert([{ customer_phone: data.customerPhone, service: data.service, revenue: data.revenue, assigned_to: data.assignedTo || null, created_at: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(), status: data.status, source: data.source }]);
              if (error) alert(formatErrorMessage(error)); else { setIsAddOrderModalOpen(false); /* fetch by realtime */ }
          }
      }} />}

      {isImportOrderModalOpen && <ImportOrderModal existingOrders={orders} onClose={() => setIsImportOrderModalOpen(false)} onImport={async (importedData) => {
           if (useLocalOnly) { alert("Chức năng Import chưa hỗ trợ chế độ Offline."); setIsImportOrderModalOpen(false); } else {
               setIsImportOrderModalOpen(false); setIsRefreshing(true);
               try {
                   // 1. Identify new sources from import data
                   const importedSources = new Set<string>();
                   importedData.forEach(o => {
                       if (o.source && o.source !== 'manual' && o.source !== 'kiotviet' && o.source !== 'Thủ công' && o.source !== 'KiotViet') {
                           importedSources.add(o.source);
                       }
                   });
                   
                   const newSourcesToAdd: string[] = [];
                   importedSources.forEach(src => {
                       if (!sources.includes(src)) {
                           newSourcesToAdd.push(src);
                       }
                   });

                   // 2. Update Settings if needed
                   if (newSourcesToAdd.length > 0) {
                       const updatedSourcesList = [...sources, ...newSourcesToAdd];
                       setSources(updatedSourcesList); // Optimistic UI update
                       if (!useLocalOnly) {
                           await supabase.from('app_settings').upsert({ key: 'sources', value: updatedSourcesList });
                       }
                   }

                   const uniqueCustomers = new Map();
                   importedData.forEach(o => { 
                       // Use the specific source from order instead of generic 'import'
                       if(o.customerPhone && o.customerName) {
                           uniqueCustomers.set(o.customerPhone, { 
                               phone: o.customerPhone, 
                               name: o.customerName, 
                               source: o.source || 'import',
                               relationshipStatus: 'Chốt đơn' // Auto set to 'Closed' as they have purchased
                           }); 
                       }
                   });

                   if (uniqueCustomers.size > 0) {
                       const customersToUpsert = Array.from(uniqueCustomers.values()).map(c => mapAppCustomerDataToDbCustomer(c));
                       const { error: custError } = await supabase.from('customers').upsert(customersToUpsert, { onConflict: 'phone' });
                       if(custError) console.error("Lỗi import customer:", custError);
                   }
                   const dbOrders = importedData.map(o => ({ external_id: o.externalId, customer_phone: o.customerPhone, service: o.service, revenue: o.revenue, status: o.status, source: o.source, created_at: o.createdAt }));
                   const { error } = await supabase.from('orders').insert(dbOrders);
                   if (error) alert("Lỗi import đơn hàng: " + formatErrorMessage(error)); else { alert(`Đã import thành công ${importedData.length} đơn hàng.`); /* fetch by realtime */ }
               } catch (err) { alert("Có lỗi xảy ra khi import: " + formatErrorMessage(err)); } finally { setIsRefreshing(false); }
           }
      }} />}
    </div>
  );
}

export default App;
