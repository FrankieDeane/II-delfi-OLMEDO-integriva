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

## Si más adelante querés la versión REAL (en producción)
Habría que sumar: backend con base de datos, login real, **Mercado Pago de verdad** (cuenta + credenciales), recetas/cálculos validados por nutricionista, y hosting. Conviene hacerlo *después* de validar la idea con este prototipo.

> ⚠️ Los cálculos de calorías son orientativos y educativos. La versión real debería contar con la revisión de un/a nutricionista, y los contenidos psicológicos con tu criterio profesional.
