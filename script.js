// 1. SUPABASE VERBINDUNG
const SUPABASE_URL = 'https://gessrezpwqmdajkfxgjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NlYgPe1Ii47nl0-anpcnSA_75ae85U9';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1b. WER IST WER?
// Optional: trage hier eure beiden Login-E-Mails ein (klein geschrieben).
// Dann kann sich jede Mail NUR noch auf ihrer eigenen Oberfläche anmelden.
// Bleibt ein Feld leer ('') -> das Konto wird beim ersten Login automatisch
// dauerhaft an die gewählte Rolle gebunden (wird in Supabase gespeichert).
const ROLE_EMAILS = {
  Aly: '',
  Sebo: ''
};

// TMDB (The Movie Database) für Titel-Suche + Cover
// Key holen: https://www.themoviedb.org/settings/api -> "API Key (v3 auth)"
// Leer lassen = es funktioniert alles, nur ohne automatisches Cover.
const TMDB_API_KEY = '2ace4aa0eb9800c1c066ce11d888452f';

// 1d. "ANGEMELDET BLEIBEN" / "PASSWORT MERKEN"
const REMEMBER_KEY = 'luvu_remember';        // '1' = angemeldet bleiben, '0' = nicht
const TAB_SESSION_KEY = 'luvu_tab_active';   // lebt nur solange der Tab / die App offen ist
const SAVE_PW_KEY = 'luvu_save_pw';          // '1' = Passwort merken, '0' = nicht
const PW_STORE_PREFIX = 'luvu_pw_';          // Ablage für das gespeicherte Passwort
const PW_SALT = 'LuvU-hearts-2026';          // nur zum Verschleiern, kein echter Schutz

let currentRole = null;

// 1c. HELFER FÜR ROLLEN
function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function emailForRole(role) {
  const mail = normalizeEmail(ROLE_EMAILS[role]);
  return mail === '' ? null : mail;
}

function roleFromEmail(email) {
  const mail = normalizeEmail(email);
  if (!mail) return null;
  if (emailForRole('Aly') === mail) return 'Aly';
  if (emailForRole('Sebo') === mail) return 'Sebo';
  return null;
}

// Rolle eines Kontos: 1. dauerhaft in Supabase (user_metadata), 2. E-Mail-Liste
function roleFromUser(user) {
  const metaRole = user && user.user_metadata ? user.user_metadata.role : null;
  if (metaRole === 'Aly' || metaRole === 'Sebo') return metaRole;
  return roleFromEmail(user ? user.email : '');
}

function otherRole(role) {
  return role === 'Aly' ? 'Sebo' : 'Aly';
}

function setLoginMessage(text, isError = true) {
  const el = document.getElementById('login-message');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#c2557a' : '#8a9bb0';
}

// 1e. PASSWORT-SPEICHER (verschleiert, synchron, funktioniert überall)
function xorShift(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(text.charCodeAt(i) ^ PW_SALT.charCodeAt(i % PW_SALT.length));
  }
  return out;
}

function encodePassword(password) {
  const bytes = new TextEncoder().encode(password);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(xorShift(binary));
}

function decodePassword(encoded) {
  const binary = xorShift(atob(encoded));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function savePasswordLocally(role, password) {
  try {
    if (!password) return;
    localStorage.setItem(PW_STORE_PREFIX + role, encodePassword(password));
  } catch (e) {
    console.warn('Passwort konnte nicht gespeichert werden:', e);
  }
}

function loadPasswordLocally(role) {
  try {
    const raw = localStorage.getItem(PW_STORE_PREFIX + role);
    if (!raw) return null;
    // Altlast der früheren Krypto-Version (JSON-Objekt) -> verwerfen
    if (raw.trim().startsWith('{')) {
      localStorage.removeItem(PW_STORE_PREFIX + role);
      return null;
    }
    const decoded = decodePassword(raw);
    return decoded || null;
  } catch (e) {
    console.warn('Passwort konnte nicht gelesen werden:', e);
    return null;
  }
}

function clearStoredPassword(role) {
  localStorage.removeItem(PW_STORE_PREFIX + role);
}

function shouldRememberPassword() {
  const savedChoice = localStorage.getItem(SAVE_PW_KEY);
  return savedChoice === null ? true : savedChoice === '1';
}

// Setzt das gemerkte Passwort ins Feld. Gibt true zurück, wenn es gefüllt wurde.
function fillStoredPassword(role) {
  const pwInput = document.getElementById('password-input');
  const pwBox = document.getElementById('remember-password');
  if (!pwInput) return false;

  const remember = shouldRememberPassword();
  if (pwBox) pwBox.checked = remember;

  pwInput.value = '';
  if (!remember) return false;

  const stored = loadPasswordLocally(role);
  if (!stored) return false;

  pwInput.value = stored;

  // Sicherheitsnetz: falls der Browser das Feld kurz danach leert
  setTimeout(() => {
    if (currentRole === role && !pwInput.value && document.activeElement !== pwInput) {
      pwInput.value = stored;
    }
  }, 200);

  return true;
}

// 1f. BESTÄTIGUNGS-DIALOG (im App-Look, ohne HTML/CSS-Änderung)
function askConfirm(message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'letter-view open';
    overlay.style.zIndex = '10050';

    const card = document.createElement('div');
    card.className = 'letter-card';
    card.style.textAlign = 'center';
    card.style.maxWidth = '340px';

    const title = document.createElement('h2');
    title.textContent = 'Are you sure?';
    title.style.textAlign = 'center';
    title.style.marginBottom = '12px';

    const text = document.createElement('p');
    text.className = 'letter-body';
    text.style.fontSize = '1.25rem';
    text.style.textAlign = 'center';
    text.textContent = message;

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.marginTop = '28px';

    const noBtn = document.createElement('button');
    noBtn.className = 'nav-btn';
    noBtn.style.flex = '1';
    noBtn.textContent = 'No, keep it';

    const yesBtn = document.createElement('button');
    yesBtn.className = 'nav-btn';
    yesBtn.style.flex = '1';
    yesBtn.style.background = '#d86c8a';
    yesBtn.style.borderColor = '#d86c8a';
    yesBtn.style.color = '#fff';
    yesBtn.textContent = 'Yes, delete';

    const close = (result) => {
      overlay.remove();
      resolve(result);
    };

    noBtn.onclick = () => close(false);
    yesBtn.onclick = () => close(true);
    overlay.onclick = (e) => { if (e.target === overlay) close(false); };

    row.appendChild(noBtn);
    row.appendChild(yesBtn);
    card.appendChild(title);
    card.appendChild(text);
    card.appendChild(row);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  });
}

// 1g. KLEINES X ZUM LÖSCHEN
function createDeleteX(onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.innerHTML = '✕';
  btn.setAttribute('aria-label', 'Delete');
  btn.style.position = 'absolute';
  btn.style.width = '26px';
  btn.style.height = '26px';
  btn.style.padding = '0';
  btn.style.borderRadius = '50%';
  btn.style.border = '1px solid #c9a9b4';
  btn.style.background = 'rgba(255, 255, 255, 0.92)';
  btn.style.color = '#9b6b7a';
  btn.style.fontSize = '0.7rem';
  btn.style.lineHeight = '1';
  btn.style.cursor = 'pointer';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.zIndex = '5';
  btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
  btn.onclick = (e) => {
    e.stopPropagation();
    onClick();
  };
  return btn;
}

// 1h. LÖSCHEN
async function deleteUsMoment(id, wrapElement) {
  const confirmed = await askConfirm('Do you really want to delete this photo from your pinboard?');
  if (!confirmed) return;

  const { error } = await supabaseClient.from('us_moments').delete().eq('id', id);
  if (error) return alert(error.message);

  if (wrapElement) wrapElement.remove();
  loadUs();
}

async function deleteOurDayEntry(id, entryElement) {
  const confirmed = await askConfirm('Do you really want to delete this moment?');
  if (!confirmed) return;

  const { error } = await supabaseClient.from('our_day').delete().eq('id', id);
  if (error) return alert(error.message);

  if (entryElement) entryElement.remove();

  // Detail-Ansicht schließen, wenn nichts mehr übrig ist
  const remaining = document.querySelectorAll('#dayViewImages .day-img-wrapper').length;
  if (remaining === 0) {
    document.getElementById('dayView').classList.remove('open');
  }

  loadOurDay();
}

// 1i. BILD IN GROSS (Lightbox)
function openImageViewer(src) {
  if (!src) return;

  const overlay = document.createElement('div');
  overlay.className = 'letter-view open';
  overlay.style.zIndex = '10060';
  overlay.style.background = 'rgba(74, 64, 72, 0.9)';
  overlay.style.padding = '0';
  overlay.style.cursor = 'zoom-out';

  const img = document.createElement('img');
  img.src = src;
  img.style.maxWidth = '92vw';
  img.style.maxHeight = '86vh';
  img.style.width = 'auto';
  img.style.height = 'auto';
  img.style.objectFit = 'contain';
  img.style.border = '6px solid #fdfaf2';
  img.style.borderRadius = '6px';
  img.style.boxShadow = '0 14px 44px rgba(0, 0, 0, 0.5)';
  img.style.cursor = 'zoom-out';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.className = 'close-btn';
  closeBtn.style.top = '18px';
  closeBtn.style.right = '18px';
  closeBtn.style.width = '34px';
  closeBtn.style.height = '34px';
  closeBtn.style.background = 'rgba(255, 255, 255, 0.92)';

  const onKey = (event) => {
    if (event.key === 'Escape') close();
  };

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };

  overlay.onclick = close;
  closeBtn.onclick = (event) => {
    event.stopPropagation();
    close();
  };
  document.addEventListener('keydown', onKey);

  overlay.appendChild(img);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}

// 2. TAB WECHSEL
// Oben nur Inbox / Sent / More, der Rest steckt im "More"-Menü
const MORE_TABS = ['myday', 'secrets', 'us', 'bucketlist', 'watchlist'];

function closeMoreMenu() {
  const menu = document.getElementById('more-menu');
  if (menu) menu.classList.remove('is-open');
}

window.toggleMoreMenu = () => {
  const menu = document.getElementById('more-menu');
  if (!menu) return;
  menu.classList.toggle('is-open');
};

window.switchTab = (tabName) => {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

  const pageMap = {
    inbox: 'page-inbox',
    sent: 'page-sent',
    myday: 'page-myday',
    secrets: 'page-secrets',
    us: 'page-us',
    bucketlist: 'page-bucketlist',
    watchlist: 'page-watchlist'
  };

  const pageId = pageMap[tabName];
  if (pageId) {
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
  }

  // Oben leuchten nur Inbox / Sent, der More-Button bei den übrigen Seiten
  const inboxBtn = document.getElementById('tab-inbox');
  const sentBtn = document.getElementById('tab-sent');
  const moreBtn = document.getElementById('tab-more');

  if (inboxBtn) inboxBtn.classList.toggle('active', tabName === 'inbox');
  if (sentBtn) sentBtn.classList.toggle('active', tabName === 'sent');
  if (moreBtn) moreBtn.classList.toggle('active', MORE_TABS.indexOf(tabName) !== -1);

  // Eintrag im More-Menü markieren
  document.querySelectorAll('.more-item[data-tab]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
  });

  closeMoreMenu();

  if (tabName === 'inbox' || tabName === 'sent') loadLetters();
  if (tabName === 'secrets') loadSecrets();
  if (tabName === 'us') loadUs();
  if (tabName === 'myday') loadOurDay();
  if (tabName === 'bucketlist') loadBucketList();
  if (tabName === 'watchlist') loadWatchList();
};

// 3. FAB & FORMULARE ÖFFNEN
window.toggleFab = () => {
  const menu = document.getElementById('fab-menu');
  const btn = document.getElementById('fab-btn');
  if (menu && btn) {
    menu.classList.toggle('active');
    btn.style.transform = menu.classList.contains('active') ? 'rotate(45deg)' : 'rotate(0deg)';
  }
};

window.openAddModal = (type) => {
  toggleFab();
  if (type === 'letter') document.getElementById('addLetterView').classList.add('open');
  if (type === 'us') document.getElementById('addUsView').classList.add('open');
  if (type === 'ourday') document.getElementById('addOurDayView').classList.add('open');
  if (type === 'secret') document.getElementById('addSecretView').classList.add('open');
  if (type === 'bucket') document.getElementById('addBucketView').classList.add('open');
  if (type === 'watch') document.getElementById('addWatchView').classList.add('open');
};

// 4. ROLLE & APP ANZEIGEN
window.setRole = (role) => {
  currentRole = role;
  localStorage.setItem('luvu_role', role);
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('btn-aly').classList.remove('active');
  document.getElementById('btn-sebo').classList.remove('active');
  document.getElementById('btn-' + role.toLowerCase()).classList.add('active');

  // gemerkte E-Mail dieser Rolle vorausfüllen
  const emailInput = document.getElementById('email-input');
  const knownMail = emailForRole(role);
  const rememberedMail = localStorage.getItem('luvu_email_' + role);
  const remembered = knownMail || rememberedMail || '';
  if (emailInput) {
    if (remembered) {
      emailInput.value = remembered;
    } else if (roleFromEmail(emailInput.value)) {
      // Mail der anderen Person steht noch drin -> wegräumen
      emailInput.value = '';
    }
  }

  // letzte "angemeldet bleiben"-Einstellung wiederherstellen
  const rememberBox = document.getElementById('remember-me');
  if (rememberBox) {
    const savedChoice = localStorage.getItem(REMEMBER_KEY);
    rememberBox.checked = savedChoice === null ? true : savedChoice === '1';
  }

  // gemerktes Passwort einsetzen
  const pwFilled = fillStoredPassword(role);
  const face = role === 'Aly' ? '👩' : '👨';
  setLoginMessage(
    pwFilled ? `Logging in as ${role} ${face} · password filled in` : `Logging in as ${role} ${face}`,
    false
  );
};

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
  const fabMenu = document.getElementById('fab-menu');
  if(!fabMenu) return;
  fabMenu.innerHTML = ''; 
  
  if (currentRole === 'Aly') {
    fabMenu.innerHTML = `
      <button class="fab-item" onclick="openAddModal('letter')">💌 Letter</button>
      <button class="fab-item" onclick="openAddModal('us')">📸 Us Moment</button>
      <button class="fab-item" onclick="openAddModal('ourday')">☀️ Our Day</button>
      <button class="fab-item" onclick="openAddModal('secret')">💌 Secret</button>
      <button class="fab-item" onclick="openAddModal('bucket')">🪣 Bucket List</button>
      <button class="fab-item" onclick="openAddModal('watch')">🍿 Watchlist</button>
    `;
  } else if (currentRole === 'Sebo') {
    fabMenu.innerHTML = `
      <button class="fab-item" onclick="openAddModal('letter')">💌 Letter</button>
      <button class="fab-item" onclick="openAddModal('us')">📸 Us Moment</button>
      <button class="fab-item" onclick="openAddModal('ourday')">☀️ Our Day</button>
      <button class="fab-item" onclick="openAddModal('secret')">💌 Secret</button>
      <button class="fab-item" onclick="openAddModal('bucket')">🪣 Bucket List</button>
      <button class="fab-item" onclick="openAddModal('watch')">🍿 Watchlist</button>
    `;
  }
  
  loadLetters();
  loadSecrets();
  loadUs();
  loadOurDay();
  loadBucketList();
  loadWatchList();
}

window.logout = async () => {
  // Rolle bleibt gemerkt, damit das Gerät die Person wiedererkennt
  sessionStorage.removeItem(TAB_SESSION_KEY);
  await supabaseClient.auth.signOut({ scope: 'local' });
  window.location.reload();
};

// 5. LOGIN
async function doLogin() {
  const email = normalizeEmail(document.getElementById('email-input').value);
  const password = document.getElementById('password-input').value;

  if (!currentRole) return setLoginMessage('Please choose who you are first.');
  if (!email || !password) return setLoginMessage('Please enter your email and password.');

  // Diese Mail gehört zur anderen Person?
  const mailRole = roleFromEmail(email);
  if (mailRole && mailRole !== currentRole) {
    return setLoginMessage(`That email belongs to ${mailRole}. Please pick ${mailRole} above.`);
  }

  setLoginMessage('Logging in…', false);
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return setLoginMessage(error.message);

  // Konto schon an die andere Rolle gebunden?
  const boundRole = roleFromUser(data.user);
  if (boundRole && boundRole !== currentRole) {
    await supabaseClient.auth.signOut({ scope: 'local' });
    return setLoginMessage(`This account is ${boundRole}'s. Please pick ${boundRole} above.`);
  }

  // Erstes Login dieses Kontos -> Rolle dauerhaft an das Konto binden
  if (!boundRole) {
    const ok = confirm(`This account will be linked to ${currentRole} from now on. Continue?`);
    if (!ok) {
      await supabaseClient.auth.signOut({ scope: 'local' });
      return setLoginMessage('Login cancelled.', false);
    }
    const { error: metaError } = await supabaseClient.auth.updateUser({ data: { role: currentRole } });
    if (metaError) return setLoginMessage(metaError.message);
  }

  // "angemeldet bleiben" merken
  const rememberBox = document.getElementById('remember-me');
  const keepLoggedIn = rememberBox ? rememberBox.checked : true;
  localStorage.setItem(REMEMBER_KEY, keepLoggedIn ? '1' : '0');
  sessionStorage.setItem(TAB_SESSION_KEY, '1');

  // "Passwort merken"
  const pwBox = document.getElementById('remember-password');
  const rememberPw = pwBox ? pwBox.checked : false;
  localStorage.setItem(SAVE_PW_KEY, rememberPw ? '1' : '0');
  if (rememberPw) {
    savePasswordLocally(currentRole, password);
  } else {
    clearStoredPassword(currentRole);
  }

  localStorage.setItem('luvu_email_' + currentRole, email);
  localStorage.setItem('luvu_role', currentRole);
  setLoginMessage('', false);
  showApp();
}

async function doSignup() {
  const email = normalizeEmail(document.getElementById('email-input').value);
  const password = document.getElementById('password-input').value;

  if (!currentRole) return setLoginMessage('Please choose who you are first.');
  if (!email || !password) return setLoginMessage('Please enter an email and password.');

  const mailRole = roleFromEmail(email);
  if (mailRole && mailRole !== currentRole) {
    return setLoginMessage(`That email belongs to ${mailRole}. Please pick ${mailRole} above.`);
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { role: currentRole } } // Rolle direkt mitspeichern
  });

  if (error) {
    setLoginMessage(error.message);
  } else {
    localStorage.setItem('luvu_email_' + currentRole, email);
    setLoginMessage('Check your emails for a confirmation link!', false);
  }
}

// Start-Logik (Auto-Login nur wenn "angemeldet bleiben" aktiv war)
async function initAuth() {
  let session = null;
  try {
    const { data } = await supabaseClient.auth.getSession();
    session = data ? data.session : null;
  } catch (e) {
    session = null;
  }
  const user = session ? session.user : null;

  const rememberedChoice = localStorage.getItem(REMEMBER_KEY);
  const tabStillOpen = sessionStorage.getItem(TAB_SESSION_KEY) === '1';

  // Angemeldet, aber "angemeldet bleiben" war aus und die App wurde neu gestartet
  if (user && rememberedChoice === '0' && !tabStillOpen) {
    try { await supabaseClient.auth.signOut({ scope: 'local' }); } catch (e) {}
    session = null;
  }

  const activeUser = session ? session.user : null;
  const role = activeUser ? roleFromUser(activeUser) : null;

  // Bekannte Rolle -> direkt in die App
  if (role && activeUser) {
    currentRole = role;
    localStorage.setItem('luvu_role', role);
    if (activeUser.email) localStorage.setItem('luvu_email_' + role, normalizeEmail(activeUser.email));
    sessionStorage.setItem(TAB_SESSION_KEY, '1');
    showApp();
    return;
  }

  // Sonst: zuletzt benutzte Rolle auf dem Login-Screen vorwählen
  const rememberedRole = localStorage.getItem('luvu_role');
  if (rememberedRole === 'Aly' || rememberedRole === 'Sebo') {
    setRole(rememberedRole);
  } else {
    // Keine Rolle gemerkt -> Passwort-Häkchen trotzdem richtig setzen
    const pwBox = document.getElementById('remember-password');
    if (pwBox) pwBox.checked = shouldRememberPassword();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').addEventListener('click', doLogin);
  document.getElementById('signup-btn').addEventListener('click', doSignup);

  // Häkchen "Passwort merken" reagiert sofort
  const pwBoxEl = document.getElementById('remember-password');
  if (pwBoxEl) {
    pwBoxEl.addEventListener('change', () => {
      localStorage.setItem(SAVE_PW_KEY, pwBoxEl.checked ? '1' : '0');
      if (!currentRole) return;
      if (pwBoxEl.checked) {
        fillStoredPassword(currentRole);
        setLoginMessage(`Logging in as ${currentRole} · password filled in`, false);
      } else {
        clearStoredPassword(currentRole);
        const pwInput = document.getElementById('password-input');
        if (pwInput) pwInput.value = '';
        setLoginMessage(`Logging in as ${currentRole}`, false);
      }
    });
  }

  // More-Menü-Button (per Listener, unabhängig vom HTML)
  const moreBtnEl = document.getElementById('tab-more');
  if (moreBtnEl) {
    moreBtnEl.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleMoreMenu();
    });
  }

  // More-Menü schließt sich beim Klick daneben
  document.addEventListener('click', (event) => {
    const menu = document.getElementById('more-menu');
    if (!menu || !menu.classList.contains('is-open')) return;
    if (menu.contains(event.target)) return;
    const btn = document.getElementById('tab-more');
    if (btn && btn.contains(event.target)) return;
    closeMoreMenu();
  });

  initAuth();
});

// 6. HELFER: BILD HOCHLADEN
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
    img.src = src;
  });
}

// verkleinert auf max. 1200 px Breite und komprimiert als JPEG (75 %)
async function compressImage(file, maxWidth = 1200, quality = 0.75) {
  try {
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImageElement(dataUrl);

    const scale = img.width > maxWidth ? maxWidth / img.width : 1;
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch (e) {
    // z. B. HEIC/RAW, das der Browser nicht zeichnen kann -> Original verwenden
    console.warn('Komprimierung fehlgeschlagen, Original wird benutzt:', e);
    return file;
  }
}

async function uploadImage(file) {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const { data, error } = await supabaseClient.storage.from('images').upload(fileName, file);
  if (error) { alert("Bild-Upload Fehler: " + error.message); return null; }
  const { data: publicUrl } = supabaseClient.storage.from('images').getPublicUrl(fileName);
  return publicUrl.publicUrl;
}

// 7. SPEICHERN
window.submitLetter = async () => {
  const title = document.getElementById('new-letter-title').value;
  const body = document.getElementById('new-letter-body').value;
  if (!title || !body) return alert("Bitte ausfüllen!");
  // sender = wer gerade schreibt
  const { error } = await supabaseClient.from('letters').insert([{ title, body, sender: currentRole }]);
  if (error) alert(error.message);
  else {
    document.getElementById('addLetterView').classList.remove('open');
    document.getElementById('new-letter-title').value = '';
    document.getElementById('new-letter-body').value = '';
    loadLetters();
  }
};

// "Us"-Bilder bleiben in voller Qualität
window.submitUsMoment = async () => {
  const file = document.getElementById('us-image').files[0];
  if (!file) return alert("Bitte Bild auswählen!");
  const imgUrl = await uploadImage(file);
  if (!imgUrl) return;
  const { error } = await supabaseClient.from('us_moments').insert([{ image_url: imgUrl, sender: currentRole }]);
  if (error) alert(error.message);
  else { document.getElementById('addUsView').classList.remove('open'); loadUs(); }
};

// "Our Day"-Bilder werden vor dem Upload komprimiert (1200 px / 75 %)
window.submitOurDay = async () => {
  const date = document.getElementById('ourday-date').value;
  const file = document.getElementById('ourday-image').files[0];
  const text = document.getElementById('ourday-text').value;
  if (!date || !file || !text) return alert("Bitte alles ausfüllen!");

  const compressed = await compressImage(file, 1200, 0.75);
  const imgUrl = await uploadImage(compressed);
  if (!imgUrl) return;

  const { error } = await supabaseClient.from('our_day').insert([{ date, image_url: imgUrl, text, sender: currentRole }]);
  if (error) alert(error.message);
  else { document.getElementById('addOurDayView').classList.remove('open'); loadOurDay(); }
};

window.submitSecret = async () => {
  const text = document.getElementById('secret-text').value;
  if (!text) return alert("Bitte Text eingeben!");
  const { error } = await supabaseClient.from('secrets').insert([{ text, sender: currentRole }]);
  if (error) alert(error.message);
  else { document.getElementById('addSecretView').classList.remove('open'); loadSecrets(); }
};

// 8. LADEN & ANZEIGEN
// Briefe werden auf zwei Bereiche verteilt (Inbox / Sent)
async function loadLetters() {
  const { data, error } = await supabaseClient.from('letters').select('*').order('created_at', { ascending: false });
  if (error) return;

  const allLetters = data || [];
  renderLetters('inbox', allLetters.filter(letter => letter.sender !== currentRole));
  renderLetters('sent', allLetters.filter(letter => letter.sender === currentRole));
}

function renderLetters(kind, letters) {
  const isInbox = kind === 'inbox';
  const container = document.getElementById(isInbox ? 'inboxEnvelopes' : 'sentEnvelopes');
  const subtitle = document.getElementById(isInbox ? 'inboxSubtitle' : 'sentSubtitle');
  if (!container) return;

  if (subtitle) {
    subtitle.textContent = isInbox
      ? `letters from ${otherRole(currentRole)}`
      : 'letters you wrote';
  }

  container.innerHTML = '';

  if (letters.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'subtitle';
    empty.style.marginTop = '40px';
    empty.textContent = isInbox ? 'no letters yet 💌' : 'nothing written yet 💌';
    container.appendChild(empty);
    return;
  }

  letters.forEach(letter => {
    const wrap = document.createElement('div');
    wrap.className = 'envelope-wrap';

    // Delivered/Read gibt es NUR im "Sent"-Tab und NUR bei Aly
    let badgeHtml = '';
    if (!isInbox && currentRole === 'Aly') {
      badgeHtml = letter.is_read
        ? `<div class="envelope-badge read">✓✓ Read</div>`
        : `<div class="envelope-badge delivered">✓ Delivered</div>`;
    }

    wrap.onclick = async () => {
      document.getElementById('letterTitle').textContent = letter.title;
      document.getElementById('letterBody').textContent = letter.body;

      const statusDiv = document.getElementById('letterStatus');
      if (!isInbox && currentRole === 'Aly') {
        statusDiv.innerHTML = letter.is_read ? '✓✓ Read by Sebo' : '✓ Delivered';
        statusDiv.style.color = letter.is_read ? '#4a90e2' : '#aaa';
      } else if (isInbox) {
        statusDiv.innerHTML = `from ${letter.sender} 💌`;
        statusDiv.style.color = '#5b7ba8';
      } else {
        statusDiv.innerHTML = '';
      }

      document.getElementById('letterView').classList.add('open');

      // Empfänger markiert eingegangene Briefe als gelesen
      if (isInbox && !letter.is_read) {
        await supabaseClient.from('letters').update({ is_read: true }).eq('id', letter.id);
        loadLetters();
      }
    };

    wrap.innerHTML = `
      <div class="envelope">
        <div class="paper">💌</div>
        <div class="flap"></div>
        <div class="pocket"></div>
        <div class="seal">🐧</div>
        <div class="envelope-title">${letter.title}</div>
        ${badgeHtml}
      </div>
    `;
    container.appendChild(wrap);
  });
}

async function loadSecrets() {
  const stackContainer = document.getElementById('heartsStack');
  const readContainer = document.getElementById('readSecretsList');
  if(!stackContainer || !readContainer) return;
  
  const { data, error } = await supabaseClient.from('secrets').select('*').neq('sender', currentRole).order('created_at', { ascending: false });
  if (error) return;
  
  stackContainer.innerHTML = '';
  readContainer.innerHTML = '';
  
  const unreadSecrets = data.filter(secret => !secret.is_read);
  const readSecrets = data.filter(secret => secret.is_read);

  unreadSecrets.forEach((secret, index) => {
    const heart = document.createElement('div');
    heart.className = 'secret-heart unread';
    
    const randomRotation = (Math.random() * 30) - 15;
    const randomOffset = (Math.random() * 20) - 10;
    heart.style.transform = `rotate(${randomRotation}deg) translateX(${randomOffset}px)`;
    heart.style.zIndex = unreadSecrets.length - index;

    heart.innerHTML = '💌';

    heart.onclick = async () => {
      document.getElementById('secretBody').innerHTML = secret.text.replace(/\n/g, '<br>');
      document.getElementById('secretView').classList.add('open');
      
      await supabaseClient.from('secrets').update({ is_read: true }).eq('id', secret.id);
      loadSecrets();
    };

    stackContainer.appendChild(heart);
  });

  if (readSecrets.length > 0) {
    const title = document.createElement('p');
    title.className = 'subtitle';
    title.style.marginTop = '40px';
    title.style.marginBottom = '15px';
    title.textContent = 'past secrets';
    readContainer.appendChild(title);

    readSecrets.forEach(secret => {
      const div = document.createElement('div');
      div.className = 'read-secret-card';
      div.onclick = () => {
        document.getElementById('secretBody').innerHTML = secret.text.replace(/\n/g, '<br>');
        document.getElementById('secretView').classList.add('open');
      };
      div.innerHTML = `<span style="font-family: 'Caveat', cursive; font-size: 1.4rem; color: #9b6b7a;">💌 A little secret</span> <span style="font-size: 0.9rem; color: #aaa;">(click to read)</span>`;
      readContainer.appendChild(div);
    });
  }
}

// jedes Pinboard-Foto mit X zum Löschen, Tippen = Großansicht
async function loadUs() {
  const container = document.getElementById('pinboard');
  if(!container) return;
  const { data, error } = await supabaseClient.from('us_moments').select('*').order('created_at', { ascending: false });
  if (error) return;
  container.innerHTML = '';
  data.forEach(moment => {
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.style.display = 'inline-block';

    const img = document.createElement('img');
    img.src = moment.image_url;
    img.className = 'pinned-photo';
    img.style.cursor = 'zoom-in';
    img.onclick = (event) => {
      event.stopPropagation();
      openImageViewer(moment.image_url);
    };

    const delBtn = createDeleteX(() => deleteUsMoment(moment.id, wrap));
    delBtn.style.top = '16px';
    delBtn.style.right = '16px';

    wrap.appendChild(img);
    wrap.appendChild(delBtn);
    container.appendChild(wrap);
  });
}

// Our-Day-Einträge: Aly links, Sebo rechts – je Spalte untereinander
async function loadOurDay() {
  const container = document.getElementById('daysList');
  if(!container) return;
  
  const { data, error } = await supabaseClient.from('our_day').select('*').order('date', { ascending: false });
  if (error) return;
  container.innerHTML = '';
  
  const groupedByDate = {};
  data.forEach(entry => {
    if (!groupedByDate[entry.date]) {
      groupedByDate[entry.date] = [];
    }
    groupedByDate[entry.date].push(entry);
  });

  for (const date in groupedByDate) {
    const entries = groupedByDate[date];

    const div = document.createElement('div');
    div.className = 'day-card';
    
    div.onclick = () => {
      document.getElementById('dayViewDate').textContent = `📅 ${date}`;

      const imagesContainer = document.getElementById('dayViewImages');
      imagesContainer.innerHTML = '';

      // zwei feste Spalten -> Aly links, Sebo rechts
      const columns = [
        { entries: entries.filter(entry => entry.sender !== 'Sebo') },
        { entries: entries.filter(entry => entry.sender === 'Sebo') }
      ];

      columns.forEach(column => {
        if (column.entries.length === 0) return;

        const col = document.createElement('div');
        col.style.flex = '1 1 0';
        col.style.minWidth = '0';
        col.style.display = 'flex';
        col.style.flexDirection = 'column';
        col.style.alignItems = 'stretch';
        col.style.gap = '16px';

        // ältester Eintrag oben, neuester unten
        const sorted = column.entries.slice().sort((a, b) => {
          return String(a.created_at || '').localeCompare(String(b.created_at || ''));
        });

        sorted.forEach(entry => {
          const imgWrap = document.createElement('div');
          imgWrap.className = 'day-img-wrapper';
          imgWrap.style.position = 'relative';
          imgWrap.style.flex = '0 0 auto';
          imgWrap.style.width = '100%';
          imgWrap.style.minWidth = '0';

          const img = document.createElement('img');
          img.src = entry.image_url;
          img.className = 'day-image-detail';
          img.style.cursor = 'zoom-in';
          img.onclick = (event) => {
            event.stopPropagation();
            openImageViewer(entry.image_url);
          };

          const sender = document.createElement('span');
          sender.className = 'day-img-sender';
          sender.textContent = entry.sender;

          const entryText = document.createElement('p');
          entryText.className = 'day-img-text';
          entryText.textContent = entry.text;

          const delBtn = createDeleteX(() => deleteOurDayEntry(entry.id, imgWrap));
          delBtn.style.top = '8px';
          delBtn.style.right = '8px';

          imgWrap.appendChild(img);
          imgWrap.appendChild(delBtn);
          imgWrap.appendChild(sender);
          imgWrap.appendChild(entryText);
          col.appendChild(imgWrap);
        });

        imagesContainer.appendChild(col);
      });

      document.getElementById('dayViewText').textContent = '';
      document.getElementById('dayView').classList.add('open');
    };

    // Nur noch das Datum im Kasten
    div.innerHTML = `
      <div class="day-date" style="margin-bottom: 0;">📅 ${date}</div>
    `;
    container.appendChild(div);
  }
}

// 9. BUCKET LIST
let bucketItems = [];
let currentBucketFilter = 'all';
let currentBucketItem = null;

async function loadBucketList() {
  const { data, error } = await supabaseClient.from('bucket_list').select('*').order('created_at', { ascending: false });
  if (error) {
    console.warn('Bucket List konnte nicht geladen werden:', error.message);
    return;
  }
  bucketItems = data || [];
  renderBucketList();
}

function updateBucketFilterButtons() {
  document.querySelectorAll('#bucketFilter .nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-place') === currentBucketFilter);
  });
}

window.filterBucketList = (place) => {
  currentBucketFilter = place || 'all';
  updateBucketFilterButtons();
  renderBucketList();
};

function renderBucketList() {
  const container = document.getElementById('bucketList');
  if (!container) return;
  container.innerHTML = '';

  const items = bucketItems.filter(item => {
    if (currentBucketFilter === 'all') return true;
    return String(item.place || '') === currentBucketFilter;
  });

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'subtitle';
    empty.style.marginTop = '40px';
    empty.textContent = currentBucketFilter === 'all'
      ? 'nothing on the list yet 🐧'
      : `nothing for ${currentBucketFilter} yet 🐧`;
    container.appendChild(empty);
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'bucket-card';
    if (item.is_done === true) card.classList.add('is-done');
    card.onclick = () => openBucketItem(item);

    // links: Bild oder Pinguin
    const thumb = document.createElement('div');
    thumb.className = 'bucket-thumb';
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.title || '';
      thumb.appendChild(img);
    } else {
      thumb.classList.add('bucket-thumb-emoji');
      thumb.textContent = '🐧';
    }

    const textWrap = document.createElement('div');
    textWrap.className = 'bucket-text';

    const title = document.createElement('div');
    title.className = 'bucket-title';
    title.textContent = item.title || '';

    const place = document.createElement('div');
    place.className = 'bucket-place';
    place.textContent = item.place ? `📍 ${item.place}` : '';

    textWrap.appendChild(title);
    textWrap.appendChild(place);

    card.appendChild(thumb);
    card.appendChild(textWrap);

    if (item.is_done === true) {
      const doneBadge = document.createElement('div');
      doneBadge.className = 'bucket-done-badge';
      doneBadge.textContent = '✓ done';
      card.appendChild(doneBadge);
    }

    container.appendChild(card);
  });
}

function openBucketItem(item) {
  currentBucketItem = item;
  document.getElementById('bucketViewTitle').textContent = item.title || '';
  document.getElementById('bucketViewPlace').textContent = item.place ? `📍 ${item.place}` : '';

  const img = document.getElementById('bucketViewImage');
  if (item.image_url) {
    img.src = item.image_url;
    img.style.display = 'block';
    img.style.cursor = 'zoom-in';
    img.onclick = () => openImageViewer(item.image_url);
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
    img.onclick = null;
  }

  document.getElementById('bucketViewDetails').textContent = item.details || '';
  renderBucketDoneState(item);
  document.getElementById('bucketView').classList.add('open');
}

window.submitBucketItem = async () => {
  const fileInput = document.getElementById('bucket-image');
  const titleInput = document.getElementById('bucket-title');
  const detailsInput = document.getElementById('bucket-details');
  const placeInput = document.getElementById('bucket-place');

  const file = fileInput.files[0];
  const title = titleInput.value.trim();
  const details = detailsInput.value.trim();
  const place = placeInput.value;

  if (!title) return alert('Please add an activity 💌');
  if (!place) return alert('Please choose a place 📍');

  let imageUrl = null;
  if (file) {
    const compressed = await compressImage(file, 1000, 0.8);
    imageUrl = await uploadImage(compressed);
    if (!imageUrl) return;
  }

  const { error } = await supabaseClient.from('bucket_list').insert([{
    title,
    details,
    place,
    image_url: imageUrl,
    sender: currentRole
  }]);

  if (error) return alert(error.message);

  document.getElementById('addBucketView').classList.remove('open');
  titleInput.value = '';
  detailsInput.value = '';
  fileInput.value = '';

  currentBucketFilter = 'all';
  updateBucketFilterButtons();
  loadBucketList();
  switchTab('bucketlist');
};

// 9b. ERLEDIGT + ERINNERUNGSFOTOS
function renderBucketDoneState(item) {
  const doneBtn = document.getElementById('bucketDoneBtn');
  const photosWrap = document.getElementById('bucketPhotos');
  const isDone = item.is_done === true;

  if (doneBtn) {
    doneBtn.textContent = isDone ? '↩ not done yet' : '✓ mark as done';
    doneBtn.classList.toggle('active', !isDone);
  }

  if (!photosWrap) return;
  photosWrap.innerHTML = '';

  const photos = Array.isArray(item.photos) ? item.photos : [];

  // Hinweis, solange noch keine Erinnerung hinterlegt ist
  if (photos.length === 0) {
    const hint = document.createElement('p');
    hint.className = 'subtitle';
    hint.style.margin = '0';
    hint.style.fontSize = '0.9rem';
    hint.textContent = '🐧 no photos yet – add at least one to finish it';
    photosWrap.appendChild(hint);
    return;
  }

  photos.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = item.title || '';
    img.onclick = () => openImageViewer(url);
    photosWrap.appendChild(img);
  });
}

function syncCurrentBucketItem() {
  if (!currentBucketItem) return;
  const fresh = bucketItems.find(entry => entry.id === currentBucketItem.id);
  if (fresh) currentBucketItem = fresh;
}

window.toggleBucketDone = async () => {
  if (!currentBucketItem) return;

  const photos = Array.isArray(currentBucketItem.photos) ? currentBucketItem.photos : [];
  const isDone = currentBucketItem.is_done === true;

  // ohne mindestens eine Erinnerung lässt sich nichts abhaken
  if (!isDone && photos.length === 0) {
    return alert('Add at least one memory photo first 📸');
  }

  const newValue = !isDone;
  const { error } = await supabaseClient
    .from('bucket_list')
    .update({ is_done: newValue })
    .eq('id', currentBucketItem.id);

  if (error) return alert(error.message);

  currentBucketItem.is_done = newValue;
  renderBucketDoneState(currentBucketItem);

  await loadBucketList();
  syncCurrentBucketItem();
};

window.submitBucketPhotos = async () => {
  if (!currentBucketItem) return;

  const input = document.getElementById('bucket-photo-input');
  const files = input && input.files ? Array.from(input.files) : [];
  if (files.length === 0) return alert('Please choose at least one photo 📸');

  const photos = Array.isArray(currentBucketItem.photos) ? currentBucketItem.photos.slice() : [];

  for (const file of files) {
    const compressed = await compressImage(file, 1200, 0.65);
    const url = await uploadImage(compressed);
    if (url) photos.push(url);
  }

  const { error } = await supabaseClient
    .from('bucket_list')
    .update({ photos: photos })
    .eq('id', currentBucketItem.id);

  if (error) return alert(error.message);

  currentBucketItem.photos = photos;
  if (input) input.value = '';
  renderBucketDoneState(currentBucketItem);

  await loadBucketList();
  syncCurrentBucketItem();
};

// 9c. BUCKET-LIST-EINTRAG LÖSCHEN (auch wenn schon erledigt)
function extractStorageFileName(url) {
  if (!url) return null;
  const marker = '/images/';
  const index = String(url).indexOf(marker);
  if (index === -1) return null;
  const name = String(url).slice(index + marker.length).split('?')[0];
  return name || null;
}

window.deleteBucketItem = async () => {
  if (!currentBucketItem) return;

  const confirmed = await askConfirm('Do you really want to delete this bucket list idea?');
  if (!confirmed) return;

  const item = currentBucketItem;
  const photos = Array.isArray(item.photos) ? item.photos.slice() : [];

  const { error } = await supabaseClient.from('bucket_list').delete().eq('id', item.id);
  if (error) return alert(error.message);

  // Best effort: zugehörige Bilder zusätzlich aus dem Storage räumen
  const filesToRemove = photos.concat(item.image_url ? [item.image_url] : [])
    .map(extractStorageFileName)
    .filter(Boolean);

  if (filesToRemove.length > 0) {
    try {
      await supabaseClient.storage.from('images').remove(filesToRemove);
    } catch (e) {
      // egal – der Eintrag ist gelöscht, das ist der wichtige Teil
    }
  }

  currentBucketItem = null;
  document.getElementById('bucketView').classList.remove('open');
  loadBucketList();
};

// 10. WATCHLIST (Serien / Filme / Anime)
let watchItems = [];
let selectedWatchResult = null;

async function loadWatchList() {
  const { data, error } = await supabaseClient.from('watchlist').select('*').order('created_at', { ascending: false });
  if (error) {
    console.warn('Watchlist konnte nicht geladen werden:', error.message);
    return;
  }
  watchItems = data || [];
  renderWatchList();
}

function buildRatingRow(item, name) {
  const row = document.createElement('div');
  row.className = 'watch-rating-row';

  const label = document.createElement('span');
  label.className = 'watch-name';
  label.textContent = name;

  const stars = document.createElement('span');
  stars.className = 'watch-stars';

  const value = name === 'Aly' ? item.rating_aly : item.rating_sebo;
  const canRate = item.is_watched === true && name === currentRole;

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'watch-star';
    const filled = value && i <= value;
    star.textContent = filled ? '★' : '☆';
    if (filled) star.classList.add('filled');
    if (canRate) {
      star.classList.add('clickable');
      star.onclick = (event) => {
        event.stopPropagation();
        setWatchRating(item, i);
      };
    }
    stars.appendChild(star);
  }

  row.appendChild(label);
  row.appendChild(stars);
  return row;
}

function renderWatchList() {
  const container = document.getElementById('watchList');
  if (!container) return;
  container.innerHTML = '';

  if (watchItems.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'subtitle';
    empty.style.marginTop = '40px';
    empty.textContent = 'nothing on the watchlist yet 🍿';
    container.appendChild(empty);
    return;
  }

  watchItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'watch-card';
    if (item.is_watched !== true) card.classList.add('not-watched');

    // links: Cover (oder Filmklappe)
    const poster = document.createElement('div');
    poster.className = 'watch-poster';
    if (item.poster_url) {
      const img = document.createElement('img');
      img.src = item.poster_url;
      img.alt = item.title || '';
      poster.appendChild(img);
    } else {
      poster.textContent = '🎬';
    }

    const info = document.createElement('div');
    info.className = 'watch-info';

    const title = document.createElement('div');
    title.className = 'watch-title';
    title.textContent = item.title || '';

    const meta = document.createElement('div');
    meta.className = 'watch-meta';
    const metaParts = [item.is_watched === true ? 'watched ✓' : 'to watch'];
    if (item.year) metaParts.push(item.year);
    if (item.media_type === 'tv') metaParts.push('Series');
    else if (item.media_type === 'movie') metaParts.push('Movie');
    meta.textContent = metaParts.join(' · ');

    const ratings = document.createElement('div');
    ratings.className = 'watch-ratings';
    ratings.appendChild(buildRatingRow(item, 'Aly'));
    ratings.appendChild(buildRatingRow(item, 'Sebo'));

    const watchedBtn = document.createElement('button');
    watchedBtn.className = 'watch-watched-btn';
    if (item.is_watched === true) watchedBtn.classList.add('is-on');
    watchedBtn.textContent = item.is_watched === true ? '↩ not watched yet' : '✓ mark as watched';
    watchedBtn.onclick = (event) => {
      event.stopPropagation();
      toggleWatchWatched(item);
    };

    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(ratings);
    info.appendChild(watchedBtn);

    card.appendChild(poster);
    card.appendChild(info);
    container.appendChild(card);
  });
}

async function setWatchRating(item, value) {
  const column = currentRole === 'Aly' ? 'rating_aly' : 'rating_sebo';
  const payload = {};
  payload[column] = value;

  const { error } = await supabaseClient.from('watchlist').update(payload).eq('id', item.id);
  if (error) return alert(error.message);

  await loadWatchList();
}

async function toggleWatchWatched(item) {
  const { error } = await supabaseClient
    .from('watchlist')
    .update({ is_watched: item.is_watched !== true })
    .eq('id', item.id);

  if (error) return alert(error.message);

  await loadWatchList();
}

// --- TMDB-Suche ---------------------------------------------------------
function tmdbConfigured() {
  return typeof TMDB_API_KEY === 'string' && TMDB_API_KEY.trim().length > 0;
}

function tmdbPosterUrl(path) {
  return path ? 'https://image.tmdb.org/t/p/w342' + path : null;
}

async function tmdbSearch(query) {
  const key = TMDB_API_KEY.trim();
  const isBearer = key.indexOf('eyJ') === 0;
  const base = 'https://api.themoviedb.org/3/search/multi?language=en-US&include_adult=false&query=' + encodeURIComponent(query);
  const url = isBearer ? base : base + '&api_key=' + encodeURIComponent(key);
  const options = isBearer ? { headers: { Authorization: 'Bearer ' + key } } : {};

  const response = await fetch(url, options);
  if (!response.ok) throw new Error('TMDB ' + response.status);

  const json = await response.json();
  return (json.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
}

window.searchWatchTitle = async () => {
  const input = document.getElementById('watch-search');
  const resultsBox = document.getElementById('watch-results');
  if (!input || !resultsBox) return;

  const query = (input.value || '').trim();
  resultsBox.innerHTML = '';
  if (!query) return;

  if (!tmdbConfigured()) {
    const hint = document.createElement('p');
    hint.className = 'subtitle';
    hint.style.fontSize = '0.85rem';
    hint.textContent = 'no TMDB key – the title will be saved without a cover';
    resultsBox.appendChild(hint);
    return;
  }

  const loading = document.createElement('p');
  loading.className = 'subtitle';
  loading.style.fontSize = '0.85rem';
  loading.textContent = 'searching…';
  resultsBox.appendChild(loading);

  try {
    const results = await tmdbSearch(query);
    resultsBox.innerHTML = '';

    if (results.length === 0) {
      const none = document.createElement('p');
      none.className = 'subtitle';
      none.style.fontSize = '0.85rem';
      none.textContent = 'nothing found 🐧';
      resultsBox.appendChild(none);
      return;
    }

    results.slice(0, 8).forEach(result => {
      const row = document.createElement('div');
      row.className = 'watch-result';

      const thumb = document.createElement('div');
      thumb.className = 'watch-result-poster';
      if (result.poster_path) {
        const img = document.createElement('img');
        img.src = tmdbPosterUrl(result.poster_path);
        thumb.appendChild(img);
      } else {
        thumb.textContent = '🎬';
      }

      const textWrap = document.createElement('div');
      textWrap.className = 'watch-result-text';

      const nameEl = document.createElement('div');
      nameEl.className = 'watch-result-title';
      nameEl.textContent = result.title || result.name || '';

      const dateStr = result.release_date || result.first_air_date || '';
      const metaEl = document.createElement('div');
      metaEl.className = 'watch-result-meta';
      metaEl.textContent = [dateStr.slice(0, 4), result.media_type === 'tv' ? 'Series' : 'Movie']
        .filter(Boolean).join(' · ');

      textWrap.appendChild(nameEl);
      textWrap.appendChild(metaEl);

      row.appendChild(thumb);
      row.appendChild(textWrap);
      row.onclick = () => selectWatchResult(row, result);

      resultsBox.appendChild(row);
    });
  } catch (e) {
    resultsBox.innerHTML = '';
    const err = document.createElement('p');
    err.className = 'subtitle';
    err.style.fontSize = '0.85rem';
    err.textContent = 'search failed: ' + e.message;
    resultsBox.appendChild(err);
  }
};

function selectWatchResult(row, result) {
  document.querySelectorAll('#watch-results .watch-result').forEach(el => el.classList.remove('selected'));
  if (row) row.classList.add('selected');

  const dateStr = result.release_date || result.first_air_date || '';

  selectedWatchResult = {
    title: result.title || result.name || '',
    tmdb_id: result.id || null,
    media_type: result.media_type || null,
    year: dateStr ? dateStr.slice(0, 4) : null,
    poster_url: tmdbPosterUrl(result.poster_path),
    overview: result.overview || null
  };

  const box = document.getElementById('watch-selected');
  const poster = document.getElementById('watch-selected-poster');
  const titleEl = document.getElementById('watch-selected-title');
  const metaEl = document.getElementById('watch-selected-meta');

  if (poster) {
    if (selectedWatchResult.poster_url) {
      poster.src = selectedWatchResult.poster_url;
      poster.style.display = 'block';
    } else {
      poster.removeAttribute('src');
      poster.style.display = 'none';
    }
  }

  if (titleEl) titleEl.textContent = selectedWatchResult.title;
  if (metaEl) {
    metaEl.textContent = [
      selectedWatchResult.year,
      selectedWatchResult.media_type === 'tv' ? 'Series' : 'Movie'
    ].filter(Boolean).join(' · ');
  }
  if (box) box.style.display = 'flex';
}

window.submitWatchItem = async () => {
  const searchInput = document.getElementById('watch-search');
  const typed = searchInput ? (searchInput.value || '').trim() : '';

  const payload = selectedWatchResult ? Object.assign({}, selectedWatchResult) : { title: typed };
  if (!payload.title) return alert('Please add a title 🍿');

  const { error } = await supabaseClient.from('watchlist').insert([{
    title: payload.title,
    media_type: payload.media_type || null,
    tmdb_id: payload.tmdb_id || null,
    year: payload.year || null,
    poster_url: payload.poster_url || null,
    overview: payload.overview || null,
    added_by: currentRole
  }]);

  if (error) return alert(error.message);

  document.getElementById('addWatchView').classList.remove('open');
  if (searchInput) searchInput.value = '';
  const resultsBox = document.getElementById('watch-results');
  if (resultsBox) resultsBox.innerHTML = '';
  const selectedBox = document.getElementById('watch-selected');
  if (selectedBox) selectedBox.style.display = 'none';
  selectedWatchResult = null;

  loadWatchList();
  switchTab('watchlist');
};

/* ===== FIX: Formularfelder beim Öffnen leeren ===== */
(function () {
  const originalOpenAddModal = window.openAddModal;

  const FORM_FIELDS = {
    letter: ['new-letter-title', 'new-letter-body'],
    us: ['us-image'],
    ourday: ['ourday-date', 'ourday-image', 'ourday-text'],
    secret: ['secret-text'],
    bucket: ['bucket-image', 'bucket-title', 'bucket-details'],
    watch: ['watch-search']
  };

  function clearForm(type) {
    const ids = FORM_FIELDS[type];
    if (!ids) return;

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    // Watchlist: auch Suchergebnisse + Auswahl zurücksetzen
    if (type === 'watch') {
      const results = document.getElementById('watch-results');
      if (results) results.innerHTML = '';
      const selected = document.getElementById('watch-selected');
      if (selected) selected.style.display = 'none';
      selectedWatchResult = null;
    }
  }

  window.openAddModal = (type) => {
    clearForm(type);
    if (typeof originalOpenAddModal === 'function') originalOpenAddModal(type);
  };
})();

