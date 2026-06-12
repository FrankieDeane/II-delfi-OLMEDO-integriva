# Integriva — by Delfina Olmedo — Prototipo navegable

> **Integriva** es la plataforma que acompaña a una persona a cuidar su alimentación, su actividad física y su bienestar emocional, con seguimiento profesional. Combina **nutrición + psicología + seguimiento** en un solo lugar.
>
> **Logo:** guardá tu logo como `assets/logo.png` y aparece solo en el encabezado y la portada (ver `assets/LEER-poner-logo-aca.txt`).

## Cómo abrirlo

**Opción simple:** doble clic en `index.html` (se abre en tu navegador). Funciona sin instalar nada.

> Es un **prototipo de demostración**: los pagos son simulados (Mercado Pago de mentira) y los datos se guardan solo en tu navegador (localStorage). Sirve para mostrar la idea, probarla y validarla con Sol, colegas o posibles inversores antes de invertir en una versión real.

## Identidad visual (paleta "dietitian")
- `#C2C395` avocado smoothie (oliva suave)
- `#DDBAAE` blush beet (rosa terracota)
- `#EFD7CF` peach protein (durazno)
- `#DCD4C1` oat latte (greige)
- `#F6EAD4` honey oatmilk (crema)
- `#FFFAF2` coconut cream (casi blanco)

Para los botones y textos se usan versiones más oscuras del oliva y el terracota, para que se lean bien (contraste).

## El recorrido completo (todo funciona)

1. **Inicio (landing):** presentación de la propuesta.
2. **Registro gratuito:** nombre, email, edad, sexo, peso actual, peso deseado, altura y nivel de actividad.
3. **Resultado de calorías + macronutrientes:** calcula tus calorías diarias (fórmula Mifflin-St Jeor), tu metabolismo basal, gasto total, déficit y IMC, **más la distribución recomendada de proteínas, carbohidratos y grasas** (gramos y %), con explicación de para qué sirve cada uno. El mensaje clave: no obsesionarse con las calorías, sino mirar el equilibrio.
4. **Membresía ($30.000/mes):** muestra qué incluye y un botón para contratar.
5. **Pago con Mercado Pago (simulado):** "aprobado" → entra a la plataforma.
6. **Onboarding de gustos:** gustos, preferencias, lo que NO se toca y lo que SÍ. El punto personalizado.
7. **Dashboard (app principal):**
   - **Marcadores de progreso:** racha de días de buena alimentación, déficit acumulado, calorías quemadas y cambio de peso.
   - **Calendario:** registrá peso, comidas y actividad de cada día. Navegás meses y ves el historial (los días con datos quedan marcados).
   - **Registro emocional:** elegí un emoji y/o escribí cómo te sentís.
   - **Seguimiento profesional:** próximo encuentro quincenal.
   - **Balance diario de macros:** barras de calorías, proteínas, carbohidratos y grasas (consumido vs. objetivo), con un mensaje que te dice qué te falta para equilibrar el día.
   - **Calculadora de calorías y macros** de comidas tradicionales (se pueden sumar a tu día, con sus proteínas/carbohidratos/grasas).
   - **"¿Qué cocino con lo que tengo?"**: ingresás alimentos y sugiere 3 recetas con calorías y macros.
   - **Extras y consultas** (botón secundario): cocinero inteligente, más recetas, y consultas por mensaje / llamada / psicológica para agendar en 48 hs.

Botón **"Reiniciar demo"** (arriba a la derecha) borra todo y empieza de cero.

## Archivos
- `index.html` — estructura
- `styles.css` — identidad visual de Integriva (paleta dietitian)
- `app.js` — toda la lógica y las pantallas
- `serve.ps1` — servidor local opcional (solo para previsualizar; no hace falta para usarlo)

## Login y verificación por email (REAL, con Appwrite)

El registro ya **no** usa un código de mentira: envía un **código de 6 dígitos al correo de verdad** usando [Appwrite](https://appwrite.io) (Email OTP). Para activarlo:

1. **Creá una cuenta y un proyecto gratis** en https://cloud.appwrite.io.
2. **Registrá el dominio** (sin esto Appwrite bloquea los pedidos): en el proyecto → *Overview → Add platform → Web* → agregá el *Hostname*:
   - `localhost` (para probar en tu compu con un servidor local, ej. `serve.ps1`).
   - `tu-sitio.netlify.app` (tu dominio real).
3. **Pegá tus datos** en `config.js`:
   - *Settings* → copiá el *API Endpoint* (ej. `https://fra.cloud.appwrite.io/v1`) y el *Project ID*.
   - Son **públicos** (van en el navegador): es seguro tenerlos en el sitio.
4. **No hace falta SQL ni base de datos:** Appwrite crea el usuario solo y el perfil se guarda en las *preferencias* privadas de cada cuenta. El código OTP de 6 dígitos viene activado de fábrica.

> **Emails:** el mailer por defecto de Appwrite sirve para **probar** (pocos envíos, puede caer en spam). Para producción conviene un **SMTP propio** (ej. **Resend** o **Brevo**, gratis hasta cierto volumen): *Settings → SMTP*. Así los emails llegan confiables y con tu dominio.

> **Probarlo localmente:** abrí el sitio con un servidor (no con doble clic / `file://`), porque Appwrite valida el dominio. Usá `serve.ps1` o cualquier server estático y entrá por `http://localhost`.

Si `config.js` no tiene datos, la app sigue abriéndose en **modo demo** (no envía emails y lo avisa en pantalla).

### Deploy en Netlify (variables de entorno)
Para no escribir las claves en el repositorio, en el deploy generamos `config.js` solo (`generate-config.sh` + `netlify.toml`). En Netlify: *Site settings → Environment variables*, agregá:

| Variable | Valor |
|---|---|
| `APPWRITE_ENDPOINT` | el *API Endpoint* de tu proyecto (ej. `https://fra.cloud.appwrite.io/v1`) |
| `APPWRITE_PROJECT_ID` | el *Project ID* de Appwrite |

Después *Deploys → Trigger deploy → Clear cache and deploy site*. Acordate de agregar tu dominio `.netlify.app` como *Web platform* en Appwrite (paso 2).

## Registro de formularios (Netlify Forms)

Cada vez que alguien completa el **registro** o el **onboarding de gustos**, la respuesta queda guardada en **Netlify → Forms** (sin programar backend). Funciona así:
- En `index.html` hay dos formularios ocultos (`registro` y `preferencias`) que Netlify detecta en el deploy.
- La app envía las respuestas por AJAX a esos mismos nombres (`App.submitNetlifyForm`).
- Lo ves en *Netlify → tu sitio → Forms*. Podés activar notificaciones por email ahí mismo.

> **Privacidad:** estos formularios guardan datos de salud (edad, peso, altura) en el panel de Netlify. Si querés minimizar, se puede registrar solo nombre+email, o capturar únicamente a los usuarios ya verificados. Avisame y lo ajusto. (Solo funciona en el sitio publicado, no con doble clic local.)

## Si más adelante querés la versión REAL (en producción)
Ya tenés **login real** (arriba). Falta sumar: **Mercado Pago de verdad** (cuenta + credenciales), recetas/cálculos validados por nutricionista, y hosting. Conviene hacerlo *después* de validar la idea con este prototipo.

> ⚠️ Los cálculos de calorías son orientativos y educativos. La versión real debería contar con la revisión de un/a nutricionista, y los contenidos psicológicos con tu criterio profesional.
