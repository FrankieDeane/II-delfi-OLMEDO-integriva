#!/usr/bin/env bash
# Genera config.js durante el deploy de Netlify usando las variables de entorno
# APPWRITE_ENDPOINT y APPWRITE_PROJECT_ID (Site settings → Environment variables).
# Si no están definidas, deja los placeholders (la app queda en modo demo).
set -euo pipefail

cat > config.js <<EOF
/* Generado automáticamente por Netlify en el deploy. No editar a mano. */
window.INTEGRIVA_CONFIG = {
  APPWRITE_ENDPOINT: '${APPWRITE_ENDPOINT:-https://cloud.appwrite.io/v1}',
  APPWRITE_PROJECT_ID: '${APPWRITE_PROJECT_ID:-PEGAR_APPWRITE_PROJECT_ID}',
};
EOF

if [ "${APPWRITE_PROJECT_ID:-}" != "" ]; then
  echo "config.js generado con credenciales de Appwrite."
else
  echo "AVISO: APPWRITE_PROJECT_ID no está definida. config.js queda en modo demo."
fi
