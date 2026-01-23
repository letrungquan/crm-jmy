
import React, { useState, useEffect, useRef } from 'react';
import { Customer, CustomerData } from '../types';

interface CustomerFormModalProps {
  customerToEdit?: Customer | null;
  relationships?: string[];
  customerGroups?: string[];
  onClose: () => void;
  onSave: (customerData: CustomerData) => void;
}

interface AddressUnit {
    id: string;
    name: string;
    full_name: string;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ customerToEdit, relationships = ['Mới', 'Tiềm năng', 'Quan tâm', 'Chốt đơn', 'VIP', 'Hủy'], customerGroups = ['VIP', 'Thân thiết', 'Tiềm năng', 'Vãng lai'], onClose, onSave }) => {
  const [formData, setFormData] = useState<CustomerData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    location: '',
    province: '',
    district: '',
    ward: '',
    tags: [],
    generalNotes: '',
    source: '',
    assignedTo: undefined,
    customerGroup: '',
    profileCompleteness: 0,
    relationshipStatus: '',
    gender: undefined,
    dateOfBirth: '',
    occupation: '',
    // Tracking fields initialization
    ip: '',
    userAgent: '',
    fbp: '',
    fbc: '',
    ttclid: '',
    ttp: '',
    sourceUrl: '',
    utmSource: '',
    utmMedium: '',
    eventId: '',
    externalId: '',
  });

  const [showTracking, setShowTracking] = useState(false);
  
  // State cho địa chỉ Việt Nam
  const [provinces, setProvinces] = useState<AddressUnit[]>([]);
  const [districts, setDistricts] = useState<AddressUnit[]>([]);
  const [wards, setWards] = useState<AddressUnit[]>([]);
  
  const [selectedProvId, setSelectedProvId] = useState<string>('');
  const [selectedDistId, setSelectedDistId] = useState<string>('');
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [houseNumber, setHouseNumber] = useState<string>('');
  
  const isEditMode = !!customerToEdit;
  const isInitializedRef = useRef(false);

  // Helper chuẩn hóa chuỗi để so sánh
  const normalizeStr = (str: string) => {
      if (!str) return '';
      return str.toLowerCase()
          .replace(/(thành phố|tỉnh|quận|huyện|thị xã|phường|xã|thị trấn|tp\.|q\.|h\.|p\.|tx\.|tt\.)\s*/g, '')
          .trim();
  };

  // Helper tìm ID theo tên
  const findIdByName = (list: AddressUnit[], name?: string, looseCheckInAddress?: string) => {
      if (!list || list.length === 0) return '';
      
      // 1. Ưu tiên khớp chính xác tên đã lưu (nếu có)
      if (name) {
          const n = normalizeStr(name);
          const exactMatch = list.find(item => normalizeStr(item.full_name) === n || normalizeStr(item.name) === n);
          if (exactMatch) return exactMatch.id;
      }

      // 2. Nếu không khớp tên (hoặc không có tên), thử tìm trong chuỗi địa chỉ đầy đủ (cho dữ liệu cũ)
      if (looseCheckInAddress) {
          const addr = normalizeStr(looseCheckInAddress);
          // Tìm item nào mà tên của nó xuất hiện trong chuỗi địa chỉ
          // Sắp xếp list theo độ dài tên giảm dần để tránh khớp nhầm (ví dụ: "Tân Phú" vs "Phú")
          const sortedList = [...list].sort((a, b) => b.name.length - a.name.length);
          const match = sortedList.find(item => {
              const iName = normalizeStr(item.name);
              // Kiểm tra xem tên đơn vị hành chính có nằm trong địa chỉ không
              // Thêm boundary check đơn giản bằng cách check space hoặc dấu phẩy
              return addr.includes(iName); 
          });
          return match?.id || '';
      }

      return '';
  };

  // Logic khởi tạo dữ liệu form và địa chỉ
  useEffect(() => {
    // 1. Set form data cơ bản
    if (isEditMode && customerToEdit) {
      setFormData({
        name: customerToEdit.name || '',
        phone: customerToEdit.phone || '',
        email: customerToEdit.email || '',
        address: customerToEdit.address || '',
        location: customerToEdit.location || '',
        province: customerToEdit.province || '',
        district: customerToEdit.district || '',
        ward: customerToEdit.ward || '',
        generalNotes: customerToEdit.generalNotes || '',
        source: customerToEdit.source || '',
        tags: customerToEdit.tags || [],
        customerGroup: customerToEdit.customerGroup || '',
        relationshipStatus: customerToEdit.relationshipStatus || relationships[0],
        assignedTo: customerToEdit.assignedTo,
        profileCompleteness: customerToEdit.profileCompleteness || 0,
        gender: customerToEdit.gender,
        dateOfBirth: customerToEdit.dateOfBirth || '',
        occupation: customerToEdit.occupation || '',
        ip: customerToEdit.ip || '',
        userAgent: customerToEdit.userAgent || '',
        fbp: customerToEdit.fbp || '',
        fbc: customerToEdit.fbc || '',
        ttclid: customerToEdit.ttclid || '',
        ttp: customerToEdit.ttp || '',
        sourceUrl: customerToEdit.sourceUrl || '',
        utmSource: customerToEdit.utmSource || '',
        utmMedium: customerToEdit.utmMedium || '',
        eventId: customerToEdit.eventId || '',
        externalId: customerToEdit.externalId || '',
      });

      // Tách số nhà từ địa chỉ cũ để hiển thị (lấy phần trước dấu phẩy đầu tiên)
      if (customerToEdit.address && !houseNumber) {
          const parts = customerToEdit.address.split(',');
          if (parts.length > 0) setHouseNumber(parts[0].trim());
      }
    } else if (!isEditMode) {
        // Set default relationship for new customer
         setFormData(prev => ({ ...prev, relationshipStatus: relationships[0] }));
    }

    // 2. Tải và khôi phục địa chỉ (Chạy 1 lần logic này)
    if (!isInitializedRef.current) {
        const fetchAddressData = async () => {
            try {
                // Fetch Tỉnh/Thành
                const pRes = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm');
                const pData = await pRes.json();
                
                if (pData.error === 0) {
                    setProvinces(pData.data);
                    
                    if (isEditMode && customerToEdit) {
                        // Xác định Tỉnh
                        const provId = findIdByName(pData.data, customerToEdit.province || customerToEdit.location, customerToEdit.address);
                        
                        if (provId) {
                            setSelectedProvId(provId);
                            
                            // Fetch Quận/Huyện
                            const dRes = await fetch(`https://esgoo.net/api-tinhthanh/2/${provId}.htm`);
                            const dData = await dRes.json();
                            
                            if (dData.error === 0) {
                                setDistricts(dData.data);
                                
                                // Xác định Quận
                                const distId = findIdByName(dData.data, customerToEdit.district, customerToEdit.address);
                                
                                if (distId) {
                                    setSelectedDistId(distId);
                                    
                                    // Fetch Phường/Xã
                                    const wRes = await fetch(`https://esgoo.net/api-tinhthanh/3/${distId}.htm`);
                                    const wData = await wRes.json();
                                    
                                    if (wData.error === 0) {
                                        setWards(wData.data);
                                        
                                        // Xác định Phường
                                        const wardId = findIdByName(wData.data, customerToEdit.ward, customerToEdit.address);
                                        if (wardId) setSelectedWardId(wardId);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Lỗi tải dữ liệu hành chính:", err);
            }
        };
        
        fetchAddressData();
        isInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerToEdit, isEditMode, relationships]);


  // --- Event Handlers ---

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const provId = e.target.value;
      setSelectedProvId(provId);
      setSelectedDistId('');
      setSelectedWardId('');
      setDistricts([]);
      setWards([]);

      const prov = provinces.find(p => p.id === provId);
      if (prov) {
          setFormData(prev => ({ ...prev, province: prov.full_name, location: prov.full_name }));
          fetch(`https://esgoo.net/api-tinhthanh/2/${provId}.htm`)
            .then(res => res.json())
            .then(data => { if(data.error === 0) setDistricts(data.data) });
      } else {
          setFormData(prev => ({ ...prev, province: '', location: '', address: houseNumber }));
      }
      // Reset address tail
      updateFullAddress(houseNumber, '', '', prov?.full_name || '');
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const distId = e.target.value;
      setSelectedDistId(distId);
      setSelectedWardId('');
      setWards([]);

      const dist = districts.find(d => d.id === distId);
      const provName = provinces.find(p => p.id === selectedProvId)?.full_name || '';

      if (dist) {
          setFormData(prev => ({ ...prev, district: dist.full_name }));
          fetch(`https://esgoo.net/api-tinhthanh/3/${distId}.htm`)
            .then(res => res.json())
            .then(data => { if(data.error === 0) setWards(data.data) });
          updateFullAddress(houseNumber, dist.full_name, '', provName);
      } else {
           setFormData(prev => ({ ...prev, district: '' }));
           updateFullAddress(houseNumber, '', '', provName);
      }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const wardId = e.target.value;
      setSelectedWardId(wardId);
      
      const ward = wards.find(w => w.id === wardId);
      const distName = districts.find(d => d.id === selectedDistId)?.full_name || '';
      const provName = provinces.find(p => p.id === selectedProvId)?.full_name || '';

      if (ward) {
          setFormData(prev => ({ ...prev, ward: ward.full_name }));
          updateFullAddress(houseNumber, distName, ward.full_name, provName);
      } else {
          setFormData(prev => ({ ...prev, ward: '' }));
          updateFullAddress(houseNumber, distName, '', provName);
      }
  };

  const handleHouseNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setHouseNumber(val);
      
      const distName = districts.find(d => d.id === selectedDistId)?.full_name || '';
      const wardName = wards.find(w => w.id === selectedWardId)?.full_name || '';
      const provName = provinces.find(p => p.id === selectedProvId)?.full_name || '';
      
      // Nếu đã chọn tỉnh thành thì tự động ghép chuỗi, ngược lại chỉ điền số nhà
      if (provName) {
          updateFullAddress(val, distName, wardName, provName);
      } else {
          // Fallback cho nhập tay hoàn toàn nếu chưa chọn dropdown
          setFormData(prev => ({...prev, address: val}));
      }
  };

  const updateFullAddress = (hNum: string, dName: string, wName: string, pName: string) => {
      let fullAddr = hNum;
      if (wName) fullAddr += `, ${wName}`;
      if (dName) fullAddr += `, ${dName}`;
      if (pName) fullAddr += `, ${pName}`;
      
      setFormData(prev => ({ ...prev, address: fullAddr }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Tên và Số điện thoại là bắt buộc.");
      return;
    }
    let filledFields = 0;
    const totalFields = 9;
    if(formData.name) filledFields++;
    if(formData.phone) filledFields++;
    if(formData.email) filledFields++;
    if(formData.address) filledFields++;
    if(formData.location) filledFields++;
    if(formData.gender) filledFields++;
    if(formData.dateOfBirth) filledFields++;
    if(formData.occupation) filledFields++;
    if(formData.customerGroup) filledFields++;
    
    const completeness = Math.round((filledFields / totalFields) * 100);

    onSave({
        ...formData,
        profileCompleteness: completeness
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <header className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">
              {isEditMode ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới'}
            </h2>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
             {/* Thông tin cơ bản */}
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b pb-1 mb-3">Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">Tên khách hàng *</label>
                  <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Số điện thoại *</label>
                  <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required disabled={isEditMode} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"/>
                </div>
                <div>
                    <label htmlFor="relationshipStatus" className="block text-sm font-medium text-slate-700">Mối quan hệ</label>
                    <select name="relationshipStatus" id="relationshipStatus" value={formData.relationshipStatus || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        {relationships.map(rel => (
                            <option key={rel} value={rel}>{rel}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-slate-700">Giới tính</label>
                    <select name="gender" id="gender" value={formData.gender || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="">-- Chọn --</option>
                        <option value="female">Nữ</option>
                        <option value="male">Nam</option>
                        <option value="other">Khác</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700">Ngày sinh</label>
                    <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                  <label htmlFor="occupation" className="block text-sm font-medium text-slate-700">Nghề nghiệp</label>
                  <input type="text" name="occupation" id="occupation" value={formData.occupation} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                 <div>
                  <label htmlFor="customerGroup" className="block text-sm font-medium text-slate-700">Nhóm khách hàng</label>
                  <select name="customerGroup" id="customerGroup" value={formData.customerGroup || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                      <option value="">-- Chọn nhóm --</option>
                      {customerGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                      ))}
                  </select>
                </div>
            </div>

            {/* Thông tin liên hệ */}
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b pb-1 mb-3 mt-6">Địa chỉ & Liên hệ khác</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                     <p className="text-xs text-slate-500 italic mb-2">Hỗ trợ tìm kiếm Tỉnh/Thành, Quận/Huyện, Phường/Xã (Dữ liệu mới nhất sau sáp nhập)</p>
                 </div>
                 {/* Chọn Tỉnh/Thành */}
                 <div>
                  <label className="block text-sm font-medium text-slate-700">Tỉnh/Thành phố</label>
                  <select 
                    value={selectedProvId} 
                    onChange={handleProvinceChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                      <option value="">-- Chọn Tỉnh/Thành --</option>
                      {provinces.map(p => (
                          <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                  </select>
                </div>
                
                 {/* Chọn Quận/Huyện */}
                 <div>
                  <label className="block text-sm font-medium text-slate-700">Quận/Huyện</label>
                  <select 
                    value={selectedDistId} 
                    onChange={handleDistrictChange}
                    disabled={!selectedProvId}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-slate-100"
                  >
                      <option value="">-- Chọn Quận/Huyện --</option>
                      {districts.map(d => (
                          <option key={d.id} value={d.id}>{d.full_name}</option>
                      ))}
                  </select>
                </div>

                {/* Chọn Phường/Xã */}
                 <div>
                  <label className="block text-sm font-medium text-slate-700">Phường/Xã</label>
                  <select 
                    value={selectedWardId} 
                    onChange={handleWardChange}
                    disabled={!selectedDistId}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-slate-100"
                  >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {wards.map(w => (
                          <option key={w.id} value={w.id}>{w.full_name}</option>
                      ))}
                  </select>
                </div>

                 {/* Số nhà / Đường */}
                 <div>
                  <label className="block text-sm font-medium text-slate-700">Số nhà / Tên đường</label>
                  <input 
                    type="text" 
                    value={houseNumber}
                    onChange={handleHouseNumberChange}
                    placeholder="VD: Số 10, Đường ABC"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                 {/* Kết quả địa chỉ chi tiết (Readonly hoặc Editable nếu cần) */}
                 <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700">Địa chỉ đầy đủ (Tự động tạo hoặc nhập tay)</label>
                  <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-800"/>
                </div>

                 <div className="md:col-span-1">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                  <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                 <div className="md:col-span-2">
                  <label htmlFor="generalNotes" className="block text-sm font-medium text-slate-700">Ghi chú chung</label>
                  <textarea name="generalNotes" id="generalNotes" value={formData.generalNotes} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
            </div>

            {/* Dữ liệu Marketing & Tracking */}
            <div className="mt-6 border-t pt-4">
               <button 
                  type="button" 
                  onClick={() => setShowTracking(!showTracking)}
                  className="flex items-center text-sm font-bold text-slate-600 hover:text-blue-600 uppercase tracking-wide w-full justify-between"
               >
                  <span>Dữ liệu Marketing & Tracking (Ẩn/Hiện)</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${showTracking ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
               </button>
               
               {showTracking && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="md:col-span-2 text-xs text-slate-500 italic mb-2">
                            Các trường này hỗ trợ bắn API lên Facebook (CAPI), TikTok, Google. Thường được điền tự động nhưng có thể nhập thủ công nếu cần.
                        </div>
                        <div>
                          <label htmlFor="utmSource" className="block text-xs font-medium text-slate-500">UTM Source</label>
                          <input type="text" name="utmSource" id="utmSource" value={formData.utmSource} onChange={handleChange} className="mt-1 block w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm"/>
                        </div>
                        <div>
                          <label htmlFor="utmMedium" className="block text-xs font-medium text-slate-500">UTM Medium</label>
                          <input type="text" name="utmMedium" id="utmMedium" value={formData.utmMedium} onChange={handleChange} className="mt-1 block w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm"/>
                        </div>
                        <div>
                          <label htmlFor="fbp" className="block text-xs font-medium text-slate-500">Facebook Browser ID (fbp)</label>
                          <input type="text" name="fbp" id="fbp" value={formData.fbp} onChange={handleChange} className="mt-1 block w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono"/>
                        </div>
                        <div>
                          <label htmlFor="fbc" className="block text-xs font-medium text-slate-500">Facebook Click ID (fbc)</label>
                          <input type="text" name="fbc" id="fbc" value={formData.fbc} onChange={handleChange} className="mt-1 block w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono"/>
                        </div>
                         <div>
                          <label htmlFor="ttp" className="block text-xs font-medium text-slate-500">TikTok Pixel Cookie (ttp)</label>
                          <input type="text" name="ttp" id="ttp" value={formData.ttp} onChange={handleChange} className="mt-1 block w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono"/>
                        </div>
                        <div>
                          <label htmlFor="ttclid" className="block text-xs font-medium text-slate-500">TikTok Click ID (ttclid)</label>
                          <input type="text" name="ttclid" id="ttclid" value={formData.ttclid} onChange={handleChange} className="mt-1 block w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono"/>
                        </div>
                        <div>
                          <label htmlFor="ip" className="block text-xs font-medium text-slate-500">IP Address</label>
                          <input type="text" name="ip" id="ip" value={formData.ip} onChange={handleChange} className="mt-1 block w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono"/>
                        </div>
                        <div>
                          <label htmlFor="userAgent" className="block text-xs font-medium text-slate-500">User Agent</label>
                          <input type="text" name="userAgent" id="userAgent" value={formData.userAgent} onChange={handleChange} className="mt-1 block w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono truncate"/>
                        </div>
                         <div className="md:col-span-2">
                          <label htmlFor="sourceUrl" className="block text-xs font-medium text-slate-500">Source URL</label>
                          <input type="text" name="sourceUrl" id="sourceUrl" value={formData.sourceUrl} onChange={handleChange} className="mt-1 block w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm"/>
                        </div>
                   </div>
               )}
            </div>

          </div>

          <footer className="p-4 bg-slate-50 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
              Huỷ
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              {isEditMode ? 'Lưu thay đổi' : 'Tạo khách hàng'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
