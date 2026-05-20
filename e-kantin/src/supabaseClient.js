import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dnayzjmoeijdeflboazn.supabase.co';
const supabaseKey = 'sb_publishable_H1SRV8ykvNX7qUGMR0iLWw_TViSSvP5';

export const supabase = createClient(supabaseUrl, supabaseKey);
