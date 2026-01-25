
import React, { useMemo, useState } from 'react';
import { CskhItem, Lead, Note } from '../types';

interface DailyCskhReportProps {
  cskhItems: CskhItem[];
  leads: Lead[];
}

const DailyCskhReport: React.FC<DailyCskhReportProps> = ({ cskhItems, leads }) => {
  // State quản lý ngày được chọn, mặc định là hôm nay (YYYY-MM-DD)
  // Lấy ngày hiện tại theo múi giờ địa phương để input date hiển thị đúng
  const [selectedDate, setSelectedDate] = useState(() => {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      return new Date(now.getTime() - offset).toISOString().split('T')[0];
  });
  
  const reportData = useMemo(() => {
    // Tạo đối tượng Date cho đầu ngày và cuối ngày được chọn (Local Time)
    const [year, month, day] = selectedDate.split('-').map(Number);
    const reportDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
    const reportDateEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Xử lý dữ liệu: Map để lấy phản hồi, sau đó Filter để loại bỏ dòng trống
    const processedItems = cskhItems.map(item => {
        const itemCreated = new Date(item.createdAt);
        // Bỏ qua các ticket tạo trong tương lai so với ngày báo cáo
        if (itemCreated > reportDateEnd) return null;

        // Lấy phản hồi CHỈ TRONG NGÀY ĐÓ
        const lead = leads.find(l => l.id === item.originalLeadId);
        let feedback = "";
        
        if (lead && lead.notes && lead.notes.length > 0) {
            // Lọc note:
            // 1. Được tạo trong khoảng thời gian của ngày được chọn
            // 2. KHÔNG chứa từ khóa [CHỐT ĐƠN] (theo yêu cầu loại bỏ hoạt động chốt đơn)
            const notesOnDate = lead.notes.filter(n => {
                const nDate = new Date(n.createdAt);
                // Kiểm tra xem note có nằm trong ngày báo cáo không
                const isSameDay = nDate >= reportDateObj && nDate <= reportDateEnd;
                // Loại bỏ nội dung chốt đơn
                const isNotOrder = !n.content.includes('[CHỐT ĐƠN]');
                
                return isSameDay && isNotOrder;
            });

            if (notesOnDate.length > 0) {
                // Sắp xếp mới nhất lên đầu để hiển thị
                notesOnDate.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                // Gộp nội dung nếu có nhiều note
                feedback = notesOnDate.map(n => n.content.replace(/\[PHẢN HỒI\]/g, '').replace(/\[\d+ Sao\]/g, '').trim()).join('; ');
            }
        }

        // QUAN TRỌNG: Nếu không có phản hồi trong ngày này, không hiển thị dòng này
        if (!feedback) return null;

        // Tính thời gian: (Ngày báo cáo - Ngày tạo)
        // Set cả 2 về 0h00 để tính số ngày chẵn
        // FIX: Sử dụng ngày tạo Lead (nếu có) thay vì ngày tạo phiếu CSKH để tính thời gian theo yêu cầu người dùng
        const startDateRaw = lead ? lead.createdAt : item.createdAt;
        const createdDate = new Date(startDateRaw);
        const createdDateMidnight = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
        const reportDateMidnight = new Date(year, month - 1, day);
        
        const diffTime = reportDateMidnight.getTime() - createdDateMidnight.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        
        let timeText = "";
        if (diffDays < 0) {
            timeText = "Chưa đến"; 
        } else if (diffDays === 0) {
            timeText = "Hôm nay";
        } else {
            timeText = `Sau ${diffDays} ngày`;
        }

        return {
            ...item,
            timeText,
            feedback,
            doctorGroup: item.doctorName || 'Chưa phân loại'
        };
    }).filter((item): item is NonNullable<typeof item> => item !== null); // Loại bỏ null

    // 3. Nhóm theo Bác sĩ
    const grouped = processedItems.reduce((acc, item) => {
        if (!acc[item.doctorGroup]) {
            acc[item.doctorGroup] = [];
        }
        acc[item.doctorGroup].push(item);
        return acc;
    }, {} as Record<string, typeof processedItems>);

    return grouped;
  }, [cskhItems, leads, selectedDate]);

  const doctors = Object.keys(reportData).sort();
  const [y, m, d] = selectedDate.split('-');
  const dateDisplay = `${d}/${m}/${y}`;

  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
        <div className="bg-blue-100 px-4 py-3 border-b border-blue-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-bold text-blue-900 uppercase flex-1">
                CHĂM SÓC KHÁCH HÀNG ({dateDisplay})
            </h3>
            <div className="flex items-center bg-white rounded border border-blue-300 px-2 py-1">
                <span className="text-xs font-bold text-slate-500 mr-2 uppercase">CHỌN NGÀY:</span>
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                />
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-blue-900 uppercase bg-blue-200 border-b border-blue-300">
                    <tr>
                        <th className="px-4 py-3 border-r border-blue-300 w-24 text-center font-bold">BS</th>
                        <th className="px-2 py-3 border-r border-blue-300 w-12 text-center font-bold">STT</th>
                        <th className="px-4 py-3 border-r border-blue-300 w-48 font-bold">TÊN KHÁCH HÀNG</th>
                        <th className="px-4 py-3 border-r border-blue-300 font-bold">DỊCH VỤ</th>
                        <th className="px-4 py-3 border-r border-blue-300 w-32 text-center font-bold">THỜI GIAN</th>
                        <th className="px-4 py-3 font-bold">PHẢN HỒI (TRONG NGÀY)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                    {doctors.length > 0 ? doctors.map((doc, docIdx) => {
                        const items = reportData[doc];
                        // Sắp xếp items: Thời gian tạo (cũ nhất lên trước hoặc mới nhất tùy ý, ở đây để theo trình tự công việc thì có thể để default hoặc sort theo timeText)
                        // Sort theo thời gian tạo giảm dần (mới nhất trên cùng)
                        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                        return items.map((item, itemIdx) => (
                            <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                                {itemIdx === 0 && (
                                    <td 
                                        className="px-4 py-3 font-bold text-slate-800 border-r border-blue-100 align-middle text-center bg-white border-b border-blue-100"
                                        rowSpan={items.length}
                                    >
                                        {doc}
                                    </td>
                                )}
                                <td className="px-2 py-3 text-center border-r border-blue-100 text-slate-500">{itemIdx + 1}</td>
                                <td className="px-4 py-3 font-semibold text-slate-800 border-r border-blue-100">{item.customerName}</td>
                                <td className="px-4 py-3 text-slate-700 border-r border-blue-100">{item.service}</td>
                                <td className="px-4 py-3 text-center border-r border-blue-100 whitespace-nowrap font-bold text-blue-600">{item.timeText}</td>
                                <td className="px-4 py-3 text-slate-600 italic">
                                    {item.feedback}
                                </td>
                            </tr>
                        ));
                    }) : (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">Không có phản hồi nào trong ngày này.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default DailyCskhReport;
