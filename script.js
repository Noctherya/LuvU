// Diese Funktion zeigt die App an, ohne Supabase zu prüfen
window.fakeLogin = () => {
  console.log("Login geklickt!");
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
};

// Tab-Wechsel
window.switchTab = (tabName) => {
  console.log("Tab gewechselt zu: " + tabName);
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  if (tabName === 'letters') {
    document.getElementById('page-letters').classList.add('active');
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
  } else if (tabName === 'us') {
    document.getElementById('page-us').classList.add('active');
    document.querySelectorAll('.nav-btn')[1].classList.add('active');
  }
};

// Plus-Button (FAB)
window.toggleFab = () => {
  console.log("Plus-Button geklickt!");
  const menu = document.getElementById('fab-menu');
  const btn = document.getElementById('fab-btn');
  
  if (menu && btn) {
    menu.classList.toggle('active');
    btn.style.transform = menu.classList.contains('active') ? 'rotate(45deg)' : 'rotate(0deg)';
  }
};
