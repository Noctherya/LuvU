// 1. SUPABASE VERBINDUNG
const SUPABASE_URL = 'https://gessrezpwqmdajkfxgjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NlYgPe1Ii47nl0-anpcnSA_75ae85U9';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. APP START
document.addEventListener('DOMContentLoaded', async () => {
  
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app-screen');
  
  // Prüfen, ob User schon eingeloggt ist
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    showApp();
  }

  // LOGIN
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

  // SIGNUP
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

  function showApp() {
    loginScreen.style.display = 'none';
    appScreen.style.display = 'block';
  }
});

// 3. LOGOUT
window.logout = async () => {
  await supabaseClient.auth.signOut();
  window.location.reload();
};

// 4. TAB WECHSEL
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

// 5. DER PLUS-BUTTON (FAB)
window.toggleFab = () => {
  const menu = document.getElementById('fab-menu');
  const btn = document.getElementById('fab-btn');
  menu.classList.toggle('active');
  // Dreht das Plus ins X
  if (menu.classList.contains('active')) {
    btn.style.transform = 'rotate(45deg)';
  } else {
    btn.style.transform = 'rotate(0deg)';
  }
};

window.openAddModal = (type) => {
  toggleFab(); // Menü schließen
  alert('Hier öffnet sich bald das Fenster für: ' + type);
  // Hier kommt später der Code für das Upload-Fenster rein
};
