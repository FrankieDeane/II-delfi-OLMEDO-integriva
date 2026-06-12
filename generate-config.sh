#!/usr/bin/env bash
# Genera config.js durante el deploy de Netlify usando las variables de entorno
# SUPABASE_URL y SUPABASE_ANON_KEY (Site settings → Environment variables).
# Si no están definidas, deja los placeholders (la app queda en modo demo).
set -euo pipefail

cat > config.js <<EOF
/* Generado automáticamente por Netlify en el deploy. No editar a mano. */
window.INTEGRIVA_CONFIG = {
  SUPABASE_URL: '${SUPABASE_URL:-PEGAR_SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY:-PEGAR_SUPABASE_ANON_KEY}',
};
EOF

if [ "${SUPABASE_URL:-}" != "" ]; then
  echo "config.js generado con credenciales de Supabase."
else
  echo "AVISO: SUPABASE_URL no está definida. config.js queda en modo demo."
fi
