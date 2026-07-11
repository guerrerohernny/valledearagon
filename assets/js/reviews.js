// ============================================================
// REVIEWS.JS — Firebase + Google OAuth
// ============================================================
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCbv3WZse4XkFHYd87-YMIbocGgVqRAKdo",
  authDomain:        "valle-de-aragon-e870a.firebaseapp.com",
  projectId:         "valle-de-aragon-e870a",
  storageBucket:     "valle-de-aragon-e870a.firebasestorage.app",
  messagingSenderId: "859555959910",
  appId:             "1:859555959910:web:becb4222a851f3375909a7",
};

let fbApp = null, fbAuth = null, fbDb = null, currentUser = null;
let fbModules = null;
let userExistingReview = null;

// ── Init: carga Firebase SDK como módulo ESM ──
async function reviewsInit() {
  // Fallback si no hay config
  if (FIREBASE_CONFIG.apiKey === "PEGA_TU_apiKey_AQUI") {
    const loadingEl = document.getElementById('reviewsLoading');
    const loginBox = document.getElementById('reviewsLoginBox');
    if (loadingEl) loadingEl.style.display = 'none';
    if (loginBox) {
      loginBox.style.display = 'block';
      loginBox.innerHTML = `<p style="color:rgba(249,246,240,.5);font-size:13px">Las reseñas estarán disponibles pronto.</p>`;
    }
    return;
  }

  try {
    // Import Firebase SDK dinámicamente (ESM)
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const authMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    const dbMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    fbApp = appMod.initializeApp(FIREBASE_CONFIG);
    fbAuth = authMod.getAuth(fbApp);
    fbDb = dbMod.getFirestore(fbApp);

    fbModules = {
      GoogleAuthProvider: authMod.GoogleAuthProvider,
      signInWithPopup:    authMod.signInWithPopup,
      signInWithRedirect: authMod.signInWithRedirect,
      getRedirectResult:  authMod.getRedirectResult,
      signOut:            authMod.signOut,
      onAuthStateChanged: authMod.onAuthStateChanged,
      setDoc:             dbMod.setDoc,
      getDoc:             dbMod.getDoc,
      getDocs:            dbMod.getDocs,
      doc:                dbMod.doc,
      collection:         dbMod.collection,
      query:              dbMod.query,
      orderBy:            dbMod.orderBy,
    };

    // Check if user came back from redirect (mobile flow)
    try {
      await fbModules.getRedirectResult(fbAuth);
    } catch (e) {
      console.warn('Redirect result check:', e);
    }

    // Listen for auth state changes
    fbModules.onAuthStateChanged(fbAuth, user => {
      currentUser = user;
      updateAuthUI();
      loadReviews();
    });

    loadReviews();
  } catch (e) {
    console.error('Firebase init error:', e);
    const loadingEl = document.getElementById('reviewsLoading');
    if (loadingEl) loadingEl.textContent = 'Error al cargar reseñas.';
  }
}

// ── Auth UI ──
function updateAuthUI() {
  const loading = document.getElementById('reviewsLoading');
  const loginBox = document.getElementById('reviewsLoginBox');
  const formBox = document.getElementById('reviewFormBox');
  if (!loading || !loginBox || !formBox) return;

  loading.style.display = 'none';

  if (currentUser) {
    loginBox.style.display = 'none';
    formBox.style.display = 'block';
    const av = document.getElementById('reviewUserAvatar');
    const nm = document.getElementById('reviewUserName');
    if (av) {
      av.src = currentUser.photoURL || '';
      av.style.display = currentUser.photoURL ? 'block' : 'none';
    }
    if (nm) nm.textContent = currentUser.displayName || currentUser.email || 'Usuario';
    loadUserReview();
  } else {
    loginBox.style.display = 'block';
    formBox.style.display = 'none';
  }
}

// ── Google Login ──
async function reviewsGoogleLogin() {
  if (!fbAuth || !fbModules) {
    alert('Firebase todavía está cargando, intenta en unos segundos.');
    return;
  }
  const provider = new fbModules.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // Detectar móvil para usar redirect (más confiable en iOS/Android)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  try {
    if (isMobile) {
      await fbModules.signInWithRedirect(fbAuth, provider);
    } else {
      await fbModules.signInWithPopup(fbAuth, provider);
    }
  } catch (e) {
    console.error('Login error:', e.code, e.message);
    if (e.code === 'auth/popup-blocked') {
      // Fallback a redirect si popup fue bloqueado
      try {
        await fbModules.signInWithRedirect(fbAuth, provider);
      } catch (e2) {
        alert('No se pudo iniciar sesión. ' + e2.message);
      }
    } else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      alert('Error al iniciar sesión: ' + e.message);
    }
  }
}

async function reviewsLogout() {
  if (!fbAuth || !fbModules) return;
  await fbModules.signOut(fbAuth);
}

async function loadUserReview() {
  if (!currentUser || !fbDb || !fbModules) return;
  try {
    const snap = await fbModules.getDoc(fbModules.doc(fbDb, 'reviews', currentUser.uid));
    if (snap.exists()) {
      userExistingReview = snap.data();
      const ta = document.getElementById('reviewText');
      if (ta) ta.value = userExistingReview.text || '';
      const radio = document.querySelector(`input[name="stars"][value="${userExistingReview.stars}"]`);
      if (radio) radio.checked = true;
      const btn = document.getElementById('btnSubmitReview');
      if (btn) btn.textContent = 'Actualizar reseña';
    }
  } catch (e) {
    console.error('Load user review error:', e);
  }
}

async function submitReview() {
  if (!currentUser || !fbDb || !fbModules) return;
  const stars = parseInt(document.querySelector('input[name="stars"]:checked')?.value || '0');
  const text = document.getElementById('reviewText')?.value?.trim() || '';
  const status = document.getElementById('reviewStatus');
  const btn = document.getElementById('btnSubmitReview');

  if (!stars) { if(status) status.textContent = 'Selecciona las estrellas'; return; }
  if (!text)  { if(status) status.textContent = 'Escribe un comentario';   return; }

  btn.disabled = true;
  if (status) status.textContent = 'Publicando...';

  try {
    await fbModules.setDoc(fbModules.doc(fbDb, 'reviews', currentUser.uid), {
      uid: currentUser.uid,
      name: currentUser.displayName || 'Anónimo',
      avatar: currentUser.photoURL || '',
      stars, text,
      createdAt: Date.now(),
    });
    if (status) status.textContent = '✓ Publicada';
    btn.textContent = 'Actualizar reseña';
    btn.disabled = false;
    loadReviews();
  } catch (e) {
    console.error('Submit error:', e);
    if (status) status.textContent = 'Error al publicar';
    btn.disabled = false;
  }
}

async function loadReviews() {
  const grid = document.getElementById('reviewsGrid');
  const empty = document.getElementById('reviewsEmpty');
  const loading = document.getElementById('reviewsLoading');
  if (!grid || !fbDb || !fbModules) return;

  try {
    const q = fbModules.query(fbModules.collection(fbDb, 'reviews'), fbModules.orderBy('createdAt', 'desc'));
    const snap = await fbModules.getDocs(q);
    const reviews = [];
    snap.forEach(d => reviews.push(d.data()));

    if (loading) loading.style.display = 'none';

    if (!reviews.length) {
      grid.innerHTML = '';
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
      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'}) : '';
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
  } catch (e) {
    console.error('Load reviews error:', e);
    if (loading) loading.style.display = 'none';
  }
}

// Expose functions to global for onclick handlers
window.reviewsGoogleLogin = reviewsGoogleLogin;
window.reviewsLogout = reviewsLogout;
window.submitReview = submitReview;

document.addEventListener('DOMContentLoaded', reviewsInit);
