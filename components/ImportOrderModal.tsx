
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Order } from '../types';

interface ImportOrderModalProps {
  existingOrders: Order[];
  onClose: () => void;
  onImport: (data: any[]) => void;
}

interface PreviewData {
    orders: any[];
    newCount: number;
    duplicateCount: number;
}

const ImportOrderModal: React.FC<ImportOrderModalProps> = ({ existingOrders, onClose, onImport }) => {
  const [fileName, setFileName] = useState<string>('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const normalizeHeader = (header: string) => {
      return header.toString().toLowerCase().trim()
          .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
          .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
          .replace(/ì|í|ị|ỉ|ĩ/g, "i")
          .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
          .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
          .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
          .replace(/đ/g, "d")
          .replace(/\s+/g, "_");
  };

  const processExcelData = (data: any[]) => {
      if (!data || data.length === 0) {
          alert("File không có dữ liệu.");
          return;
      }

      const ordersMap = new Map<string, any>();

      data.forEach(row => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
              normalizedRow[normalizeHeader(key)] = row[key];
          });

          // Các key phổ biến trong file xuất KiotViet
          const maHoaDon = normalizedRow['ma_hoa_don'] || normalizedRow['ma_chung_tu'];
          if (!maHoaDon) return;

          const tenKhachHang = normalizedRow['ten_khach_hang'] || normalizedRow['khach_hang'] || '';
          const dienThoaiRaw = normalizedRow['dien_thoai'] || normalizedRow['so_dien_thoai'] || normalizedRow['sdt'] || '';
          
          // Lọc bỏ những khách không có SĐT
          const cleanPhone = dienThoaiRaw.toString().replace(/[^0-9]/g, '');
          if (!cleanPhone || cleanPhone.length < 8) {
              return; // Bỏ qua dòng này nếu không có SĐT hợp lệ
          }
          const finalPhone = cleanPhone;

          const tenHang = normalizedRow['ten_hang'] || normalizedRow['hang_hoa'] || normalizedRow['dien_giai'] || '';
          const thoiGian = normalizedRow['thoi_gian'] || normalizedRow['ngay_ban'] || normalizedRow['ngay_chung_tu'];
          const trangThai = normalizedRow['trang_thai'];
          
          // Lấy Kênh bán làm Nguồn (Source)
          // Ưu tiên cột "Kênh bán" chính xác
          let kenhBan = normalizedRow['kenh_ban'];
          if (!kenhBan) {
              // Tìm kiếm lỏng hơn nếu key không khớp chính xác
              const rawKey = Object.keys(row).find(k => {
                  const norm = normalizeHeader(k);
                  return norm.includes('kenh_ban') || norm === 'kenh';
              });
              if (rawKey) kenhBan = row[rawKey];
          }
          const sourceValue = kenhBan || 'KiotViet';

          // Logic tính toán doanh thu để tránh nhân đôi/nhân ba khi một hóa đơn có nhiều dòng
          const lineAmount = parseFloat(normalizedRow['thanh_tien'] || '0');
          const invoiceTotal = parseFloat(normalizedRow['khach_can_tra'] || normalizedRow['tong_tien_hang'] || '0');

          let createdAt = new Date().toISOString();
          if (thoiGian) {
              if (typeof thoiGian === 'number') {
                   const date = new Date((thoiGian - (25567 + 2)) * 86400 * 1000);
                   createdAt = date.toISOString();
              } else {
                  const parts = thoiGian.toString().split(/[/\s:]/);
                  if (parts.length >= 3) {
                       try {
                           const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${parts[3]||'00'}:${parts[4]||'00'}:00`);
                           if(!isNaN(d.getTime())) createdAt = d.toISOString();
                       } catch(e) {}
                  }
              }
          }

          if (ordersMap.has(maHoaDon)) {
              const existingOrder = ordersMap.get(maHoaDon);
              // Thêm tên hàng nếu chưa có
              if (tenHang && !existingOrder.service.includes(tenHang)) {
                  existingOrder.service += ` , ${tenHang}`;
              }
              
              // Nếu file có cột 'thanh_tien' (chi tiết hóa đơn), ta cộng dồn tiền từng dòng
              if (normalizedRow['thanh_tien'] !== undefined && normalizedRow['thanh_tien'] !== "") {
                  existingOrder.revenue += lineAmount;
              }
          } else {
              // Dòng đầu tiên của hóa đơn này
              ordersMap.set(maHoaDon, {
                  externalId: maHoaDon,
                  customerName: tenKhachHang,
                  customerPhone: finalPhone,
                  service: tenHang,
                  revenue: (normalizedRow['thanh_tien'] !== undefined && normalizedRow['thanh_tien'] !== "") ? lineAmount : invoiceTotal,
                  createdAt: createdAt,
                  status: (trangThai === 'Hoàn thành' || !trangThai) ? 'completed' : (trangThai === 'Đã hủy' ? 'cancelled' : 'pending'),
                  source: sourceValue
              });
          }
      });

      const existingIds = new Set(existingOrders.map(o => o.externalId).filter(Boolean));
      const newOrders: any[] = [];
      let duplicateCount = 0;

      ordersMap.forEach((order) => {
          if (existingIds.has(order.externalId)) {
              duplicateCount++;
          } else {
              newOrders.push(order);
          }
      });

      setPreviewData({
          orders: newOrders,
          newCount: newOrders.length,
          duplicateCount: duplicateCount
      });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = event.target?.result;
              const workbook = XLSX.read(data, { type: 'binary' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
              
              if (json && json.length > 0) {
                  processExcelData(json);
              } else {
                  alert('File không có dữ liệu hoặc không đọc được.');
              }
          } catch (err) {
              alert('Lỗi đọc file Excel.');
              console.error(err);
          } finally {
              setIsProcessing(false);
          }
      };
      reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
          <header className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Import từ KiotViet (Excel)</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          
          <div className="p-6">
              <div className="flex space-x-4 border-b border-slate-200 mb-6">
                  <button className="pb-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                      Upload File Excel (.xlsx)
                  </button>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-50 relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  
                  <label className="cursor-pointer mb-4">
                      <span className="bg-green-600 text-white px-8 py-2.5 rounded-md hover:bg-green-700 font-bold shadow-sm transition-all inline-block">
                          Chọn file Excel KiotViet
                      </span>
                      <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                  </label>

                  <p className="text-sm text-slate-500 text-center mb-1">
                      Hỗ trợ file xuất <strong>Hóa đơn</strong> hoặc <strong>Chi tiết hóa đơn</strong> từ KiotViet.
                  </p>
                  <p className="text-xs text-slate-400 text-center">
                      Hệ thống sẽ tự động lấy nguồn từ cột <strong>Kênh bán</strong> (nếu có).
                  </p>

                  {fileName && (
                      <div className="mt-6 w-full animate-fade-in bg-white border border-green-200 rounded-lg p-3 flex items-center shadow-sm">
                           <div className="h-8 w-8 bg-green-50 rounded flex items-center justify-center text-green-600 mr-3">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                           </div>
                           <div className="flex-1 overflow-hidden">
                               <p className="text-sm font-bold text-slate-700 truncate">{fileName}</p>
                               {previewData && <p className="text-xs text-slate-500">Phát hiện {previewData.newCount} đơn mới, {previewData.duplicateCount} đơn trùng.</p>}
                           </div>
                      </div>
                  )}
                  
                  {isProcessing && (
                      <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                  )}
              </div>
          </div>

          <footer className="p-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg border-t border-slate-200">
            <button onClick={onClose} className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium">Đóng</button>
            {previewData && previewData.newCount > 0 && (
                <button 
                    onClick={() => onImport(previewData.orders)} 
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold shadow-md transition-all animate-bounce-in"
                >
                    Nhập {previewData.newCount} đơn hàng mới
                </button>
            )}
          </footer>
      </div>
    </div>
  );
};

export default ImportOrderModal;
