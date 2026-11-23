// 1. SUPABASE VERBINDUNG
const SUPABASE_URL = 'https://gessrezpwqmdajkfxgjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NlYgPe1Ii47nl0-anpcnSA_75ae85U9';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentRole = null; 

// 2. TAB WECHSEL (Sicher und ohne Fehler)
window.switchTab = (tabName) => {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  if (tabName === 'letters') {
    document.getElementById('page-letters').classList.add('active');
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
  } else if (tabName === 'myday') {
    document.getElementById('page-myday').classList.add('active');
    document.querySelectorAll('.nav-btn')[1].classList.add('active');
  } else if (tabName === 'secrets') {
    document.getElementById('page-secrets').classList.add('active');
    document.querySelectorAll('.nav-btn')[2].classList.add('active');
  } else if (tabName === 'us') {
    document.getElementById('page-us').classList.add('active');
    document.querySelectorAll('.nav-btn')[3].classList.add('active');
  }
};

// 3. PLUS-BUTTON MENÜ
window.toggleFab = () => {
  const menu = document.getElementById('fab-menu');
  const btn = document.getElementById('fab-btn');
  if (menu && btn) {
    menu.classList.toggle('active');
    btn.style.transform = menu.classList.contains('active') ? 'rotate(45deg)' : 'rotate(0deg)';
  }
};

// 4. FORMULAR ÖFFNEN (Direkt über HTML)
window.openAddModal = (type) => {
  toggleFab(); // Menü schließen
  
  if (type === 'letter') {
    document.getElementById('addLetterView').classList.add('open');
  } else {
    alert('Das Formular für ' + type + ' bauen wir als Nächstes!');
  }
};

// 5. BRIEF SPEICHERN
window.submitLetter = async () => {
  const title = document.getElementById('new-letter-title').value;
  const body = document.getElementById('new-letter-body').value;
  
  if (!title || !body) {
    alert("Bitte fülle Titel und Text aus!");
    return;
  }

  const { data, error } = await supabaseClient
    .from('letters')
    .insert([{ title: title, body: body, sender: 'Aly' }]);

  if (error) {
    alert("Fehler beim Speichern: " + error.message);
  } else {
    alert("Brief erfolgreich gespeichert! 💌");
    document.getElementById('addLetterView').classList.remove('open');
    document.getElementById('new-letter-title').value = '';
    document.getElementById('new-letter-body').value = '';
    
    // NEU: Wir laden die Briefe sofort neu (die Funktion bauen wir gleich)
    loadLetters(); 
  }
};

// 6. ROLLE AUSWÄHLEN & APP ANZEIGEN
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

  // Direkt beim Einloggen die Briefe laden
  loadLetters();
}

// 7. BRIEFE AUS SUPABASE LADEN
async function loadLetters() {
  const envelopeContainer = document.getElementById('envelopes');
  if (!envelopeContainer) return;

  // Lade alle Briefe aus der Tabelle
  const { data: letters, error } = await supabaseClient
    .from('letters')
    .select('*')
    .order('created_at', { ascending: false }); // Neueste zuerst

  if (error) {
    console.error("Fehler beim Laden der Briefe:", error);
    return;
  }

  envelopeContainer.innerHTML = '';

  // Baue für jeden Brief einen Umschlag
  letters.forEach((letter, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'envelope-wrap';
    
    // Das Klick-Event für den Umschlag
    wrap.onclick = () => {
      document.getElementById('letterTitle').textContent = letter.title;
      document.getElementById('letterBody').textContent = letter.body;
      document.getElementById('letterMedia').innerHTML = '';
      document.getElementById('letterView').classList.add('open');
    };

    wrap.innerHTML = `
      <div class="envelope">
        <div class="paper">💌</div>
        <div class="flap"></div>
        <div class="pocket"></div>
        <div class="seal">🐧</div>
        <div class="envelope-title">${letter.title}</div>
      </div>
    `;
    envelopeContainer.appendChild(wrap);
  });
}

// 8. LOGIN EVENTS
window.logout = async () => {
  localStorage.removeItem('luvu_role');
  await supabaseClient.auth.signOut();
  window.location.reload();
};

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
