import { createClient } from '@supabase/supabase-js';

export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase sunucu ortam değişkenleri eksik.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function requireAdmin(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return { error: 'Yönetici oturumu gerekli.', status: 401 };
  const db = adminDb();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return { error: 'Oturum geçersiz.', status: 401 };
  const { data: admin } = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!admin) return { error: 'Bu hesap yönetici yetkisine sahip değil.', status: 403 };
  return { db, user };
}

export function currentHour() {
  const d = new Date();
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}
