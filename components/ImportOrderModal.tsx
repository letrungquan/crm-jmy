
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
  
  const normalizeHeader = (header: any) => {
      if (!header) return "";
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

  const parseVnNumber = (val: any) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      // Xử lý số định dạng VN: 1.000.000 hoặc 1.000.000,00
      const clean = val.toString().replace(/\./g, '').replace(/,/g, '.');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
  };

  const processExcelData = (data: any[]) => {
      if (!data || data.length === 0) {
          alert("File không có dữ liệu.");
          return;
      }

      // Tìm dòng tiêu đề thực sự nếu file có các dòng trống hoặc tiêu đề báo cáo ở trên
      let startIndex = 0;
      const headerKeywords = ['ma_hoa_don', 'ma_chung_tu', 'khach_hang', 'ten_khach_hang', 'dien_thoai'];
      
      // Thử tìm dòng chứa các từ khóa tiêu đề
      for (let i = 0; i < Math.min(data.length, 10); i++) {
          const rowKeys = Object.keys(data[i]).map(k => normalizeHeader(k));
          if (rowKeys.some(k => headerKeywords.includes(k))) {
              startIndex = i;
              break;
          }
      }

      const ordersMap = new Map<string, any>();

      for (let i = startIndex; i < data.length; i++) {
          const row = data[i];
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
              normalizedRow[normalizeHeader(key)] = row[key];
          });

          // Các key phổ biến trong file xuất KiotViet
          const maHoaDonRaw = normalizedRow['ma_hoa_don'] || normalizedRow['ma_chung_tu'];
          if (!maHoaDonRaw) continue;
          const maHoaDon = maHoaDonRaw.toString().trim();

          const tenKhachHang = (normalizedRow['ten_khach_hang'] || normalizedRow['khach_hang'] || '').toString().trim();
          const dienThoaiRaw = normalizedRow['dien_thoai'] || normalizedRow['so_dien_thoai'] || normalizedRow['sdt'] || '';
          
          // Lọc bỏ những khách không có SĐT
          const cleanPhone = dienThoaiRaw.toString().replace(/[^0-9]/g, '');
          if (!cleanPhone || cleanPhone.length < 8) {
              continue; // Bỏ qua dòng này nếu không có SĐT hợp lệ
          }
          const finalPhone = cleanPhone;

          const tenHang = (normalizedRow['ten_hang'] || normalizedRow['hang_hoa'] || normalizedRow['dien_giai'] || '').toString().trim();
          const thoiGian = normalizedRow['thoi_gian'] || normalizedRow['ngay_ban'] || normalizedRow['ngay_chung_tu'];
          const trangThai = (normalizedRow['trang_thai'] || '').toString().trim();
          
          // Lấy Kênh bán làm Nguồn (Source)
          let kenhBan = normalizedRow['kenh_ban'];
          if (!kenhBan) {
              const rawKey = Object.keys(row).find(k => {
                  const norm = normalizeHeader(k);
                  return norm.includes('kenh_ban') || norm === 'kenh' || norm === 'nguon' || norm === 'source';
              });
              if (rawKey) kenhBan = row[rawKey];
          }
          const sourceValue = (kenhBan || 'KiotViet').toString().trim();

          // Logic tính toán doanh thu
          const lineAmount = parseVnNumber(normalizedRow['thanh_tien']);
          const invoiceTotal = parseVnNumber(normalizedRow['khach_can_tra'] || normalizedRow['tong_tien_hang']);

          // Lấy Ngày sinh
          let ngaySinh = normalizedRow['ngay_sinh'];
          let parsedDateOfBirth = undefined;
          if (ngaySinh) {
              if (typeof ngaySinh === 'number') {
                  const date = new Date((ngaySinh - (25567 + 2)) * 86400 * 1000);
                  if(!isNaN(date.getTime())) parsedDateOfBirth = date.toISOString().split('T')[0];
              } else {
                  const parts = ngaySinh.toString().split(/[/\s-]/);
                  if (parts.length >= 3) {
                      // Giả định format DD/MM/YYYY
                      const day = parts[0].padStart(2, '0');
                      const month = parts[1].padStart(2, '0');
                      const year = parts[2];
                      if (year.length === 4) {
                          parsedDateOfBirth = `${year}-${month}-${day}`;
                      } else {
                          // Thử format YYYY-MM-DD
                          const d2 = new Date(ngaySinh.toString());
                          if(!isNaN(d2.getTime())) parsedDateOfBirth = d2.toISOString().split('T')[0];
                      }
                  }
              }
          }

          let createdAt = new Date().toISOString();
          if (thoiGian) {
              if (typeof thoiGian === 'number') {
                   // Xử lý ngày Excel (serial number)
                   const utcDate = new Date((thoiGian - (25567 + 2)) * 86400 * 1000);
                   const date = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcDate.getUTCHours(), utcDate.getUTCMinutes(), utcDate.getUTCSeconds());
                   if(!isNaN(date.getTime())) createdAt = date.toISOString();
              } else {
                  // Xử lý chuỗi ngày DD/MM/YYYY HH:mm hoặc YYYY-MM-DD HH:mm
                  const thoiGianStr = thoiGian.toString().trim();
                  const parts = thoiGianStr.split(/[/\s:-]/);
                  if (parts.length >= 3) {
                       try {
                           let year, month, day, hour, minute, second;
                           
                           // Kiểm tra xem part đầu tiên là năm hay ngày
                           if (parts[0].length === 4) {
                               // Format YYYY-MM-DD
                               year = parseInt(parts[0]);
                               month = parseInt(parts[1]) - 1;
                               day = parseInt(parts[2]);
                           } else {
                               // Format DD/MM/YYYY
                               day = parseInt(parts[0]);
                               month = parseInt(parts[1]) - 1;
                               year = parseInt(parts[2]);
                           }
                           
                           hour = parseInt(parts[3] || '0');
                           minute = parseInt(parts[4] || '0');
                           second = parseInt(parts[5] || '0');
                           
                           if (year > 2000) {
                               const d = new Date(year, month, day, hour, minute, second);
                               if(!isNaN(d.getTime())) createdAt = d.toISOString();
                           } else {
                               // Thử fallback
                               const d2 = new Date(thoiGianStr.replace(' ', 'T'));
                               if(!isNaN(d2.getTime())) createdAt = d2.toISOString();
                           }
                       } catch(e) {}
                  }
              }
          }

          if (ordersMap.has(maHoaDon)) {
              const existingOrder = ordersMap.get(maHoaDon);
              if (tenHang && !existingOrder.service.includes(tenHang)) {
                  existingOrder.service += ` , ${tenHang}`;
              }
              
              if (normalizedRow['thanh_tien'] !== undefined && normalizedRow['thanh_tien'] !== "") {
                  existingOrder.revenue += lineAmount;
              }
          } else {
              ordersMap.set(maHoaDon, {
                  externalId: maHoaDon,
                  customerName: tenKhachHang,
                  customerPhone: finalPhone,
                  service: tenHang || 'Đơn hàng KiotViet',
                  revenue: lineAmount > 0 ? lineAmount : invoiceTotal,
                  createdAt: createdAt,
                  status: (trangThai === 'Hoàn thành' || !trangThai) ? 'completed' : (trangThai === 'Đã hủy' ? 'cancelled' : 'pending'),
                  source: sourceValue,
                  dateOfBirth: parsedDateOfBirth
              });
          }
      }

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
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
              
              if (json && json.length > 0) {
                  processExcelData(json);
              } else {
                  alert('File không có dữ liệu hoặc không đọc được.');
              }
          } catch (err) {
              alert('Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.');
              console.error(err);
          } finally {
              setIsProcessing(false);
          }
      };
      reader.readAsArrayBuffer(file);
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
