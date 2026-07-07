// ============================================================
// MAIN.JS — Modal + Galería + Nav  (sin cotizador)
// ============================================================

const MD = {
  berdun:{
    name:'Berdún', price:'Desde $4,670,000', m2c:'228.66', m2t:'144', beds:'4', baths:'4',
    ew:'★ El más vendido · Cochera techada · Lote 8×18',
    desc:'El Berdún es el modelo más completo: baño y vestidor en TODAS las habitaciones, bar/asador en patio y preparación Starlink. Cochera techada con espacio para 3 autos.',
    feats:['Preparación Starlink','Bar / Asador en patio','Baño y vestidor en todas las hab.','3 recámaras totales','Cuarto de lavado en planta alta','WC independiente del área de ducha','Cochera techada · 3 autos'],
    media:[
      {type:'img', src:'assets/img/berdun_fachada.jpg',          caption:'Fachada Berdún'},
      {type:'img', src:'assets/img/berdun_planta.jpg',        caption:'Distribución en planta'},
      {type:'yt', src:'TdkvFp07gLQ', caption:'Recorrido'},
      {type:'yt', src:'jMkI9hVNl2o', caption:'Detalles'},
    ]
  },
  mirambel:{
    name:'Mirambel', price:'Desde $4,830,000', m2c:'225.66', m2t:'144', beds:'4', baths:'4',
    ew:'Cochera techada · Doble altura · Lote 8×18',
    desc:'El Mirambel impresiona con su recibidor en doble altura y habitación completa en planta baja con baño propio. Cochera techada para 3 autos. Ideal para familias que no quieren sacrificar nada.',
    feats:['Doble altura en sala','Habitación en PB con baño completo','WC independiente en rec. principal','4 recámaras totales','Cuarto de lavado en planta alta','Vestidor completo en rec. principal','Cochera techada · 3 autos'],
    media:[
      {type:'img', src:'assets/img/mirambel_fachada.jpg',           caption:'Fachada Mirambel'},
      {type:'img', src:'assets/img/mirambel_planta.jpg',         caption:'Distribución en planta'},
      {type:'yt', src:'r7bnAp0-jGw', caption:'Recorrido'},
      {type:'yt', src:'4V96E8r4UJw', caption:'Detalles'},
    ]
  },
  arago:{
    name:'Aragó', price:'Desde $4,360,000', m2c:'194.40', m2t:'144', beds:'3+', baths:'3',
    ew:'Modelo intermedio · Lote 8×18',
    desc:'El Aragó añade sala/estudio, terraza trasera y cuarto de lavado en planta alta. El modelo con mayor versatilidad para personalización de espacios.',
    feats:['Sala / Estudio adicional','Terraza trasera','Cuarto de lavado en planta alta','Baño completo en todas las hab.','Vestidor amplio en recámara principal','Regadera independiente del WC'],
    media:[
      {type:'img', src:'assets/img/arago_fachada.jpg',          caption:'Fachada Aragó'},
      {type:'img', src:'assets/img/arago_planta.jpg',        caption:'Distribución en planta'},
      {type:'yt', src:'OvBgroU7dAA', caption:'Recorrido'},
      {type:'yt', src:'ATJ7PG_w-Jo', caption:'Detalles'},
    ]
  },
  ambel:{
    name:'Ambel', price:'Desde $4,050,000', m2c:'173.05', m2t:'144', beds:'3+', baths:'3',
    ew:'Modelo base · Lote 8×18',
    desc:'El Ambel es el punto de entrada al portafolio premium de Valle de Aragón. Dos plantas bien distribuidas, cocina con alacena y baño completo en todas las habitaciones.',
    feats:['Cocina con alacena','Baño en todas las habitaciones','Puertas piso a techo','Área de lavado en patio','Vestidor en recámara principal','Piso rectificado 80×80'],
    media:[
      {type:'img', src:'assets/img/ambel_fachada.jpg',          caption:'Fachada Ambel'},
      {type:'img', src:'assets/img/ambel_planta.jpg',        caption:'Distribución en planta'},
      {type:'yt', src:'Xm2srcK8lRo', caption:'Recorrido'},
      {type:'yt', src:'8iqHL2o2zXU', caption:'Detalles'},
    ]
  },
  morello:{
    name:'Morello', price:'Desde $3,500,000', m2c:'142.62', m2t:'126', beds:'3', baths:'2.5',
    ew:'Nuevo modelo accesible · Solo Manzana 10',
    desc:'El Morello nace para quienes quieren vivir en Valle de Aragón con sus amenidades y ubicación en un formato compacto y accesible. Se construye exclusivamente en la Manzana 10.',
    feats:['Sala, comedor, cocina abierta','Medio baño en planta baja','Recámara principal con baño completo','2 recámaras secundarias','Área de lavado y patio'],
    media:[
      {type:'img', src:'assets/img/morello_fachada.jpg', caption:'Fachada Morello'},
      {type:'img', src:'assets/img/morello_planta.jpg', caption:'Distribución en planta'},
    ]
  },
};

let galIdx = 0, galItems = [], touchStartX = 0;

function openModal(id) {
  galIdx = 0;
  const d = MD[id];
  if (!d) return;
  galItems = d.media;
  const featsHtml = d.feats.map(f=>`<div class="mc-f">${f}</div>`).join('');
  document.getElementById('modal-body').innerHTML = `
    <div class="gal-wrap" id="galWrap">
      <div class="gal-stage" id="galStage"></div>
      <button class="gal-arrow gal-prev" id="galPrev" onclick="galMove(-1)">&#8249;</button>
      <button class="gal-arrow gal-next" id="galNext" onclick="galMove(1)">&#8250;</button>
      <div class="gal-dots" id="galDots"></div>
      <div class="gal-caption" id="galCaption"></div>
    </div>
    <div class="mc-inner">
      <div class="mc-ew">${d.ew}</div>
      <div class="mc-title"><em>${d.name}</em></div>
      <div class="mc-specs">
        <div class="mc-pill">${d.m2c} m² construcción</div>
        <div class="mc-pill">${d.m2t} m² terreno</div>
        <div class="mc-pill">${d.beds} rec · ${d.baths} baños</div>
        <div class="mc-pill">Desde ${d.price}</div>
      </div>
      <p class="mc-desc">${d.desc}</p>
      <div class="mc-fg">${featsHtml}</div>
      <div class="mc-acts">
        <a href="#cotizador" onclick="closeModal()"><span class="bp" style="font-size:10px;padding:12px 24px">Cotizar este modelo →</span></a>
        <a href="https://wa.me/526679265145?text=Hola%20Hernny,%20me%20interesa%20el%20modelo%20${encodeURIComponent(d.name)}%20de%20Valle%20de%20Aragón" target="_blank">
          <button class="bwa" style="font-size:10px;padding:11px 18px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            Contáctanos
          </button>
        </a>
      </div>
    </div>`;
  document.getElementById('galDots').innerHTML = galItems.map((_,i)=>`<button class="gal-dot ${i===0?'active':''}" onclick="galGoto(${i})"></button>`).join('');
  const stage = document.getElementById('galStage');
  stage.addEventListener('touchstart', e=>{ touchStartX = e.touches[0].clientX; }, {passive:true});
  stage.addEventListener('touchend', e=>{ const dx = e.changedTouches[0].clientX - touchStartX; if(Math.abs(dx)>40) galMove(dx<0?1:-1); });
  renderGalItem(0);
  document.getElementById('modal-ov').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderGalItem(idx) {
  const item = galItems[idx];
  const stage = document.getElementById('galStage');
  stage.querySelectorAll('video').forEach(v=>v.pause());
  if (item.type === 'img') {
    stage.innerHTML = `<img src="${item.src}" alt="${item.caption}" class="gal-img" onclick="openLightbox('${item.src}')">`;
  } else if (item.type === 'yt') {
    if (!item.src || item.src.includes('_ID') || item.src.length < 6) {
      stage.innerHTML = '<div class="gal-vid-ph"><div>📹</div><div style="margin-top:12px;font-size:13px;">Video próximamente disponible</div></div>';
    } else {
      stage.innerHTML = `<div class="gal-vid-wrap"><iframe class="gal-yt" src="https://www.youtube.com/embed/${item.src}?rel=0&modestbranding=1&playsinline=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
    }
  } else {
    stage.innerHTML = `<div class="gal-vid-wrap"><video class="gal-vid" controls playsinline preload="metadata">
      <source src="${item.src}" type="video/mp4"></video></div>`;
  }
  document.querySelectorAll('.gal-dot').forEach((d,i)=>d.classList.toggle('active',i===idx));
  const cap = document.getElementById('galCaption');
  if (cap) cap.textContent = item.caption;
  const prev = document.getElementById('galPrev');
  const next = document.getElementById('galNext');
  if (prev) prev.style.opacity = idx===0?'0.3':'1';
  if (next) next.style.opacity = idx===galItems.length-1?'0.3':'1';
}

function galMove(dir) {
  const newIdx = Math.max(0, Math.min(galItems.length-1, galIdx+dir));
  if (newIdx === galIdx) return;
  galIdx = newIdx;
  renderGalItem(galIdx);
}
function galGoto(idx) { galIdx=idx; renderGalItem(idx); }

function openLightbox(src) {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `<div class="lb-bg" onclick="this.parentElement.remove()"></div><img src="${src}" class="lb-img"><button class="lb-close" onclick="this.parentElement.remove()">✕</button>`;
  document.body.appendChild(lb);
}

function closeModal() {
  document.querySelectorAll('#modal-body video').forEach(v=>v.pause());
  document.getElementById('modal-ov').classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOut(e) { if(e.target===document.getElementById('modal-ov')) closeModal(); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeModal(); document.querySelectorAll('.lightbox').forEach(l=>l.remove()); }});

function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('scroll', () => {
    document.getElementById('nav')?.classList.toggle('sc', window.scrollY > 60);
  });
});

// ── ABOUT SLIDER ──
let aboutSliderIdx = 0;
function initAboutSlider(){
  const slides = document.querySelectorAll('.about-slide');
  const dotsWrap = document.getElementById('aboutDots');
  if(!slides.length || !dotsWrap) return;
  // Create dots
  slides.forEach((_,i)=>{
    const d = document.createElement('button');
    d.className = 'about-sdot'+(i===0?' active':'');
    d.onclick = ()=>{ aboutSliderGoto(i); clearInterval(aboutSliderTimer); };
    dotsWrap.appendChild(d);
  });
  aboutSliderTimer = setInterval(()=>{
    aboutSliderIdx = (aboutSliderIdx+1) % slides.length;
    aboutSliderGoto(aboutSliderIdx);
  }, 3000);
}
let aboutSliderTimer = null;
function aboutSliderGoto(idx){
  const slides=document.querySelectorAll('.about-slide');
  const dots=document.querySelectorAll('.about-sdot');
  slides.forEach((s,i)=>s.classList.toggle('active',i===idx));
  dots.forEach((d,i)=>d.classList.toggle('active',i===idx));
  aboutSliderIdx=idx;
}

// ── MANZANA BUTTONS with availability counters ──
function initMzButtons(){
  const wrap = document.getElementById('mzButtons');
  if(!wrap||!INVENTARIO) return;
  const mzList = [
    {mz:6, label:'Manzana 6', val:'6'},
    {mz:7, label:'Manzana 7', val:'7'},
    {mz:8, label:'Manzana 8', val:'8'},
    {mz:9, label:'Manzana 9', val:'9'},
    {mz:10,label:'Manzana 10',val:'10'},
  ];
  wrap.innerHTML = mzList.map(({mz,label,val})=>{
    const disp = INVENTARIO.filter(l=>l.mz===mz && l.st.toLowerCase()==='disponible').length;
    let dispLabel='', dispCls='ok';
    if(disp===0){ dispLabel='Agotada'; dispCls='agotada'; }
    else if(disp<=3){ dispLabel=`⏳ Solo ${disp} ${disp===1?'opción':'opciones'}`; dispCls='ultima'; }
    else { dispLabel=`${disp} opciones`; }
    const disabled = (disp===0 && !INVENTARIO.some(l=>l.mz===mz&&(l.enObra||l.loteMedio))) ? 'disabled' : '';
    return `<button class="mz-btn" onclick="selMz('${val}')" ${disabled}>
      <span class="mz-btn-wrap">
        <span>${label}</span>
        <span class="mz-disp ${dispCls}">${dispLabel}</span>
      </span>
    </button>`;
  }).join('');
}

// Override DOMContentLoaded to add new inits
document.addEventListener('DOMContentLoaded', ()=>{
  initAboutSlider();
  // mzButtons initialized after INVENTARIO loads (cotizador.js runs after main.js)
  setTimeout(initMzButtons, 50);
});
