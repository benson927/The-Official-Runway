import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ 警告：Supabase URL 或 Anon Key 未在環境變數中定義！請確認 frontend/.env 檔案已正確配置。");
}

// 🕵️‍♂️ V6.1 自動防禦性清洗 URL 格式：如果結尾包含 /rest/v1/，自動截斷為標準 base URL
let cleanUrl = supabaseUrl ? supabaseUrl.trim() : '';
if (cleanUrl.endsWith('/rest/v1/')) {
  cleanUrl = cleanUrl.substring(0, cleanUrl.length - '/rest/v1/'.length);
} else if (cleanUrl.endsWith('/rest/v1')) {
  cleanUrl = cleanUrl.substring(0, cleanUrl.length - '/rest/v1'.length);
}

export const supabase = createClient(cleanUrl, supabaseAnonKey);
