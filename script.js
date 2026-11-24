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

// 2. TAB WECHSEL
window.switchTab = (tabName) => {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

  ['inbox', 'sent', 'myday', 'secrets', 'us'].forEach(name => {
    const btn = document.getElementById('tab-' + name);
    if (btn) btn.classList.remove('active');
  });

  const pageMap = {
    inbox: 'page-inbox',
    sent: 'page-sent',
    myday: 'page-myday',
    secrets: 'page-secrets',
    us: 'page-us'
  };

  const pageId = pageMap[tabName];
  if (pageId) {
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
  }

  const tabBtn = document.getElementById('tab-' + tabName);
  if (tabBtn) tabBtn.classList.add('active');

  if (tabName === 'inbox' || tabName === 'sent') loadLetters();
  if (tabName === 'secrets') loadSecrets();
  if (tabName === 'us') loadUs();
  if (tabName === 'myday') loadOurDay();
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
    `;
  } else if (currentRole === 'Sebo') {
    fabMenu.innerHTML = `
      <button class="fab-item" onclick="openAddModal('letter')">💌 Letter</button>
      <button class="fab-item" onclick="openAddModal('us')">📸 Us Moment</button>
      <button class="fab-item" onclick="openAddModal('ourday')">☀️ Our Day</button>
      <button class="fab-item" onclick="openAddModal('secret')">💌 Secret</button>
    `;
  }
  
  loadLetters();
  loadSecrets();
  loadUs();
  loadOurDay();
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

  initAuth();
});

// 6. HELFER: BILD HOCHLADEN
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

window.submitUsMoment = async () => {
  const file = document.getElementById('us-image').files[0];
  if (!file) return alert("Bitte Bild auswählen!");
  const imgUrl = await uploadImage(file);
  if (!imgUrl) return;
  const { error } = await supabaseClient.from('us_moments').insert([{ image_url: imgUrl, sender: currentRole }]);
  if (error) alert(error.message);
  else { document.getElementById('addUsView').classList.remove('open'); loadUs(); }
};

window.submitOurDay = async () => {
  const date = document.getElementById('ourday-date').value;
  const file = document.getElementById('ourday-image').files[0];
  const text = document.getElementById('ourday-text').value;
  if (!date || !file || !text) return alert("Bitte alles ausfüllen!");
  const imgUrl = await uploadImage(file);
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
// NEU: Briefe werden auf zwei Bereiche verteilt (Inbox / Sent)
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

// jedes Pinboard-Foto mit X zum Löschen
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

    const delBtn = createDeleteX(() => deleteUsMoment(moment.id, wrap));
    delBtn.style.top = '16px';
    delBtn.style.right = '16px';

    wrap.appendChild(img);
    wrap.appendChild(delBtn);
    container.appendChild(wrap);
  });
}

// jeder Our-Day-Eintrag mit X zum Löschen (in der Detail-Ansicht)
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
      
      entries.forEach(entry => {
        const imgWrap = document.createElement('div');
        imgWrap.className = 'day-img-wrapper';
        imgWrap.style.position = 'relative';

        const img = document.createElement('img');
        img.src = entry.image_url;
        img.className = 'day-image-detail';

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
        imagesContainer.appendChild(imgWrap);
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
