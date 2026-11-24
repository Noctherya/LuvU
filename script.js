// ===== 1. SUPABASE VERBINDUNG =====
const SUPABASE_URL = 'https://gessrezpwqmdajkfxgjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NlYgPe1Ii47nl0-anpcnSA_75ae85U9';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TMDB_API_KEY = '2ace4aa0eb9800c1c066ce11d888452f';
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w200';

let currentRole = null;
let currentBucketId = null;
let currentBucketPhotos = [];
let selectedWatchItem = null;
let bucketPlaceFilter = 'all';
let allBucketItems = [];

// ===== 2. HELFER =====
function clearFields(...ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = '';
  });
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resetLetterForm() { clearFields('new-letter-title', 'new-letter-body'); }
function resetUsForm() { clearFields('us-image'); }
function resetOurDayForm() { clearFields('ourday-date', 'ourday-image', 'ourday-text'); }
function resetSecretForm() { clearFields('secret-text'); }
function resetBucketForm() {
  clearFields('bucket-image', 'bucket-title', 'bucket-details');
  const place = document.getElementById('bucket-place');
  if (place) place.value = 'Karlsruhe';
}
function resetWatchForm() {
  clearFields('watch-search');
  const results = document.getElementById('watch-results');
  if (results) results.innerHTML = '';
  const selected = document.getElementById('watch-selected');
  if (selected) selected.style.display = 'none';
  selectedWatchItem = null;
}

const FORM_RESETS = {
  addLetterView: resetLetterForm,
  addUsView: resetUsForm,
  addOurDayView: resetOurDayForm,
  addSecretView: resetSecretForm,
  addBucketView: resetBucketForm,
  addWatchView: resetWatchForm
};

// ===== 3. TAB WECHSEL =====
window.switchTab = (tabName) => {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

  ['tab-inbox', 'tab-sent', 'tab-more'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  document.querySelectorAll('.more-item').forEach(item => item.classList.remove('active'));

  const moreMenu = document.getElementById('more-menu');
  if (moreMenu) moreMenu.classList.remove('is-open');

  const page = document.getElementById('page-' + tabName);
  if (page) page.classList.add('active');

  if (tabName === 'inbox' || tabName === 'sent') {
    const tab = document.getElementById('tab-' + tabName);
    if (tab) tab.classList.add('active');
  } else {
    const moreBtn = document.getElementById('tab-more');
    if (moreBtn) moreBtn.classList.add('active');
    const item = document.querySelector(`.more-item[data-tab="${tabName}"]`);
    if (item) item.classList.add('active');
  }

  if (tabName === 'inbox') loadInbox();
  if (tabName === 'sent') loadSent();
  if (tabName === 'myday') loadOurDay();
  if (tabName === 'secrets') loadSecrets();
  if (tabName === 'us') loadUs();
  if (tabName === 'bucketlist') loadBucketList();
  if (tabName === 'watchlist') loadWatchList();
};

// ===== 4. FAB & FORMULARE ÖFFNEN =====
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
    resetLetterForm();
    document.getElementById('addLetterView').classList.add('open');
  }
  if (type === 'us') {
    resetUsForm();
    document.getElementById('addUsView').classList.add('open');
  }
  if (type === 'ourday') {
    resetOurDayForm();
    document.getElementById('addOurDayView').classList.add('open');
  }
  if (type === 'secret') {
    resetSecretForm();
    document.getElementById('addSecretView').classList.add('open');
  }
  if (type === 'bucket') {
    resetBucketForm();
    document.getElementById('addBucketView').classList.add('open');
  }
  if (type === 'watch') {
    resetWatchForm();
    document.getElementById('addWatchView').classList.add('open');
  }
};

// ===== 5. ROLLE & APP ANZEIGEN =====
function applyRoleUI(role) {
  const aly = document.getElementById('btn-aly');
  const sebo = document.getElementById('btn-sebo');
  if (aly) aly.classList.remove('active');
  if (sebo) sebo.classList.remove('active');
  const btn = document.getElementById('btn-' + role.toLowerCase());
  if (btn) btn.classList.add('active');
}

window.setRole = (role) => {
  currentRole = role;
  localStorage.setItem('luvu_role', role);
  document.getElementById('login-form').style.display = 'block';
  applyRoleUI(role);
};

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';

  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  const inboxPage = document.getElementById('page-inbox');
  if (inboxPage) inboxPage.classList.add('active');
  ['tab-sent', 'tab-more'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const inboxTab = document.getElementById('tab-inbox');
  if (inboxTab) inboxTab.classList.add('active');

  const fabMenu = document.getElementById('fab-menu');
  if (!fabMenu) return;
  fabMenu.innerHTML = `
    <button class="fab-item" onclick="openAddModal('letter')">💌 Letter</button>
    <button class="fab-item" onclick="openAddModal('us')">📸 Us Moment</button>
    <button class="fab-item" onclick="openAddModal('ourday')">☀️ Our Day</button>
    <button class="fab-item" onclick="openAddModal('secret')">💌 Secret</button>
    <button class="fab-item" onclick="openAddModal('bucket')">🪣 Bucket idea</button>
    <button class="fab-item" onclick="openAddModal('watch')">🍿 Watch title</button>
  `;

  loadInbox();
  loadSent();
  loadOurDay();
  loadSecrets();
  loadUs();
  loadBucketList();
  loadWatchList();
}

window.logout = async () => {
  localStorage.removeItem('luvu_role');
  await supabaseClient.auth.signOut();
  window.location.reload();
};

// ===== 6. LOGIN / START =====
document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const loginMsg = document.getElementById('login-message');

  const savedEmail = localStorage.getItem('luvu_email');
  const savedPass = localStorage.getItem('luvu_pass');
  if (savedEmail && emailInput) emailInput.value = savedEmail;
  if (savedPass && passwordInput) passwordInput.value = savedPass;

  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      loginMsg.textContent = error.message;
    } else {
      loginMsg.textContent = '';
      const rememberMe = document.getElementById('remember-me');
      const rememberPass = document.getElementById('remember-password');
      if (rememberMe && rememberMe.checked) localStorage.setItem('luvu_email', email);
      else localStorage.removeItem('luvu_email');
      if (rememberPass && rememberPass.checked) localStorage.setItem('luvu_pass', password);
      else localStorage.removeItem('luvu_pass');
      showApp();
    }
  });

  document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) loginMsg.textContent = error.message;
    else loginMsg.textContent = 'Check your emails for a confirmation link!';
  });

  const moreBtn = document.getElementById('tab-more');
  const moreMenu = document.getElementById('more-menu');
  if (moreBtn && moreMenu) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moreMenu.classList.toggle('is-open');
    });
    document.addEventListener('click', (e) => {
      if (!moreMenu.contains(e.target) && !moreBtn.contains(e.target)) {
        moreMenu.classList.remove('is-open');
      }
    });
  }

  Object.keys(FORM_RESETS).forEach(viewId => {
    const view = document.getElementById(viewId);
    if (!view) return;
    const closeBtn = view.querySelector('.close-btn');
    if (closeBtn) closeBtn.addEventListener('click', FORM_RESETS[viewId]);
  });

  (async () => {
    const savedRole = localStorage.getItem('luvu_role');
    if (!savedRole) return;
    currentRole = savedRole;
    const form = document.getElementById('login-form');
    if (form) form.style.display = 'block';
    applyRoleUI(savedRole);
    const { data } = await supabaseClient.auth.getSession();
    if (data && data.session) showApp();
  })();
});

// ===== 7. BILD HOCHLADEN =====
async function uploadImage(file) {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const { error } = await supabaseClient.storage.from('images').upload(fileName, file);
  if (error) { alert("Bild-Upload Fehler: " + error.message); return null; }
  const { data: publicUrl } = supabaseClient.storage.from('images').getPublicUrl(fileName);
  return publicUrl.publicUrl;
}

// ===== 8. SPEICHERN =====
window.submitLetter = async () => {
  const title = document.getElementById('new-letter-title').value.trim();
  const body = document.getElementById('new-letter-body').value.trim();
  if (!title || !body) return alert("Bitte ausfüllen!");
  const { error } = await supabaseClient.from('letters').insert([{ title, body, sender: currentRole }]);
  if (error) alert(error.message);
  else {
    resetLetterForm();
    document.getElementById('addLetterView').classList.remove('open');
    loadInbox();
    loadSent();
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
    resetUsForm();
    document.getElementById('addUsView').classList.remove('open');
    loadUs();
  }
};

window.submitOurDay = async () => {
  const date = document.getElementById('ourday-date').value;
  const file = document.getElementById('ourday-image').files[0];
  const text = document.getElementById('ourday-text').value.trim();
  if (!date || !file || !text) return alert("Bitte alles ausfüllen!");
  const imgUrl = await uploadImage(file);
  if (!imgUrl) return;
  const { error } = await supabaseClient.from('our_day').insert([{ date, image_url: imgUrl, text, sender: currentRole }]);
  if (error) alert(error.message);
  else {
    resetOurDayForm();
    document.getElementById('addOurDayView').classList.remove('open');
    loadOurDay();
  }
};

window.submitSecret = async () => {
  const text = document.getElementById('secret-text').value.trim();
  if (!text) return alert("Bitte Text eingeben!");
  const { error } = await supabaseClient.from('secrets').insert([{ text, sender: currentRole }]);
  if (error) alert(error.message);
  else {
    resetSecretForm();
    document.getElementById('addSecretView').classList.remove('open');
    loadSecrets();
  }
};

// ===== 9. BRIEFE: INBOX / SENT =====
async function loadInbox() {
  const container = document.getElementById('inboxEnvelopes');
  if (!container) return;
  const { data, error } = await supabaseClient.from('letters').select('*').order('created_at', { ascending: false });
  if (error) { console.warn(error.message); return; }
  renderLetters(container, (data || []).filter(l => l.sender !== currentRole), 'inbox');
}

async function loadSent() {
  const container = document.getElementById('sentEnvelopes');
  if (!container) return;
  const { data, error } = await supabaseClient.from('letters').select('*').order('created_at', { ascending: false });
  if (error) { console.warn(error.message); return; }
  renderLetters(container, (data || []).filter(l => l.sender === currentRole), 'sent');
}

function renderLetters(container, letters, mode) {
  container.innerHTML = '';
  if (!letters.length) {
    container.innerHTML = `<p class="subtitle">${mode === 'inbox' ? 'no letters yet 💌' : "you haven't written anything yet"}</p>`;
    return;
  }

  letters.forEach(letter => {
    const wrap = document.createElement('div');
    wrap.className = 'envelope-wrap';

    let badgeHtml;
    if (mode === 'inbox') {
      badgeHtml = letter.is_read
        ? `<div class="envelope-badge read">✓ Read</div>`
        : `<div class="envelope-badge new">✨ New</div>`;
    } else {
      badgeHtml = letter.is_read
        ? `<div class="envelope-badge read">✓✓ Read</div>`
        : `<div class="envelope-badge delivered">✓ Delivered</div>`;
    }

    wrap.onclick = async () => {
      document.getElementById('letterTitle').textContent = letter.title;
      document.getElementById('letterBody').textContent = letter.body;

      const statusDiv = document.getElementById('letterStatus');
      if (mode === 'sent') {
        const otherName = letter.sender === 'Aly' ? 'Sebo' : 'Aly';
        statusDiv.innerHTML = letter.is_read ? `✓✓ Read by ${otherName}` : '✓ Delivered';
        statusDiv.style.color = letter.is_read ? '#4a90e2' : '#aaa';
      } else {
        statusDiv.innerHTML = '';
      }

      document.getElementById('letterView').classList.add('open');

      if (mode === 'inbox' && !letter.is_read) {
        await supabaseClient.from('letters').update({ is_read: true }).eq('id', letter.id);
        loadInbox();
      }
    };

    wrap.innerHTML = `
      <div class="envelope">
        <div class="paper">💌</div>
        <div class="flap"></div>
        <div class="pocket"></div>
        <div class="seal">🐧</div>
        <div class="envelope-title">${escapeHtml(letter.title)}</div>
        ${badgeHtml}
      </div>
    `;
    container.appendChild(wrap);
  });
}

// ===== 10. SECRETS =====
async function loadSecrets() {
  const stackContainer = document.getElementById('heartsStack');
  const readContainer = document.getElementById('readSecretsList');
  if (!stackContainer || !readContainer) return;

  const { data, error } = await supabaseClient.from('secrets').select('*').neq('sender', currentRole).order('created_at', { ascending: false });
  if (error) { console.warn(error.message); return; }

  stackContainer.innerHTML = '';
  readContainer.innerHTML = '';

  const unreadSecrets = (data || []).filter(secret => !secret.is_read);
  const readSecrets = (data || []).filter(secret => secret.is_read);

  unreadSecrets.forEach((secret, index) => {
    const heart = document.createElement('div');
    heart.className = 'secret-heart unread';
    heart.style.transform = `rotate(${(Math.random() * 30) - 15}deg) translateX(${(Math.random() * 20) - 10}px)`;
    heart.style.zIndex = unreadSecrets.length - index;
    heart.innerHTML = '💌';

    heart.onclick = async () => {
      document.getElementById('secretBody').innerHTML = escapeHtml(secret.text).replace(/\n/g, '<br>');
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
        document.getElementById('secretBody').innerHTML = escapeHtml(secret.text).replace(/\n/g, '<br>');
        document.getElementById('secretView').classList.add('open');
      };
      div.innerHTML = `<span style="font-family: 'Caveat', cursive; font-size: 1.4rem; color: #9b6b7a;">💌 A little secret</span> <span style="font-size: 0.9rem; color: #aaa;">(click to read)</span>`;
      readContainer.appendChild(div);
    });
  }
}

// ===== 11. US =====
async function loadUs() {
  const container = document.getElementById('pinboard');
  if (!container) return;
  const { data, error } = await supabaseClient.from('us_moments').select('*').order('created_at', { ascending: false });
  if (error) { console.warn(error.message); return; }
  container.innerHTML = '';
  (data || []).forEach(moment => {
    const img = document.createElement('img');
    img.src = moment.image_url;
    img.className = 'pinned-photo';
    container.appendChild(img);
  });
}

// ===== 12. OUR DAY =====
async function loadOurDay() {
  const container = document.getElementById('daysList');
  if (!container) return;

  const { data, error } = await supabaseClient.from('our_day').select('*').order('date', { ascending: false });
  if (error) { console.warn(error.message); return; }
  container.innerHTML = '';

  const groupedByDate = {};
  (data || []).forEach(entry => {
    if (!groupedByDate[entry.date]) groupedByDate[entry.date] = [];
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
          <span class="day-img-sender">${escapeHtml(entry.sender)}</span>
          <p class="day-img-text">${escapeHtml(entry.text)}</p>
        `;
        imagesContainer.appendChild(imgWrap);
      });
      document.getElementById('dayViewText').textContent = '';
      document.getElementById('dayView').classList.add('open');
    };

    div.innerHTML = `<div class="day-date" style="margin-bottom: 0;">📅 ${date}</div>`;
    container.appendChild(div);
  }
}

// ===== 13. BUCKET LIST =====
async function loadBucketList() {
  const container = document.getElementById('bucketList');
  if (!container) return;

  const { data, error } = await supabaseClient.from('bucket_list').select('*').order('created_at', { ascending: false });
  if (error) { console.warn(error.message); return; }

  allBucketItems = data || [];
  renderBucketList();
}

window.filterBucketList = (place) => {
  bucketPlaceFilter = place;
  document.querySelectorAll('#bucketFilter .nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.place === place);
  });
  renderBucketList();
};

function renderBucketList() {
  const container = document.getElementById('bucketList');
  if (!container) return;

  const items = bucketPlaceFilter === 'all'
    ? allBucketItems
    : allBucketItems.filter(item => item.place === bucketPlaceFilter);

  container.innerHTML = '';
  if (!items.length) {
    container.innerHTML = '<p class="subtitle">nothing here yet…</p>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'bucket-card' + (item.is_done ? ' is-done' : '');
    const thumb = item.image_url
      ? `<img src="${item.image_url}" alt="">`
      : `<span class="bucket-thumb-emoji">🪣</span>`;
    card.innerHTML = `
      <div class="bucket-thumb">${thumb}</div>
      <div class="bucket-text">
        <div class="bucket-title">${escapeHtml(item.title)}</div>
        <div class="bucket-place">${item.place ? '📍 ' + escapeHtml(item.place) : ''}</div>
      </div>
      ${item.is_done ? '<span class="bucket-done-badge">✓ done</span>' : ''}
    `;
    card.onclick = () => openBucketDetail(item);
    container.appendChild(card);
  });
}

function openBucketDetail(item) {
  currentBucketId = item.id;
  currentBucketPhotos = Array.isArray(item.photos) ? item.photos.slice() : [];

  document.getElementById('bucketViewTitle').textContent = item.title;
  document.getElementById('bucketViewPlace').textContent = item.place ? '📍 ' + item.place : '';
  document.getElementById('bucketViewDetails').textContent = item.details || '';

  const img = document.getElementById('bucketViewImage');
  if (item.image_url) {
    img.src = item.image_url;
    img.style.display = 'block';
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
  }

  const doneBtn = document.getElementById('bucketDoneBtn');
  doneBtn.textContent = item.is_done ? '↩ mark as not done' : '✓ mark as done';

  renderBucketPhotos();
  document.getElementById('bucketView').classList.add('open');
}

function renderBucketPhotos() {
  const container = document.getElementById('bucketPhotos');
  if (!container) return;
  container.innerHTML = '';
  currentBucketPhotos.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.onclick = () => window.open(url, '_blank');
    container.appendChild(img);
  });
}

window.submitBucketItem = async () => {
  const title = document.getElementById('bucket-title').value.trim();
  const details = document.getElementById('bucket-details').value.trim();
  const place = document.getElementById('bucket-place').value;
  const file = document.getElementById('bucket-image').files[0];

  if (!title) return alert("Bitte eine Aktivität eingeben!");

  let imgUrl = null;
  if (file) {
    imgUrl = await uploadImage(file);
    if (!imgUrl) return;
  }

  const { error } = await supabaseClient.from('bucket_list').insert([{
    title,
    details,
    place,
    image_url: imgUrl,
    is_done: false,
    photos: [],
    sender: currentRole
  }]);

  if (error) alert(error.message);
  else {
    resetBucketForm();
    document.getElementById('addBucketView').classList.remove('open');
    loadBucketList();
  }
};

window.submitBucketPhotos = async () => {
  const input = document.getElementById('bucket-photo-input');
  const files = input.files;
  if (!files || !files.length) return alert("Bitte Fotos auswählen!");

  for (const file of files) {
    const url = await uploadImage(file);
    if (url) currentBucketPhotos.push(url);
  }

  const { error } = await supabaseClient.from('bucket_list').update({ photos: currentBucketPhotos }).eq('id', currentBucketId);
  if (error) alert(error.message);
  else {
    input.value = '';
    renderBucketPhotos();
    loadBucketList();
  }
};

window.toggleBucketDone = async () => {
  const item = allBucketItems.find(i => i.id === currentBucketId);
  if (!item) return;
  const newValue = !item.is_done;

  const { error } = await supabaseClient.from('bucket_list').update({ is_done: newValue }).eq('id', item.id);
  if (error) { alert(error.message); return; }

  const doneBtn = document.getElementById('bucketDoneBtn');
  if (doneBtn) doneBtn.textContent = newValue ? '↩ mark as not done' : '✓ mark as done';
  item.is_done = newValue;
  loadBucketList();
};

window.deleteBucketItem = async () => {
  if (!currentBucketId) return;
  if (!confirm("Diese Idee wirklich löschen?")) return;

  const { error } = await supabaseClient.from('bucket_list').delete().eq('id', currentBucketId);
  if (error) { alert(error.message); return; }

  document.getElementById('bucketView').classList.remove('open');
  currentBucketId = null;
  loadBucketList();
};

// ===== 14. WATCHLIST =====
async function loadWatchList() {
  const container = document.getElementById('watchList');
  if (!container) return;

  const { data, error } = await supabaseClient.from('watchlist').select('*').order('created_at', { ascending: false });
  if (error) { console.warn(error.message); return; }

  container.innerHTML = '';
  if (!data || !data.length) {
    container.innerHTML = '<p class="subtitle">nothing on the list yet…</p>';
    return;
  }
  data.forEach(item => container.appendChild(buildWatchCard(item)));
}

function buildWatchCard(item) {
  const card = document.createElement('div');
  card.className = 'watch-card' + (item.watched ? '' : ' not-watched');

  const poster = item.poster_url ? `<img src="${item.poster_url}" alt="">` : '🎬';

  card.innerHTML = `
    <div class="watch-poster">${poster}</div>
    <div class="watch-info">
      <div class="watch-title">${escapeHtml(item.title)}</div>
      <div class="watch-meta">${escapeHtml(item.type || '')}${item.year ? ' · ' + escapeHtml(item.year) : ''}</div>
      <div class="watch-ratings">
        ${starRow('Aly', item.rating_aly || 0, 'rating_aly')}
        ${starRow('Sebo', item.rating_sebo || 0, 'rating_sebo')}
      </div>
      <button class="watch-watched-btn ${item.watched ? 'is-on' : ''}">${item.watched ? '✓ watched' : 'mark as watched'}</button>
    </div>
  `;

  card.querySelectorAll('.watch-star.clickable').forEach(star => {
    star.addEventListener('click', () => setWatchRating(item.id, star.dataset.field, Number(star.dataset.value)));
  });
  card.querySelector('.watch-watched-btn').addEventListener('click', () => toggleWatchWatched(item.id, item.watched));

  return card;
}

function starRow(name, value, field) {
  const mine = (currentRole === 'Aly' && field === 'rating_aly') || (currentRole === 'Sebo' && field === 'rating_sebo');
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="watch-star ${i <= value ? 'filled' : ''} ${mine ? 'clickable' : ''}" data-field="${field}" data-value="${i}">★</span>`;
  }
  return `<div class="watch-rating-row"><span class="watch-name">${name}</span><span class="watch-stars">${stars}</span></div>`;
}

async function setWatchRating(id, field, value) {
  if (currentRole === 'Aly' && field !== 'rating_aly') return;
  if (currentRole === 'Sebo' && field !== 'rating_sebo') return;

  const { error } = await supabaseClient.from('watchlist').update({ [field]: value }).eq('id', id);
  if (error) alert(error.message);
  else loadWatchList();
}

async function toggleWatchWatched(id, current) {
  const { error } = await supabaseClient.from('watchlist').update({ watched: !current }).eq('id', id);
  if (error) alert(error.message);
  else loadWatchList();
}

window.searchWatchTitle = async () => {
  const query = document.getElementById('watch-search').value.trim();
  const results = document.getElementById('watch-results');
  if (!query) return alert("Bitte einen Titel eingeben!");

  if (!TMDB_API_KEY || TMDB_API_KEY === 'DEIN_TMDB_API_KEY') {
    results.innerHTML = '<p class="watch-result-meta">Bitte zuerst einen TMDB-API-Key in script.js eintragen.</p>';
    return;
  }

  results.innerHTML = '<p class="watch-result-meta">Searching…</p>';

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=de-DE&query=${encodeURIComponent(query)}`);
    const json = await res.json();
    const list = (json.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 10);

    results.innerHTML = '';
    if (!list.length) {
      results.innerHTML = '<p class="watch-result-meta">Nothing found.</p>';
      return;
    }

    list.forEach(r => {
      const title = r.title || r.name || '';
      const year = (r.release_date || r.first_air_date || '').slice(0, 4);
      const type = r.media_type === 'tv' ? 'Serie' : 'Film';
      const poster = r.poster_path ? TMDB_POSTER_BASE + r.poster_path : '';

      const el = document.createElement('div');
      el.className = 'watch-result';
      el.innerHTML = `
        <div class="watch-result-poster">${poster ? `<img src="${poster}" alt="">` : '🎬'}</div>
        <div class="watch-result-text">
          <div class="watch-result-title">${escapeHtml(title)}</div>
          <div class="watch-result-meta">${type}${year ? ' · ' + year : ''}</div>
        </div>
      `;
      el.onclick = () => selectWatchResult({ tmdb_id: r.id, title, year, type, poster_url: poster }, el);
      results.appendChild(el);
    });
  } catch (e) {
    results.innerHTML = '<p class="watch-result-meta">Search failed.</p>';
  }
};

function selectWatchResult(item, el) {
  selectedWatchItem = item;
  document.querySelectorAll('.watch-result').forEach(r => r.classList.remove('selected'));
  if (el) el.classList.add('selected');

  const box = document.getElementById('watch-selected');
  box.style.display = 'flex';
  document.getElementById('watch-selected-title').textContent = item.title;
  document.getElementById('watch-selected-meta').textContent = `${item.type}${item.year ? ' · ' + item.year : ''}`;

  const img = document.getElementById('watch-selected-poster');
  if (item.poster_url) {
    img.src = item.poster_url;
    img.style.display = 'block';
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
  }
}

window.submitWatchItem = async () => {
  if (!selectedWatchItem) return alert("Bitte zuerst einen Titel suchen und auswählen!");

  const { error } = await supabaseClient.from('watchlist').insert([{
    tmdb_id: selectedWatchItem.tmdb_id,
    title: selectedWatchItem.title,
    year: selectedWatchItem.year,
    type: selectedWatchItem.type,
    poster_url: selectedWatchItem.poster_url,
    rating_aly: 0,
    rating_sebo: 0,
    watched: false,
    sender: currentRole
  }]);

  if (error) alert(error.message);
  else {
    resetWatchForm();
    document.getElementById('addWatchView').classList.remove('open');
    loadWatchList();
  }
};

// ===== 15. SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
