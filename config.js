/* ============================================================
   INTEGRIVA — Configuración de Appwrite (auth real por email)
   ------------------------------------------------------------
   1) Entrá a https://cloud.appwrite.io  → creá una cuenta y un proyecto.
   2) En el proyecto:  Settings (Configuración) →
        • "API Endpoint"  → pegalo en APPWRITE_ENDPOINT
                            (suele ser https://<region>.cloud.appwrite.io/v1)
        • "Project ID"    → pegalo en APPWRITE_PROJECT_ID
   3) IMPORTANTE — registrá el dominio (si no, Appwrite bloquea por seguridad):
        Overview → Add platform → Web →
          • Hostname: localhost            (para probar en tu compu con un server)
          • Hostname: tu-sitio.netlify.app (tu dominio real)
   4) Guardá este archivo. Listo: el envío de códigos por email queda activo.

   Si dejás los valores como están (PEGAR_...), la app sigue funcionando
   en "modo demo" pero NO envía emails reales.
   El Project ID y el endpoint son PÚBLICOS (van en el navegador): es seguro.
   ============================================================ */
window.INTEGRIVA_CONFIG = {
  APPWRITE_ENDPOINT: 'https://cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: 'PEGAR_APPWRITE_PROJECT_ID',
};
