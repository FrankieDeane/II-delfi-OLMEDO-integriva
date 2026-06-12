/* ============================================================
   INTEGRIVA — Configuración de Supabase (auth real por email)
   ------------------------------------------------------------
   1) Entrá a https://supabase.com  → creá un proyecto gratis.
   2) En el panel:  Project Settings → API
        • "Project URL"        → pegalo en SUPABASE_URL
        • "anon public" key    → pegalo en SUPABASE_ANON_KEY
      (La clave "anon" es PÚBLICA y está pensada para el navegador.
       NUNCA pegues acá la clave "service_role".)
   3) Guardá este archivo. Listo: el envío de códigos por email queda activo.

   Si dejás los valores como están (PEGAR_...), la app sigue funcionando
   en "modo demo" pero NO envía emails reales.
   ============================================================ */
window.INTEGRIVA_CONFIG = {
  SUPABASE_URL: 'PEGAR_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'PEGAR_SUPABASE_ANON_KEY',
};
