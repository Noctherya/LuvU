// 1. SUPABASE VERBINDUNG
const SUPABASE_URL = 'https://gessrezpwqmdajkfxgjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NlYgPe1Ii47nl0-anpcnSA_75ae85U9';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentRole = null; 

// 2. HELFER: EINGABEFELDER LEEREN
function clearFields(...ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = '';
  });
}

const FORM_FIELDS = {
  addLetterView: ['new-letter-title', 'new-letter-body'],
  addUsView: ['us-image'],
  addOurDayView: ['ourday-date', 'ourday-image', 'ourday-text'],
  addSecretView: ['secret-text']
};

// 3. TAB WECHSEL
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

// 4. FAB & FORMULARE ÖFFNEN
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
  if (type === 'letter') {
    clearFields(...FORM_FIELDS.addLetterView);
    document.getElementById('addLetterView').classList.add('open');
  }
  if (type === 'us') {
    clearFields(...FORM_FIELDS.addUsView);
    document.getElementById('addUsView').classList.add('open');
  }
  if (type === 'ourday') {
    clearFields(...FORM_FIELDS.addOurDayView);
    document.getElementById('addOurDayView').classList.add('open');
  }
  if (type === 'secret') {
    clearFields(...FORM_FIELDS.addSecretView);
    document.getElementById('addSecretView').classList.add('open');
  }
};

// 5. ROLLE & APP ANZEIGEN
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

// 6. LOGIN + FELDER BEIM SCHLIESSEN LEEREN
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

  Object.keys(FORM_FIELDS).forEach(viewId => {
    const view = document.getElementById(viewId);
    if (!view) return;
    const closeBtn = view.querySelector('.close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => clearFields(...FORM_FIELDS[viewId]));
  });
});

// 7. HELFER: BILD HOCHLADEN
async function uploadImage(file) {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const { data, error } = await supabaseClient.storage.from('images').upload(fileName, file);
  if (error) { alert("Bild-Upload Fehler: " + error.message); return null; }
  const { data: publicUrl } = await supabaseClient.storage.from('images').getPublicUrl(fileName);
  return publicUrl.publicUrl;
}

// 8. SPEICHERN
window.submitLetter = async () => {
  const title = document.getElementById('new-letter-title').value;
  const body = document.getElementById('new-letter-body').value;
  if (!title || !body) return alert("Bitte ausfüllen!");
  const { error } = await supabaseClient.from('letters').insert([{ title, body, sender: 'Aly' }]);
  if (error) alert(error.message);
  else {
    clearFields(...FORM_FIELDS.addLetterView);
    document.getElementById('addLetterView').classList.remove('open');
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
  else {
    clearFields(...FORM_FIELDS.addUsView);
    document.getElementById('addUsView').classList.remove('open');
    loadUs();
  }
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
  else {
    clearFields(...FORM_FIELDS.addOurDayView);
    document.getElementById('addOurDayView').classList.remove('open');
    loadOurDay();
  }
};

window.submitSecret = async () => {
  const text = document.getElementById('secret-text').value;
  if (!text) return alert("Bitte Text eingeben!");
  const { error } = await supabaseClient.from('secrets').insert([{ text, sender: currentRole }]);
  if (error) alert(error.message);
  else {
    clearFields(...FORM_FIELDS.addSecretView);
    document.getElementById('addSecretView').classList.remove('open');
    loadSecrets();
  }
};

// 9. LADEN & ANZEIGEN
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

    // NEU: Nur noch das Datum im Kasten
    div.innerHTML = `
      <div class="day-date" style="margin-bottom: 0;">📅 ${date}</div>
    `;
    container.appendChild(div);
  }
}
