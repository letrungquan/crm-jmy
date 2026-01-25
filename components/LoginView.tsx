
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface LoginViewProps {
  onBypass?: () => void; // Kept for interface compatibility but unused in UI
}

const LoginView: React.FC<LoginViewProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logAccess = async (userId: string) => {
      try {
          // 1. Get Public IP
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          const ip = data.ip;
          const userAgent = navigator.userAgent;

          // 2. Check latest log for this user to avoid duplicate entries for same session context
          const { data: latestLogs } = await supabase
              .from('access_logs')
              .select('id, ip, user_agent')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1);

          const latestLog = latestLogs?.[0];

          if (latestLog && latestLog.ip === ip && latestLog.user_agent === userAgent) {
              // Update existing log timestamp (created_at acts as "last seen" in this context)
              await supabase
                  .from('access_logs')
                  .update({ created_at: new Date().toISOString() })
                  .eq('id', latestLog.id);
          } else {
              // 3. Insert new log entry
              await supabase.from('access_logs').insert([
                  {
                      user_id: userId,
                      ip: ip,
                      user_agent: userAgent,
                  }
              ]);
          }
      } catch (err) {
          console.error("Failed to log access:", err);
          // Don't block login if logging fails
      }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        // --- XỬ LÝ ĐĂNG NHẬP ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
            await logAccess(data.user.id);
        }

    } catch (err: any) {
      setError(err.message || 'Thao tác thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">JMY Beauty CRM</h1>
            <p className="text-slate-500">Đăng nhập để tiếp tục</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="sale@jmybeauty.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
