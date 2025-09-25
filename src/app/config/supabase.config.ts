import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase extraída de tu proyecto
const SUPABASE_URL = 'https://vknxbpcnpdhziiqknrbs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbnhicGNucGRoemlpcWtucmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MjkyMTAsImV4cCI6MjA3MzAwNTIxMH0.oupKVcJplxy-H88HjeS4-QAaD8ChjyfcaqZDnC-xuIs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storage: undefined // Disable session storage to avoid lock conflicts
  },
  global: {
    headers: {
      'X-Client-Info': 'coraza-system-web'
    }
  }
});

// Configuración del bucket para las firmas
export const SIGNATURES_BUCKET = 'signatures';
