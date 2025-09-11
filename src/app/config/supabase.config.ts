import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase extraída de tu proyecto
const SUPABASE_URL = 'https://vknxbpcnpdhziiqknrbs.supabase.co';
// IMPORTANTE: Necesitas obtener tu anon key desde tu dashboard de Supabase
// Ve a: https://supabase.com/dashboard → Tu proyecto → Settings → API → anon public key
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI'; // <-- Reemplaza esto con tu anon key real

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuración del bucket para las firmas
export const SIGNATURES_BUCKET = 'signatures';
