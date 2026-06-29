// ============================================================
// REVIEWS.JS — Firebase + Google OAuth
// ============================================================
// PASO 1: Ve a https://console.firebase.google.com
//         Crea un proyecto → Agrega app web → copia firebaseConfig
// PASO 2: En Firebase Console → Authentication → Habilitar Google
// PASO 3: En Firebase Console → Firestore Database → Crear BD (modo producción)
//         Agrega esta regla en Firestore Rules:
//         rules_version = '2';
//         service cloud.firestore {
//           match /databases/{database}/documents {
//             match /reviews/{uid} {
//               allow read: if true;
//               allow write: if request.auth != null && request.auth.uid == uid;
//             }
//           }
//         }
// PASO 4: Pega tus claves en FIREBASE_CONFIG abajo
// PASO 5: En Google Cloud Console → APIs & Services → Credentials
//         Agrega tu dominio en "Authorized JavaScript origins"
// ============================================================

const FIREBASE_CONFIG = {
  apiKey:            "PEGA_TU_apiKey_AQUI",
  authDomain:        "PEGA_TU_authDomain_AQUI",
  projectId:         "PEGA_TU_projectId_AQUI",
  storageBucket:     "PEGA_TU_storageBucket_AQUI",
  messagingSenderId: "PEGA_TU_messagingSenderId_AQUI",
  appId:             "PEGA_TU_appId_AQUI",
};

// ── Estado ──
let fbApp = null, fbAuth = null, fbDb = null, currentUser = null;
let userExistingReview = null;

// ── Init: carga Firebase SDKs dinámicamente ──
function reviewsInit() {
  // Si no hay config real, mostrar sección informativa sin romper el sitio
  if (FIREBASE_CONFIG.apiKey === "PEGA_TU_apiKey_AQUI") {
    document.getElementById('reviewsLoading').style.display = 'none';
    document.getElementById('reviewsLoginBox').style.display = 'block';
    document.getElementById('reviewsLoginBox').innerHTML = `
      <p style="color:rgba(249,246,240,.5);font-size:13px">
        Las reseñas estarán disponibles pronto.<br>
        <small style="color:rgba(249,246,240,.3)">(Configura Firebase en assets/js/reviews.js)</small>
      </p>`;
    return;
  }

  // Load Firebase SDK
  const sdkBase = 'https://www.gstatic.com/firebasejs/10.12.0/';
  const scripts = [
    sdkBase + 'firebase-app.js',
    sdkBase + 'firebase-auth.js',
    sdkBase + 'firebase-firestore.js',
  ];

  let loaded = 0;
  scripts.forEach(src => {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = src;
    s.onload = () => { if (++loaded === scripts.length) _reviewsStart(); };
    s.onerror = () => {
      document.getElementById('reviewsLoading').style.display = 'none';
    };
    document.head.appendChild(s);
  });
}

// Use dynamic import for Firebase (ESM)
async function _reviewsStart() {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
      = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    const { getFirestore, collection, doc, setDoc, getDoc, getDocs, orderBy, query }
      = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    fbApp  = initializeApp(FIREBASE_CONFIG);
    fbAuth = getAuth(fbApp);
    fbDb   = getFirestore(fbApp);

    // Store refs globally for button handlers
    window._fbRefs = { GoogleAuthProvider, signInWithPopup, signOut, setDoc, getDoc, getDocs, doc, collection, orderBy, query };

    onAuthStateChanged(fbAuth, user => {
      currentUser = user;
      _updateAuthUI();
      _loadReviews();
    });

    _loadReviews();
  } catch(e) {
    console.error('Firebase init error:', e);
    document.getElementById('reviewsLoading').style.display = 'none';
  }
}

// ── Auth UI ──
function _updateAuthUI() {
  const loading    = document.getElementById('reviewsLoading');
  const loginBox   = document.getElementById('reviewsLoginBox');
  const formBox    = document.getElementById('reviewFormBox');
  if (!loading||!loginBox||!formBox) return;

  loading.style.display = 'none';

  if (currentUser) {
    loginBox.style.display = 'none';
    formBox.style.display  = 'block';
    const av = document.getElementById('reviewUserAvatar');
    const nm = document.getElementById('reviewUserName');
    if (av) { av.src = currentUser.photoURL||''; av.style.display = currentUser.photoURL?'block':'none'; }
    if (nm) nm.textContent = currentUser.displayName||currentUser.email||'Usuario';
    // Pre-fill if existing review
    _loadUserReview();
  } else {
    loginBox.style.display = 'block';
    formBox.style.display  = 'none';
  }
}

async function reviewsGoogleLogin() {
  if (!fbAuth || !window._fbRefs) return;
  const { GoogleAuthProvider, signInWithPopup } = window._fbRefs;
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(fbAuth, provider);
  } catch(e) { console.error('Login error:', e); }
}

async function reviewsLogout() {
  if (!fbAuth || !window._fbRefs) return;
  const { signOut } = window._fbRefs;
  await signOut(fbAuth);
}

async function _loadUserReview() {
  if (!currentUser || !fbDb || !window._fbRefs) return;
  const { getDoc, doc } = window._fbRefs;
  const snap = await getDoc(doc(fbDb, 'reviews', currentUser.uid));
  if (snap.exists()) {
    userExistingReview = snap.data();
    // Pre-fill form
    const ta = document.getElementById('reviewText');
    if (ta) ta.value = userExistingReview.text || '';
    const radio = document.querySelector(`input[name="stars"][value="${userExistingReview.stars}"]`);
    if (radio) radio.checked = true;
    const btn = document.getElementById('btnSubmitReview');
    if (btn) btn.textContent = 'Actualizar reseña';
  }
}

// ── Submit review ──
async function submitReview() {
  if (!currentUser || !fbDb || !window._fbRefs) return;
  const { setDoc, doc } = window._fbRefs;

  const stars = parseInt(document.querySelector('input[name="stars"]:checked')?.value || '0');
  const text  = document.getElementById('reviewText')?.value?.trim() || '';
  const status = document.getElementById('reviewStatus');
  const btn  = document.getElementById('btnSubmitReview');

  if (!stars) { if(status) status.textContent = 'Selecciona las estrellas'; return; }
  if (!text)  { if(status) status.textContent = 'Escribe un comentario';   return; }

  btn.disabled = true;
  if (status) status.textContent = 'Publicando...';

  try {
    await setDoc(doc(fbDb, 'reviews', currentUser.uid), {
      uid:       currentUser.uid,
      name:      currentUser.displayName || 'Anónimo',
      avatar:    currentUser.photoURL || '',
      stars,
      text,
      createdAt: Date.now(),
    });
    if (status) status.textContent = '✓ Publicada';
    btn.textContent = 'Actualizar reseña';
    btn.disabled = false;
    _loadReviews();
  } catch(e) {
    console.error(e);
    if (status) status.textContent = 'Error al publicar';
    btn.disabled = false;
  }
}

// ── Load & render reviews ──
async function _loadReviews() {
  const grid    = document.getElementById('reviewsGrid');
  const empty   = document.getElementById('reviewsEmpty');
  const loading = document.getElementById('reviewsLoading');
  if (!grid) return;

  if (!fbDb || !window._fbRefs) {
    if (loading) loading.style.display = 'none';
    return;
  }

  const { getDocs, collection, query, orderBy } = window._fbRefs;
  try {
    const q    = query(collection(fbDb, 'reviews'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const reviews = [];
    snap.forEach(d => reviews.push(d.data()));

    if (loading) loading.style.display = 'none';

    if (!reviews.length) {
      grid.innerHTML  = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    grid.innerHTML = reviews.map(r => {
      const stars = Array.from({length:5}, (_,i) =>
        `<span class="review-star ${i < r.stars ? 'filled' : ''}">★</span>`
      ).join('');
      const initials = (r.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
      const avatarHtml = r.avatar
        ? `<img class="review-avatar" src="${r.avatar}" alt="${r.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '';
      const placeholder = `<div class="review-avatar-placeholder" ${r.avatar?'style="display:none"':''}>${initials}</div>`;
      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-MX', {day:'numeric',month:'short',year:'numeric'}) : '';
      return `<div class="review-card">
        <div class="review-card-top">
          ${avatarHtml}${placeholder}
          <div class="review-meta">
            <div class="review-name">${r.name||'Cliente'}</div>
            <div class="review-date">${dateStr}</div>
          </div>
        </div>
        <div class="review-stars">${stars}</div>
        <div class="review-text">${r.text||''}</div>
      </div>`;
    }).join('');
  } catch(e) {
    console.error('Load reviews error:', e);
    if (loading) loading.style.display = 'none';
  }
}

// ── Init on DOM ready ──
document.addEventListener('DOMContentLoaded', reviewsInit);
