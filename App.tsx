
import React, { useState, useMemo } from 'react';
import { Lead, Sale, AppView, Customer, CustomerData, StatusConfig, Note } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { INITIAL_LEADS, INITIAL_SALES, INITIAL_STATUSES, INITIAL_CSKH_STATUSES } from './constants';
import LeadDetailModal from './components/LeadDetailModal';
import AddLeadModal from './components/AddLeadModal';
import KanbanBoard from './components/KanbanBoard';
import CalendarView from './components/CalendarView';
import Sidebar from './components/Sidebar';
import MainHeader from './components/MainHeader';
import CustomerList from './components/CustomerList';
import CustomerDetailView from './components/CustomerDetailView';
import StatusManagementModal from './components/StatusManagementModal';
import CskhView from './components/CskhView';
import CustomerFormModal from './components/CustomerFormModal';


function App() {
  const [leads, setLeads] = useLocalStorage<Lead[]>('leads', INITIAL_LEADS);
  const [sales] = useLocalStorage<Sale[]>('sales', INITIAL_SALES);
  const [statuses, setStatuses] = useLocalStorage<StatusConfig[]>('statuses', INITIAL_STATUSES);
  const [cskhStatuses, setCskhStatuses] = useLocalStorage<StatusConfig[]>('cskhStatuses', INITIAL_CSKH_STATUSES);
  const [customersData, setCustomersData] = useLocalStorage<Record<string, CustomerData>>('customersData', {
    '0907723704': {
        name: 'CHI KIM ANH',
        phone: '0907723704',
        generalNotes: 'Ghi chú chung về khách hàng Kim Anh.',
        tags: ['Khách hàng tiềm năng', 'Quan tâm da'],
        location: 'CẦN THƠ',
        relationshipStatus: 'Chốt đơn',
        assignedTo: 'sale4',
        email: 'kim.anh@example.com',
        taxCode: '',
        address: '120 Trần Phú, P. Cái Khế, TP Cần Thơ',
        businessIndustry: '',
        customerGroup: 'Khách hàng mới',
        website: 'https://www.facebook.com/tiem.hang.nhat.decor',
        source: '(Chưa có dữ liệu)',
        creator: 'Phùng Thị Tuyết Anh',
        profileCreatedAt: '2025-10-06T10:05:00.000Z',
        profileCompleteness: 55,
    }
  });
  const [activeView, setActiveView] = useState<AppView>('customers');
  const [customerViewMode, setCustomerViewMode] = useState<'list' | 'detail'>('list');
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCskhStatusModalOpen, setIsCskhStatusModalOpen] = useState(false);
  const [newLeadStatus, setNewLeadStatus] = useState<string>(statuses[0]?.id || 'new');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [saleFilter, setSaleFilter] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Sale['id']>(INITIAL_SALES[0].id);

  // State for Customer Form Modal (Add/Edit)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);


  const uniqueSources = useMemo(() => {
    const sources = new Set(leads.map(lead => lead.source));
    return ['all', ...Array.from(sources)];
  }, [leads]);

  const sortedLeads = useMemo(() => {
    const filteredBySource = sourceFilter === 'all'
      ? leads
      : leads.filter(lead => lead.source === sourceFilter);

    const filteredBySale = saleFilter === 'all'
        ? filteredBySource
        : saleFilter === 'unassigned'
            ? filteredBySource.filter(lead => lead.assignedTo === null)
            : filteredBySource.filter(lead => lead.assignedTo === saleFilter);
      
    return [...filteredBySale].sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  }, [leads, sourceFilter, saleFilter]);

  const customers = useMemo(() => {
    const customerMap = new Map<string, { name: string; leads: Lead[], phone: string }>();

    leads.forEach(lead => {
        if (!lead.phone) return;
        if (!customerMap.has(lead.phone)) {
            customerMap.set(lead.phone, { name: lead.name, leads: [], phone: lead.phone });
        }
        const customerData = customerMap.get(lead.phone)!;
        customerData.leads.push(lead);
        if (lead.name.length > customerData.name.length) {
          customerData.name = lead.name;
        }
    });
    
    // Add customers from customersData who might not have any leads
    Object.entries(customersData).forEach(([phone, data]) => {
        if (!customerMap.has(phone)) {
            customerMap.set(phone, { name: data.name || phone, phone, leads: [] });
        }
    });

    const allCustomers: Customer[] = Array.from(customerMap.values()).map((data) => {
        const persistentData = customersData[data.phone] || { generalNotes: '', tags: [] };
        return {
            phone: data.phone,
            name: data.name,
            leads: data.leads.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            ...persistentData,
        };
    });

    return allCustomers.sort((a,b) => {
        const aDate = a.leads[0]?.createdAt || a.profileCreatedAt || 0;
        const bDate = b.leads[0]?.createdAt || b.profileCreatedAt || 0;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }, [leads, customersData]);
  
  const cskhLeads = useMemo(() => {
    return leads
        .filter(lead => lead.status === 'completed')
        .sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [leads]);

  const handleOpenAddModal = (statusId?: string) => {
    setNewLeadStatus(statusId || statuses[0]?.id || 'new');
    setIsAddModalOpen(true);
  };
  
  const handleUpdateCustomerData = (phone: string, data: Partial<CustomerData>) => {
    setCustomersData(prev => {
        const existing = prev[phone];
        // Ensure mandatory fields exist if we are creating a new record or updating a partial one that might be missing them in context
        const baseData: CustomerData = existing || {
            phone,
            generalNotes: '',
            tags: [],
        };
        
        return {
            ...prev,
            [phone]: {
                ...baseData,
                ...data,
            }
        };
    });
    setSelectedCustomer(prev => prev ? {...prev, ...data} : null);
  };

  const handleOpenAddCustomerModal = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };
  
  const handleSaveCustomer = (data: CustomerData) => {
    if (editingCustomer) { // Update
        setCustomersData(prev => ({
            ...prev,
            [editingCustomer.phone]: { ...prev[editingCustomer.phone], ...data }
        }));
        // If name was changed, update it across all their leads for consistency
        if (data.name && data.name !== editingCustomer.name) {
            setLeads(prevLeads => prevLeads.map(lead => 
                lead.phone === editingCustomer.phone ? { ...lead, name: data.name! } : lead
            ));
        }
        setSelectedCustomer(prev => prev ? {...prev, ...data} : null);
    } else { // Create
        if (customersData[data.phone]) {
            alert('Lỗi: Số điện thoại này đã tồn tại trong hệ thống.');
            return;
        }
        setCustomersData(prev => ({
            ...prev,
            [data.phone]: {
                ...data,
                profileCreatedAt: new Date().toISOString(),
                creator: sales.find(s => s.id === currentUser)?.name || 'Không rõ',
            }
        }));
    }
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
  };
  
  const handleDeleteCustomer = (phone: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này? Mọi cơ hội bán hàng liên quan cũng sẽ bị xóa vĩnh viễn.')) {
        // Delete all leads associated with this customer
        setLeads(prev => prev.filter(l => l.phone !== phone));

        // Delete the customer data
        setCustomersData(prev => {
            const newState = { ...prev };
            delete newState[phone];
            return newState;
        });

        // Go back to the customer list
        handleCloseCustomerDetail();
    }
  };

  const handleAddNoteToLead = (leadId: string, content: string) => {
     const note: Note = {
      id: `note_${Date.now()}`,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser,
    };

    setLeads(prevLeads => prevLeads.map(lead => 
      lead.id === leadId 
        ? { ...lead, notes: [note, ...lead.notes], updatedAt: new Date().toISOString() } 
        : lead
    ));
  };
  
  const processLeadStatusUpdate = (leadToUpdate: Lead): Lead => {
    const updatedLead = { ...leadToUpdate };
    const isContacting = updatedLead.status === 'contacting';
    const isScheduled = ['scheduled', 'completed'].includes(updatedLead.status);

    if (isContacting) updatedLead.appointmentDate = null;
    else updatedLead.projectedAppointmentDate = null;
    
    if (!isScheduled) updatedLead.appointmentDate = null;
    
    if (updatedLead.status === 'completed' && !updatedLead.cskhStatus) {
        updatedLead.cskhStatus = cskhStatuses[0]?.id || 'cskh_1_completed';
    }
    
    return { ...updatedLead, updatedAt: new Date().toISOString() };
  }


  const handleUpdateLead = (updatedLead: Lead) => {
    const processedLead = processLeadStatusUpdate(updatedLead);
    setLeads(prevLeads => prevLeads.map(lead => lead.id === processedLead.id ? processedLead : lead));
    setSelectedLead(null);
  };

  const handleAddLead = (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => {
    const newLead: Lead = {
      ...newLeadData,
      id: `lead_${Date.now()}`,
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Create or update customer data when a lead is added
    if (!customersData[newLead.phone]) {
         handleUpdateCustomerData(newLead.phone, {
            phone: newLead.phone,
            name: newLead.name,
            source: newLead.source,
            profileCreatedAt: newLead.createdAt,
            creator: sales.find(s => s.id === (newLead.assignedTo || currentUser))?.name || 'Không rõ',
         });
    }
    setLeads(prevLeads => [newLead, ...prevLeads]);
    setIsAddModalOpen(false);
  };

  const handleLeadStatusChangeOnDrop = (leadId: string, newStatusId: string) => {
    setLeads(prevLeads => {
      const lead = prevLeads.find(l => l.id === leadId);
      if (!lead) return prevLeads;

      const updatedLeadData = { ...lead, status: newStatusId };
      
      if ((newStatusId === 'scheduled' && !lead.appointmentDate) || (newStatusId === 'contacting' && !lead.projectedAppointmentDate)) {
        setSelectedLead(updatedLeadData);
        return prevLeads; 
      }
      
      const processedLead = processLeadStatusUpdate(updatedLeadData);
      return prevLeads.map(l => l.id === leadId ? processedLead : l);
    });
  };

  const handleAcceptLead = (leadId: string) => {
    const contactingStatus = statuses.find(s => s.id === 'contacting');
    if (!contactingStatus) {
        alert("Trạng thái 'Đang lấy lịch' không tồn tại. Vui lòng kiểm tra cài đặt trạng thái.");
        return;
    }
     if (!currentUser) {
        alert("Vui lòng chọn bạn là sale nào để nhận lead.");
        return;
    }

    const leadToUpdate = leads.find(l => l.id === leadId);
    if (!leadToUpdate) return;

    const processedLead = processLeadStatusUpdate({
        ...leadToUpdate,
        status: 'contacting',
        assignedTo: currentUser
    });
    
    setLeads(prevLeads => prevLeads.map(lead => 
      lead.id === leadId 
        ? processedLead
        : lead
    ));
  };
  
  const handleUpdateLeadCskhStatus = (leadId: string, newCskhStatusId: string) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId
          ? { ...lead, cskhStatus: newCskhStatusId, updatedAt: new Date().toISOString() }
          : lead
      )
    );
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerViewMode('detail');
  };

  const handleCloseCustomerDetail = () => {
    setCustomerViewMode('list');
    setSelectedCustomer(null);
  };
  
  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onAddLead={() => handleOpenAddModal()}
      />
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeader 
          onAddLead={() => handleOpenAddModal()} 
          onToggleSidebar={() => setIsSidebarOpen(true)}
          sales={sales}
          currentUser={currentUser}
          onSetCurrentUser={setCurrentUser}
        />

        <main className="flex-1 overflow-x-auto overflow-y-auto bg-white">
           {activeView === 'sales' && (
            <KanbanBoard 
              leads={sortedLeads}
              sales={sales}
              statuses={statuses}
              onSelectLead={setSelectedLead}
              onUpdateLeadStatus={handleLeadStatusChangeOnDrop}
              onAddLead={handleOpenAddModal}
              onAcceptLead={handleAcceptLead}
              sources={uniqueSources}
              selectedSource={sourceFilter}
              onSourceChange={setSourceFilter}
              onCustomizeStatuses={() => setIsStatusModalOpen(true)}
              selectedSale={saleFilter}
              onSaleChange={setSaleFilter}
            />
          )}
          
          {activeView === 'cskh' && (
              <CskhView
                leads={cskhLeads}
                statuses={cskhStatuses}
                onSelectLead={setSelectedLead}
                onUpdateLeadCskhStatus={handleUpdateLeadCskhStatus}
                onCustomizeStatuses={() => setIsCskhStatusModalOpen(true)}
              />
          )}
          
          {activeView === 'revenue' && (
            <div className="p-2 sm:p-4">
              <CalendarView leads={leads} onSelectLead={setSelectedLead} />
            </div>
          )}
          
          {activeView === 'customers' && (
            customerViewMode === 'list' 
               ? <CustomerList customers={customers} onSelectCustomer={handleSelectCustomer} onAddCustomer={handleOpenAddCustomerModal}/>
               : selectedCustomer && <CustomerDetailView
                    customer={selectedCustomer}
                    onClose={handleCloseCustomerDetail}
                    onSelectLead={setSelectedLead}
                    onUpdateCustomer={handleUpdateCustomerData}
                    sales={sales}
                    statuses={statuses}
                    onEdit={handleOpenEditCustomerModal}
                    onDelete={handleDeleteCustomer}
                    onAddNote={handleAddNoteToLead}
                    currentUser={currentUser}
                 />
          )}

          {activeView !== 'sales' && activeView !== 'revenue' && activeView !== 'customers' && activeView !== 'cskh' && (
             <div className="p-8 text-center text-slate-500">
                <h2 className="text-xl font-semibold">Tính năng đang được phát triển</h2>
                <p>Vui lòng quay lại sau.</p>
             </div>
          )}

        </main>
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          sales={sales}
          statuses={statuses}
          cskhStatuses={cskhStatuses}
          context={selectedLead.cskhStatus || selectedLead.status === 'completed' ? 'cskh' : 'sales'}
          onClose={() => setSelectedLead(null)}
          onSave={handleUpdateLead}
          currentUser={currentUser}
        />
      )}

      {isAddModalOpen && (
        <AddLeadModal
          sales={sales}
          customers={customers}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddLead}
          defaultStatus={newLeadStatus}
        />
      )}
      
      {isCustomerModalOpen && (
        <CustomerFormModal
            customerToEdit={editingCustomer}
            onClose={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }}
            onSave={handleSaveCustomer}
        />
      )}

      {isStatusModalOpen && (
        <StatusManagementModal
            statuses={statuses}
            leads={leads}
            onSave={(newStatuses) => {
                setStatuses(newStatuses);
                setIsStatusModalOpen(false);
            }}
            onClose={() => setIsStatusModalOpen(false)}
            statusKey="status"
        />
      )}

      {isCskhStatusModalOpen && (
        <StatusManagementModal
            statuses={cskhStatuses}
            leads={cskhLeads}
            onSave={(newStatuses) => {
                setCskhStatuses(newStatuses);
                setIsCskhStatusModalOpen(false);
            }}
            onClose={() => setIsCskhStatusModalOpen(false)}
            statusKey="cskhStatus"
            defaultStatusId={cskhStatuses[0]?.id}
        />
      )}
    </div>
  );
}

export default App;
