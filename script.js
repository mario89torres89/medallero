// --- CONFIGURACIÓN DE NUBE (FIREBASE 11+ FIRESTORE) ---
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

// --- ESTADO GLOBAL ---
let appData = {
    currentGroupName: "2A",
    groups: { "2A": [], "2B": [], "2C": [], "2D": [], "3A": [], "3B": [] }
};
let currentStudentId = null;
let islandsMap = new Map();
let isReadOnly = false; // Flag para modo espectador

// --- DETECTAR MODO ESPECTADOR ---
function checkViewerMode() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('modo') === 'ver') {
        isReadOnly = true;
        document.body.classList.add('modo-ver');
        document.getElementById('loading-text').innerText = "Iniciando Modo Espectador...";
    }
}

// --- MOTOR 3D ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050510, 0.015);
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
    innovation: { color: 0x00ffff, geo: new THREE.IcosahedronGeometry(0.5, 0), icon: '💡', name: 'Innovación' },
    creativity: { color: 0xff00ff, geo: new THREE.OctahedronGeometry(0.6, 0), icon: '🎨', name: 'Creatividad' },
    collaboration: { color: 0x00ff00, geo: new THREE.TetrahedronGeometry(0.6, 0), icon: '🤝', name: 'Colaboración' }
};

const LEVELS = [
    { max: 4, name: "Explorador", color: 0x00ffff, size: 1 },
    { max: 9, name: "Constructor", color: 0x00ff00, size: 1.2 },
    { max: 14, name: "Innovador", color: 0xffffff, size: 1.5 },
    { max: 999, name: "Maestro Tech", color: 0xff00ff, size: 2 }
];

const islandsGroup = new THREE.Group();
scene.add(islandsGroup);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const pLight = new THREE.PointLight(0x00ffff, 1, 150); pLight.position.set(0,70,0); scene.add(pLight);
const core = new THREE.Mesh(new THREE.CylinderGeometry(5,5,2,32), new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true }));
scene.add(core);

// --- UTILIDADES ---
function showNotify(msg) {
    if(isReadOnly) return; // No molestar a los alumnos con notificaciones de guardado
    const container = document.getElementById('notification-container');
    const n = document.createElement('div');
    n.className = 'notification';
    n.innerText = `📡 ${msg}`;
    container.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 500); }, 3000);
}

// --- SINCRONIZACIÓN ---
async function pushToCloud() {
    if(isReadOnly) return; // BLOQUEO DE ESCRITURA
    try { await setDoc(doc(db, "settings", "mainData"), appData); } catch (e) { console.error(e); }
}

function initSync() {
    onSnapshot(doc(db, "settings", "mainData"), (docSnap) => {
        if (docSnap.exists()) {
            appData = docSnap.data();
            updateAll();
            const loader = document.getElementById('loading-screen');
            if(loader) { loader.style.opacity = '0'; setTimeout(() => loader.remove(), 800); }
            document.getElementById('cloud-status').innerText = isReadOnly ? "☁️ MODO LECTURA" : "☁️ ARCHIPIÉLAGO SINCRONIZADO";
            document.getElementById('cloud-status').style.color = isReadOnly ? "#aaa" : "#0f0";
        } else if(!isReadOnly) {
            pushToCloud();
        }
    });
}

function updateAll() {
    islandsGroup.clear(); islandsMap.clear();
    const students = appData.groups[appData.currentGroupName] || [];
    document.getElementById('current-group-label').innerText = appData.currentGroupName;
    students.forEach((s, i) => {
        const radius = i % 2 === 0 ? 30 : 45;
        const angle = (Math.PI * 2 / Math.max(students.length, 1)) * i;
        const level = LEVELS.find(l => s.starTypes.length <= l.max);
        const island = new THREE.Mesh(new THREE.CylinderGeometry(3*level.size, 2, 2*level.size, 6), new THREE.MeshStandardMaterial({ color: level.color, roughness: 0.5, metalness: 0.8 }));
        island.position.set(Math.cos(angle)*radius, level.size, Math.sin(angle)*radius);
        island.userData.id = s.id;
        
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        canvas.width = 512; canvas.height = 128;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'; ctx.fillRect(0,0,512,128);
        ctx.strokeStyle = '#0ff'; ctx.lineWidth = 10; ctx.strokeRect(0,0,512,128);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 60px Orbitron'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(s.name, 256, 64);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
        sprite.scale.set(5, 1.25, 1); sprite.position.set(0, -2.5, 0); island.add(sprite);
        const sGroup = new THREE.Group(); sGroup.position.set(0, 2.5 + level.size, 0); island.add(sGroup);
        islandsGroup.add(island);
        islandsMap.set(s.id, { mesh: island, starsGroup: sGroup });
        s.starTypes.forEach((type, idx) => {
            const config = ENERGY_TYPES[type];
            const star = new THREE.Mesh(config.geo, new THREE.MeshStandardMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.5 }));
            const a = (Math.PI * 2 / 5) * (idx % 5);
            star.position.set(Math.cos(a)*1.8, Math.floor(idx/5)*1.2, Math.sin(a)*1.8);
            sGroup.add(star);
        });
    });
    updateLeaderboard();
}

function updateLeaderboard() {
    const list = document.getElementById('rank-list'); if(!list) return; list.innerHTML = '';
    const students = appData.groups[appData.currentGroupName] || [];
    [...students].sort((a,b) => b.starTypes.length - a.starTypes.length).forEach((s, i) => {
        const card = document.createElement('div'); card.className = 'student-card';
        card.onclick = () => focusStudent(s.id);
        const energyPercent = Math.min((s.starTypes.length / 15) * 100, 100);
        card.innerHTML = `<div><span class="student-name">${s.name}</span><div class="energy-bar"><div class="energy-fill" style="width: ${energyPercent}%"></div></div></div><div class="stars-count">${s.starTypes.length} ★</div>`;
        list.appendChild(card);
    });
}

function focusStudent(id) {
    const sRef = islandsMap.get(id); if(!sRef) return;
    gsap.to(camera.position, { x: sRef.mesh.position.x * 1.5, y: 15, z: sRef.mesh.position.z * 1.5, duration: 1.2 });
    controls.target.copy(sRef.mesh.position); autoRotate = false;
    openModal(id);
}

function openModal(id) {
    const s = appData.groups[appData.currentGroupName].find(x => x.id === id); if(!s) return;
    currentStudentId = id;
    document.getElementById('modal-name').innerText = s.name;
    document.getElementById('modal-stars').innerText = s.starTypes.length;
    const level = LEVELS.find(l => s.starTypes.length <= l.max);
    document.getElementById('modal-level').innerText = level.name;
    document.getElementById('modal-level').style.color = `#${level.color.toString(16).padStart(6, '0')}`;
    const medals = document.getElementById('modal-medals'); medals.innerHTML = '';
    const counts = s.starTypes.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
    Object.keys(counts).forEach(t => {
        for(let i=0; i < Math.floor(counts[t]/2); i++) {
            const m = document.createElement('div'); m.className = 'medal-badge';
            m.style.boxShadow = `0 0 10px #${ENERGY_TYPES[t].color.toString(16)}`;
            m.innerText = ENERGY_TYPES[t].icon; medals.appendChild(m);
        }
    });
    document.getElementById('student-modal').classList.remove('hidden');
}

// --- ACCIONES ---
window.rewardStudent = (id, type) => {
    if(isReadOnly) return;
    const s = appData.groups[appData.currentGroupName].find(x => x.id === id);
    if(s) { s.starTypes.push(type); showNotify(`${ENERGY_TYPES[type].name} +1`); pushToCloud(); }
};

window.saveStudentChanges = () => {
    if(isReadOnly) return;
    const s = appData.groups[appData.currentGroupName].find(x => x.id === currentStudentId);
    if(s) { s.name = document.getElementById('edit-name-input').value; window.setEditMode(false); pushToCloud(); }
};

window.deleteStudent = () => {
    if(isReadOnly) return;
    if(confirm(`¿Eliminar?`)) { appData.groups[appData.currentGroupName] = appData.groups[appData.currentGroupName].filter(x => x.id !== currentStudentId); window.closeModal(); pushToCloud(); }
};

window.openAddModal = () => {
    if(isReadOnly) return;
    const name = prompt("Nombre:");
    if(name) {
        const newS = { id: Date.now(), name: name, starTypes: [] };
        if(!appData.groups[appData.currentGroupName]) appData.groups[appData.currentGroupName] = [];
        appData.groups[appData.currentGroupName].push(newS); pushToCloud();
    }
};

window.toggleRanking = () => {
    const lb = document.getElementById('leaderboard'); lb.classList.toggle('hidden-rank');
    document.getElementById('toggle-rank').innerText = lb.classList.contains('hidden-rank') ? '▶' : '◀';
};

window.setEditMode = (e) => {
    if(isReadOnly) return;
    document.getElementById('view-mode').classList.toggle('hidden', e);
    document.getElementById('edit-mode').classList.toggle('hidden', !e);
    if(e) {
        const s = appData.groups[appData.currentGroupName].find(x => x.id === currentStudentId);
        document.getElementById('edit-name-input').value = s ? s.name : "";
    }
};

window.closeModal = () => document.getElementById('student-modal').classList.add('hidden');

// --- EVENTOS UI ---
document.getElementById('group-select').onchange = (e) => { appData.currentGroupName = e.target.value; updateAll(); if(!isReadOnly) pushToCloud(); };
document.getElementById('btn-add-student').onclick = window.openAddModal;
document.getElementById('btn-rotate').onclick = () => autoRotate = !autoRotate;
document.getElementById('btn-close-modal').onclick = window.closeModal;
document.getElementById('btn-edit-profile').onclick = () => window.setEditMode(true);
document.getElementById('btn-save-edit').onclick = window.saveStudentChanges;
document.getElementById('btn-delete-student').onclick = window.deleteStudent;
document.getElementById('btn-cancel-edit').onclick = () => window.setEditMode(false);
document.getElementById('toggle-rank').onclick = window.toggleRanking;
document.getElementById('reward-inn').onclick = () => window.rewardStudent(currentStudentId, 'innovation');
document.getElementById('reward-cre').onclick = () => window.rewardStudent(currentStudentId, 'creativity');
document.getElementById('reward-col').onclick = () => window.rewardStudent(currentStudentId, 'collaboration');

window.addEventListener('click', (e) => {
    if(e.target.closest('#ui-layer')) return;
    const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    for(let h of hits) { let o = h.object; while(o) { if(o.userData.id) { focusStudent(o.userData.id); return; } o = o.parent; } }
});

window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

function animate() {
    requestAnimationFrame(animate); core.rotation.y += 0.01;
    if(autoRotate) islandsGroup.rotation.y -= 0.005;
    const time = Date.now()*0.002;
    islandsMap.forEach((ref, id) => {
        if(ref.mesh) {
            ref.mesh.position.y = 1 + Math.sin(time + id)*0.3;
            if(ref.starsGroup) ref.starsGroup.rotation.y += 0.01;
        }
    });
    controls.update(); renderer.render(scene, camera);
}

checkViewerMode(); initSync(); animate();
