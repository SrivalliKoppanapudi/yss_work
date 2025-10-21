import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lylambzzecswhsofafir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bGFtYnp6ZWNzd2hzb2ZhZmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTg0OTMsImV4cCI6MjA2ODY5NDQ5M30.AyIx3P95tw0fnPjZCByBfBzAHibqw2e2gJEjv7XIh9w';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
