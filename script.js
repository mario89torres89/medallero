import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAhUy5vlj0CPgDATmxdBYy2oLH6UTbWlMk",
    authDomain: "medallero-c2c17.firebaseapp.com",
    projectId: "medallero-c2c17",
    storageBucket: "medallero-c2c17.firebasestorage.app",
    messagingSenderId: "173851474439",
    appId: "1:173851474439:web:a4dbf9a3f1ea912bda48a2",
    measurementId: "G-DEN9R6XSK4"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const ADMIN_USER = "admin";
const ADMIN_PASS = "mario2026";

// --- LISTAS DE ALUMNOS ---
const ALUMNOS_2D = [
    "DURAN ANAYA, MIA ROMINA", "FUENTES LUNA, SANTIAGO LIONEL", "HERNÁNDEZ MÁRQUEZ, JORGE ALFREDO",
    "JUAREZ VARGAS, JUAN ABRAHAM", "LAZARO SANDOVAL, SANTIAGO", "LOPEZ CRUZ, DEREK HAZIEL",
    "MACIAS SANCHEZ, REGINA", "MARTÍNEZ GONZÁLEZ, ALAN SANTIAGO", "MARTINEZ ROMERO, ANGEL GABRIEL",
    "OLMEDO YAMAZAKI, TAKASHI ALEJANDRO", "PAREDES CRUZ, SURY NOE", "PARRA PIÑA, DANIEL AXEL",
    "QUIÑONES MARTINEZ, RICARDO DANIEL", "RAMIREZ GONZALEZ, EMILIANO", "REYES AGUILAR, SAMANTHA CAMILA",
    "REYNA AVILA, MAXIMILIANO", "ROYACELLI GUILLEN, CARLOS GAEL", "SÁNCHEZ ARROYO, MARCO ANTONIO",
    "SANDOVAL CAMPUZANO, VANIA", "SOLARES ALVAREZ, ETHAN URIEL", "SOLIS CRUZ, XIMENA ZOE",
    "SOTO TORRES, GAEL EMILIANO", "TENORIO MENDOZA, DIEGO YAEL", "TREJO MARTINEZ, JUSTIN MIGUEL",
    "TRUJILLO PASTEN, DULCE SOFÍA", "VAZQUEZ ESTALA, VALERIE JULIETA", "VEGA MORALES, CRISTIAN YAEL",
    "VENEGAS RAMIREZ, ERIKA YUNUET", "VILLAVICENCIO VERDE, IVANNA ALEXA", "YAÑEZ LÓPEZ, JOSE SAMUEL",
    "ZEPEDA SANTAMARIA, AUSTIN YAEL"
];

const ALUMNOS_3B = [
    "AGUILAR DE LA ROSA, SANTIAGO", "ARROYO RODRIGUEZ, MATEO", "BRIONES NAVARRO, MATEO",
    "CALIXTO JUAREZ, KALID GAEL", "CHAVEZ BENITEZ, SANTIAGO SAUL", "CHAVEZ PEREZ, VALERIA ELIZABETH",
    "ESCAMILLA FLORES, ROBERTO ISAAC", "ESPARZA MONTELONGO, MARCO ITAN", "FLORES LARA, IANN MICHELLE",
    "FLORES PALOS, DIEGO", "FLORES SANCHEZ, IRVING SANTIAGO", "FRANCO GONZALEZ, ANDREA SOPHIA",
    "FRANCO VALENCIA, AFENI ROMINA", "GARDUÑO MEJÍA, VÍCTOR SANTIAGO", "HUERTA RINCON, EMILIANO",
    "LÓPEZ GARCÍA, REGINA CRISTEL", "LOPEZ LOPEZ, SANTIAGO DIDIER", "MALDONADO VICTORIA, GAEL",
    "MARTINEZ CAMACHO, SHARAN REGINA", "MARTÍNEZ CORTÉZ, DULCE ABRIL", "MONROY ROMERO, IAN ALEXIS",
    "MOSQUEDA TORRES, GERALDINE ODALYS", "MOYA NERI, DIEGO", "ORTIZ BALDERAS, DANIELA YDALI",
    "ORTIZ PEREZ, EMILIANO", "PÉREZ RAMÍREZ, FERNANDA", "PRADO MAYA, DANIELA",
    "ROYACELLI GUILLEN, KARLA DENISSE", "SERVIN SOSA, EMILIANO", "TOLEDO ROSALES, LEONARDO",
    "VARELA RAMIREZ, EVE ISABELLA", "ZAMORA MEDEL, JOSE CHRISTIAN", "ZUNZUNEGUI RODRIGUEZ, MIA FERNANDA"
];

const COLORS = { blue: 0x00548B, green: 0x78BE20, orange: 0xEF7D00 };

let appData = { currentGroupName: "2D", groups: { "2A": [], "2B": [], "2C": [], "2D": [], "3A": [], "3B": [] } };
let currentStudentId = null, islandsMap = new Map(), isReadOnly = true;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050a15, 0.015);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 45, 65);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
let autoRotate = true;

const ENERGY_TYPES = {
    innovation: { color: COLORS.blue, geo: new THREE.IcosahedronGeometry(0.5, 0), icon: '💡', name: 'Innovación' },
    collaboration: { color: COLORS.green, geo: new THREE.TetrahedronGeometry(0.6, 0), icon: '🤝', name: 'Colaboración' },
    creativity: { color: COLORS.orange, geo: new THREE.OctahedronGeometry(0.6, 0), icon: '🎨', name: 'Creatividad' }
};

const LEVELS = [
    { max: 4, name: "Explorador", color: COLORS.blue, size: 1 },
    { max: 9, name: "Constructor", color: COLORS.green, size: 1.2 },
    { max: 14, name: "Innovador", color: COLORS.orange, size: 1.5 },
    { max: 999, name: "Maestro Tech", color: 0xffffff, size: 2 }
];

// --- CILINDRO CONSTRUIDO EN WIREFRAME ---
const coreLogo = new THREE.Group();
function createInnovaShield() {
    // Cilindro principal wireframe
    const cylinderGeo = new THREE.CylinderGeometry(3, 3, 6, 8);
    const cylinderMat = new THREE.MeshBasicMaterial({ color: COLORS.blue, wireframe: true, transparent: true, opacity: 0.8 });
    const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
    cylinder.rotation.x = -Math.PI / 2;
    cylinder.position.y = 2;
    coreLogo.add(cylinder);

    // Anillos constructivos
    for(let i = 0; i < 3; i++) {
        const ringGeo = new THREE.TorusGeometry(4 + i * 0.5, 0.1, 8, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: i === 0 ? COLORS.orange : (i === 1 ? COLORS.green : COLORS.blue), wireframe: true, transparent: true, opacity: 0.6 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 2;
        ring.rotation.x = -Math.PI / 2;
        ring.rotation.z = (i * Math.PI) / 6;
        coreLogo.add(ring);
    }

    // Base hexagonal
    const hexGeo = new THREE.CylinderGeometry(5, 5, 0.5, 6);
    const hexMat = new THREE.MeshBasicMaterial({ color: COLORS.green, wireframe: true, transparent: true, opacity: 0.4 });
    const hexBase = new THREE.Mesh(hexGeo, hexMat);
    hexBase.position.y = -1;
    coreLogo.add(hexBase);
}
createInnovaShield();
scene.add(coreLogo);

const islandsGroup = new THREE.Group();
scene.add(islandsGroup);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const pLight = new THREE.PointLight(COLORS.blue, 1, 150); pLight.position.set(0,70,0); scene.add(pLight);

// --- FUNCIONES CORE ---
function showNotify(msg) { if(isReadOnly) return; const container = document.getElementById('notification-container'); const n = document.createElement('div'); n.className = 'notification'; n.innerText = `📡 ${msg}`; container.appendChild(n); setTimeout(() => { n.style.opacity='0'; setTimeout(()=>n.remove(),500); }, 3000); }

async function pushToCloud() { if(isReadOnly) return; try { await setDoc(doc(db, "settings", "mainData"), appData); } catch (e) { console.error(e); } }

function inicializarGrupos() { if (appData.groups["2D"].length === 0 && appData.groups["3B"].length === 0) { ALUMNOS_2D.forEach((n,i)=>{ appData.groups["2D"].push({id:Date.now()+i,name:n,starTypes:[]});}); ALUMNOS_3B.forEach((n,i)=>{ appData.groups["3B"].push({id:Date.now()+1000+i,name:n,starTypes:[]});}); if(!isReadOnly){pushToCloud(); showNotify("✅ Alumnos 2D y 3B cargados");} } }

function initSync() { onSnapshot(doc(db,"settings","mainData"),(docSnap)=>{ if(docSnap.exists()){ appData=docSnap.data(); inicializarGrupos(); updateAll(); const loader=document.getElementById('loading-screen'); if(loader){loader.style.opacity='0'; setTimeout(()=>loader.remove(),800);} const status=document.getElementById('cloud-status'); status.innerText=isReadOnly?"☁️ MODO LECTURA":"☁️ ADMIN: CONECTADO"; status.style.color=isReadOnly?"#888":"#78BE20"; } else if(!isReadOnly){ inicializarGrupos(); pushToCloud(); } }); }

function updateAll() { islandsGroup.clear(); islandsMap.clear(); const students = appData.groups[appData.currentGroupName] || []; document.getElementById('current-group-label').innerText = appData.currentGroupName; students.forEach((s, i) => { const radius = i % 2 === 0 ? 30 : 45; const angle = (Math.PI * 2 / Math.max(students.length, 1)) * i; const level = LEVELS.find(l => s.starTypes.length <= l.max); const island = new THREE.Mesh(new THREE.CylinderGeometry(3*level.size, 2, 2*level.size, 6), new THREE.MeshStandardMaterial({ color: level.color, roughness: 0.5, metalness: 0.8 })); island.position.set(Math.cos(angle)*radius, level.size, Math.sin(angle)*radius); island.userData.id = s.id; const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); canvas.width = 512; canvas.height = 128; ctx.fillStyle = 'rgba(0, 84, 139, 0.2)'; ctx.fillRect(0,0,512,128); ctx.strokeStyle = '#00548B'; ctx.lineWidth = 10; ctx.strokeRect(0,0,512,128); ctx.fillStyle = '#fff'; ctx.font = 'bold 60px Orbitron'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.name, 256, 64); const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true })); sprite.scale.set(5, 1.25, 1); sprite.position.set(0, -2.5, 0); island.add(sprite); const sGroup = new THREE.Group(); sGroup.position.set(0, 2.5 + level.size, 0); island.add(sGroup); islandsGroup.add(island); islandsMap.set(s.id, { mesh: island, starsGroup: sGroup }); s.starTypes.forEach((type, idx) => { const config = ENERGY_TYPES[type]; const star = new THREE.Mesh(config.geo, new THREE.MeshStandardMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.5 })); const a = (Math.PI * 2 / 5) * (idx % 5); star.position.set(Math.cos(a)*1.8, Math.floor(idx/5)*1.2, Math.sin(a)*1.8); sGroup.add(star); }); }); updateLeaderboard(); }

function updateLeaderboard() { const list = document.getElementById('rank-list'); if(!list) return; list.innerHTML = ''; const students = appData.groups[appData.currentGroupName] || []; [...students].sort((a,b) => b.starTypes.length - a.starTypes.length).forEach((s, i) => { const card = document.createElement('div'); card.className = 'student-card'; card.addEventListener('click', () => focusStudent(s.id)); const energyPercent = Math.min((s.starTypes.length / 15) * 100, 100); card.innerHTML = `<div><span class="student-name">${s.name}</span><div class="energy-bar"><div class="energy-fill" style="width: ${energyPercent}%"></div></div></div><div class="stars-count">${s.starTypes.length} ★</div>`; list.appendChild(card); }); }

function focusStudent(id) { const sRef = islandsMap.get(id); if(!sRef) return; gsap.to(camera.position, { x: sRef.mesh.position.x * 1.5, y: 15, z: sRef.mesh.position.z * 1.5, duration: 1.2 }); controls.target.copy(sRef.mesh.position); autoRotate = false; openModal(id); }

function openModal(id) { const s = appData.groups[appData.currentGroupName].find(x => x.id === id); if(!s) return; currentStudentId = id; document.getElementById('modal-name').innerText = s.name; document.getElementById('modal-stars').innerText = s.starTypes.length; const level = LEVELS.find(l => s.starTypes.length <= l.max); document.getElementById('modal-level').innerText = level.name; document.getElementById('modal-level').style.color = `#${level.color.toString(16).padStart(6, '0')}`; const medals = document.getElementById('modal-medals'); medals.innerHTML = ''; const counts = s.starTypes.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {}); Object.keys(counts).forEach(t => { for(let i=0; i < Math.floor(counts[t]/2); i++) { const m = document.createElement('div'); m.className = 'medal-badge'; m.style.boxShadow = `0 0 10px #${ENERGY_TYPES[t].color.toString(16)}`; m.innerText = ENERGY_TYPES[t].icon; medals.appendChild(m); } }); document.getElementById('student-modal').classList.remove('hidden'); }

function toggleAdmin(auth) { isReadOnly = !auth; if(auth){ document.body.classList.remove('modo-ver'); document.getElementById('btn-login-open').innerText = "🔓 SALIR"; showNotify("MODO DOCENTE ACTIVO"); } else { document.body.classList.add('modo-ver'); document.getElementById('btn-login-open').innerText = "🔑 ACCESO DOCENTE"; } updateAll(); }

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-login-open').addEventListener('click', () => { if(!isReadOnly) { toggleAdmin(false); return; } document.getElementById('login-modal').classList.remove('hidden'); });
    document.getElementById('btn-login-submit').addEventListener('click', () => { if(document.getElementById('login-user').value === ADMIN_USER && document.getElementById('login-pass').value === ADMIN_PASS) { toggleAdmin(true); document.getElementById('login-modal').classList.add('hidden'); } else { alert("ERROR"); } });
    document.getElementById('btn-login-close').addEventListener('click', () => document.getElementById('login-modal').classList.add('hidden'));
    document.getElementById('btn-add-student').addEventListener('click', () => { if(isReadOnly) return; const n = prompt("Nombre:"); if(n) { appData.groups[appData.currentGroupName].push({ id: Date.now(), name:
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

function animate() {
    requestAnimationFrame(animate); 
    coreLogo.rotation.y += 0.01;
    if(autoRotate) islandsGroup.rotation.y -= 0.005;
    const time = Date.now()*0.002;
    islandsMap.forEach((ref, id) => { if(ref.mesh) { ref.mesh.position.y = 1 + Math.sin(time + id)*0.3; if(ref.starsGroup) ref.starsGroup.rotation.y += 0.01; } });
    controls.update(); renderer.render(scene, camera);
}

initSync(); animate();

