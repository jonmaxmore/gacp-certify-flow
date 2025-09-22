import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mpxebbqxqyzalctgsyxm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGViYnF4cXl6YWxjdGdzeXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjAxNjksImV4cCI6MjA3NDA5NjE2OX0.dSQ9q5KN3p2Ix2lZBdNs8CE3P3c1eiv-7BWzSBfB1j8";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});