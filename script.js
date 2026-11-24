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
const PW_STORE_PREFIX = 'luvu_pw_';          // Ablage für das verschlüsselte Passwort

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

function setLoginMessage(text, isError = true) {
  const el = document.getElementById('login-message');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#c2557a' : '#8a9bb0';
}

// 1e. NEU: PASSWORT-SPEICHER (AES-GCM, Schlüssel bleibt im Browser)
function openKeyDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('luvu-secure', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('keys')) {
        req.result.createObjectStore('keys');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCryptoKey() {
  const db = await openKeyDb();
  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readonly');
    const r = tx.objectStore('keys').get('pwkey');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  if (existing) return existing;

  // Nicht-exportierbarer Schlüssel: kann nicht ausgelesen werden, nur benutzt
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readwrite');
    tx.objectStore('keys').put(key, 'pwkey');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return key;
}

async function savePasswordLocally(role, password) {
  try {
    if (!password) return;
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(password);
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    const payload = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(cipher))
    };
    localStorage.setItem(PW_STORE_PREFIX + role, JSON.stringify(payload));
  } catch (e) {
    // z. B. kein https -> dann wird eben nicht gemerkt
    console.warn('Password could not be stored:', e);
  }
}

async function loadPasswordLocally(role) {
  try {
    const raw = localStorage.getItem(PW_STORE_PREFIX + role);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    const key = await getCryptoKey();
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(payload.iv) },
      key,
      new Uint8Array(payload.data)
    );
    return new TextDecoder().decode(plain);
  } catch (e) {
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

// Füllt das Passwortfeld mit dem gemerkten Passwort der Rolle
async function fillStoredPassword(role) {
  const pwInput = document.getElementById('password-input');
  const pwBox = document.getElementById('remember-password');
  if (!pwInput) return;

  const remember = shouldRememberPassword();
  if (pwBox) pwBox.checked = remember;

  pwInput.value = '';
  if (!remember) return;

  const stored = await loadPasswordLocally(role);
  if (stored && currentRole === role && pwInput.value === '') {
    pwInput.value = stored;
  }
}

// 2. TAB WECHSEL
window.switchTab = (tabName) => {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  
  document.getElementById('tab-letters').classList.remove('active');
  document.getElementById('tab-myday').classList.remove('active');
  document.getElementById('tab-secrets').classList.remove('active');
  document.getElementById('tab-us').classList.remove('active');

  if (tabName === 'letters') {
    document.getElementById('page-letters').classList.add('active');
    document.getElementById('tab-letters').classList.add('active');
  } else if (tabName === 'myday') {
    document.getElementById('page-myday').classList.add('active');
    document.getElementById('tab-myday').classList.add('active');
  } else if (tabName === 'secrets') {
    document.getElementById('page-secrets').classList.add('active');
    document.getElementById('tab-secrets').classList.add('active');
  } else if (tabName === 'us') {
    document.getElementById('page-us').classList.add('active');
    document.getElementById('tab-us').classList.add('active');
  }

  if (tabName === 'letters') loadLetters();
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

  // NEU: gemerktes Passwort einsetzen
  fillStoredPassword(role);

  setLoginMessage(`Logging in as ${role} ${role === 'Aly' ? '👩' : '👨'}`, false);
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

  // NEU: "Passwort merken"
  const pwBox = document.getElementById('remember-password');
  const rememberPw = pwBox ? pwBox.checked : false;
  localStorage.setItem(SAVE_PW_KEY, rememberPw ? '1' : '0');
  if (rememberPw) {
    await savePasswordLocally(currentRole, password);
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
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').addEventListener('click', doLogin);
  document.getElementById('signup-btn').addEventListener('click', doSignup);
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
  const { error } = await supabaseClient.from('letters').insert([{ title, body, sender: 'Aly' }]);
  if (error) alert(error.message);
  else { document.getElementById('addLetterView').classList.remove('open'); loadLetters(); }
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
async function loadLetters() {
  const container = document.getElementById('envelopes');
  if(!container) return;
  const { data, error } = await supabaseClient.from('letters').select('*').order('created_at', { ascending: false });
  if (error) return;
  container.innerHTML = '';
  
  data.forEach(letter => {
    const wrap = document.createElement('div');
    wrap.className = 'envelope-wrap';
    
    let badgeHtml = '';
    if (currentRole === 'Aly') {
      if (letter.is_read) {
        badgeHtml = `<div class="envelope-badge read">✓✓ Read</div>`;
      } else {
        badgeHtml = `<div class="envelope-badge delivered">✓ Delivered</div>`;
      }
    } else if (currentRole === 'Sebo') {
      if (letter.is_read) {
        badgeHtml = `<div class="envelope-badge read">✓ Read</div>`;
      } else {
        badgeHtml = `<div class="envelope-badge new">✨ New</div>`;
      }
    }

    wrap.onclick = async () => {
      document.getElementById('letterTitle').textContent = letter.title;
      document.getElementById('letterBody').textContent = letter.body;
      
      const statusDiv = document.getElementById('letterStatus');
      if (currentRole === 'Aly') {
        statusDiv.innerHTML = letter.is_read ? '✓✓ Read by Sebo' : '✓ Delivered';
        statusDiv.style.color = letter.is_read ? '#4a90e2' : '#aaa';
      } else {
        statusDiv.innerHTML = ''; 
      }

      document.getElementById('letterView').classList.add('open');
      
      if (currentRole === 'Sebo' && !letter.is_read) {
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

async function loadUs() {
  const container = document.getElementById('pinboard');
  if(!container) return;
  const { data, error } = await supabaseClient.from('us_moments').select('*').order('created_at', { ascending: false });
  if (error) return;
  container.innerHTML = '';
  data.forEach(moment => {
    const img = document.createElement('img');
    img.src = moment.image_url;
    img.className = 'pinned-photo';
    container.appendChild(img);
  });
}

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
        imgWrap.innerHTML = `
          <img src="${entry.image_url}" class="day-image-detail">
          <span class="day-img-sender">${entry.sender}</span>
          <p class="day-img-text">${entry.text}</p>
        `;
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
