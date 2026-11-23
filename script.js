// 1. SUPABASE VERBINDUNG
const SUPABASE_URL = 'https://gessrezpwqmdajkfxgjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NlYgPe1Ii47nl0-anpcnSA_75ae85U9';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentRole = null; // 'Aly' oder 'Sebo'

// 2. APP START
document.addEventListener('DOMContentLoaded', async () => {
  
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app-screen');
  
  // Prüfen, ob schon eingeloggt
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    // Wenn schon eingeloggt, Rolle aus dem lokalen Speicher holen (falls vorhanden)
    const savedRole = localStorage.getItem('luvu_role');
    if (savedRole) {
      currentRole = savedRole;
      showApp();
    } else {
      // Wenn keine Rolle gespeichert ist, müssen wir zur Auswahl zurück
      await supabaseClient.auth.signOut();
      window.location.reload();
    }
  }

  // Login
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

  // Signup
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

// Rolle auswählen (Aly oder Sebo)
window.setRole = (role) => {
  currentRole = role;
  localStorage.setItem('luvu_role', role); // Rolle merken für den nächsten Start
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('btn-aly').classList.remove('active');
  document.getElementById('btn-sebo').classList.remove('active');
  document.getElementById('btn-' + role.toLowerCase()).classList.add('active');
};

// App anzeigen (mit rollenspezifischen Buttons)
async function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
  
  const fabMenu = document.getElementById('fab-menu');
  fabMenu.innerHTML = ''; // Leeren
  
  if (currentRole === 'Aly') {
    // Aly darf alles
    fabMenu.innerHTML = `
      <button class="fab-item" onclick="openAddModal('letter')">💌 Letter</button>
      <button class="fab-item" onclick="openAddModal('us')">📸 Us Moment</button>
      <button class="fab-item" onclick="openAddModal('ourday')">☀️ Our Day</button>
      <button class="fab-item" onclick="openAddModal('secret')">💌 Secret</button>
    `;
  } else if (currentRole === 'Sebo') {
    // Sebo darf jetzt auch Secrets hinzufügen
    fabMenu.innerHTML = `
      <button class="fab-item" onclick="openAddModal('us')">📸 Us Moment</button>
      <button class="fab-item" onclick="openAddModal('ourday')">☀️ Our Day</button>
      <button class="fab-item" onclick="openAddModal('secret')">💌 Secret</button>
    `;
  }
}

// Logout
window.logout = async () => {
  localStorage.removeItem('luvu_role'); // Rolle beim Logout löschen
  await supabaseClient.auth.signOut();
  window.location.reload();
};

// Tab Wechsel
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

// Plus-Button (FAB) öffnen/schließen
window.toggleFab = () => {
  const menu = document.getElementById('fab-menu');
  const btn = document.getElementById('fab-btn');
  menu.classList.toggle('active');
  btn.style.transform = menu.classList.contains('active') ? 'rotate(45deg)' : 'rotate(0deg)';
};

// Modal öffnen (Platzhalter)
window.openAddModal = (type) => {
  toggleFab();
  alert('Hier kommt bald das Formular für: ' + type);
};
