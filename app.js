/**
 * Participa DF Lite - Core Logic
 */

const API_URL = "http://localhost:8000"; 
let map = null;
let reportMarker = null;
let activeMediaType = null;
let recognition = null;
let db = null;
let typingTimer = null;
let currentFontSize = 100;

// DEFINIÇÃO DAS CATEGORIAS (Dinâmico)
const CATEGORIAS = {
    com_local: [
        {val: 'buraco', text: '🚧 Buraco / Via'},
        {val: 'lixo', text: '🗑️ Lixo / Limpeza'},
        {val: 'iluminacao', text: '💡 Iluminação'},
        {val: 'transporte', text: '🚌 Transporte'},
        {val: 'saude', text: '🏥 Saúde (Local)'},
        {val: 'escola', text: '🎓 Escola'},
        {val: 'outro', text: '📝 Outro (Local)'}
    ],
    sem_local: [
        {val: 'atendimento', text: '😠 Atendimento / Servidor'},
        {val: 'sistema', text: '💻 Sistema / Site'},
        {val: 'elogio', text: '⭐ Elogio / Sugestão'},
        {val: 'denuncia', text: '🕵️ Denúncia Anônima'},
        {val: 'outro_geral', text: '📝 Outro (Geral)'}
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('intro-view').classList.add('active');
    registerPWA();
    initDB();
    setupMediaListeners();
    setupPrivacyAI();
    checkConnection();
    window.addEventListener('online', () => { syncOfflineData(); carregarRelatosSalvos(); });
    
    // Inicializa categorias
    toggleLocalizacao(); 
});

// --- LÓGICA DE CATEGORIAS DINÂMICAS ---
window.toggleLocalizacao = function() {
    const isChecked = document.getElementById('check-sem-local').checked;
    
    // 1. Controla Visual
    document.getElementById('loc-container').style.display = isChecked ? 'none' : 'block';
    document.getElementById('loc-disabled-msg').style.display = isChecked ? 'block' : 'none';
    
    // 2. Troca as Opções do Select
    const select = document.getElementById('input-tipo');
    select.innerHTML = ''; // Limpa tudo
    
    const opcoes = isChecked ? CATEGORIAS.sem_local : CATEGORIAS.com_local;
    
    opcoes.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.val;
        el.innerText = opt.text;
        select.appendChild(el);
    });
};

// --- ACESSIBILIDADE ---
window.toggleAccPanel = function() { document.getElementById('acc-panel').classList.toggle('hidden'); };
window.toggleContrast = function() { document.body.classList.toggle('high-contrast'); };
window.toggleMonochrome = function() { document.body.classList.toggle('monochrome'); };
window.toggleSaturation = function() { document.body.classList.toggle('low-saturation'); };
window.toggleDyslexia = function() { document.body.classList.toggle('dyslexia-mode'); };
window.toggleSpacing = function() { document.body.classList.toggle('extra-spacing'); };
window.toggleCursor = function() { document.body.classList.toggle('big-cursor'); };
window.highlightLinks = function() { document.body.classList.toggle('highlight-links'); };
window.changeFontSize = function(d) {
    if (d === 1 && currentFontSize < 150) currentFontSize += 10;
    if (d === -1 && currentFontSize > 80) currentFontSize -= 10;
    document.body.style.fontSize = `${currentFontSize}%`;
};
window.toggleReadingGuide = function() {
    const guide = document.getElementById('reading-guide-bar');
    guide.classList.toggle('active');
    if(guide.classList.contains('active')) document.addEventListener('mousemove', moveGuide);
    else document.removeEventListener('mousemove', moveGuide);
};
function moveGuide(e) { document.getElementById('reading-guide-bar').style.top = (e.clientY - 15) + 'px'; }
window.resetAccessibility = function() {
    document.body.className = ''; currentFontSize = 100; document.body.style.fontSize = '100%';
    document.getElementById('reading-guide-bar').classList.remove('active');
};

// --- NAVEGAÇÃO ---
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}
window.goToMap = function() { switchView('map-view'); setTimeout(() => { if (!map) initMap(); else map.invalidateSize(); }, 100); };
window.backToIntro = function() { switchView('intro-view'); };

// --- HISTÓRICO ---
window.openHistory = function() { switchView('history-view'); renderHistory(); };
window.closeHistory = function() { switchView('map-view'); };
async function renderHistory() {
    const container = document.getElementById('history-list');
    container.innerHTML = '<div style="text-align:center;margin-top:20px;">Carregando...</div>';
    try {
        let lista = [];
        if(navigator.onLine) {
            const res = await fetch(`${API_URL}/api/minhas-manifestacoes`);
            lista = await res.json();
        } else {
            container.innerHTML = '<div style="text-align:center;margin-top:20px;">Sem conexão para atualizar.</div>';
            return;
        }
        if(lista.length === 0) {
            container.innerHTML = '<div style="text-align:center;margin-top:50px;color:#999;">Nenhum registro encontrado.</div>';
            return;
        }
        container.innerHTML = '';
        lista.forEach(item => {
            const dataF = item.data_criacao || item.data || 'Recente';
            const tipoF = item.tipo_ocorrencia || item.tipo || 'Geral';
            
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `<div class="history-info"><strong>Protocolo: ${item.protocolo}</strong><small>${dataF} • ${tipoF}</small></div><div class="history-status">Recebido</div>`;
            container.appendChild(div);
        });
    } catch(e) { container.innerHTML = 'Erro ao carregar.'; }
}

// --- SUCESSO ---
window.closeSuccess = function() {
    document.getElementById('success-modal').classList.add('hidden');
    window.location.reload(); 
};

// --- MÍDIA E FORM ---
window.openForm = function(type) {
    activeMediaType = type;
    document.getElementById('input-foto').value = "";
    document.getElementById('input-video').value = "";
    document.getElementById('media-preview-container').style.display = 'none';
    document.getElementById('media-instruction').style.display = 'flex';
    
    // Reseta Local
    document.getElementById('check-sem-local').checked = false;
    toggleLocalizacao(); // Garante lista correta

    if (type === 'foto') { document.getElementById('media-icon-display').innerText = "📷"; switchView('form-view'); }
    else if (type === 'video') { document.getElementById('media-icon-display').innerText = "🎥"; switchView('form-view'); }
    else if (type === 'audio') { startRecording(); }
};
window.reTriggerMedia = function() {
    if (activeMediaType === 'foto') document.getElementById('input-foto').click();
    else if (activeMediaType === 'video') document.getElementById('input-video').click();
    else if (activeMediaType === 'audio') startRecording();
};
window.closeForm = function() { switchView('map-view'); };
window.limparTexto = function() {
    document.getElementById('input-descricao').value = "";
    document.getElementById('lgpd-alert').style.display = 'none';
};

// --- PREVIEW ---
function setupMediaListeners() {
    ['input-foto', 'input-video'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            if(e.target.files[0]) showPreview(e.target.files[0], id.includes('video') ? 'video' : 'image');
        });
    });
}
function showPreview(file, type) {
    const c = document.getElementById('media-preview-container');
    document.getElementById('media-instruction').style.display = 'none';
    c.style.display = 'block';
    if(type==='image') c.innerHTML = `<img src="${URL.createObjectURL(file)}">`;
    else if(type==='video') c.innerHTML = `<video src="${URL.createObjectURL(file)}" controls style="background:black;"></video>`;
    else c.innerHTML = `<div style="width:100%;height:100%;background:#2980B9;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:3rem;"><span>🎤</span><span style="font-size:1rem;">Áudio</span></div>`;
    switchView('form-view');
}

// --- GRAVAÇÃO ---
function startRecording() {
    document.getElementById('recording-overlay').style.display = 'flex';
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = 'pt-BR'; recognition.continuous = true; recognition.interimResults = true;
        recognition.onresult = (e) => {
            let txt = ''; for (let i = e.resultIndex; i < e.results.length; ++i) txt += e.results[i][0].transcript;
            document.getElementById('recording-text').innerText = txt;
            document.getElementById('input-descricao').value = txt;
        };
        recognition.start();
    }
}
window.stopRecording = function() {
    if(recognition) recognition.stop();
    document.getElementById('recording-overlay').style.display = 'none';
    activeMediaType = 'audio'; showPreview(null, 'audio');
};

// --- MAPA ---
function initMap() {
    if(!document.getElementById('map')) return;
    if(typeof L !== 'undefined') L.Icon.Default.imagePath = 'libs/images/';
    map = L.map('map', {zoomControl:false}).setView([-15.7942, -47.8822], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    reportMarker = L.marker(map.getCenter(), {draggable:true, icon: L.icon({iconUrl:'libs/images/marker-icon-red.png', shadowUrl:'libs/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41]})}).addTo(map);
    map.on('move', () => reportMarker.setLatLng(map.getCenter()));
    map.on('moveend', () => updateLocationData(map.getCenter()));
    document.getElementById('btn-gps').onclick = () => map.locate({setView:true, maxZoom:16});
    map.locate({setView:true, maxZoom:16});
    if(navigator.onLine) carregarRelatosSalvos();
}
function updateLocationData(latlng) { document.getElementById('txt-endereco').innerText = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`; }
window.buscarLocal = async function() {
    const q = document.getElementById('input-busca').value;
    if(!q) return;
    try {
        const res = await fetch(`${API_URL}/api/buscar-endereco?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if(data.length>0) {
            const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
            map.setView([lat, lon], 16); reportMarker.setLatLng([lat, lon]);
            document.getElementById('txt-endereco').innerText = data[0].display_name.split(',')[0];
        }
    } catch(e){}
};

// --- IA ---
function setupPrivacyAI() {
    const txt = document.getElementById('input-descricao');
    txt.addEventListener('input', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(async () => {
            if(txt.value.length < 5 || !navigator.onLine) return;
            try {
                const res = await fetch(`${API_URL}/api/validar-privacidade`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({texto:txt.value})});
                const data = await res.json();
                document.getElementById('lgpd-alert').style.display = data.contem_dados ? 'block' : 'none';
            } catch(e){}
        }, 800);
    });
}

// --- ENVIO ---
window.submitForm = async function() {
    const btn = document.querySelector('.highlight');
    btn.innerText = "Enviando..."; btn.disabled = true;
    const fd = new FormData();
    fd.append('descricao', document.getElementById('input-descricao').value);
    
    // PEGA O TEXTO DO SELECT, NÃO O VALOR
    const select = document.getElementById('input-tipo');
    const tipoTexto = select.options[select.selectedIndex].text;
    fd.append('tipo', tipoTexto); // Envia texto legível para o backend
    
    fd.append('anonimo', document.getElementById('check-anonimo').checked);
    
    const semLocal = document.getElementById('check-sem-local').checked;
    if (!semLocal && map) {
        const c=map.getCenter(); fd.append('latitude', c.lat); fd.append('longitude', c.lng); 
    } else {
        fd.append('latitude', "0.0"); fd.append('longitude', "0.0"); 
    }

    const f = document.getElementById(activeMediaType==='video'?'input-video':'input-foto').files[0];
    if(f) fd.append('foto', f);

    if(navigator.onLine) {
        try {
            const res = await fetch(`${API_URL}/api/enviar-manifestacao`, {method:'POST', body:fd});
            const json = await res.json();
            if(json.status === 'sucesso') {
                document.getElementById('success-protocol').innerText = json.protocolo;
                document.getElementById('success-modal').classList.remove('hidden');
            }
        } catch(e) { saveOffline(fd); }
    } else { saveOffline(fd); }
};

function initDB() {
    const req = indexedDB.open("ParticipaDF_DB", 1);
    req.onupgradeneeded = (e) => { db = e.target.result; if(!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', {keyPath:'id', autoIncrement:true}); };
    req.onsuccess = (e) => { db = e.target.result; if(navigator.onLine) syncOfflineData(); };
}
function saveOffline(fd) {
    const tx = db.transaction(["outbox"], "readwrite");
    tx.objectStore("outbox").add({
        descricao: fd.get('descricao'), tipo: fd.get('tipo'), latitude: fd.get('latitude'), longitude: fd.get('longitude'), timestamp: Date.now()
    });
    alert("📡 Salvo offline! Enviaremos quando reconectar.");
    window.location.reload();
}
function syncOfflineData() {
    if(!db) return;
    const tx = db.transaction(["outbox"], "readwrite");
    tx.objectStore("outbox").getAll().onsuccess = (e) => {
        e.target.result.forEach(async (item) => {
            const fd = new FormData();
            fd.append('descricao', item.descricao); fd.append('tipo', item.tipo); fd.append('latitude', item.latitude); fd.append('longitude', item.longitude);
            try { await fetch(`${API_URL}/api/enviar-manifestacao`, {method:'POST', body:fd}); db.transaction(["outbox"],"readwrite").objectStore("outbox").delete(item.id); } catch(e){}
        });
    };
}
function registerPWA() { if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js'); }
function checkConnection() { console.log(navigator.onLine ? "Online" : "Offline"); }
async function carregarRelatosSalvos() {
    try {
        const res = await fetch(`${API_URL}/api/minhas-manifestacoes`);
        const lista = await res.json();
        const icon = L.icon({iconUrl:'libs/images/marker-icon-orange.png', shadowUrl:'libs/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34]});
        lista.forEach(m => {
            if(m.localizacao && m.localizacao.lat !== 0) {
                L.marker([m.localizacao.lat, m.localizacao.lng], {icon:icon}).addTo(map).bindPopup(`<b>${m.protocolo}</b><br>${m.tipo_ocorrencia}`);
            }
        });
    } catch(e){}
}