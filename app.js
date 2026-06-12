/* ============================================================
   INTEGRIVA (by Delfina Olmedo) — Lógica de la aplicación (prototipo navegable)
   Vanilla JS, sin dependencias. Persistencia en localStorage.
   ============================================================ */

const App = {
  user: null,        // datos del registro + calorías calculadas
  membership: null,  // { active, fecha }
  prefs: null,       // gustos de comida
  logs: {},          // { "YYYY-MM-DD": { peso, comidas:[], actividad:[], emocion:{} } }
  extras: null,      // extras contratados
  selDate: null,     // día seleccionado en el calendario
  calMonth: null,    // mes visible en el calendario (Date)

  /* ---------- Persistencia ---------- */
  save() {
    localStorage.setItem('nm_user', JSON.stringify(this.user));
    localStorage.setItem('nm_membership', JSON.stringify(this.membership));
    localStorage.setItem('nm_prefs', JSON.stringify(this.prefs));
    localStorage.setItem('nm_logs', JSON.stringify(this.logs));
    localStorage.setItem('nm_extras', JSON.stringify(this.extras));
    localStorage.setItem('nm_cookies', JSON.stringify(this.cookies));
  },
  load() {
    try {
      this.user = JSON.parse(localStorage.getItem('nm_user')) || null;
      this.membership = JSON.parse(localStorage.getItem('nm_membership')) || { active: false };
      this.prefs = JSON.parse(localStorage.getItem('nm_prefs')) || null;
      this.logs = JSON.parse(localStorage.getItem('nm_logs')) || {};
      this.extras = JSON.parse(localStorage.getItem('nm_extras')) || { recetasPlus: false, cocinero: false };
      this.cookies = JSON.parse(localStorage.getItem('nm_cookies')) || null; // null = no decidió
    } catch (e) { console.warn(e); }
  },
  reset() {
    if (!confirm('¿Borrar todos los datos de prueba y empezar de cero?')) return;
    ['nm_user','nm_membership','nm_prefs','nm_logs','nm_extras','nm_cookies'].forEach(k => localStorage.removeItem(k));
    if (this.auth && this.auth.enabled) { this.auth.signOut().finally(() => location.reload()); return; }
    location.reload();
  },

  /* ---------- Utilidades ---------- */
  money(n) { return '$' + n.toLocaleString('es-AR'); },
  todayKey() { return this.dateKey(new Date()); },
  dateKey(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); },
  dayLog(key) {
    if (!this.logs[key]) this.logs[key] = { peso: null, comidas: [], actividad: [], emocion: null };
    return this.logs[key];
  },
  toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 2200);
  },

  /* ---------- Cálculo de calorías (Mifflin-St Jeor) ---------- */
  calcCalories(u) {
    const s = u.sexo === 'M' ? 5 : -161;
    const bmr = Math.round(10*u.peso + 6.25*u.altura - 5*u.edad + s);
    const factores = { sed: 1.2, lig: 1.375, mod: 1.55, alt: 1.725 };
    const tdee = Math.round(bmr * (factores[u.actividad] || 1.375));
    let objetivo, meta;
    if (u.pesoDeseado < u.peso - 0.5) { objetivo = Math.max(bmr, tdee - 500); meta = 'bajar'; }
    else if (u.pesoDeseado > u.peso + 0.5) { objetivo = tdee + 350; meta = 'subir'; }
    else { objetivo = tdee; meta = 'mantener'; }
    const imc = +(u.peso / Math.pow(u.altura/100, 2)).toFixed(1);
    return { bmr, tdee, objetivo, meta, deficit: tdee - objetivo, imc, macros: App.macrosFor(objetivo) };
  },

  /* ---------- Distribución de macronutrientes ----------
     Distribución equilibrada: 30% proteínas, 40% carbohidratos, 30% grasas.
     Proteínas y carbohidratos = 4 kcal/g · Grasas = 9 kcal/g */
  macrosFor(objetivo) {
    return {
      prot: Math.round(objetivo * 0.30 / 4),
      carb: Math.round(objetivo * 0.40 / 4),
      gras: Math.round(objetivo * 0.30 / 9),
      pPct: 30, cPct: 40, fPct: 30,
    };
  },
  // Suma calorías y macros de una lista de comidas
  sumMacros(arr) {
    return arr.reduce((a, x) => ({
      cal: a.cal + (+x.cal || 0),
      p: a.p + (+x.p || 0),
      c: a.c + (+x.c || 0),
      f: a.f + (+x.f || 0),
    }), { cal: 0, p: 0, c: 0, f: 0 });
  },

  /* ============================================================
     NAVEGACIÓN
     ============================================================ */
  go(screen) {
    this.screen = screen;
    const app = document.getElementById('app');
    const topbar = document.getElementById('topbar');
    window.scrollTo(0,0);

    // La barra superior solo aparece dentro de la app con membresía
    const inApp = ['dashboard'].includes(screen);
    topbar.classList.toggle('hidden', !inApp);
    if (inApp) this.renderNav();

    const r = this.screens[screen];
    app.innerHTML = r ? r.call(this) : '<div class="wrap">Pantalla no encontrada</div>';
    app.firstElementChild && app.firstElementChild.classList.add('fade-in');
    if (this.afterRender[screen]) this.afterRender[screen].call(this);

    // Banner de cookies: al entrar a la página principal (post pago), si todavía no decidió
    if (['onboarding','dashboard'].includes(screen) && !this.cookies) this.showCookieBanner();
    else this.hideCookieBanner();
  },

  renderNav() {
    const items = [['dashboard','Inicio']];
    document.getElementById('topnav').innerHTML =
      items.map(([k,l]) => `<button class="${this.screen===k?'active':''}" onclick="App.go('${k}')">${l}</button>`).join('');
  },

  /* ============================================================
     INICIO
     ============================================================ */
  init() {
    this.load();
    this.auth.init();
    this.selDate = this.todayKey();
    this.calMonth = new Date();
    // Reanudar donde corresponde
    if (this.membership && this.membership.active) {
      this.go(this.prefs ? 'dashboard' : 'onboarding');
    } else {
      this.go('landing');
    }
  },
};

/* ============================================================
   AUTENTICACIÓN REAL (Appwrite · Email OTP)
   ------------------------------------------------------------
   - createEmailToken → envía un código de 6 dígitos al correo y
     devuelve el userId que usamos para verificar.
   - createSession    → valida ese código y abre la sesión.
   - updatePrefs      → guarda el perfil (privado de cada usuario).
   Si no hay credenciales en config.js, queda en "modo demo"
   (no envía emails) y la pantalla de verificación lo avisa.
   ============================================================ */
App.auth = {
  account: null,
  enabled: false,
  pendingUserId: null,   // userId que devuelve createEmailToken
  RESEND_COOLDOWN: 60,   // segundos entre reenvíos
  MAX_RESENDS: 5,        // tope de reenvíos por sesión de registro
  lastSentAt: 0,
  resendCount: 0,

  init() {
    const cfg = window.INTEGRIVA_CONFIG || {};
    const ready = window.Appwrite &&
      cfg.APPWRITE_ENDPOINT && cfg.APPWRITE_PROJECT_ID &&
      !String(cfg.APPWRITE_PROJECT_ID).startsWith('PEGAR_');
    if (ready) {
      const client = new Appwrite.Client()
        .setEndpoint(cfg.APPWRITE_ENDPOINT)
        .setProject(cfg.APPWRITE_PROJECT_ID);
      this.account = new Appwrite.Account(client);
      this.enabled = true;
    } else {
      console.warn('[Integriva] Appwrite no configurado (config.js). El envío real de emails está desactivado.');
    }
  },

  // Envía (o reenvía) el código de 6 dígitos al email.
  async sendCode(email, { isResend = false } = {}) {
    if (!this.enabled) throw { code: 'no_config' };

    // Tope de reenvíos del lado del cliente (UX clara, no de seguridad).
    if (isResend) {
      const waited = (Date.now() - this.lastSentAt) / 1000;
      if (this.resendCount >= this.MAX_RESENDS) throw { code: 'too_many' };
      if (waited < this.RESEND_COOLDOWN) {
        throw { code: 'cooldown', seconds: Math.ceil(this.RESEND_COOLDOWN - waited) };
      }
    }

    try {
      // Por si ya había una sesión vieja abierta, la cerramos antes de pedir otra.
      if (!isResend) { try { await this.account.deleteSession({ sessionId: 'current' }); } catch (e) {} }
      const token = await this.account.createEmailToken({
        userId: Appwrite.ID.unique(),
        email,
      });
      this.pendingUserId = token.userId;
      if (App.user) { App.user.userId = token.userId; App.save(); }
    } catch (error) {
      throw this.normalize(error);
    }

    this.lastSentAt = Date.now();
    if (isResend) this.resendCount++;
  },

  // Valida el código y abre sesión. Devuelve la sesión de Appwrite.
  async verifyCode(code) {
    if (!this.enabled) throw { code: 'no_config' };
    const userId = this.pendingUserId || (App.user && App.user.userId);
    if (!userId) throw { code: 'invalid' };
    try {
      return await this.account.createSession({ userId, secret: code });
    } catch (error) {
      throw this.normalize(error);
    }
  },

  // Guarda el perfil en las preferencias del usuario (privadas, sin schema).
  async saveProfile(u) {
    if (!this.enabled || !u) return;
    try {
      await this.account.updatePrefs({
        prefs: {
          nombre: u.nombre, edad: u.edad, sexo: u.sexo, peso: u.peso,
          pesoDeseado: u.pesoDeseado, altura: u.altura, actividad: u.actividad,
          acepta: !!u.acepta, calObjetivo: u.cal ? u.cal.objetivo : null,
        },
      });
    } catch (e) {
      console.warn('[Integriva] No se pudo guardar el perfil:', e);
    }
  },

  async signOut() {
    if (this.enabled) { try { await this.account.deleteSession({ sessionId: 'current' }); } catch (e) {} }
  },

  // Traduce el error de Appwrite a un código simple + mensaje en español.
  normalize(error) {
    const type = (error && error.type) || '';
    const code = error && error.code;
    const msg = (error && error.message ? error.message : '').toLowerCase();
    if (code === 429 || type.includes('rate_limit')) return { code: 'too_many', message: error && error.message };
    if (type.includes('invalid_token') || msg.includes('invalid token') || msg.includes('expired') || code === 401) {
      return { code: 'invalid', message: error && error.message };
    }
    if (type.includes('user_already') || type.includes('user_email_already')) {
      return { code: 'duplicate', message: error && error.message };
    }
    if (type.includes('smtp') || code === 500) return { code: 'send_failed', message: error && error.message };
    return { code: 'unknown', message: error && error.message };
  },

  // Mensaje amable para el usuario según el código de error.
  friendly(err) {
    switch (err && err.code) {
      case 'no_config':   return 'El envío de emails todavía no está configurado. Avisale a quien administra Integriva.';
      case 'invalid':     return 'El código no es válido o expiró. Tocá "Reenviar email" para pedir uno nuevo.';
      case 'expired':     return 'El código expiró. Tocá "Reenviar email" para recibir uno nuevo.';
      case 'cooldown':    return `Esperá ${err.seconds||60} segundos antes de pedir otro código.`;
      case 'too_many':    return 'Demasiados intentos. Esperá unos minutos y volvé a probar.';
      case 'send_failed': return 'No pudimos enviar el email. Revisá la dirección e intentá de nuevo.';
      case 'duplicate':   return 'Ya existe una cuenta con este email. Te enviamos un código para ingresar.';
      default:            return 'Ocurrió un problema. Intentá de nuevo en un momento.';
    }
  },
};

/* ============================================================
   PANTALLAS (devuelven HTML)
   ============================================================ */
App.screens = {

  /* ---------------- LANDING ---------------- */
  landing() {
    return `
    <div class="wrap">
      <div class="hero-brand-top">
        <img src="assets/logo.png" alt="Integriva by Delfina Olmedo" class="hero-logo"
             onerror="this.style.display='none';document.getElementById('heroBrandTxt').style.display='flex'">
        <span id="heroBrandTxt" class="brand-text" style="display:none">
          <span class="logo-dot"></span>
          <span>Integriva <small>by Delfina Olmedo</small></span>
        </span>
      </div>
      <section class="hero">
        <div class="hero-text">
          <span class="eyebrow">Nutrición · Psicología · Movimiento</span>
          <h1>Cuidá tu cuerpo y tu <span>mente</span>, en un solo lugar.</h1>
          <p class="lead">Un acompañamiento humano y práctico para mejorar tu alimentación, tu actividad física y tu bienestar emocional — con seguimiento profesional real.</p>
          <div class="hero-actions">
            <button class="btn big" onclick="App.go('registro')">Empezar gratis →</button>
            <button class="btn outline big" onclick="App.go('membresia')">Ver la membresía</button>
          </div>
          <p class="muted" style="margin-top:14px;font-size:.9rem">Empezás calculando tus calorías sin costo. Sin tarjetas, sin compromiso.</p>
        </div>
        <div class="hero-card">
          <div class="mini"><span class="emo">🥗</span><div><b>Plan personalizado</b><br><span class="muted">según tus gustos y objetivos</span></div></div>
          <div class="mini"><span class="emo">📅</span><div><b>Calendario diario</b><br><span class="muted">peso, comidas y movimiento</span></div></div>
          <div class="mini"><span class="emo">💬</span><div><b>Seguimiento con psicólogos</b><br><span class="muted">para estar contenido/a</span></div></div>
          <div class="mini"><span class="emo">🔥</span><div><b>Progreso visible</b><br><span class="muted">tus logros, día a día</span></div></div>
        </div>
      </section>

      <section style="margin-top:60px">
        <div class="section-title">
          <h2>Todo lo que necesitás para sostener el cambio</h2>
          <p class="muted">Combinamos nutrición, psicología y seguimiento. No te damos recetas mágicas: te acompañamos.</p>
        </div>
        <div class="features">
          ${[
            ['🧮','Calculá tus calorías','Entendé cuántas calorías necesitás y qué significa un déficit, explicado simple.'],
            ['📆','Registrá tu día','Peso, comidas y actividad física en un calendario con todo tu historial.'],
            ['🍳','Cociná con lo que tenés','Ingresá lo que hay en tu heladera y recibí 3 recetas con calorías calculadas.'],
            ['🫶','Seguimiento emocional','Registrá cómo te sentís y tené encuentros quincenales con profesionales.'],
          ].map(([i,t,d]) => `<div class="feature card"><div class="ic">${i}</div><h3>${t}</h3><p class="muted">${d}</p></div>`).join('')}
        </div>
      </section>

      <section class="card" style="margin-top:50px;text-align:center;background:linear-gradient(150deg,var(--verde-claro),#fff)">
        <h2>Tu primer paso es gratis</h2>
        <p class="muted" style="max-width:34em;margin:0 auto 20px">Completá tus datos y obtené al instante tus calorías diarias recomendadas y una explicación clara de cómo lograr tu objetivo.</p>
        <button class="btn big" onclick="App.go('registro')">Calcular mis calorías →</button>
      </section>

      <footer class="site-footer">
        <span>Integriva · by Delfina Olmedo</span>
        <span class="sep">·</span>
        <button class="link" onclick="App.openTerms()">Condiciones de cuidado y privacidad</button>
      </footer>
    </div>`;
  },

  /* ---------------- REGISTRO ---------------- */
  registro() {
    const u = this.user || {};
    return `
    <div class="wrap narrow">
      <button class="link" onclick="App.go('landing')">← Volver</button>
      <h2 style="margin-top:14px">Creá tu cuenta</h2>
      <p class="muted">Estos datos nos sirven para calcular tus calorías y armar tu plan. (Paso gratuito)</p>
      <div class="card" style="margin-top:18px">
        <form id="regForm">
          <div class="field"><label>Nombre</label><input name="nombre" value="${u.nombre||''}" placeholder="Tu nombre" required></div>
          <div class="field"><label>Email</label><input name="email" type="email" value="${u.email||''}" placeholder="tu@email.com" required></div>
          <div class="row">
            <div class="field"><label>Edad</label><input name="edad" type="number" min="10" max="100" value="${u.edad||''}" placeholder="años" required></div>
            <div class="field"><label>Sexo</label>
              <select name="sexo" required>
                <option value="">Elegí…</option>
                <option value="F" ${u.sexo==='F'?'selected':''}>Femenino</option>
                <option value="M" ${u.sexo==='M'?'selected':''}>Masculino</option>
              </select>
            </div>
          </div>
          <div class="row">
            <div class="field"><label>Peso actual (kg)</label><input name="peso" type="number" step="0.1" min="30" max="300" value="${u.peso||''}" placeholder="kg" required></div>
            <div class="field"><label>Peso deseado (kg)</label><input name="pesoDeseado" type="number" step="0.1" min="30" max="300" value="${u.pesoDeseado||''}" placeholder="kg" required></div>
          </div>
          <div class="row">
            <div class="field"><label>Altura (cm)</label><input name="altura" type="number" min="120" max="230" value="${u.altura||''}" placeholder="cm" required></div>
            <div class="field"><label>Actividad física actual</label>
              <select name="actividad" required>
                <option value="sed" ${u.actividad==='sed'?'selected':''}>Sedentaria (poco o nada)</option>
                <option value="lig" ${!u.actividad||u.actividad==='lig'?'selected':''}>Ligera (1-3 días/sem)</option>
                <option value="mod" ${u.actividad==='mod'?'selected':''}>Moderada (3-5 días/sem)</option>
                <option value="alt" ${u.actividad==='alt'?'selected':''}>Alta (6-7 días/sem)</option>
              </select>
            </div>
          </div>
          <label class="check-field">
            <input type="checkbox" name="acepta" ${u.acepta?'checked':''}>
            <span>Acepto las <button type="button" class="link" onclick="App.openTerms()">Condiciones de cuidado y privacidad</button> y el tratamiento de mis datos.</span>
          </label>
          <div id="regErr" class="error hidden"></div>
          <button type="submit" class="btn block big" style="margin-top:6px">Calcular mis calorías →</button>
        </form>
      </div>
    </div>`;
  },

  /* ---------------- VERIFICACIÓN DE EMAIL (OTP real) ---------------- */
  verificar() {
    const u = this.user;
    const demo = !this.auth.enabled;
    const boxes = Array.from({length:6}, (_,i) =>
      `<input class="otp-box" data-i="${i}" inputmode="numeric" maxlength="1"
              aria-label="Dígito ${i+1} de 6" autocomplete="${i===0?'one-time-code':'off'}">`).join('');
    return `
    <div class="wrap narrow">
      <button class="link" onclick="App.go('registro')">← Volver</button>
      <div class="auth-card card center" style="margin-top:14px">
        <div class="auth-badge">📩</div>
        <h2>Revisá tu correo</h2>
        <p class="muted" style="max-width:34em;margin:0 auto 4px">Te enviamos un código de 6 dígitos a</p>
        <p class="auth-email">${u.email}</p>
        <p class="muted" style="font-size:.84rem;margin-top:10px">Puede tardar un minuto. Si no aparece, mirá la carpeta de <b>spam</b>.</p>

        <div class="otp-group" id="otpGroup" role="group" aria-label="Código de verificación">${boxes}</div>
        <div id="codeErr" class="error center hidden" role="alert"></div>

        <button id="verifyBtn" class="btn block big" style="margin-top:18px"
                onclick="App.verifyAccount(App.collectOtp())">Confirmar registro →</button>

        <p class="muted center" style="font-size:.88rem;margin-top:16px">¿No te llegó?
          <button id="resendBtn" class="link" onclick="App.resendCode()">Reenviar email</button>
          <span id="resendHint" class="muted" style="font-size:.82rem"></span></p>
      </div>
      <p class="auth-secure center">🔒 Tus datos de salud viajan cifrados y solo vos podés verlos.</p>
      ${demo ? `<p class="muted center" style="font-size:.82rem">⚠️ Modo demo: el envío de emails no está configurado.
        Cargá las credenciales de Appwrite en <b>config.js</b> para que el código llegue de verdad.</p>` : ''}
    </div>`;
  },

  /* ---------------- RESULTADO DE CALORÍAS ---------------- */
  calorias() {
    const u = this.user, c = u.cal;
    const m = this.macrosFor(c.objetivo);
    const metaTxt = { bajar:'bajar de peso', subir:'subir de peso', mantener:'mantener tu peso' }[c.meta];
    const imcCat = c.imc < 18.5 ? 'bajo' : c.imc < 25 ? 'saludable' : c.imc < 30 ? 'sobrepeso' : 'obesidad';
    return `
    <div class="wrap narrow">
      <button class="link" onclick="App.go('registro')">← Editar mis datos</button>
      <div class="card cal-hero" style="margin-top:14px">
        <p class="muted">¡Listo, ${u.nombre}! Tu objetivo es <b>${metaTxt}</b>. Para lograrlo te recomendamos consumir aprox.</p>
        <div class="cal-number">${c.objetivo}</div>
        <div class="cal-unit">calorías por día</div>
        <div class="stat-row">
          <div class="stat"><b>${c.bmr}</b><span>Metabolismo basal (en reposo)</span></div>
          <div class="stat"><b>${c.tdee}</b><span>Gasto diario total</span></div>
          <div class="stat"><b>${c.deficit>0?'−'+c.deficit:c.deficit===0?'=':'+'+Math.abs(c.deficit)}</b><span>${c.meta==='bajar'?'Déficit diario':c.meta==='subir'?'Superávit diario':'Mantenimiento'}</span></div>
          <div class="stat"><b>${c.imc}</b><span>IMC (${imcCat})</span></div>
        </div>
      </div>

      <div class="card">
        <h3>¿Qué significan estas calorías?</h3>
        <ul class="explain">
          <li><b>Metabolismo basal:</b> es la energía que tu cuerpo gasta solo para vivir (respirar, latir, pensar), aunque estés en reposo todo el día.</li>
          <li><b>Gasto diario total:</b> suma a lo anterior tu actividad cotidiana y ejercicio. Es lo que realmente quemás por día.</li>
          ${c.meta==='bajar' ? `<li><b>Déficit calórico:</b> para bajar de peso necesitás consumir un poco menos de lo que gastás. Te proponemos un déficit moderado de <b>500 kcal/día</b> (≈ medio kilo por semana), sostenible y saludable.</li>` : ''}
          ${c.meta==='subir' ? `<li><b>Superávit calórico:</b> para subir de peso de forma saludable conviene comer algo más de lo que gastás, priorizando alimentos nutritivos.</li>` : ''}
          ${c.meta==='mantener' ? `<li><b>Mantenimiento:</b> comer cerca de tu gasto total te permite sostener tu peso mientras mejorás tus hábitos.</li>` : ''}
          <li><b>La actividad física complementa:</b> moverte no solo quema calorías, también mejora tu ánimo, tu sueño y te ayuda a sostener el cambio. No se trata de castigarte: se trata de acompañar tu cuerpo.</li>
        </ul>
        <p class="muted" style="margin-top:10px;font-size:.88rem">⚠️ Este cálculo es orientativo. Ante cualquier condición de salud, consultá con un profesional. En Integriva te acompañan nutricionistas y psicólogos.</p>
      </div>

      <div class="card">
        <h3>No son solo calorías: mirá tus macronutrientes 🥗</h3>
        <p class="muted">Dos comidas con las mismas calorías pueden nutrirte muy distinto. Por eso te mostramos cómo repartir tu día entre los <b>tres macronutrientes</b>. Para tu objetivo te sugerimos:</p>
        <div class="macro-targets">
          <div class="mt prot"><b>${m.prot} g</b><span>Proteínas</span><small>${m.pPct}% · ${Math.round(m.prot*4)} kcal</small></div>
          <div class="mt carb"><b>${m.carb} g</b><span>Carbohidratos</span><small>${m.cPct}% · ${Math.round(m.carb*4)} kcal</small></div>
          <div class="mt gras"><b>${m.gras} g</b><span>Grasas</span><small>${m.fPct}% · ${Math.round(m.gras*9)} kcal</small></div>
        </div>
        <ul class="explain">
          <li><b>Proteínas:</b> reparan músculos y tejidos, y te dan saciedad (te ayudan a no picotear). Carne, pollo, pescado, huevo, legumbres, lácteos.</li>
          <li><b>Carbohidratos:</b> tu principal fuente de energía para el día y el ejercicio. Frutas, verduras, cereales, legumbres, pan y arroz (mejor integrales).</li>
          <li><b>Grasas (saludables):</b> necesarias para tus hormonas, tu cerebro y para absorber vitaminas. Palta, frutos secos, aceite de oliva, semillas, pescado.</li>
        </ul>
        <p class="muted" style="margin-top:10px;font-size:.9rem">💚 En Integriva no queremos que te obsesiones con un número. Una buena comida es la que <b>equilibra</b> los tres, no la que tiene menos calorías. Dentro de la app vas a ver tu balance del día en tiempo real.</p>
      </div>

      <div class="card center" style="background:linear-gradient(150deg,var(--verde-claro),#fff)">
        <h2>¿Y ahora qué sigue?</h2>
        <p class="muted" style="max-width:34em;margin:0 auto 8px">Con la membresía recibís tu <b>plan a corto, mediano y largo plazo</b>, el calendario para registrar todo, recetas, y el seguimiento con profesionales.</p>
        <button class="btn big coral" onclick="App.go('membresia')">Ver qué incluye la membresía →</button>
      </div>
    </div>`;
  },

  /* ---------------- MEMBRESÍA / PAYWALL ---------------- */
  membresia() {
    const incluye = [
      ['📅','Calendario de registro','Anotá tu peso, comidas y actividad física día a día, con todo tu historial y progreso.'],
      ['🗺️','Plan a corto, mediano y largo plazo','Objetivos claros y alcanzables, pensados para vos.'],
      ['💬','Seguimiento quincenal con psicólogos','Encuentros cada 15 días para estar contenido/a emocionalmente en el proceso.'],
      ['🍽️','Recetas ricas y nutritivas','Ideas de comidas pensadas para disfrutar mientras cuidás tu alimentación.'],
      ['🧮','Calculadora y módulo de recetas','Calculá calorías de comidas y recibí recetas con lo que tenés en casa.'],
      ['📊','Marcador de progreso','Visualizá tus logros: déficit acumulado y rachas de buena alimentación.'],
    ];
    return `
    <div class="wrap">
      <button class="link" onclick="App.go(App.user?'calorias':'landing')">← Volver</button>
      <div class="section-title" style="margin-top:14px">
        <h2>Sumate a Integriva</h2>
        <p class="muted">Toda la experiencia —nutrición, psicología y seguimiento— en un mismo lugar.</p>
      </div>
      <div class="grid grid-2" style="align-items:start;margin-top:18px">
        <div class="card">
          <h3 style="margin-bottom:14px">Tu membresía incluye</h3>
          <ul style="list-style:none" class="includes">
            ${incluye.map(([i,t,d]) => `<li><span class="chk">${i}</span><div><b>${t}</b><br><span class="muted">${d}</span></div></li>`).join('')}
          </ul>
          <div class="upsell" style="margin-top:18px">
            <b>✨ Extras opcionales (los activás cuando quieras desde adentro):</b>
            <ul style="margin:8px 0 0 18px" class="muted">
              <li><b>Cocinero inteligente:</b> cociná sin pensar en qué comprar.</li>
              <li><b>Más acceso a recetas</b> actualizadas cada 15 días.</li>
              <li><b>Seguimiento emocional más personalizado</b> si lo deseás.</li>
            </ul>
          </div>
        </div>
        <div class="price-card">
          <span class="pill" style="background:rgba(255,255,255,.2);color:white">Membresía mensual</span>
          <div class="price">${this.money(30000)}</div>
          <div class="per">por mes · cancelás cuando quieras</div>
          <button class="btn big block" onclick="App.go('pago')">Contratar y pagar →</button>
          <p style="opacity:.85;font-size:.82rem;margin-top:12px">Pago seguro con Mercado Pago</p>
        </div>
      </div>
    </div>`;
  },

  /* ---------------- MERCADO PAGO (simulado) ---------------- */
  pago() {
    return `
    <div class="mp-screen">
      <button class="link" onclick="App.go('membresia')" style="margin-bottom:12px">← Cancelar</button>
      <div class="mp-card">
        <div class="mp-top">💳 Mercado Pago</div>
        <div class="mp-body">
          <p class="muted center">Estás pagando a <b>Integriva</b></p>
          <div class="mp-amount">${this.money(30000)}</div>
          <p class="muted center" style="font-size:.85rem;margin-bottom:18px">Membresía mensual</p>
          <div class="field"><label>Email</label><input id="mpEmail" value="${this.user?.email||''}" placeholder="tu@email.com"></div>
          <div class="field"><label>Número de tarjeta</label><input id="mpCard" placeholder="•••• •••• •••• ••••" maxlength="19"></div>
          <div class="row">
            <div class="field"><label>Vencimiento</label><input placeholder="MM/AA" maxlength="5"></div>
            <div class="field"><label>CVV</label><input placeholder="•••" maxlength="4"></div>
          </div>
          <button class="btn block big" style="background:#009EE3;box-shadow:none" onclick="App.procesarPago()">Pagar ${this.money(30000)}</button>
          <p class="muted center" style="font-size:.78rem;margin-top:12px">🔒 Simulación de prueba. No ingreses datos reales: cualquier valor funciona.</p>
        </div>
      </div>
    </div>`;
  },

  /* ---------------- ONBOARDING DE GUSTOS ---------------- */
  onboarding() {
    const p = this.prefs || {};
    return `
    <div class="wrap narrow">
      <div class="steps"><i class="on"></i><i></i><i></i></div>
      <h2 class="center">¡Bienvenido/a a Integriva! 🎉</h2>
      <p class="muted center">Antes de empezar, contanos de vos para personalizar tu experiencia. Esto es lo que hace que tu plan sea realmente tuyo.</p>
      <div class="card" style="margin-top:18px">
        <form id="prefForm">
          <div class="field"><label>🍽️ ¿Qué comidas te gustan más?</label>
            <textarea name="gustos" placeholder="Ej: pastas, ensaladas, pollo, frutas, comida casera…">${p.gustos||''}</textarea></div>
          <div class="field"><label>❤️ Tus preferencias y costumbres</label>
            <textarea name="preferencias" placeholder="Ej: como 4 veces al día, prefiero cocinar fácil, soy vegetariano/a, me gusta el dulce…">${p.preferencias||''}</textarea></div>
          <div class="field"><label>🚫 Lo que NO se puede tocar (alergias, lo que no comés)</label>
            <textarea name="noTocar" placeholder="Ej: soy alérgico al maní, no como cerdo, no tolero la lactosa…">${p.noTocar||''}</textarea></div>
          <div class="field"><label>✅ Lo que SÍ querés mantener en tu dieta</label>
            <textarea name="siDieta" placeholder="Ej: mi café de la mañana, un asado los domingos, el chocolate amargo…">${p.siDieta||''}</textarea></div>
          <button type="submit" class="btn block big">Entrar a mi espacio →</button>
        </form>
      </div>
    </div>`;
  },

  /* ---------------- DASHBOARD (app principal) ---------------- */
  dashboard() {
    const u = this.user;
    const k = this.selDate;
    const log = this.dayLog(k);
    const m = this.computeMetrics();
    const fechaSel = this.prettyDate(k);
    const esHoy = k === this.todayKey();

    const cm = this.sumMacros(log.comidas);       // {cal,p,c,f} consumido hoy
    const actCal = log.actividad.reduce((s,x)=>s+(+x.cal||0),0);
    const mt = this.macrosFor(u.cal.objetivo);    // objetivos de macros

    return `
    <div class="wrap">
      <div class="greet">
        <div>
          <h2 style="margin:0">Hola, ${u.nombre} 👋</h2>
          <p class="muted">Tu objetivo: <b>${u.cal.objetivo} kcal/día</b> · Meta de peso: <b>${u.pesoDeseado} kg</b></p>
        </div>
        <button class="btn coral" onclick="App.openExtras()">✨ Extras y consultas</button>
      </div>

      <!-- MARCADORES DE PROGRESO -->
      <div class="card">
        <h3 style="margin-bottom:14px">Tu progreso 🎯</h3>
        <div class="score-row">
          <div class="score green"><b>🔥 ${m.diasBuenos}</b><span>${m.diasBuenos===1?'día':'días'} de buena alimentación</span></div>
          <div class="score coral"><b>${m.deficitTotal>=0?'−':''}${Math.abs(m.deficitTotal).toLocaleString('es-AR')}</b><span>kcal de déficit acumulado</span></div>
          <div class="score yellow"><b>🏃 ${m.actTotal.toLocaleString('es-AR')}</b><span>kcal quemadas con actividad</span></div>
          <div class="score green"><b>${m.cambioPeso>0?'+':''}${m.cambioPeso} kg</b><span>desde que empezaste</span></div>
        </div>
        ${m.racha>=3?`<p class="pill amar" style="margin-top:14px">🌟 ¡Llevás ${m.racha} días seguidos cuidándote! Seguí así.</p>`:''}
      </div>

      <div class="dash-grid" style="margin-top:22px">
        <!-- COLUMNA IZQUIERDA: calendario + registro del día -->
        <div>
          <div class="card">
            <div class="cal-head">
              <button class="ghost-btn" onclick="App.changeMonth(-1)">←</button>
              <h3 id="calTitle">${this.monthLabel()}</h3>
              <button class="ghost-btn" onclick="App.changeMonth(1)">→</button>
            </div>
            <div class="cal-grid" id="calGrid">${this.renderCalendar()}</div>
            <p class="muted" style="font-size:.82rem;margin-top:10px">📍 Tocá un día para ver o cargar tu registro. El punto coral marca los días con datos.</p>
          </div>

          <div class="card">
            <h3>${esHoy?'Registro de hoy':'Registro del '+fechaSel}</h3>

            <!-- Peso -->
            <div class="inline-form" style="grid-template-columns:1fr auto">
              <div class="field" style="margin:0"><label>⚖️ Peso del día (kg)</label>
                <input id="pesoInput" type="number" step="0.1" value="${log.peso||''}" placeholder="kg"></div>
              <button class="btn" style="align-self:end" onclick="App.savePeso()">Guardar</button>
            </div>

            <!-- Comidas -->
            <h4 style="margin:18px 0 4px">🍽️ Comidas <span class="muted" style="font-weight:400">(${cm.cal} kcal)</span></h4>
            <div id="comidasList">${this.renderLogList(log.comidas,'comidas')}</div>
            <div class="meal-form">
              <div class="field" style="flex:3 1 130px;margin:0"><label>Comida</label><input id="comNom" placeholder="Ej: Ensalada de pollo"></div>
              <div class="field" style="flex:1 1 56px;margin:0"><label>kcal</label><input id="comCal" type="number" placeholder="0"></div>
              <div class="field" style="flex:1 1 50px;margin:0"><label>Prot g</label><input id="comP" type="number" placeholder="0"></div>
              <div class="field" style="flex:1 1 50px;margin:0"><label>Carb g</label><input id="comC" type="number" placeholder="0"></div>
              <div class="field" style="flex:1 1 50px;margin:0"><label>Gras g</label><input id="comF" type="number" placeholder="0"></div>
              <button class="btn" onclick="App.addLog('comidas')">+ Agregar</button>
            </div>
            <p class="muted" style="font-size:.8rem;margin-top:6px">¿No sabés las calorías? Usá la <button class="link" onclick="App.scrollTo('calc')">calculadora →</button></p>

            <!-- Actividad -->
            <h4 style="margin:18px 0 4px">🏃 Actividad física <span class="muted" style="font-weight:400">(${actCal} kcal)</span></h4>
            <div id="actList">${this.renderLogList(log.actividad,'actividad')}</div>
            <div class="inline-form">
              <div class="field" style="margin:0"><label>Actividad</label><input id="actNom" placeholder="Ej: Caminata 30 min"></div>
              <div class="field" style="margin:0"><label>kcal</label><input id="actCal" type="number" placeholder="0"></div>
              <button class="btn" onclick="App.addLog('actividad')">+ Agregar</button>
            </div>

            <!-- Balance del día (calorías + macros) -->
            <h4 style="margin:20px 0 2px">⚖️ Balance del día</h4>
            <p class="muted" style="font-size:.82rem">Lo importante no son solo las calorías, sino el equilibrio entre los tres macronutrientes.</p>
            <div class="macro-grid">
              ${this.macroBar('Calorías', cm.cal - actCal, u.cal.objetivo, 'kcal', 'kcal')}
              ${this.macroBar('Proteínas', cm.p, mt.prot, 'g', 'prot')}
              ${this.macroBar('Carbohidratos', cm.c, mt.carb, 'g', 'carb')}
              ${this.macroBar('Grasas', cm.f, mt.gras, 'g', 'gras')}
            </div>
            <div class="balance-msg">${this.balanceGuidance(cm, mt)}</div>
          </div>
        </div>

        <!-- COLUMNA DERECHA -->
        <div>
          <!-- Estado emocional -->
          <div class="card">
            <h3>¿Cómo te sentís hoy? 💭</h3>
            <div class="emo-picker" id="emoPicker">
              ${['😄','🙂','😐','😟','😣','😴','💪','🥲'].map(e=>`<button class="emo-btn ${log.emocion?.emoji===e?'sel':''}" onclick="App.pickEmo('${e}')">${e}</button>`).join('')}
            </div>
            <div class="field" style="margin:0"><textarea id="emoTexto" placeholder="¿Querés dejar registrado algo de cómo te sentís? (opcional)">${log.emocion?.texto||''}</textarea></div>
            <button class="btn block" style="margin-top:10px" onclick="App.saveEmo()">Guardar mi registro emocional</button>
          </div>

          <!-- Seguimiento profesional -->
          <div class="card">
            <h3>Seguimiento profesional 🫶</h3>
            <div class="pro-card">
              <div class="avatar">SB</div>
              <div>
                <b>Próximo encuentro quincenal</b><br>
                <span class="muted">${this.nextSession()} · con Lic. en Psicología</span>
              </div>
            </div>
            <button class="btn outline block" style="margin-top:12px" onclick="App.toast('📅 Te enviaremos el link del encuentro por email')">Confirmar asistencia</button>
          </div>

          <!-- Calculadora -->
          <div class="card" id="calc">
            <h3>Calculadora de calorías 🧮</h3>
            <p class="muted" style="font-size:.88rem">Elegí comidas tradicionales para estimar cuánto representan en tu dieta.</p>
            <div class="inline-form" style="grid-template-columns:1fr 90px auto">
              <div class="field" style="margin:0"><label>Alimento</label>
                <select id="calcFood">${this.foodOptions()}</select></div>
              <div class="field" style="margin:0"><label>Porciones</label><input id="calcQty" type="number" value="1" min="0.5" step="0.5"></div>
              <button class="btn" onclick="App.calcFood()">Sumar</button>
            </div>
            <div id="calcResult"></div>
          </div>
        </div>
      </div>

      <!-- MÓDULO RECETAS CON LO QUE TENÉS -->
      <div class="card" id="recetas" style="margin-top:22px">
        <h3>¿Qué cocino con lo que tengo? 🍳</h3>
        <p class="muted">Ingresá los alimentos que tenés en casa (separados por coma) y te sugerimos 3 recetas con sus calorías.</p>
        <div class="inline-form" style="grid-template-columns:1fr auto">
          <div class="field" style="margin:0"><input id="pantry" placeholder="Ej: huevos, arroz, tomate, pollo, queso, palta"></div>
          <button class="btn coral" onclick="App.suggestRecipes()">Buscar recetas</button>
        </div>
        <div class="grid grid-3" id="recipeResult" style="margin-top:16px"></div>
      </div>
    </div>`;
  },
};

/* ============================================================
   POST-RENDER (enganchar formularios)
   ============================================================ */
App.afterRender = {
  registro() {
    document.getElementById('regForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target, d = Object.fromEntries(new FormData(f));
      ['edad','peso','pesoDeseado','altura'].forEach(k => d[k] = parseFloat(d[k]));
      const err = document.getElementById('regErr');
      const showErr = (m) => { err.textContent = m; err.classList.remove('hidden'); };
      err.classList.add('hidden');
      if (!d.sexo) { showErr('Elegí una opción de sexo.'); return; }
      if (d.peso<30||d.altura<120) { showErr('Revisá los valores de peso y altura.'); return; }
      if (!d.acepta) { showErr('Para continuar necesitás aceptar las Condiciones de cuidado y privacidad.'); return; }
      d.acepta = true;
      d.cal = App.calcCalories(d);
      d.verified = false;

      const btn = f.querySelector('button[type="submit"]');
      btn.disabled = true; btn.classList.add('loading'); btn.textContent = 'Enviando código…';

      // Reiniciamos el contador de reenvíos para este registro.
      App.auth.resendCount = 0; App.auth.lastSentAt = 0;
      App.user = d; App.save();   // guardamos local para que persista el userId

      if (App.auth.enabled) {
        try {
          await App.auth.sendCode(d.email);
        } catch (ex) {
          btn.disabled = false; btn.classList.remove('loading'); btn.textContent = 'Calcular mis calorías →';
          showErr(App.auth.friendly(ex));
          return;
        }
      }
      App.go('verificar');
    });
  },
  onboarding() {
    document.getElementById('prefForm').addEventListener('submit', (e) => {
      e.preventDefault();
      App.prefs = Object.fromEntries(new FormData(e.target));
      App.save();
      App.toast('¡Listo! Tu espacio está personalizado 🎉');
      App.go('dashboard');
    });
  },
  verificar() {
    const boxes = Array.from(document.querySelectorAll('.otp-box'));
    if (!boxes.length) return;
    boxes[0].focus();
    const onlyDigits = (s) => (s || '').replace(/\D/g, '');
    boxes.forEach((box, i) => {
      box.addEventListener('input', () => {
        box.value = onlyDigits(box.value).slice(-1);
        if (box.value && i < boxes.length - 1) boxes[i+1].focus();
        if (boxes.every(b => b.value)) App.verifyAccount(App.collectOtp());
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && i > 0) { boxes[i-1].focus(); boxes[i-1].value = ''; }
        if (e.key === 'ArrowLeft' && i > 0) boxes[i-1].focus();
        if (e.key === 'ArrowRight' && i < boxes.length - 1) boxes[i+1].focus();
      });
      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const digits = onlyDigits((e.clipboardData || window.clipboardData).getData('text')).slice(0, 6);
        digits.split('').forEach((d, k) => { if (boxes[k]) boxes[k].value = d; });
        (boxes[Math.min(digits.length, 5)] || box).focus();
        if (boxes.every(b => b.value)) App.verifyAccount(App.collectOtp());
      });
    });
  },
};

/* ============================================================
   ACCIONES
   ============================================================ */
App.collectOtp = function() {
  return Array.from(document.querySelectorAll('.otp-box')).map(b => b.value).join('').trim();
};
App._resetOtp = function() {
  const boxes = Array.from(document.querySelectorAll('.otp-box'));
  boxes.forEach(b => { b.value = ''; });
  if (boxes[0]) boxes[0].focus();
};

App.verifyAccount = async function(code) {
  const err = document.getElementById('codeErr');
  const btn = document.getElementById('verifyBtn');
  if (this._verifying) return;            // evita doble envío (auto-submit + click)
  const showErr = (m) => { if (err) { err.textContent = m; err.classList.remove('hidden'); } else this.toast(m); };
  if (err) err.classList.add('hidden');

  if (!/^\d{6}$/.test(String(code))) { showErr('Ingresá los 6 dígitos del código.'); return; }

  if (this.auth.enabled) {
    this._verifying = true;
    if (btn) { btn.disabled = true; btn.classList.add('loading'); btn.textContent = 'Verificando…'; }
    try {
      await this.auth.verifyCode(code);
      await this.auth.saveProfile(this.user);
    } catch (ex) {
      this._verifying = false;
      if (btn) { btn.disabled = false; btn.classList.remove('loading'); btn.textContent = 'Confirmar registro →'; }
      showErr(this.auth.friendly(ex));
      this._resetOtp();
      return;
    }
    this._verifying = false;
  }

  this.user.verified = true;
  this.save();
  this.toast('¡Cuenta verificada! ✓');
  this.go('calorias');
};

App.resendCode = async function() {
  const err = document.getElementById('codeErr');
  const link = document.getElementById('resendBtn');
  const showErr = (m) => { if (err) { err.textContent = m; err.classList.remove('hidden'); } else this.toast(m); };
  if (err) err.classList.add('hidden');

  if (!this.auth.enabled) { this.toast('⚠️ Configurá Appwrite en config.js para enviar emails reales'); return; }

  if (link) { link.disabled = true; link.textContent = 'Enviando…'; }
  try {
    await this.auth.sendCode(this.user.email, { isResend: true });
    this.toast('📩 Te reenviamos el email con un código nuevo');
  } catch (ex) {
    showErr(this.auth.friendly(ex));
  } finally {
    if (link) { link.disabled = false; link.textContent = 'Reenviar email'; }
  }
};

App.procesarPago = function() {
  const btn = event.target;
  btn.disabled = true; btn.textContent = 'Procesando…';
  setTimeout(() => {
    this.membership = { active: true, fecha: this.todayKey() };
    if (!this.user.startWeight) this.user.startWeight = this.user.peso;
    this.save();
    document.getElementById('app').innerHTML = `
      <div class="mp-screen">
        <div class="mp-card">
          <div class="mp-body center" style="padding:40px 24px">
            <div style="font-size:3.5rem">✅</div>
            <h2 style="color:var(--verde-osc)">¡Pago aprobado!</h2>
            <p class="muted">Tu membresía de Integriva ya está activa.</p>
            <button class="btn big block" style="margin-top:18px" onclick="App.go('onboarding')">Continuar →</button>
          </div>
        </div>
      </div>`;
  }, 1400);
};

App.savePeso = function() {
  const v = parseFloat(document.getElementById('pesoInput').value);
  const log = this.dayLog(this.selDate);
  log.peso = isNaN(v) ? null : v;
  // si es el primer peso registrado, sirve de referencia
  if (!this.user.startWeight && log.peso) { this.user.startWeight = log.peso; }
  this.save(); this.toast('Peso guardado ⚖️'); this.go('dashboard');
};

App.addLog = function(tipo) {
  const pre = tipo === 'comidas' ? 'com' : 'act';
  const nom = document.getElementById(pre+'Nom').value.trim();
  const cal = parseFloat(document.getElementById(pre+'Cal').value);
  if (!nom) { this.toast('Escribí un nombre'); return; }
  const item = { nombre: nom, cal: isNaN(cal)?0:cal };
  if (tipo === 'comidas') {
    item.p = parseFloat(document.getElementById('comP').value) || 0;
    item.c = parseFloat(document.getElementById('comC').value) || 0;
    item.f = parseFloat(document.getElementById('comF').value) || 0;
  }
  this.dayLog(this.selDate)[tipo].push(item);
  this.save(); this.go('dashboard');
};

App.removeLog = function(tipo, i) {
  this.dayLog(this.selDate)[tipo].splice(i,1);
  this.save(); this.go('dashboard');
};

App.pickEmo = function(e) {
  const log = this.dayLog(this.selDate);
  log.emocion = log.emocion || {};
  log.emocion.emoji = e;
  document.querySelectorAll('#emoPicker .emo-btn').forEach(b => b.classList.toggle('sel', b.textContent===e));
};

App.saveEmo = function() {
  const log = this.dayLog(this.selDate);
  const txt = document.getElementById('emoTexto').value;
  log.emocion = { emoji: log.emocion?.emoji || '🙂', texto: txt };
  this.save(); this.toast('Registro emocional guardado 💭');
};

App.selectDay = function(key) { this.selDate = key; this.go('dashboard'); };
App.changeMonth = function(d) { this.calMonth.setMonth(this.calMonth.getMonth()+d); this.go('dashboard'); };

App.calcFood = function() {
  const sel = document.getElementById('calcFood');
  const qty = parseFloat(document.getElementById('calcQty').value)||1;
  const f = FOODS[+sel.value];
  const cal = Math.round(f.cal*qty), p = Math.round(f.p*qty), c = Math.round(f.c*qty), g = Math.round(f.f*qty);
  document.getElementById('calcResult').innerHTML =
    `<div class="stat" style="margin-top:12px"><b>${cal} kcal</b><span>${qty} × ${f.nom}</span></div>
     <div class="macro-legend" style="justify-content:center;margin:10px 0">
       <span><i style="background:var(--coral)"></i>Prot ${p} g</span>
       <span><i style="background:var(--amarillo)"></i>Carb ${c} g</span>
       <span><i style="background:var(--avocado)"></i>Gras ${g} g</span>
     </div>
     <button class="btn outline block" onclick="App.addCalcToMeals(${+sel.value},${qty})">+ Agregar a mis comidas de hoy</button>`;
};
App.addCalcToMeals = function(idx, qty) {
  const f = FOODS[idx];
  this.dayLog(this.selDate).comidas.push({
    nombre: (qty===1?'':qty+' × ') + f.nom,
    cal: Math.round(f.cal*qty), p: Math.round(f.p*qty), c: Math.round(f.c*qty), f: Math.round(f.f*qty)
  });
  this.save(); this.toast('Agregado a tus comidas 🍽️'); this.go('dashboard');
};

App.suggestRecipes = function() {
  const raw = document.getElementById('pantry').value.toLowerCase();
  const have = raw.split(',').map(s=>s.trim()).filter(Boolean);
  if (!have.length) { this.toast('Escribí al menos un alimento'); return; }
  const scored = RECIPES.map(r => {
    const match = r.ings.filter(i => have.some(h => i.includes(h) || h.includes(i)));
    return { r, score: match.length, match };
  }).filter(x => x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  const cont = document.getElementById('recipeResult');
  if (!scored.length) {
    cont.innerHTML = `<p class="muted">No encontramos recetas con eso. Probá con: huevos, arroz, pollo, tomate, queso, avena, atún, palta…</p>`;
    return;
  }
  cont.innerHTML = scored.map(({r,match}) => `
    <div class="recipe">
      <h4>${r.nom}</h4>
      <div class="ings">🧺 ${r.ings.join(', ')}</div>
      <p style="font-size:.88rem">${r.pasos}</p>
      <div class="macro-legend" style="margin:8px 0">
        <span><i style="background:var(--coral)"></i>P ${r.p} g</span>
        <span><i style="background:var(--amarillo)"></i>C ${r.c} g</span>
        <span><i style="background:var(--avocado)"></i>G ${r.f} g</span>
      </div>
      <div class="tag-list">
        <span class="pill">${r.cal} kcal</span>
        <span class="pill coral">${match.length} ingrediente${match.length>1?'s':''} que tenés</span>
      </div>
    </div>`).join('');
  this.toast('¡Encontramos recetas para vos! 🍳');
};

App.scrollTo = function(id) { document.getElementById(id)?.scrollIntoView({behavior:'smooth'}); };

/* ---------- Extras / consultas (modal) ---------- */
App.openExtras = function() {
  const e = this.extras;
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.onclick = (ev) => { if (ev.target===bg) bg.remove(); };
  bg.innerHTML = `
    <div class="modal" style="max-width:520px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3>Extras y consultas ✨</h3>
        <button class="ghost-btn" onclick="this.closest('.modal-bg').remove()">✕</button>
      </div>
      <p class="muted" style="font-size:.9rem">Sumá lo que necesites cuando quieras. Las recetas y sugerencias se actualizan cada 15 días.</p>

      <div class="upsell" style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
          <div><b>👨‍🍳 Cocinero inteligente</b><br><span class="muted" style="font-size:.86rem">Cociná sin pensar en qué comprar: menú y lista de compras armados para vos.</span></div>
          <div style="text-align:right"><div class="price-tag">${this.money(18000)}</div><span class="muted" style="font-size:.75rem">/mes</span></div>
        </div>
        <button class="btn ${e.cocinero?'outline':''} block" style="margin-top:10px" onclick="App.toggleExtra('cocinero')">${e.cocinero?'✓ Contratado — quitar':'Contratar'}</button>
      </div>

      <div class="upsell" style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
          <div><b>🍽️ Más recetas premium</b><br><span class="muted" style="font-size:.86rem">Acceso ampliado a recetas, actualizadas cada 15 días.</span></div>
          <div style="text-align:right"><div class="price-tag">${this.money(8000)}</div><span class="muted" style="font-size:.75rem">/mes</span></div>
        </div>
        <button class="btn ${e.recetasPlus?'outline':''} block" style="margin-top:10px" onclick="App.toggleExtra('recetasPlus')">${e.recetasPlus?'✓ Contratado — quitar':'Contratar'}</button>
      </div>

      <h4 style="margin:18px 0 8px">Consulta personalizada</h4>
      <p class="muted" style="font-size:.86rem;margin-bottom:10px">Agendá en las próximas 48 horas:</p>
      <div class="grid grid-3" style="gap:10px">
        <button class="btn outline" onclick="App.bookConsult('mensaje')">💬 Por mensaje<br><span style="font-size:.8rem">${this.money(5000)}</span></button>
        <button class="btn outline" onclick="App.bookConsult('llamada')">📞 Por llamada<br><span style="font-size:.8rem">${this.money(9000)}</span></button>
        <button class="btn outline" onclick="App.bookConsult('psicológica')">🫶 Psicológica<br><span style="font-size:.8rem">${this.money(15000)}</span></button>
      </div>
    </div>`;
  document.body.appendChild(bg);
};
App.toggleExtra = function(k) {
  this.extras[k] = !this.extras[k]; this.save();
  this.toast(this.extras[k] ? '✅ Extra contratado' : 'Extra dado de baja');
  document.querySelector('.modal-bg')?.remove();
  this.openExtras();
};
App.bookConsult = function(tipo) {
  document.querySelector('.modal-bg')?.remove();
  this.toast(`📅 Consulta ${tipo} solicitada. Te contactamos para agendar en las próximas 48 hs.`);
};

/* ---------- Banner de cookies ---------- */
App.showCookieBanner = function() {
  if (document.getElementById('cookieBanner')) return;
  const b = document.createElement('div');
  b.id = 'cookieBanner';
  b.className = 'cookie-banner';
  b.innerHTML = `
    <p>🍪 Usamos cookies para recordar tu sesión y mejorar tu experiencia. Al continuar, aceptás nuestras
       <button class="link" onclick="App.openTerms()">Condiciones de cuidado y privacidad</button>.</p>
    <div class="actions">
      <button class="btn outline" onclick="App.setCookies(false)">Solo necesarias</button>
      <button class="btn" onclick="App.setCookies(true)">Aceptar todas</button>
    </div>`;
  document.body.appendChild(b);
};
App.hideCookieBanner = function() { document.getElementById('cookieBanner')?.remove(); };
App.setCookies = function(all) {
  this.cookies = { aceptadas: true, todas: !!all, fecha: this.todayKey() };
  this.save();
  this.hideCookieBanner();
  this.toast(all ? '🍪 ¡Gracias! Preferencias guardadas' : 'Listo, solo cookies necesarias');
};

/* ---------- Condiciones de cuidado y privacidad (modal) ---------- */
App.openTerms = function() {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.onclick = (ev) => { if (ev.target===bg) bg.remove(); };
  bg.innerHTML = `
    <div class="modal" style="max-width:560px;max-height:82vh;overflow:auto">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3>Condiciones de cuidado y privacidad</h3>
        <button class="ghost-btn" onclick="this.closest('.modal-bg').remove()">✕</button>
      </div>
      <p class="muted" style="font-size:.82rem">Última actualización: ${new Date().toLocaleDateString('es-AR',{month:'long',year:'numeric'})}</p>
      <div style="font-size:.9rem;line-height:1.6">
        <h4 style="margin-top:14px">1. Qué es Integriva</h4>
        <p>Integriva (by Delfina Olmedo) es una plataforma de acompañamiento en alimentación, actividad física y bienestar emocional. Su contenido es <b>orientativo y educativo</b>.</p>
        <h4 style="margin-top:14px">2. No reemplaza atención médica</h4>
        <p>Los cálculos de calorías y macronutrientes, las recetas y las sugerencias <b>no constituyen un diagnóstico ni un tratamiento médico</b>. Ante cualquier condición de salud, embarazo, trastorno alimentario o duda, consultá con un/a profesional de la salud. Si estás atravesando una urgencia emocional, comunicate con los servicios de emergencia de tu zona.</p>
        <h4 style="margin-top:14px">3. Tus datos y privacidad</h4>
        <p>Tratamos tus datos personales y de salud con confidencialidad y solo para brindarte el servicio. No los vendemos a terceros. Podés pedir acceder, corregir o borrar tu información cuando quieras.</p>
        <h4 style="margin-top:14px">4. Cookies</h4>
        <p>Usamos cookies necesarias para que la plataforma funcione (mantener tu sesión) y, si lo aceptás, cookies para mejorar tu experiencia. Podés cambiar tu elección cuando quieras.</p>
        <h4 style="margin-top:14px">5. Membresía y pagos</h4>
        <p>La membresía se abona por Mercado Pago. Podés cancelarla cuando quieras; el acceso continúa hasta el fin del período pago.</p>
        <h4 style="margin-top:14px">6. Acompañamiento profesional</h4>
        <p>El seguimiento lo realizan profesionales matriculados. Las recomendaciones se ajustan a tu criterio y al de tu profesional tratante.</p>
        <p class="muted" style="margin-top:14px;font-size:.8rem">⚠️ Texto de demostración para el prototipo. La versión real debe contar con términos y política de privacidad revisados legalmente y adaptados a la normativa vigente (en Argentina, Ley 25.326 de Protección de Datos Personales).</p>
      </div>
      <button class="btn block" style="margin-top:16px" onclick="this.closest('.modal-bg').remove()">Entendido</button>
    </div>`;
  document.body.appendChild(bg);
};

/* ============================================================
   HELPERS DE RENDER
   ============================================================ */
App.renderLogList = function(arr, tipo) {
  if (!arr.length) return `<p class="muted" style="font-size:.86rem">Todavía no cargaste nada.</p>`;
  return arr.map((x,i) => {
    const macros = (tipo==='comidas' && ((x.p||0)+(x.c||0)+(x.f||0))>0)
      ? `<br><span class="muted" style="font-size:.74rem">P ${Math.round(x.p||0)} · C ${Math.round(x.c||0)} · G ${Math.round(x.f||0)} g</span>` : '';
    return `<div class="log-item"><span>${x.nombre}${macros}</span>
      <span><b>${x.cal} kcal</b> <span class="x" onclick="App.removeLog('${tipo}',${i})">✕</span></span></div>`;
  }).join('');
};

/* Barra de progreso de un macro / calorías */
App.macroBar = function(label, val, target, unit, cls) {
  val = Math.round(val);
  const pct = target>0 ? Math.min(100, Math.round(val/target*100)) : 0;
  const over = val > target*1.08 && target>0;
  return `<div class="macro">
    <div class="top"><span>${label}</span><span class="${over?'over':''}">${val} / ${target} ${unit}${over?' ⚠️':''}</span></div>
    <div class="bar ${cls}"><i style="width:${pct}%"></i></div>
  </div>`;
};

/* Mensaje guía: qué le falta al día para estar equilibrado */
App.balanceGuidance = function(cm, m) {
  if (cm.cal === 0) return '🍽️ Todavía no registraste comidas hoy. Cuando lo hagas, te muestro qué te falta para un día equilibrado.';
  const items = [
    { k:'proteínas', r: cm.p/m.prot, tip:'sumá huevo, pollo, pescado, legumbres o yogur' },
    { k:'carbohidratos', r: cm.c/m.carb, tip:'sumá fruta, avena, arroz integral, pan o legumbres' },
    { k:'grasas saludables', r: cm.f/m.gras, tip:'sumá palta, frutos secos, aceite de oliva o semillas' },
  ].sort((a,b)=>a.r-b.r);
  const low = items[0];
  if (low.r >= 0.85) return '🌿 ¡Buen equilibrio hoy! Estás cubriendo bien tus tres macronutrientes. Recordá: importa el conjunto del día, no la perfección de cada comida.';
  return `💡 Para equilibrar mejor tu día, ${low.tip} — vas con el ${Math.round(low.r*100)}% de tus ${low.k}.`;
};

App.renderCalendar = function() {
  const d = this.calMonth;
  const year = d.getFullYear(), month = d.getMonth();
  const first = new Date(year, month, 1);
  const startDow = (first.getDay()+6)%7; // lunes=0
  const days = new Date(year, month+1, 0).getDate();
  const dows = ['L','M','M','J','V','S','D'];
  let html = dows.map(x=>`<div class="dow">${x}</div>`).join('');
  for (let i=0;i<startDow;i++) html += `<div class="day empty"></div>`;
  for (let n=1;n<=days;n++) {
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(n).padStart(2,'0')}`;
    const has = this.logs[key] && (this.logs[key].peso || this.logs[key].comidas.length || this.logs[key].actividad.length || this.logs[key].emocion);
    const cls = ['day', key===this.todayKey()?'today':'', key===this.selDate?'sel':'', has?'has':''].filter(Boolean).join(' ');
    html += `<div class="${cls}" onclick="App.selectDay('${key}')">${n}${this.logs[key]?.emocion?`<span style="font-size:.8rem">${this.logs[key].emocion.emoji}</span>`:''}</div>`;
  }
  return html;
};

App.monthLabel = function() {
  return this.calMonth.toLocaleDateString('es-AR',{month:'long',year:'numeric'}).replace(/^\w/,c=>c.toUpperCase());
};
App.prettyDate = function(key) {
  const [y,m,dd] = key.split('-').map(Number);
  return new Date(y,m-1,dd).toLocaleDateString('es-AR',{day:'numeric',month:'long'});
};
App.nextSession = function() {
  const d = new Date(); d.setDate(d.getDate() + (14 - (d.getDate()%14)));
  return d.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'}).replace(/^\w/,c=>c.toUpperCase());
};

App.foodOptions = function() {
  return FOODS.map((f,i) => `<option value="${i}">${f.nom} (${f.cal} kcal)</option>`).join('');
};

/* ---------- Métricas de progreso ---------- */
App.computeMetrics = function() {
  let deficitTotal=0, actTotal=0, diasBuenos=0;
  const obj = this.user.cal.objetivo;
  const keys = Object.keys(this.logs).sort();
  keys.forEach(k => {
    const l = this.logs[k];
    const com = l.comidas.reduce((s,x)=>s+(+x.cal||0),0);
    const act = l.actividad.reduce((s,x)=>s+(+x.cal||0),0);
    actTotal += act;
    if (com>0) {
      const neto = com - act;
      deficitTotal += (this.user.cal.tdee - neto); // déficit respecto al gasto
      if (neto <= obj) diasBuenos++;
    }
  });
  // cambio de peso
  const pesos = keys.map(k=>this.logs[k].peso).filter(Boolean);
  const start = this.user.startWeight || this.user.peso;
  const cambioPeso = pesos.length ? +(pesos[pesos.length-1]-start).toFixed(1) : 0;
  // racha de días buenos consecutivos hasta hoy
  let racha=0; let cur=new Date();
  for (let i=0;i<60;i++){
    const k=this.dateKey(cur); const l=this.logs[k];
    if (l){ const com=l.comidas.reduce((s,x)=>s+(+x.cal||0),0); const act=l.actividad.reduce((s,x)=>s+(+x.cal||0),0);
      if (com>0 && (com-act)<=obj){racha++;} else if(com>0){break;} }
    else if(i>0){break;}
    cur.setDate(cur.getDate()-1);
  }
  return { deficitTotal:Math.round(deficitTotal), actTotal, diasBuenos, cambioPeso, racha };
};

/* ============================================================
   DATOS: alimentos para la calculadora y recetas
   ============================================================ */
// p = proteínas (g), c = carbohidratos (g), f = grasas (g) por porción
const FOODS = [
  {nom:'Milanesa de carne con puré', cal:550, p:35, c:45, f:25},
  {nom:'Asado (porción)', cal:480, p:40, c:0, f:35},
  {nom:'Empanada de carne', cal:280, p:10, c:25, f:16},
  {nom:'Pizza (porción)', cal:285, p:12, c:33, f:11},
  {nom:'Pastas con salsa (plato)', cal:430, p:14, c:70, f:9},
  {nom:'Ñoquis (plato)', cal:400, p:10, c:75, f:6},
  {nom:'Ensalada mixta', cal:120, p:3, c:12, f:7},
  {nom:'Pollo al horno (porción)', cal:260, p:35, c:0, f:12},
  {nom:'Arroz cocido (taza)', cal:205, p:4, c:45, f:0},
  {nom:'Tarta de verdura (porción)', cal:300, p:10, c:25, f:18},
  {nom:'Huevo frito (unidad)', cal:90, p:6, c:0, f:7},
  {nom:'Sándwich de jamón y queso', cal:350, p:18, c:30, f:16},
  {nom:'Yogur con granola', cal:230, p:9, c:35, f:6},
  {nom:'Fruta (manzana/banana)', cal:95, p:1, c:25, f:0},
  {nom:'Mate cocido / café con leche', cal:60, p:3, c:7, f:2},
  {nom:'Medialuna', cal:200, p:4, c:24, f:10},
  {nom:'Alfajor', cal:230, p:3, c:33, f:10},
  {nom:'Gaseosa (vaso)', cal:90, p:0, c:23, f:0},
  {nom:'Lentejas guisadas (plato)', cal:330, p:18, c:50, f:5},
  {nom:'Atún al natural (lata)', cal:130, p:28, c:0, f:2},
  {nom:'Palta (media unidad)', cal:160, p:2, c:9, f:15},
  {nom:'Avena (taza, cocida)', cal:150, p:5, c:27, f:3},
];

const RECIPES = [
  {nom:'Revuelto de huevo y verduras', ings:['huevo','huevos','tomate','cebolla','queso','espinaca'], cal:280, p:18, c:10, f:18, pasos:'Salteá las verduras, agregá los huevos batidos y revolvé hasta cocinar. Sumá queso al final.'},
  {nom:'Arroz salteado con pollo', ings:['arroz','pollo','cebolla','zanahoria','huevo'], cal:420, p:30, c:50, f:10, pasos:'Cociná el arroz, saltealo con pollo en cubos y verduras. Condimentá a gusto.'},
  {nom:'Ensalada completa de atún', ings:['atun','atún','tomate','lechuga','huevo','arroz','palta'], cal:320, p:28, c:18, f:15, pasos:'Mezclá hojas verdes, tomate, atún y huevo duro. Sumá palta o arroz para que sea más completa.'},
  {nom:'Tostadas con palta y huevo', ings:['pan','palta','huevo','tomate','queso'], cal:340, p:15, c:30, f:18, pasos:'Tostá el pan, pisá la palta encima y agregá huevo poché o revuelto.'},
  {nom:'Avena nutritiva', ings:['avena','leche','banana','fruta','yogur'], cal:300, p:10, c:50, f:7, pasos:'Cociná la avena con leche, sumá fruta picada y un toque de miel.'},
  {nom:'Wrap de pollo', ings:['pollo','tortilla','lechuga','tomate','queso','palta'], cal:380, p:28, c:35, f:13, pasos:'Rellená una tortilla con pollo, vegetales y queso. Enrollá y dorá apenas.'},
  {nom:'Tortilla de papa liviana', ings:['papa','huevo','huevos','cebolla'], cal:350, p:16, c:35, f:15, pasos:'Cociná la papa, mezclá con huevo batido y cebolla, cociná a fuego bajo de ambos lados.'},
  {nom:'Pasta con tomate y verduras', ings:['fideos','pasta','tomate','cebolla','queso','zanahoria'], cal:430, p:14, c:75, f:8, pasos:'Herví la pasta, prepará una salsa de tomate con verduras y mezclá.'},
  {nom:'Bowl de yogur y frutas', ings:['yogur','fruta','banana','avena','granola'], cal:240, p:12, c:38, f:5, pasos:'Combiná yogur con fruta picada y avena o granola.'},
  {nom:'Pechuga grillada con ensalada', ings:['pollo','lechuga','tomate','zanahoria','huevo'], cal:300, p:35, c:12, f:12, pasos:'Grillá la pechuga y serví con una ensalada fresca bien condimentada.'},
  {nom:'Guiso de lentejas', ings:['lenteja','lentejas','arroz','cebolla','zanahoria','papa','tomate'], cal:380, p:20, c:60, f:6, pasos:'Rehogá las verduras, sumá las lentejas y cocina con caldo hasta espesar.'},
];

/* ---------- Arranque ---------- */
document.addEventListener('DOMContentLoaded', () => App.init());
