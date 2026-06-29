// ============================================================
// INVENTARIO OFICIAL — Valle de Aragón  (actualizado Jun 2026)
// Para actualizar: cambia únicamente el campo  st
//   'Disponible' | 'Apartado' | 'Vendido' | 'Muestra' | 'Entregada'
// NO modificar: clave, mz, lote, m2, exc, plus, tipoUbic
// Lotes especiales:
//   M8-lote7  → loteMedio (suma $1,114,750 adicional)
//   M9-lote7  → loteMedio (suma $936,000 adicional)
//   M9-lote17 → enObra, modeloFijo:'berdun'
//   M9-lote21 → enObra, modeloFijo:'arago'
// ============================================================
const INVENTARIO = [
  // M-6 · Sur · Av. Ansó · frente al parque
  {clave:601, mz:6, lote:1, st:'Muestra',   m2:162,    exc:18,    plus:75000, tipoUbic:'Esquina + Parque'},
  {clave:602, mz:6, lote:2, st:'Muestra',   m2:144,    exc:0,     plus:50000, tipoUbic:'Parque'},
  {clave:603, mz:6, lote:3, st:'Muestra',   m2:144,    exc:0,     plus:50000, tipoUbic:'Parque'},
  {clave:604, mz:6, lote:4, st:'Muestra',   m2:144,    exc:0,     plus:50000, tipoUbic:'Parque'},
  {clave:605, mz:6, lote:5, st:'Entregada', m2:144,    exc:0,     plus:50000, tipoUbic:'Parque'},
  {clave:606, mz:6, lote:6, st:'Entregada', m2:144,    exc:0,     plus:50000, tipoUbic:'Parque'},
  {clave:607, mz:6, lote:7, st:'Entregada', m2:156.99, exc:12.99, plus:75000, tipoUbic:'Esquina + Parque'},

  // M-7 · Oeste · Calle Aragó
  {clave:701, mz:7, lote:1,  st:'Entregada', m2:236.14, exc:92.14, plus:75000, tipoUbic:'Esquina + Parque'},
  {clave:702, mz:7, lote:2,  st:'Entregada', m2:162,    exc:18,    plus:50000, tipoUbic:'Parque'},
  {clave:703, mz:7, lote:3,  st:'Entregada', m2:144,    exc:0,     plus:50000, tipoUbic:'Parque'},
  {clave:704, mz:7, lote:4,  st:'Entregada', m2:144,    exc:0,     plus:50000, tipoUbic:'Parque'},
  {clave:705, mz:7, lote:5,  st:'Entregada', m2:144,    exc:0,     plus:50000, tipoUbic:'Parque'},
  {clave:706, mz:7, lote:6,  st:'Entregada', m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:707, mz:7, lote:7,  st:'Vendido',   m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:708, mz:7, lote:8,  st:'Vendido',   m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:709, mz:7, lote:9,  st:'Vendido',   m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:710, mz:7, lote:10, st:'Vendido',   m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:711, mz:7, lote:11, st:'Vendido',   m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:712, mz:7, lote:12, st:'Disponible',m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:713, mz:7, lote:13, st:'Disponible',m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:714, mz:7, lote:14, st:'Disponible',m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:715, mz:7, lote:15, st:'Vendido',   m2:208.53, exc:64.53, plus:50000, tipoUbic:'Esquina'},

  // M-8 · Interior (Calle Fago / Alfindén)
  {clave:801, mz:8, lote:1,  st:'Disponible',m2:166.26, exc:22.26, plus:50000, tipoUbic:'Esquina'},
  {clave:802, mz:8, lote:2,  st:'Disponible',m2:152.44, exc:8.44,  plus:0,     tipoUbic:'—'},
  {clave:803, mz:8, lote:3,  st:'Disponible',m2:152.44, exc:8.44,  plus:0,     tipoUbic:'—'},
  {clave:804, mz:8, lote:4,  st:'Disponible',m2:152.44, exc:8.44,  plus:0,     tipoUbic:'—'},
  {clave:805, mz:8, lote:5,  st:'Apartado',  m2:152.44, exc:8.44,  plus:0,     tipoUbic:'—'},
  {clave:806, mz:8, lote:6,  st:'Vendido',   m2:152.44, exc:8.44,  plus:0,     tipoUbic:'—'},
  {clave:807, mz:8, lote:7,  st:'Disponible',m2:171.5,  exc:27.5,  plus:0,     tipoUbic:'—', loteMedio:true, extraLoteMedio:1114750},
  {clave:808, mz:8, lote:8,  st:'Vendido',   m2:171.5,  exc:27.5,  plus:0,     tipoUbic:'—'},
  {clave:809, mz:8, lote:9,  st:'Vendido',   m2:171.5,  exc:27.5,  plus:0,     tipoUbic:'—'},
  {clave:810, mz:8, lote:10, st:'Entregada', m2:171.5,  exc:27.5,  plus:0,     tipoUbic:'—'},
  {clave:811, mz:8, lote:11, st:'Entregada', m2:171.5,  exc:27.5,  plus:0,     tipoUbic:'—'},
  {clave:812, mz:8, lote:12, st:'Entregada', m2:171.51, exc:27.51, plus:0,     tipoUbic:'—'},
  {clave:813, mz:8, lote:13, st:'Vendido',   m2:171.54, exc:27.54, plus:0,     tipoUbic:'—'},
  {clave:814, mz:8, lote:14, st:'Vendido',   m2:171.56, exc:27.56, plus:0,     tipoUbic:'—'},
  {clave:815, mz:8, lote:15, st:'Entregada', m2:171.59, exc:27.59, plus:0,     tipoUbic:'—'},
  {clave:816, mz:8, lote:16, st:'Vendido',   m2:171.62, exc:27.62, plus:0,     tipoUbic:'—'},
  {clave:817, mz:8, lote:17, st:'Disponible',m2:152.57, exc:8.57,  plus:0,     tipoUbic:'—'},
  {clave:818, mz:8, lote:18, st:'Disponible',m2:152.59, exc:8.59,  plus:0,     tipoUbic:'—'},
  {clave:819, mz:8, lote:19, st:'Disponible',m2:152.61, exc:8.61,  plus:0,     tipoUbic:'—'},
  {clave:820, mz:8, lote:20, st:'Disponible',m2:152.63, exc:8.63,  plus:0,     tipoUbic:'—'},
  {clave:821, mz:8, lote:21, st:'Disponible',m2:152.65, exc:8.65,  plus:0,     tipoUbic:'—'},
  {clave:822, mz:8, lote:22, st:'Disponible',m2:163.64, exc:19.64, plus:50000, tipoUbic:'Esquina'},

  // M-9 · Norte · Calle Alfindén (sale el sol)
  {clave:901, mz:9, lote:1,  st:'Vendido',   m2:145.39, exc:1.39,  plus:50000, tipoUbic:'Esquina'},
  {clave:902, mz:9, lote:2,  st:'Disponible',m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:903, mz:9, lote:3,  st:'Disponible',m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:904, mz:9, lote:4,  st:'Disponible',m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:905, mz:9, lote:5,  st:'Disponible',m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:906, mz:9, lote:6,  st:'Disponible',m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:907, mz:9, lote:7,  st:'Disponible',m2:144,    exc:0,     plus:0,     tipoUbic:'—', loteMedio:true, extraLoteMedio:936000},
  {clave:908, mz:9, lote:8,  st:'Vendido',   m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:909, mz:9, lote:9,  st:'Vendido',   m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:910, mz:9, lote:10, st:'Vendido',   m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:911, mz:9, lote:11, st:'Vendido',   m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:912, mz:9, lote:12, st:'Entregada', m2:144,    exc:0,     plus:0,     tipoUbic:'—'},
  {clave:913, mz:9, lote:13, st:'Entregada', m2:144,    exc:0,     plus:50000, tipoUbic:'Parque'},
  {clave:914, mz:9, lote:14, st:'Vendido',   m2:144,    exc:0,     plus:50000, tipoUbic:'Parque'},
  {clave:915, mz:9, lote:15, st:'Vendido',   m2:144,    exc:0,     plus:50000, tipoUbic:'Parque'},
  {clave:916, mz:9, lote:16, st:'Entregada', m2:162,    exc:18,    plus:50000, tipoUbic:'Parque'},
  {clave:917, mz:9, lote:17, st:'Disponible',m2:162,    exc:18,    plus:50000, tipoUbic:'Parque', enObra:true, modeloFijo:'berdun', plazoObra:3},
  {clave:918, mz:9, lote:18, st:'Apartado',  m2:162,    exc:18,    plus:50000, tipoUbic:'Parque'},
  {clave:919, mz:9, lote:19, st:'Vendido',   m2:162,    exc:18,    plus:50000, tipoUbic:'Parque'},
  {clave:920, mz:9, lote:20, st:'Vendido',   m2:162,    exc:18,    plus:50000, tipoUbic:'Parque'},
  {clave:921, mz:9, lote:21, st:'Disponible',m2:164.19, exc:20.19, plus:50000, tipoUbic:'Parque', enObra:true, modeloFijo:'arago', plazoObra:3},

  // M-10 · Este · Av. Lérida · solo modelo Morello
  {clave:1001,mz:10,lote:1,  st:'Disponible',m2:205.97, exc:79.97, plus:50000, tipoUbic:'Esquina'},
  {clave:1002,mz:10,lote:2,  st:'Disponible',m2:144,    exc:18,    plus:0,     tipoUbic:'—'},
  {clave:1003,mz:10,lote:3,  st:'Apartado',  m2:222.18, exc:96.18, plus:0,     tipoUbic:'—'},
  {clave:1004,mz:10,lote:4,  st:'Disponible',m2:167.94, exc:41.94, plus:0,     tipoUbic:'—'},
  {clave:1005,mz:10,lote:5,  st:'Disponible',m2:162,    exc:36,    plus:0,     tipoUbic:'—'},
  {clave:1006,mz:10,lote:6,  st:'Disponible',m2:162,    exc:36,    plus:0,     tipoUbic:'—'},
  {clave:1007,mz:10,lote:7,  st:'Disponible',m2:162,    exc:36,    plus:0,     tipoUbic:'—'},
  {clave:1008,mz:10,lote:8,  st:'Disponible',m2:162,    exc:36,    plus:0,     tipoUbic:'—'},
  {clave:1009,mz:10,lote:9,  st:'Disponible',m2:144,    exc:18,    plus:0,     tipoUbic:'—'},
  {clave:1010,mz:10,lote:10, st:'Disponible',m2:144,    exc:18,    plus:0,     tipoUbic:'—'},
  {clave:1011,mz:10,lote:11, st:'Disponible',m2:163.28, exc:37.28, plus:50000, tipoUbic:'Esquina'},
];
