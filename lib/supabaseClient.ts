import { createClient } from '@supabase/supabase-js';

// --- HƯỚNG DẪN LẤY THÔNG TIN ---
// 1. Vào Supabase Dashboard -> Project Settings -> API.
// 2. Copy "Project URL" dán vào SUPABASE_URL.
// 3. Copy "anon public key" dán vào SUPABASE_KEY.

// Dán URL của bạn vào file .env (Ví dụ: https://xyz.supabase.co)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

// Dán Anon Key của bạn vào file .env
// Lưu ý: Key phải bắt đầu bằng 'ey...' (JWT Token).
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || ''; 

// Kiểm tra cấu hình sơ bộ để tránh crash app ngay lập tức
const isValidKey = SUPABASE_KEY.length > 20;

export const isSupabaseConfigured = 
    SUPABASE_URL.includes('supabase.co') && isValidKey;

// Nếu key sai, ta truyền một dummy key để createClient không throw error ngay lập tức
// Lỗi sẽ được bắt ở tầng fetch data trong App.tsx
export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co', 
    isValidKey ? SUPABASE_KEY : 'ey_invalid_key_placeholder', 
    {
      auth: {
        persistSession: true, // Duy trì phiên đăng nhập trong LocalStorage
        autoRefreshToken: true, // Tự động làm mới token khi hết hạn
        detectSessionInUrl: true, // Phát hiện session từ URL (cho OAuth/Magic Link)
        storage: window.localStorage // Chỉ định rõ nơi lưu trữ là localStorage của trình duyệt
      }
    }
);