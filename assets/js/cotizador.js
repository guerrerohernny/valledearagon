// ============================================================
// COTIZADOR VALLE DE ARAGÓN v8
// Fórmula BBVA verificada: mensualidad base = fórmula anualidad francesa
// Credito máximo BBVA = min(vv*0.90, 4203000)
// Seguros = vida + daños + CAD (mostrados separados)
// ============================================================

const P = {
  precioM2ExcCasa:      9000,
  loteMorello:          126,
  loteStd:              144,
  plusEsquina:          50000,
  plusParque:           50000,
  plusEsquinaParque:    75000,
  avaluo:               17000,
  otrosGastos:          780,
  comisionAperturaPct:  0.01,       // 1% sobre crédito (no del simulador, del acuerdo)
  gastosNotarPct:       0.05,
  apartadoCredito:      50000,
  firmaCredito:         200000,
  apartadoContado:      100000,
  firmaContado:         500000,
  tasaAnual:            0.101,      // 10.10% fija BBVA
  plazoAnios:           20,
  aforoMax:             0.90,
  creditoMaxBBVA:       4203000,    // Límite del producto BBVA Oferta Corredores
  // Seguros BBVA (para mostrar estimado)
  factorVidaMil:        0.6000333333,  // por mil del crédito
  factorDaniosMil:      0.15929833,    // por mil del valor asegurable
  factorValorAsegPct:   0.7311,        // % del valor vivienda = valor asegurable est.
  cadMil:               0.08,          // comisión aut. diferida por mil mensual
};

const MODS_COT = {
  berdun:   {nombre:'Berdún',   precio:4670000, m2c:228.66, loteBase:144, soloM10:false, img:'assets/img/berdun_fachada.jpg'},
  mirambel: {nombre:'Mirambel', precio:4830000, m2c:225.66, loteBase:144, soloM10:false, img:'assets/img/mirambel_fachada.jpg'},
  arago:    {nombre:'Aragó',    precio:4360000, m2c:194.40, loteBase:144, soloM10:false, img:'assets/img/arago_fachada.jpg'},
  ambel:    {nombre:'Ambel',    precio:4050000, m2c:173.05, loteBase:144, soloM10:false, img:'assets/img/ambel_fachada.jpg'},
  morello:  {nombre:'Morello',  precio:3500000, m2c:142.62, loteBase:126, soloM10:true,  img:'assets/img/morello_fachada.jpg'},
};

// Orientación CORREGIDA: sol sale por Av. Ansó (M-6), se oculta hacia Av. Lérida (M-10)
// Sur = Calle Fago (M-8 Fago), Norte = Alfindén (M-9)
const MZ_ORIENT = {
  6: 'Oeste · Av. Ansó',
  7: 'Norte · Calle Aragó',
  8: 'Norte (lotes 1-11) / Sur (lotes 12-22)',
  9: 'Sur · Calle Alfindén',
  10:'Este · Av. Lérida',
};
// Orientación por lote individual en M-8
function mzOrientLote(mz, lote){
  if(mz===8) return lote<=11 ? 'Norte · Calle Alfindén' : 'Sur · Calle Fago';
  if(mz===7) return 'Norte · Calle Fago';
  if(mz===9) return 'Sur · Calle Alfindén';
  return MZ_ORIENT[mz]||'';
}
const MZ_LABEL = {6:'Manzana 6',7:'Manzana 7',8:'Manzana 8',9:'Manzana 9',10:'Manzana 10'};

// ── UTILS ──
function $$(n,d=0){ return '$'+Number(n).toLocaleString('es-MX',{minimumFractionDigits:d,maximumFractionDigits:d}); }
function pct(v){ return (v*100).toFixed(1)+'%'; }
function ultimoDia(d){ return new Date(d.getFullYear(), d.getMonth()+2, 0); }
function addM(f,m){ return new Date(f.getFullYear(), f.getMonth()+m+1, 0); }
function fDate(d){ return d.getDate()+' '+['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()]+' '+d.getFullYear(); }
function hipoteca(cap, tasa, anios){
  if(cap<=0) return 0;
  const i=tasa/12, n=anios*12;
  return cap*(i*(1+i)**n)/((1+i)**n-1);
}
function seguros(cap, vv){
  const vida = P.factorVidaMil/1000 * cap;
  const aseg = vv * P.factorValorAsegPct;
  const danios = P.factorDaniosMil/1000 * aseg;
  const cad = P.cadMil/1000 * cap;
  return { vida, danios, cad, total: vida+danios+cad };
}

// ── ESTADO ──
let COT = {mz:null, lote:null, mod:null, esquema:'credito', engPct:20, creditoManual:null};

// ── CONTADORES DE DISPONIBILIDAD ──
function dispCount(mz){
  return INVENTARIO.filter(l=>l.mz===mz && l.st.toLowerCase()==='disponible').length;
}

// ════════════════════════════════════════════════════════════
// STEP 1: MANZANA — usa mzButtons del HTML, loteRow, loteGrid, selInfo
// ════════════════════════════════════════════════════════════
function selMz(mz){
  COT.mz=parseInt(mz); COT.lote=null;
  document.querySelectorAll('.mz-btn').forEach(b=>b.classList.remove('sel'));
  event.currentTarget.classList.add('sel');
  const si=document.getElementById('selInfo');
  if(si){si.style.display='none';si.innerHTML='';}
  _buildGrid(COT.mz);
}

function _buildGrid(mzNum){
  const lr=document.getElementById('loteRow'), lg=document.getElementById('loteGrid');
  const ll=document.getElementById('loteLabelTxt');
  if(!lr||!lg) return;
  const isM10=mzNum===10;
  if(ll) ll.textContent = isM10 ? 'Manzana 10 — solo modelo Morello' : 'Selecciona el lote';
  lg.innerHTML='';
  // Remove old legend
  lr.querySelectorAll('.lote-legend').forEach(e=>e.remove());

  INVENTARIO.filter(l=>l.mz===mzNum).forEach(lot=>{
    const st=lot.st.toLowerCase();
    const btn=document.createElement('button');
    let cls='lot-btn '+st;
    let disabled=false;
    let label='';

    if(lot.enObra){
      cls='lot-btn en-obra';
      label=`<span class="lot-num">${lot.lote}</span><span class="lot-m2">${lot.m2}m²</span><span class="lot-badge-obra">En obra</span>`;
    } else if(lot.loteMedio){
      cls='lot-btn lote-especial';
      label=`<span class="lot-num">${lot.lote}</span><span class="lot-m2">${lot.m2}m²</span><span class="lot-badge-esp">★ Especial</span>`;
    } else {
      label=`<span class="lot-num">${lot.lote}</span><span class="lot-m2">${lot.m2}m²</span>`;
      if(st!=='disponible') disabled=true;
    }

    btn.className=cls;
    btn.innerHTML=label;
    btn.title=`Lote ${lot.lote} · ${lot.m2}m² · ${lot.tipoUbic} · ${lot.st}`;
    if(!disabled && (st==='disponible'||lot.enObra)){
      btn.addEventListener('click',()=>_selLote(lot,btn));
    } else {
      btn.disabled=true;
    }
    lg.appendChild(btn);
  });

  // Legend
  const leg=document.createElement('div');
  leg.className='lote-legend';
  leg.innerHTML=`
    <div class="leg-i"><div class="leg-dot" style="background:white;border:2px solid #2D5A1B"></div>Disponible</div>
    <div class="leg-i"><div class="leg-dot" style="background:#F5C842"></div>Apartado</div>
    <div class="leg-i"><div class="leg-dot" style="background:#2D5A1B"></div>Vendido</div>
    <div class="leg-i"><div class="leg-dot" style="background:#2563EB"></div>Casa muestra</div>
    <div class="leg-i"><div class="leg-dot" style="background:#E03B2E"></div>🎉 Escriturada</div>
    <div class="leg-i"><div class="leg-dot" style="background:#FF8C00"></div>En obra</div>
    <div class="leg-i"><div class="leg-dot" style="background:#8B5CF6"></div>★ Lote especial</div>`;
  lr.appendChild(leg);
  lr.style.display='block';
}

function _selLote(lot,btn){
  COT.lote=lot;
  document.querySelectorAll('.lot-btn').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');

  let plusTxt='';
  if(lot.plus>0){
    const ub=lot.tipoUbic||'';
    if(ub.includes('Esquina')&&ub.includes('Parque')) plusTxt=` · <b style="color:#2D5A1B">+${$$(lot.plus)} esquina+parque</b>`;
    else if(ub.includes('Esquina')) plusTxt=` · <b style="color:#2D5A1B">+${$$(lot.plus)} esquina</b>`;
    else if(ub.includes('Parque'))  plusTxt=` · <b style="color:#2D5A1B">+${$$(lot.plus)} frente al parque</b>`;
    else plusTxt=` · <b style="color:#2D5A1B">+${$$(lot.plus)}</b>`;
  }

  let extra='';
  if(lot.enObra){
    extra=`<div style="margin-top:8px;padding:10px 14px;background:#FFF3CD;border-left:3px solid #FF8C00;font-size:13px">
      <b>🏗️ Lote en proceso de construcción</b><br>
      Modelo asignado: <b>${MODS_COT[lot.modeloFijo]?.nombre}</b><br>
      Plazo de entrega estimado: <b>${lot.plazoObra} meses</b><br>
      <small>Al ser una obra en proceso, el modelo ya está definido y el plazo de enganche es de ${lot.plazoObra} meses.</small>
    </div>`;
  }
  if(lot.loteMedio){
    extra=`<div style="margin-top:8px;padding:10px 14px;background:#F0E6FF;border-left:3px solid #8B5CF6;font-size:13px">
      <b>★ Lote especial con medio lote adicional</b><br>
      Plus por medio lote: <b>${$$(lot.extraLoteMedio)}</b><br>
      <small>Esta propiedad incluye un lote y medio, dándote mayor espacio y valor a futuro.</small>
    </div>`;
  }

  const si=document.getElementById('selInfo');
  si.style.display='block';
  si.innerHTML=`<b>${MZ_LABEL[lot.mz]} · Lote ${lot.lote}</b> (Clave ${lot.clave}) · ${lot.m2} m²${plusTxt}
    ${lot.exc>0?`<br><small>Excedente: ${lot.exc} m²</small>`:''}
    <br><small>🧭 ${mzOrientLote(lot.mz, lot.lote)}</small>
    ${extra}
    <div style="margin-top:14px"><button class="bp" style="font-size:10px;padding:10px 24px" onclick="goS(2)">Siguiente: elegir modelo →</button></div>`;

  // Si es en obra, ir directo al paso 2 con modelo fijo
  if(lot.enObra){
    COT.mod = lot.modeloFijo;
    setTimeout(()=>goS(2),300);
  }
}

// ════════════════════════════════════════════════════════════
// STEP 2: MODELO
// ════════════════════════════════════════════════════════════
function _buildModelos(){
  const lot=COT.lote; if(!lot) return;
  const isM10=lot.mz===10;

  let plusTxt='';
  if(lot.plus>0){
    const ub2=lot.tipoUbic||'';
    if(ub2.includes('Esquina')&&ub2.includes('Parque')) plusTxt=` · <b>+${$$(lot.plus)} esquina+parque</b>`;
    else if(ub2.includes('Esquina')) plusTxt=` · <b>+${$$(lot.plus)} esquina</b>`;
    else if(ub2.includes('Parque'))  plusTxt=` · <b>+${$$(lot.plus)} parque</b>`;
    else plusTxt=` · <b>+${$$(lot.plus)}</b>`;
  }
  const loteMedioExtra = lot.loteMedio ? (lot.extraLoteMedio||0) : 0;
  const lb=document.getElementById('lotebar');
  if(lb) lb.innerHTML=`<b>${MZ_LABEL[lot.mz]} · Lote ${lot.lote}</b> · ${lot.m2} m²${plusTxt}${loteMedioExtra>0?` · <b style="color:#8B5CF6">+${$$(loteMedioExtra)} lote especial</b>`:''}`;

  const mc=document.getElementById('modCards'); if(!mc) return;

  if(lot.enObra){
    // Only show the fixed model, auto-selected
    const m=MODS_COT[lot.modeloFijo];
    const precioExc=(lot.exc||0)>0?(lot.exc)*P.precioM2ExcCasa:0;
    const total=m.precio+precioExc+lot.plus+loteMedioExtra;
    mc.innerHTML=`<div class="mod-card sel" id="mc-${lot.modeloFijo}" style="border-color:#FF8C00;background:#FFF8F0">
      <img src="${m.img}" alt="${m.nombre}" class="mod-card-img">
      <div class="mod-card-body">
        <div class="mod-card-tag" style="background:#FF8C00">🏗️ EN CONSTRUCCIÓN</div>
        <div class="mod-card-name">${m.nombre}</div>
        <div class="mod-card-m2">${m.m2c} m² · Modelo ya asignado a este lote</div>
        <div class="mod-card-price">${$$(total)}</div>
      </div>
    </div>
    <div style="margin-top:12px;padding:10px;background:#FFF3CD;font-family:'Montserrat',sans-serif;font-size:12px;border-left:3px solid #FF8C00">
      Este lote tiene un modelo ya en construcción. Puedes adquirirlo con entrega en aprox. ${lot.plazoObra} meses. 
      El plazo de enganche se reduce a ${lot.plazoObra} pagos mensuales.
    </div>`;
    setTimeout(()=>goS(3),300);
    return;
  }

  mc.innerHTML=Object.entries(MODS_COT).map(([id,m])=>{
    const ok=m.soloM10?isM10:true; // Morello solo M10; otros modelos en cualquier manzana
    const precioExc=(lot.exc||0)>0?(lot.exc)*P.precioM2ExcCasa:0;
    const total=m.precio+precioExc+lot.plus+loteMedioExtra;
    const isSel=COT.mod===id;
    return `<div class="mod-card${ok?'':' dis'}${isSel?' sel':''}" ${ok?`onclick="selModelo('${id}')"`:''}  id="mc-${id}">
      <img src="${m.img}" alt="${m.nombre}" class="mod-card-img">
      <div class="mod-card-body">
        ${m.soloM10?'<div class="mod-card-tag">Solo M-10</div>':''}
        <div class="mod-card-name">${m.nombre}</div>
        <div class="mod-card-m2">${m.m2c} m² construcción</div>
        <div class="mod-card-price">${ok?$$(total):'No disponible para M-10'}</div>
      </div>
    </div>`;
  }).join('');
}

function selModelo(id){
  COT.mod=id;
  document.querySelectorAll('.mod-card').forEach(c=>c.classList.remove('sel'));
  document.getElementById('mc-'+id)?.classList.add('sel');
  setTimeout(()=>goS(3),250);
}

// ════════════════════════════════════════════════════════════
// STEP 3: COTIZACIÓN
// ════════════════════════════════════════════════════════════
function _buildCot(){
  const lot=COT.lote, mod=MODS_COT[COT.mod];
  if(!lot||!mod) return;
  const precioExc=(lot.exc||0)>0?(lot.exc)*P.precioM2ExcCasa:0;
  const loteMedioExtra=lot.loteMedio?(lot.extraLoteMedio||0):0;
  const vv=mod.precio+precioExc+lot.plus+loteMedioExtra;
  const hoy=new Date();

  const qw=document.getElementById('qWrap'); if(!qw) return;
  qw.innerHTML=`<div class="cot-doc" id="cotDoc">
    <div class="cot-header-bar">
      <div><img src="assets/img/logo.png" style="height:36px"><div style="font-family:Montserrat,sans-serif;font-size:9px;letter-spacing:.2em;color:#888;margin-top:4px">VALLE DE ARAGÓN</div></div>
      <div style="text-align:right;font-family:Montserrat,sans-serif;font-size:11px;color:#888"><div>COTIZACIÓN</div><div>${fDate(hoy)}</div></div>
    </div>
    <div class="cot-section">
      <div class="cot-section-title">Propiedad</div>
      <div class="cot-row"><span class="cot-lbl">Lote</span><span class="cot-val">${MZ_LABEL[lot.mz]} · Lote ${lot.lote} (Clave ${lot.clave}) · ${lot.m2} m²</span></div>
      <div class="cot-row"><span class="cot-lbl">Modelo</span><span class="cot-val">${mod.nombre} · ${mod.m2c} m² construcción</span></div>
      ${lot.tipoUbic&&lot.tipoUbic!=='—'?`<div class="cot-row"><span class="cot-lbl">Ubicación especial</span><span class="cot-val">${lot.tipoUbic}</span></div>`:''}
      <div class="cot-row"><span class="cot-lbl">Orientación</span><span class="cot-val">🧭 ${mzOrientLote(lot.mz, lot.lote)}</span></div>
      ${lot.enObra?`<div class="cot-row"><span class="cot-lbl">Estado</span><span class="cot-val">🏗️ En construcción · Entrega ~${lot.plazoObra} meses</span></div>`:''}
      ${lot.loteMedio?`<div class="cot-row"><span class="cot-lbl">Tipo</span><span class="cot-val">★ Lote especial (lote y medio)</span></div>`:''}
    </div>
    <div class="cot-section">
      <div class="cot-section-title">Valor de la propiedad</div>
      <div class="cot-row"><span class="cot-lbl">Valor base ${mod.nombre}</span><span class="cot-val">${$$(mod.precio)}</span></div>
      ${(lot.exc||0)>0?`<div class="cot-row"><span class="cot-lbl">Excedente terreno (${lot.exc} m² × $${P.precioM2ExcCasa.toLocaleString('es-MX')})</span><span class="cot-val">${$$(precioExc)}</span></div>`:''}
      ${lot.plus>0?`<div class="cot-row"><span class="cot-lbl">Plus ubicación (${lot.tipoUbic})</span><span class="cot-val">${$$(lot.plus)}</span></div>`:''}
      ${loteMedioExtra>0?`<div class="cot-row"><span class="cot-lbl">★ Plus lote y medio</span><span class="cot-val">${$$(loteMedioExtra)}</span></div>`:''}
      <div class="cot-row cot-subtotal"><span class="cot-lbl">Valor vivienda</span><span class="cot-val">${$$(vv)}</span></div>
    </div>
    <div class="cot-section">
      <div class="cot-section-title">Esquema de pago</div>
      <div class="esquema-tabs">
        <button class="esq-tab ${COT.esquema==='credito'?'active':''}" onclick="setEsquema('credito')">🏦 Crédito hipotecario</button>
        <button class="esq-tab ${COT.esquema==='contado'?'active':''}" onclick="setEsquema('contado')">💰 Contado</button>
      </div>
      <div id="esquemaWrap"></div>
    </div>
    <div class="cot-disclaimer">
      ⚠️ <b>Simulación informativa.</b> El valor de la propiedad está sujeto a cambios sin previo aviso. 
      Las condiciones crediticias varían según tu situación en buró de crédito. 
      Consulta con tu asesor para verificar disponibilidad y realizar tu precalificación crediticia.
    </div>
  </div>`;
  _buildEsq(vv, lot);
}

function setEsquema(esq){
  COT.esquema=esq;
  document.querySelectorAll('.esq-tab').forEach(t=>
    t.classList.toggle('active', esq==='credito'?t.textContent.includes('Crédito'):t.textContent.includes('Contado'))
  );
  const lot=COT.lote, mod=MODS_COT[COT.mod];
  const precioExc=(lot.exc||0)>0?(lot.exc)*P.precioM2ExcCasa:0;
  const loteMedioExtra=lot.loteMedio?(lot.extraLoteMedio||0):0;
  _buildEsq(mod.precio+precioExc+lot.plus+loteMedioExtra, lot);
}

function _buildEsq(vv, lot){
  const wrap=document.getElementById('esquemaWrap'); if(!wrap) return;
  if(COT.esquema==='credito') _buildCredito(wrap,vv,lot);
  else _buildContado(wrap,vv,lot);
}

function _buildCredito(wrap,vv,lot){
  const aforoMax = Math.floor(vv*P.aforoMax/1000)*1000; // 90% del valor total
  const creditoRef = COT.creditoManual!==null ? Math.min(COT.creditoManual,aforoMax) : vv*(1-COT.engPct/100);
  const creditoReal = Math.min(creditoRef, aforoMax);
  const engReal = vv - creditoReal;
  const engPctReal = engReal/vv*100;

  const comision      = creditoReal*P.comisionAperturaPct;
  const gastosNotar   = vv*P.gastosNotarPct;
  const gastosOp      = P.avaluo+P.otrosGastos+comision+gastosNotar;
  const desembolso    = engReal+gastosOp;
  // Plazo de enganche: si lote en obra = plazoObra meses, sino 6 meses
  const nEnganche     = lot.enObra ? (lot.plazoObra||3) : 6;
  const base          = Math.max(0, desembolso-P.apartadoCredito-P.firmaCredito);
  const pagoEng       = base/nEnganche;

  // Mensualidad BBVA — formula correcta
  const mens          = hipoteca(creditoReal, P.tasaAnual, P.plazoAnios);
  const seg           = seguros(creditoReal, vv);
  const mensTotal     = mens + seg.total;

  const hoy=new Date(), primerPago=ultimoDia(hoy);

  wrap.innerHTML=`
  <div class="cred-inputs">
    <div class="cred-input-group">
      <label class="cred-label">Enganche: <span id="engLabel">${Math.round(engPctReal)}%</span> — ${$$(engReal)}</label>
      <input type="range" min="10" max="70" step="5" value="${Math.max(10,Math.min(70,Math.round(engPctReal)))}"
        oninput="onSlider(this.value,${vv})" class="cred-slider" id="engSlider">
      <div class="cred-slider-labels"><span>10%</span><span>70%</span></div>
    </div>
    <div class="cred-input-group">
      <label class="cred-label">O ingresa el crédito deseado</label>
      <div class="cred-input-row">
        <span class="cred-prefix">$</span>
        <input type="number" id="creditoInput" value="${Math.round(creditoReal)}" min="0" max="${aforoMax}" step="10000"
          onchange="onCreditoInput(this.value,${vv})" onblur="onCreditoInput(this.value,${vv})" class="cred-number-input">
        <span class="cred-suffix">MXN</span>
      </div>
      <small class="cred-hint">Máximo financiable (90% del valor): ${$$(aforoMax)}</small>
    </div>
  </div>

  <div class="cot-resumen-nuevo">

    <div class="crn-bloque crn-fila">
      <div class="crn-label">Valor total de la vivienda</div>
      <div class="crn-valor">${$$(vv)}</div>
    </div>

    <div class="crn-bloque crn-gastos">
      <div class="crn-sublabel">GASTOS DE OPERACIÓN</div>
      <div class="crn-row"><span>Avalúo</span><span>${$$(P.avaluo)}</span></div>
      <div class="crn-row"><span>Otros gastos</span><span>${$$(P.otrosGastos)}</span></div>
      <div class="crn-row"><span>Comisión apertura (1%)</span><span>${$$(comision)}</span></div>
      <div class="crn-row"><span>Gastos notariales (~5%)</span><span>${$$(gastosNotar)}</span></div>
      <div class="crn-row crn-subtotal"><span>Total gastos</span><span>${$$(gastosOp)}</span></div>
    </div>

    <div class="crn-bloque crn-fila">
      <div>
        <div class="crn-label">Financiamiento ${pct(creditoReal/vv)}</div>
        <div class="crn-sublabel-light">Banco · Infonavit · FOVISSSTE · mixtos</div>
      </div>
      <div class="crn-valor">${$$(creditoReal)}</div>
    </div>

    <div class="crn-bloque crn-inversion crn-fila crn-fila-wrap">
      <div>
        <div class="crn-label-green">Inversión inicial ${pct(engReal/vv)} + gastos de operación</div>
        <div class="crn-nota">Entregada en partes: el apartado, el monto a la firma y ${nEnganche} mensualidades</div>
      </div>
      <div class="crn-valor-green">${$$(desembolso)} / ${nEnganche} meses</div>
    </div>

    <div class="crn-bloque crn-mensualidad crn-fila crn-fila-wrap">
      <div>
        <div class="crn-label-green">Mensualidad total estimada</div>
        <div class="crn-nota">Incluye seguros de vida, daños y comisión aut. diferida</div>
        <div class="crn-nota">Tasa ${(P.tasaAnual*100).toFixed(2)}% fija · ${P.plazoAnios} años · ${P.plazoAnios*12} pagos</div>
      </div>
      <div class="crn-valor-green">${$$(mensTotal,2)} / mes</div>
    </div>

  </div>

  <div class="pagos-section">
    <div class="cot-section-title" style="margin-bottom:12px">Esquema de pagos</div>
    <div class="pago-row header"><span>#</span><span>Concepto</span><span>Fecha</span><span>Monto</span></div>
    <div class="pago-row ap"><span>—</span><span>🔑 Apartado (separa tu lote hoy)</span><span>${fDate(hoy)}</span><span>${$$(P.apartadoCredito)}</span></div>
    <div class="pago-row firma"><span>—</span><span>📝 Firma de contrato</span><span>A convenir</span><span>${$$(P.firmaCredito)}</span></div>
    ${Array.from({length:nEnganche},(_,i)=>`<div class="pago-row eng"><span>${i+1}</span><span>Pago enganche</span><span>${fDate(addM(primerPago,i))}</span><span>${$$(pagoEng,2)}</span></div>`).join('')}
    <div class="pago-row credito-row"><span>—</span><span>🏦 Financiamiento (Banco, Infonavit, FOVISSSTE, mixtos)</span><span>Al escriturar</span><span>${$$(creditoReal)}</span></div>
    <div class="pago-row total-row"><span></span><span>Inversión total</span><span></span><span>${$$(vv+gastosOp)}</span></div>
  </div>
  <div class="cot-actions">
    <button class="btn-guardar" onclick="guardarCot()">⬇ Guardar cotización</button>
    <a href="https://wa.me/526679265145?text=${encodeURIComponent('Hola Hernny, generé esta cotización:\n\n'+MZ_LABEL[COT.lote?.mz]+' · Lote '+COT.lote?.lote+' (Clave '+COT.lote?.clave+')\nModelo '+MODS_COT[COT.mod]?.nombre+'\nValor vivienda: '+$$(vv)+'\nFinanciamiento: '+$$(creditoReal)+'\nMensualidad total: '+$$(mensTotal,2)+'/mes\n\n¿Podemos agendar visita?')}" target="_blank">
      <button class="bwa"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>Precalifícate en minutos</button>
    </a>
    <button class="brs" onclick="resetCot()">Nueva cotización</button>
  </div>`;
}

function _buildContado(wrap,vv,lot){
  const gastosNotar=vv*P.gastosNotarPct;
  const avaluoContado=5000; // avalúo catastral para contado
  const gastosOp=avaluoContado+P.otrosGastos+gastosNotar;
  const total=vv+gastosOp;
  const nPagos=lot.enObra?(lot.plazoObra||3):6;
  const base=total-P.apartadoContado-P.firmaContado;
  const pago=base/nPagos;
  const hoy=new Date(), primerPago=ultimoDia(hoy);

  wrap.innerHTML=`
  <div class="cot-resumen-nuevo">

    <div class="crn-bloque crn-fila">
      <div class="crn-label">Valor total de la vivienda</div>
      <div class="crn-valor">${$$(vv)}</div>
    </div>

    <div class="crn-bloque crn-gastos">
      <div class="crn-sublabel">GASTOS DE OPERACIÓN</div>
      <div class="crn-row"><span>Avalúo catastral</span><span>${$$(avaluoContado)}</span></div>
      <div class="crn-row"><span>Otros gastos</span><span>${$$(P.otrosGastos)}</span></div>
      <div class="crn-row"><span>Gastos notariales (~5%)</span><span>${$$(gastosNotar)}</span></div>
      <div class="crn-row crn-subtotal"><span>Total gastos</span><span>${$$(gastosOp)}</span></div>
    </div>

    <div class="crn-bloque crn-inversion crn-fila crn-fila-wrap">
      <div>
        <div class="crn-label-green">Inversión inicial — Contado</div>
        <div class="crn-nota">Entregada en partes: el apartado, el monto a la firma y ${nPagos} mensualidades</div>
      </div>
      <div class="crn-valor-green">${$$(total)} / ${nPagos} meses</div>
    </div>

  </div>

  <div class="pagos-section">
    <div class="cot-section-title" style="margin-bottom:12px">Esquema de pagos — Contado</div>
    <div class="pago-row header"><span>#</span><span>Concepto</span><span>Fecha</span><span>Monto</span></div>
    <div class="pago-row ap"><span>—</span><span>🔑 Apartado</span><span>${fDate(hoy)}</span><span>${$$(P.apartadoContado)}</span></div>
    <div class="pago-row firma"><span>—</span><span>📝 Firma de contrato</span><span>A convenir</span><span>${$$(P.firmaContado)}</span></div>
    ${Array.from({length:nPagos},(_,i)=>`<div class="pago-row eng"><span>${i+1}</span><span>Pago contado</span><span>${fDate(addM(primerPago,i))}</span><span>${$$(pago,2)}</span></div>`).join('')}
    <div class="pago-row total-row"><span></span><span>Inversión total</span><span></span><span>${$$(total)}</span></div>
  </div>
  <div class="cot-actions">
    <button class="btn-guardar" onclick="guardarCot()">⬇ Guardar cotización</button>
    <a href="https://wa.me/526679265145?text=${encodeURIComponent('Hola Hernny, cotización de contado:\n'+MZ_LABEL[COT.lote?.mz]+' · Lote '+COT.lote?.lote+'\nModelo '+MODS_COT[COT.mod]?.nombre+'\nTotal: '+$$(total)+'\n'+nPagos+' pagos de: '+$$(pago,2)+'\n¿Podemos hablar?')}" target="_blank">
      <button class="bwa"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>Precalifícate en minutos</button>
    </a>
    <button class="brs" onclick="resetCot()">Nueva cotización</button>
  </div>`;
}

// ── SLIDERS ──
function onSlider(val,vv){
  COT.engPct=parseInt(val); COT.creditoManual=null;
  document.getElementById('engLabel').textContent=val+'%';
  const ci=document.getElementById('creditoInput');
  if(ci) ci.value=Math.round(vv*(1-parseInt(val)/100));
  _buildCredito(document.getElementById('esquemaWrap'),vv,COT.lote);
}
function onCreditoInput(val,vv){
  COT.creditoManual=parseInt(val)||0;
  const aforoMax=Math.floor(vv*P.aforoMax/1000)*1000;
  const c=Math.min(COT.creditoManual,aforoMax);
  const ep=Math.max(10,Math.min(70,Math.round((1-c/vv)*100)));
  COT.engPct=ep;
  const sl=document.getElementById('engSlider'); if(sl) sl.value=ep;
  const el=document.getElementById('engLabel');  if(el) el.textContent=ep+'%';
  _buildCredito(document.getElementById('esquemaWrap'),vv,COT.lote);
}

// ── GUARDAR: genera HTML → iframe → print-to-PDF con contact info ──
function guardarCot(){
  const el=document.getElementById('cotDoc'); if(!el) return;
  const pw=window.open('','_blank','width=900,height=720');
  pw.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Cotización ${MODS_COT[COT.mod]?.nombre||""} ${MZ_LABEL[COT.lote?.mz]||""} · Lote ${COT.lote?.lote||""} (Clave ${COT.lote?.clave||""})</title>
  <style>
    @page{size:letter;margin:0.8cm 1.4cm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    *{box-sizing:border-box}
    body{font-family:Arial,sans-serif;margin:0;padding:0;color:#141414;font-size:10px;line-height:1.3}
    .cot-header-bar{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #2D5A1B;padding-bottom:5px;margin-bottom:8px}
    .cot-header-bar img{height:32px}
    .cot-section{margin-bottom:5px;page-break-inside:avoid}
    .cot-section-title{font-weight:700;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2D5A1B;border-bottom:1px solid #e0e0e0;padding-bottom:4px;margin-bottom:7px}
    .cot-row{display:flex;justify-content:space-between;padding:1px 2px;border-bottom:1px solid #f5f5f5;font-size:9.5px;gap:6px}
    .cot-lbl{color:#555;flex:1}.cot-val{font-weight:600;text-align:right}
    .cot-subtotal{font-weight:700;background:#f9f6f0;padding:5px 4px}
    .cot-subtotal .cot-val{color:#2D5A1B;font-size:13px}
    .cred-resumen{background:#f9f6f0;padding:4px 8px;margin:4px 0;border-left:3px solid #2D5A1B}
    .cred-res-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px}
    .cred-res-row.accent{font-weight:700;font-size:12px;border-bottom:1px solid #ddd;padding-bottom:5px;margin-bottom:3px}
    .cred-res-row.highlight{font-weight:700;color:#2D5A1B;font-size:13px;border-top:1px solid #ddd;padding-top:6px;margin-top:3px}
    .cred-res-row.eng-highlight{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid #e0e0e0;margin-top:4px}
    .eng-label{font-weight:700;font-size:11px;color:#141414}
    .eng-value{font-size:13px;font-weight:700;color:#2D5A1B;line-height:1}
    .cred-res-row.small{font-size:9px;color:#aaa}
    .pagos-section{margin-top:14px;page-break-inside:avoid}
    .pago-row{display:grid;grid-template-columns:18px 1fr 80px 75px;gap:3px;padding:1px 2px;font-size:8.5px;border-bottom:1px solid #f0f0f0;align-items:center}
    .pago-row.header{font-weight:700;font-size:9px;text-transform:uppercase;background:#2D5A1B;color:white}
    .pago-row.ap{background:#e8f5e3}.pago-row.firma{background:#fff8e8}
    .pago-row.total-row{font-weight:700;background:#f0f7ee;border-top:2px solid #2D5A1B}
    .pago-row span:last-child{text-align:right;font-weight:600}
    .cot-disclaimer{margin-top:6px;padding:5px 10px;background:#FFF8E1;border:1px solid #FFD54F;font-size:8px;color:#555;line-height:1.4;page-break-inside:avoid}
    .cot-resumen-nuevo{margin:8px 0;border-left:3px solid #2D5A1B;background:#f9f6f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .crn-bloque{padding:6px 12px;border-bottom:1px solid #e8e4dc}
    .crn-bloque:last-child{border-bottom:none}
    .crn-label{font-family:Arial,sans-serif;font-size:8px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:#888;margin-bottom:2px}
    .crn-sublabel{font-family:Arial,sans-serif;font-size:7px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#2D5A1B;margin-bottom:6px}
    .crn-sublabel-light{font-family:Arial,sans-serif;font-size:8px;color:#888;margin-bottom:2px}
    .crn-valor{font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#141414;line-height:1.1}
    .crn-label-green{font-family:Arial,sans-serif;font-size:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#2D5A1B;margin-bottom:2px}
    .crn-valor-green{font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#2D5A1B;line-height:1.1;margin-bottom:2px}
    .crn-nota{font-family:Arial,sans-serif;font-size:7px;color:#aaa;margin-top:1px}
    .crn-row{display:flex;justify-content:space-between;font-family:Arial,sans-serif;font-size:9px;color:#666;padding:2px 0;border-bottom:1px solid #ede9e0}
    .crn-subtotal{font-weight:700;color:#141414;border-bottom:none;padding-top:4px;border-top:1px solid #d0ccc4}
    .crn-fila{display:flex;justify-content:space-between;align-items:center;gap:8px}
    .crn-fila-wrap{align-items:flex-start}
    .crn-fila .crn-valor,.crn-fila .crn-valor-green{text-align:right;white-space:nowrap;flex-shrink:0}
    .crn-gastos{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .crn-inversion,.crn-mensualidad{background:#f0f7ee;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .cred-resumen{display:none}
    .cot-contact-footer{margin-top:16px;padding:14px 16px;background:#2D5A1B;color:white;text-align:center;page-break-inside:avoid}
    .cot-contact-title{font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:4px}
    .cot-contact-name{font-size:16px;font-weight:700;color:white;margin-bottom:10px}
    .cot-contact-links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
    .cot-contact-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;font-size:11px;font-weight:600;text-decoration:none;border-radius:0}
    .cot-wa{background:#25D366;color:white}
    .cot-tel{background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.3)}
    .esquema-tabs,.cred-inputs,.cot-actions,.cred-input-row,.cred-hint,.cred-label,.cred-slider,.cred-slider-labels,.cred-res-row.small{display:none!important}
    .cred-res-row.eng-note{font-size:8px;color:#888;padding:2px 0 5px}
    .cred-res-row.eng-note{font-size:9px;color:#888;padding:2px 0 5px;border-bottom:1px solid #eee}
  </style></head><body>${el.innerHTML}
    <div style="margin-top:12px;background:#2D5A1B;padding:10px 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="48%" style="padding:0 5px 0 0">
          <a href="https://wa.me/526679265145?text=Hola%20Hernny,%20vi%20mi%20cotización%20de%20Valle%20de%20Aragón"
             style="display:block;width:100%;box-sizing:border-box;background:#25D366;color:white;text-decoration:none;padding:0;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;cursor:pointer">
            <div style="padding:16px 8px;line-height:1.4;pointer-events:none">📱 WhatsApp<br><span style="font-size:12px;font-weight:400">667 926 5145</span></div>
          </a>
        </td>
        <td width="48%" style="padding:0 0 0 5px">
          <a href="tel:+526679265145"
             style="display:block;width:100%;box-sizing:border-box;background:rgba(255,255,255,.18);color:white;text-decoration:none;padding:0;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;border:2px solid rgba(255,255,255,.5);-webkit-print-color-adjust:exact;print-color-adjust:exact;cursor:pointer">
            <div style="padding:16px 8px;line-height:1.4;pointer-events:none">📞 Llamar<br><span style="font-size:12px;font-weight:400">667 926 5145</span></div>
          </a>
        </td>
        <td width="4%"></td>
        <td width="30%" style="text-align:right;padding-left:8px">
          <div style="font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,.55);line-height:1.5">Asesor</div>
          <div style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:white">Hernny Guerrero</div>
        </td>
      </tr></table>
    </div>
</body></html>`);
  pw.document.close();
  setTimeout(()=>{ pw.print(); }, 400);
}

// ── NAVEGACIÓN ──
function goS(s){
  [1,2,3].forEach(i=>{
    document.getElementById('p'+i)?.classList.toggle('active',i===s);
    const sn=document.getElementById('sn'+i), sl=document.getElementById('sl'+i);
    if(sn) sn.className='sn2'+(i===s?' ac':i<s?' dn':'');
    if(sl) sl.className='sl2'+(i===s?' ac':i<s?' dn':'');
    const c=document.getElementById('sc'+i);
    if(c) c.className='sc2'+(i<s?' dn':'');
  });
  if(s===2) _buildModelos();
  if(s===3) _buildCot();
  document.getElementById('cotizador')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function resetCot(){
  COT={mz:null,lote:null,mod:null,esquema:'credito',engPct:20,creditoManual:null};
  document.querySelectorAll('.mz-btn').forEach(b=>b.classList.remove('sel'));
  const lr=document.getElementById('loteRow');
  if(lr){lr.style.display='none'; const lg=document.getElementById('loteGrid'); if(lg) lg.innerHTML='';}
  const si=document.getElementById('selInfo');
  if(si){si.style.display='none';si.innerHTML='';}
  const qw=document.getElementById('qWrap'); if(qw) qw.innerHTML='';
  goS(1);
}
