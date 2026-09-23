import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdminEnv } from "./env";

/**
 * Cliente de Supabase con `service_role`: salta RLS. Solo en el servidor, para escribir conexiones,
 * tokens (Vault), el catálogo importado y lo que llega por webhooks (docs/esquema-supabase.md › RLS).
 * Vive aquí y no en lib/supabase/ para no tocar la capa de auth (CLAUDE.md › No tocar sin pedirlo).
 * Un cliente por llamada: nada de singletons en serverless.
 */
export function adminClient(): SupabaseClient {
  const { url, serviceRoleKey } = supabaseAdminEnv();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
