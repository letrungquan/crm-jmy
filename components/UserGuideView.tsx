
import React, { useState } from 'react';

const sections = [
  {
    id: 'overview',
    title: '1. Tổng quan hệ thống',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          Hệ thống <strong>JMY Beauty CRM</strong> được thiết kế để giúp bạn quản lý toàn bộ vòng đời của khách hàng, từ lúc mới tiếp cận cho đến khi sử dụng dịch vụ và chăm sóc sau bán hàng.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm">
            <h4 className="font-bold text-blue-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
              Thanh Menu (Bên trái)
            </h4>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-2">
              <li>Chứa các phân hệ chính của phần mềm.</li>
              <li>Có thể thu gọn/mở rộng để tăng không gian làm việc.</li>
              <li>Hiển thị các menu tùy thuộc vào quyền hạn của bạn.</li>
            </ul>
          </div>
          <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 shadow-sm">
            <h4 className="font-bold text-purple-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Thanh Công Cụ (Phía trên)
            </h4>
            <ul className="list-disc list-inside text-sm text-purple-700 space-y-2">
              <li>Nút <strong>+ Thêm cơ hội</strong>: Thêm nhanh khách hàng mới từ bất kỳ đâu.</li>
              <li>Thông tin tài khoản cá nhân.</li>
              <li>Nút Đăng xuất an toàn.</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'leads',
    title: '2. Cơ Hội Bán Hàng (Leads)',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    content: (
      <div className="space-y-5">
        <p className="text-slate-600 leading-relaxed">
          Nơi tiếp nhận và xử lý các khách hàng tiềm năng mới liên hệ hoặc được phân công. Giao diện dạng bảng Kanban giúp bạn dễ dàng theo dõi tiến độ của từng khách hàng.
        </p>
        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 font-bold text-slate-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Quy trình xử lý Cơ hội
          </div>
          <div className="p-5 space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">1</div>
              <div className="ml-4">
                <h5 className="font-bold text-slate-800 text-lg">Tiếp nhận & Tư vấn</h5>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">Khách hàng mới sẽ nằm ở cột <strong>Mới</strong>. Sau khi liên hệ tư vấn, hãy kéo thẻ khách hàng sang cột <strong>Đang tư vấn</strong> để đánh dấu đã tiếp nhận.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">2</div>
              <div className="ml-4">
                <h5 className="font-bold text-slate-800 text-lg">Đặt lịch hẹn</h5>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">Khi khách đồng ý đến spa, kéo thẻ sang cột <strong>Đặt lịch</strong>. Hệ thống sẽ yêu cầu bạn nhập thời gian hẹn dự kiến để dễ dàng theo dõi.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">3</div>
              <div className="ml-4">
                <h5 className="font-bold text-slate-800 text-lg">Chốt đơn (Đã đến / Xong)</h5>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">Khi khách đến và sử dụng dịch vụ, kéo thẻ sang cột <strong>Đã đến/Xong</strong>. Hệ thống sẽ yêu cầu nhập doanh thu thực tế. Sau bước này, khách hàng sẽ tự động được chuyển sang danh sách <strong>CSKH Sau Dịch Vụ</strong>.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">4</div>
              <div className="ml-4">
                <h5 className="font-bold text-slate-800 text-lg">Thất bại</h5>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">Nếu khách hàng từ chối hoặc không thể liên lạc, kéo thẻ vào cột <strong>Thất bại</strong> và ghi chú lại lý do để quản lý có thể đánh giá chất lượng nguồn khách.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'cskh',
    title: '3. CSKH Sau Dịch Vụ',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          Phân hệ này giúp bạn quản lý việc gọi điện hỏi thăm, chăm sóc khách hàng sau khi họ đã trải nghiệm dịch vụ tại spa, đảm bảo sự hài lòng tối đa.
        </p>
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <ul className="space-y-4 text-slate-700">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span><strong>Tự động tạo:</strong> Ngay khi một "Cơ hội" được chốt thành công (kéo vào cột Đã đến/Xong), một hồ sơ CSKH sẽ tự động xuất hiện tại đây.</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span><strong>Cập nhật trạng thái:</strong> Theo dõi tiến trình chăm sóc qua các trạng thái như: <em>Mới, Đã gọi lần 1, Cần gọi lại, Đã xong</em>.</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span><strong>Tạo lịch tái khám:</strong> Trong lúc gọi điện CSKH, nếu khách hàng đồng ý quay lại kiểm tra hoặc làm liệu trình tiếp theo, bạn có thể nhấn nút <strong>"Tạo lịch tái khám"</strong> ngay trong chi tiết CSKH.</span>
            </li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'appointments',
    title: '4. Lịch Tái Khám',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    content: (
      <div className="space-y-5">
        <p className="text-slate-600 leading-relaxed">
          Nơi quản lý tất cả các lịch hẹn quay lại của khách hàng cũ. Giúp lễ tân và bác sĩ chủ động sắp xếp thời gian.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h5 className="font-bold text-slate-800">Cần gọi nhắc</h5>
            <p className="text-sm text-slate-500 mt-2">Lịch hẹn sắp tới cần gọi điện nhắc nhở khách để tránh quên lịch.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <h5 className="font-bold text-slate-800">Đã gọi xác nhận</h5>
            <p className="text-sm text-slate-500 mt-2">Khách đã nghe máy và xác nhận sẽ đến theo đúng lịch hẹn.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h5 className="font-bold text-slate-800">Hoàn thành</h5>
            <p className="text-sm text-slate-500 mt-2">Khách đã đến spa và thực hiện xong dịch vụ tái khám.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'customers',
    title: '5. Quản Lý Khách Hàng',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          Hồ sơ lưu trữ toàn bộ thông tin và lịch sử giao dịch của khách hàng. Đây là tài sản quý giá nhất của spa.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mr-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" /></svg>
            </div>
            <div>
              <h5 className="font-bold text-slate-800">Hồ sơ 360 độ</h5>
              <p className="text-sm text-slate-500 mt-1">Xem chi tiết thông tin cá nhân, tổng doanh thu, lịch sử các lần tư vấn và lịch sử mua hàng.</p>
            </div>
          </div>
          <div className="flex items-start p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
            <div className="bg-purple-50 p-2 rounded-lg text-purple-600 mr-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div>
              <h5 className="font-bold text-slate-800">Tìm kiếm thông minh</h5>
              <p className="text-sm text-slate-500 mt-1">Dễ dàng tìm kiếm khách hàng nhanh chóng theo Tên hoặc Số điện thoại.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'tips',
    title: '6. Mẹo Sử Dụng Hiệu Quả',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    content: (
      <div className="space-y-4">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl shadow-sm">
          <h4 className="font-bold text-amber-800 flex items-center text-lg mb-3">
            <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Lưu ý quan trọng dành cho nhân sự
          </h4>
          <ul className="space-y-3 text-amber-900 text-sm">
            <li className="flex items-start">
              <span className="mr-2 mt-0.5">•</span>
              <span><strong>Số điện thoại là duy nhất:</strong> Hệ thống dùng số điện thoại để nhận diện khách hàng. Hãy nhập chính xác số điện thoại để lịch sử khách hàng được đồng bộ xuyên suốt.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-0.5">•</span>
              <span><strong>Ghi chú đầy đủ:</strong> Luôn ghi chú lại nội dung sau mỗi lần gọi điện hoặc nhắn tin với khách hàng để đồng nghiệp hoặc quản lý có thể nắm bắt tình hình.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-0.5">•</span>
              <span><strong>Cập nhật trạng thái liên tục:</strong> Đừng để thẻ khách hàng nằm mãi ở một cột. Hãy chuyển trạng thái ngay khi có tiến triển mới để báo cáo được chính xác.</span>
            </li>
          </ul>
        </div>
      </div>
    )
  }
];

const UserGuideView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Hướng dẫn sử dụng CRM
        </h1>
        <p className="text-slate-500 mt-2 text-sm">Tài liệu hướng dẫn chi tiết các tính năng và quy trình làm việc trên hệ thống JMY Beauty CRM.</p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-72 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0">
          <nav className="p-4 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors text-left ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={`mr-3 ${activeSection === section.id ? 'text-blue-600' : 'text-slate-400'}`}>
                  {section.icon}
                </span>
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`${activeSection === section.id ? 'block animate-fade-in' : 'hidden'}`}
              >
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 bg-white">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center">
                      <span className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-4">
                        {section.icon}
                      </span>
                      {section.title}
                    </h2>
                  </div>
                  <div className="p-4 sm:p-8">
                    {section.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuideView;
