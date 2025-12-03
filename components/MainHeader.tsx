import React from 'react';
import { Sale } from '../types';

const MainHeader: React.FC<{ 
  onAddLead: () => void; 
  onToggleSidebar: () => void;
  sales: Sale[];
  currentUser: Sale['id'];
  onSetCurrentUser: (id: Sale['id']) => void;
}> = ({ onAddLead, onToggleSidebar, sales, currentUser, onSetCurrentUser }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex-shrink-0 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center">
        <button onClick={onToggleSidebar} className="mr-3 text-slate-500 md:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden sm:flex items-center text-sm text-slate-500">
            <span>JMY Beauty</span>
            <span className="mx-2">/</span>
            <span>Quân Lễ</span>
            <span className="mx-2">/</span>
            <span className="font-semibold text-slate-700">JMY Beauty CRM</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="flex items-center">
            <span className="text-sm font-medium text-slate-500 mr-2 hidden sm:block">Đang xem là:</span>
            <select
              id="current-user-select"
              value={currentUser}
              onChange={(e) => onSetCurrentUser(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-slate-900 font-semibold"
            >
              {sales.map(sale => (
                <option key={sale.id} value={sale.id}>
                  {sale.name}
                </option>
              ))}
            </select>
        </div>
        <button className="hidden md:flex items-center justify-center h-9 px-4 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Share
        </button>
        <button className="hidden md:flex items-center justify-center h-9 px-4 text-sm font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
            Automations
        </button>
        <button className="h-9 w-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        </button>
         <button className="h-9 w-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </button>
        <button onClick={onAddLead} className="h-9 w-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        </button>
        <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
            B
        </div>
      </div>
    </header>
  );
};

export default MainHeader;