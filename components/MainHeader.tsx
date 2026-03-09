
import React from 'react';
import { Sale } from '../types';
import { supabase } from '../lib/supabaseClient';
import { usePermissions } from '../contexts/PermissionContext';

interface MainHeaderProps {
  onAddLead: () => void;
  onToggleSidebar: () => void;
  sales: Sale[];
  userProfile: Sale | null;
}

const MainHeader: React.FC<MainHeaderProps> = ({ onAddLead, onToggleSidebar, userProfile }) => {
  const { canCreate } = usePermissions();
  const handleLogout = async () => {
    // Chỉ cần gọi signOut, App.tsx sẽ lắng nghe sự kiện onAuthStateChange 
    // và tự động chuyển về màn hình Login mà không cần reload trang.
    await supabase.auth.signOut();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <div className="flex items-center">
        <button onClick={onToggleSidebar} className="mr-3 text-slate-500 md:hidden p-2 hover:bg-slate-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider hidden sm:block">JMY Beauty CRM</span>
      </div>

      <div className="flex items-center space-x-4">
        {userProfile && (
            <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Xin chào</span>
                <span className="text-sm font-bold text-slate-800">
                  {userProfile.name}
                  {userProfile.role === 'admin' && <span className="ml-1 text-xs text-blue-500 bg-blue-50 px-1 rounded">(Admin)</span>}
                </span>
            </div>
        )}

        {canCreate('leads') && (
            <button onClick={onAddLead} className="h-9 w-9 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95" title="Thêm cơ hội mới">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </button>
        )}
        
        <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold border-2 shadow-sm ${userProfile?.role === 'admin' ? 'bg-indigo-600 text-white border-indigo-200' : 'bg-slate-200 text-slate-600 border-white'}`} title={userProfile?.role?.toUpperCase()}>
            {userProfile?.name?.charAt(0) || 'U'}
        </div>

        <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 p-2" title="Đăng xuất">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
        </button>
      </div>
    </header>
  );
};

export default MainHeader;
