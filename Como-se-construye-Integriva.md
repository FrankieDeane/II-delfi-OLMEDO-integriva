# Cómo se construye Integriva — by Delfina Olmedo
### Guía + guion para explicarlo paso a paso (y prompt para construirlo)

---

## La idea en una frase

> **Integriva** es una página web que acompaña a una persona a cuidar su alimentación, su cuerpo y sus emociones en un mismo lugar, combinando **nutrición + psicología + seguimiento profesional**. No cuenta solo calorías: enseña a comer equilibrado y a estar bien con el proceso.

---

# PARTE A — Cómo se hace, etapa por etapa
*(explicado para alguien que no sabe de tecnología)*

Hacer una página como esta es parecido a **construir y abrir un restaurante saludable**: primero el plano, después la decoración, después la cocina que no se ve, y recién al final abrís las puertas al público. Estas son las etapas:

### 1) La idea y el plano 🗺️
Antes de tocar una computadora, se define **qué tiene que hacer la página y para quién**. Qué problema resuelve, qué pasos sigue la persona desde que entra hasta que la usa todos los días. Esto ya lo tenemos: es el recorrido completo de Integriva.
> 💡 *En tecnología a esto se le dice "definir el flujo del usuario". Es el paso más importante y el más barato de cambiar: equivocarse acá cuesta una charla; equivocarse después cuesta plata.*

### 2) El diseño y la identidad 🎨
Se decide **cómo se ve y se siente**: el nombre (Integriva), los colores (la paleta cálida de verdes oliva y rosados), las tipografías, el tono. El objetivo es que transmita calidez y confianza, no una app fría de gimnasio.
> 💡 *Esto es la "identidad visual" o branding. Es lo que hace que la marca se reconozca y genere confianza antes de leer una sola palabra.*

### 3) El prototipo 🧪 ← *(acá estamos hoy)*
Se arma una **maqueta navegable**: una versión que se ve y se clickea como la real, pero por dentro es de mentira (los pagos son simulados, los datos se guardan solo en la compu). Sirve para **mostrar la idea, probarla y validarla** con gente antes de invertir en lo caro.
> 💡 *Es como la maqueta de un edificio antes de construirlo: te deja caminar por los ambientes y decidir cambios sin haber puesto un ladrillo.*

### 4) El "frente" de la página (lo que ves y tocás) 🖥️
Se programa todo lo que el usuario ve: los botones, los formularios, el calendario, las barras de progreso. Que sea lindo, claro y que funcione bien en celular y computadora.
> 💡 *A esto se le dice **frontend**. Es la "vidriera y el salón" del restaurante.*

### 5) El "fondo" (lo que no se ve) 🗄️
Se construye la parte invisible: la **base de datos** donde se guardan de verdad los usuarios, sus pesos, comidas, emociones e historial; el sistema de **cuentas con contraseña**; y la lógica que hace los cálculos en un servidor seguro.
> 💡 *A esto se le dice **backend** y **base de datos**. Es "la cocina y el depósito": el cliente no los ve, pero sin ellos no hay restaurante. Acá viven los datos de las personas, así que también entra la **seguridad y la privacidad** (clave en algo de salud).*

### 6) Los conectores con servicios externos 🔌
Se enchufa la página con herramientas que ya existen:
- **Mercado Pago** para cobrar la membresía de verdad (requiere una cuenta y unas credenciales).
- **Email** para mandar confirmaciones y recordatorios.
- (Opcional) **Agenda/videollamada** para los encuentros con profesionales.
> 💡 *Se llaman "integraciones". No reinventás el cobro ni el mail: usás servicios probados y los conectás.*

### 7) Las pruebas ✅
Antes de abrir, se prueba todo: que el pago funcione, que los cálculos den bien, que no se rompa en distintos celulares. Se corrigen los errores que aparecen.

### 8) La publicación (abrir las puertas) 🚀
Se sube la página a internet con un **dominio** (ej. *complenitud.com*) y un **hosting** (el lugar donde "vive" la página, que se paga por mes). Ahí ya cualquiera puede entrar.

### 9) Mantenimiento y mejora ♻️
Una vez abierta, se la cuida: se arreglan cosas, se suman recetas, se mejora según lo que pidan los usuarios. **Una página no se "termina": se cultiva.**

---

### Resumen de etapas (para tenerlo a mano)
| Etapa | En criollo | Estado |
|---|---|---|
| 1. Idea y flujo | Qué hace y para quién | ✅ Listo |
| 2. Diseño e identidad | Cómo se ve | ✅ Listo (Integriva) |
| 3. Prototipo | Maqueta navegable | ✅ Listo |
| 4. Frontend | Lo que el usuario toca | ⏳ A futuro |
| 5. Backend + base de datos | La cocina invisible | ⏳ A futuro |
| 6. Integraciones | Mercado Pago, mails | ⏳ A futuro |
| 7. Pruebas | Que no se rompa | ⏳ A futuro |
| 8. Publicación | Dominio + hosting | ⏳ A futuro |
| 9. Mantenimiento | Cuidarla y mejorarla | ♻️ Continuo |

---

# PARTE B — Características principales

1. **Registro y cálculo personalizado.** La persona carga datos básicos (edad, sexo, peso, altura, objetivo) y el sistema calcula sus **calorías diarias** con una fórmula validada (Mifflin-St Jeor) y su **distribución de macronutrientes** (proteínas, carbohidratos y grasas).

2. **Enfoque en el equilibrio, no en la obsesión.** No se trata solo de un número de calorías: se enseña qué aporta cada macronutriente y se muestra el **balance del día** con un mensaje que dice qué falta para comer equilibrado.

3. **Membresía con pago.** Acceso al plan completo por una membresía mensual, con pago real vía Mercado Pago.

4. **Personalización real.** Antes de empezar, la persona cuenta sus gustos, lo que no come y lo que quiere mantener. La experiencia se adapta a ella.

5. **Calendario y registro diario.** Anota peso, comidas y actividad física cada día, con historial para ver el progreso en el tiempo.

6. **Registro emocional.** Con emojis o texto, la persona deja registro de cómo se siente. La psicología en el centro, no como adorno.

7. **Recetas con lo que tenés en casa.** Ingresa los alimentos disponibles y recibe recetas con sus calorías y macros calculados.

8. **Marcadores de progreso.** Racha de días de buena alimentación, déficit acumulado, calorías quemadas: refuerzo positivo para sostener el hábito.

9. **Seguimiento profesional.** Encuentros quincenales con psicólogos y la opción de consultas personalizadas (mensaje, llamada o consulta psicológica).

10. **Extras opcionales.** Cocinero inteligente, más recetas y seguimiento emocional ampliado, a la mano para contratar cuando se quiera.

**El diferencial:** la mayoría de las apps cuentan calorías. Integriva junta **comida + cuerpo + emociones + acompañamiento humano** en un solo lugar, con tono cálido y respaldo profesional.

---

# PARTE C — Prompt listo para un programador o una IA
*(copiá y pegá esto para pedir la versión real)*

> Quiero desarrollar **Integriva**, una plataforma web (responsive, mobile-first) que acompaña a personas a cuidar su alimentación, actividad física y bienestar emocional, combinando nutrición, psicología y seguimiento profesional. Tono de marca: cálido, humano, basado en evidencia, sin alarmismo. Idioma: español (Argentina).
>
> **Identidad visual:** paleta cálida tipo "dietitian" — avocado smoothie #C2C395, blush beet #DDBAAE, peach protein #EFD7CF, oat latte #DCD4C1, honey oatmilk #F6EAD4, coconut cream #FFFAF2 (usar versiones más oscuras del oliva y el terracota para botones/textos, por contraste/accesibilidad). Tipografías sugeridas: Fraunces (títulos) + Nunito Sans (texto).
>
> **Flujo del usuario:**
> 1. Landing con la propuesta de valor.
> 2. Registro gratuito: nombre, email, edad, sexo, peso actual, peso deseado, altura, nivel de actividad.
> 3. Cálculo de calorías (Mifflin-St Jeor) + distribución de macronutrientes (proteínas/carbohidratos/grasas), con explicación clara. Enfoque en el equilibrio, no solo en calorías.
> 4. Membresía mensual (≈$30.000 ARS) con detalle de lo que incluye.
> 5. Pago real con **Mercado Pago** (Checkout Pro o API); al aprobarse, da acceso.
> 6. Onboarding de preferencias alimentarias (gustos, restricciones/alergias, lo que sí quiere mantener).
> 7. Dashboard con: calendario de registro diario (peso, comidas, actividad) con historial; balance diario de calorías y macros con barras y mensaje guía; registro emocional (emojis + texto); módulo "recetas con lo que tengo en casa"; calculadora de calorías/macros; marcadores de progreso (racha, déficit acumulado); módulo de seguimiento profesional (encuentros quincenales + consultas a 48 hs); y extras de pago (cocinero inteligente, más recetas, seguimiento ampliado).
>
> **Requisitos técnicos:**
> - Frontend moderno (sugerencia: React/Next.js) responsive.
> - Backend con base de datos para usuarios, registros diarios e historial (sugerencia: Node + PostgreSQL, o una solución tipo Supabase/Firebase).
> - Autenticación con email y contraseña; manejo seguro y privado de datos de salud.
> - Integración de pagos con Mercado Pago y envío de emails transaccionales.
> - Panel para que los profesionales puedan ver/seguir a sus pacientes (a definir en una segunda etapa).
>
> **Importante:** los cálculos de calorías/macros y las recetas son orientativos y deben poder ser **revisados y ajustados por un/a nutricionista**; los contenidos psicológicos los valida un/a profesional. Priorizá claridad, calidez y privacidad.
>
> Empecemos por proponer la arquitectura y un plan de desarrollo por etapas, con estimación de esfuerzo.

---

> ⚠️ **Nota profesional:** este documento describe el proyecto y su construcción. Los cálculos y contenidos de salud (nutricionales y psicológicos) requieren validación profesional antes de salir a producción. Vos sos el responsable del criterio clínico; la tecnología es la herramienta.
