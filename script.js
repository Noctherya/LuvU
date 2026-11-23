// 1. SUPABASE VERBINDUNG
const SUPABASE_URL = 'https://gessrezpwqmdajkfxgjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NlYgPe1Ii47nl0-anpcnSA_75ae85U9';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentRole = null; 

// 2. KLICK-FUNKTIONEN (Werden sofort geladen, können nicht abstürzen)
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
  alert('Hier kommt bald das Formular für: ' + type);
};

// 3. ROLLE AUSWÄHLEN
window.setRole = (role) => {
  currentRole = role;
  localStorage.setItem('luvu_role', role);
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('btn-aly').classList.remove('active');
  document.getElementById('btn-sebo').classList.remove('active');
  document.getElementById('btn-' + role.toLowerCase()).classList.add('active');
};

// 4. LOGOUT
window.logout = async () => {
  localStorage.removeItem('luvu_role');
  await supabaseClient.auth.signOut();
  window.location.reload();
};

// 5. APP ANZEIGEN (Buttons je nach Rolle)
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
}

// 6. SUPABASE START & LOGIN
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const savedRole = localStorage.getItem('luvu_role');
      if (savedRole) {
        currentRole = savedRole;
        showApp();
      } else {
        await supabaseClient.auth.signOut();
        window.location.reload();
      }
    }

    const loginBtn = document.getElementById('login-btn');
    if(loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
          document.getElementById('login-message').textContent = error.message;
        } else {
          showApp();
        }
      });
    }

    const signupBtn = document.getElementById('signup-btn');
    if(signupBtn) {
      signupBtn.addEventListener('click', async () => {
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error) {
          document.getElementById('login-message').textContent = error.message;
        } else {
          document.getElementById('login-message').textContent = 'Check your emails for a confirmation link!';
        }
      });
    }
  } catch (err) {
    console.error("Fehler beim Laden:", err);
  }
});
