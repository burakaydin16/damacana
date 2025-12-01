import { createClient } from '@supabase/supabase-js';

// LÜTFEN BURAYI KENDİ SUPABASE PROJE BİLGİLERİNİZLE DOLDURUN
const SUPABASE_URL = 'https://wuuagejtougukcixaoam.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dWFnZWp0b3VndWtjaXhhb2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjYxNjUsImV4cCI6MjA3OTY0MjE2NX0.k8T0F0mxJst6m2NHElQQA_uBNzPPQ0EzC3t3lgwis6s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);