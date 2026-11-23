// 1. SUPABASE VERBINDUNG
const SUPABASE_URL = 'https://gessrezpwqmdajkfxgjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NlYgPe1Ii47nl0-anpcnSA_75ae85U9';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentRole = null; 

// 2. TAB WECHSEL (Jetzt mit sicherer ID-Zuweisung)
window.switchTab = (tabName) => {
  // Alle Seiten ausblenden
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  
  // Alle Tab-Buttons auf "nicht aktiv" setzen
  document.getElementById('tab-letters').classList.remove('active');
  document.getElementById('tab-myday').classList.remove('active');
  document.getElementById('tab-secrets').classList.remove('active');
  document.getElementById('tab-us').classList.remove('active');

  // Die richtige Seite anzeigen und den richtigen Button markieren
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

  // Daten laden
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
  
  // Daten laden beim Start
  loadLetters();
  loadSecrets();
  loadUs();
  loadOurDay();
}

window.logout = async () => {
  localStorage.removeItem('luvu_role');
  await supabaseClient.auth.signOut();
  window.location.reload();
};

// 5. LOGIN
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      document.getElementById('login-message').textContent = error.message;
    } else {
      showApp();
    }
  });

  document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
      document.getElementById('login-message').textContent = error.message;
    } else {
      document.getElementById('login-message').textContent = 'Check your emails for a confirmation link!';
    }
  });
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

// 7. SPEICHERN (LETTER, US, OURDAY, SECRET)
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
    wrap.onclick = () => {
      document.getElementById('letterTitle').textContent = letter.title;
      document.getElementById('letterBody').textContent = letter.body;
      document.getElementById('letterView').classList.add('open');
    };
    wrap.innerHTML = `<div class="envelope"><div class="paper">💌</div><div class="flap"></div><div class="pocket"></div><div class="seal">🐧</div><div class="envelope-title">${letter.title}</div></div>`;
    container.appendChild(wrap);
  });
}

async function loadSecrets() {
  const container = document.getElementById('secretsList');
  if(!container) return;
  const { data, error } = await supabaseClient.from('secrets').select('*').neq('sender', currentRole).order('created_at', { ascending: false });
  if (error) return;
  container.innerHTML = '';
  data.forEach(secret => {
    const div = document.createElement('div');
    div.className = 'secret-text-card';
    div.innerHTML = `<div class="secret-body" style="font-family:'Caveat'; font-size:1.5rem;">"${secret.text}"</div>`;
    container.appendChild(div);
  });
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
  data.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'day-card';
    div.innerHTML = `<div class="day-date">📅 ${entry.date} - ${entry.sender}</div><img src="${entry.image_url}" class="day-image"><p>${entry.text}</p>`;
    container.appendChild(div);
  });
}
