
import { createClient } from '@supabase/supabase-js';

// --- HƯỚNG DẪN LẤY THÔNG TIN ---
// 1. Vào Supabase Dashboard -> Project Settings -> API.
// 2. Copy "Project URL" dán vào SUPABASE_URL.
// 3. Copy "anon public key" dán vào SUPABASE_KEY.

// Dán URL của bạn vào đây (Ví dụ: https://xyz.supabase.co)
const SUPABASE_URL = 'https://lizxohpdhizjmxbcncln.supabase.co';

// Dán Anon Key của bạn vào đây (Chuỗi ký tự rất dài)
const SUPABASE_KEY = 'sb_publishable_whXBBN3gh0LCzX80k210kQ_jJDpqil-'; 

// Kiểm tra cấu hình: Chỉ cần có URL và Key không quá ngắn là cho phép thử kết nối
export const isSupabaseConfigured = 
    SUPABASE_URL.includes('supabase.co') && 
    SUPABASE_KEY.length > 20 && 
    !SUPABASE_KEY.includes('YOUR_ANON_KEY');

export const supabase = createClient(SUPABASE_URL, isSupabaseConfigured ? SUPABASE_KEY : 'invalid_key_placeholder', {
  auth: {
    persistSession: true, // Duy trì phiên đăng nhập trong LocalStorage
    autoRefreshToken: true, // Tự động làm mới token khi hết hạn
    detectSessionInUrl: true, // Phát hiện session từ URL (cho OAuth/Magic Link)
    storage: window.localStorage // Chỉ định rõ nơi lưu trữ là localStorage của trình duyệt
  }
});
