import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://uykxmgvxcsbvhuoesrts.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4gRP5beZGjTNmR366muD-g_dgOacwYS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
