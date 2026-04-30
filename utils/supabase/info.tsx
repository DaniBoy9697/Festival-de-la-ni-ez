export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';

export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const projectId = (() => {
  const match = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co$/);
  return match?.[1] ?? '';
})();

export const supabaseFunctionsBaseUrl = `${supabaseUrl}/functions/v1/server`;

if (!supabaseUrl || !publicAnonKey || !projectId) {
  console.warn(
    'Faltan variables de entorno de Supabase. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
  );
}