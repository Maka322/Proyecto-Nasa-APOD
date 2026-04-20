const API_KEY = 'cV6bqtX5IQnFPdJszAIHPnjjIdscI7eWASnlDoxV';

document.addEventListener('DOMContentLoaded', () => {

    const menuBtn = document.getElementById('menuBtn');
    const sideMenu = document.getElementById('sideMenu');

    const toggleMenu = () => {
        sideMenu.classList.toggle('active');
        menuBtn.classList.toggle('active-trigger');
    };

    menuBtn.onclick = (e) => { e.stopPropagation(); toggleMenu(); };
    document.querySelectorAll('.side-menu a').forEach(link => link.onclick = toggleMenu);
    document.onclick = (e) => { if (sideMenu.classList.contains('active') && !sideMenu.contains(e.target)) toggleMenu(); };


    document.getElementById('exploreBtn').onclick = () => document.getElementById('apod-section').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('searchBtn').onclick = () => fetchAPOD(document.getElementById('dateInput').value);
    document.getElementById('btnLibrarySearch').onclick = searchLibrary;
    document.getElementById('favBtn').onclick = () => saveFavorite();

    fetchAPOD();
    renderFavs();
    initObserver();
});

async function translate(text) {
    if (!text) return "Información no disponible.";
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`);
        const json = await res.json();
        return json.responseData.translatedText || text;
    } catch { return text; }
}

async function fetchAPOD(date = '') {
    const display = document.getElementById('apodResult');
    display.innerHTML = 'Recibiendo señal...';
    try {
        const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}${date ? `&date=${date}` : ''}`);
        const data = await res.json();
        const titleEs = await translate(data.title);
        const descEs = await translate(data.explanation);

        window.currentData = { title: titleEs, url: data.url, date: data.date };
        display.innerHTML = `
            <h3>${titleEs}</h3>
            <img src="${data.url}" style="width:100%; border-radius:10px; margin:20px 0;">
            <p style="font-size:0.9rem; text-align:justify; line-height:1.5;">${descEs}</p>
        `;
    } catch { display.innerHTML = 'Error al conectar con la NASA.'; }
}

async function searchLibrary() {
    const query = document.getElementById('libraryQuery').value;
    const resultsDiv = document.getElementById('libraryResults');
    if (!query) return;

    resultsDiv.innerHTML = 'Explorando archivos...';
    try {
        const res = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`);
        const data = await res.json();
        const items = data.collection.items.slice(0, 8);

        resultsDiv.innerHTML = '';
        for (const item of items) {
            const titleEs = await translate(item.data[0].title);
            const imgUrl = item.links[0].href;
            resultsDiv.innerHTML += `
                <div class="result-item">
                    <img src="${imgUrl}" onclick="window.open('${imgUrl}')">
                    <p style="font-size:0.75rem; margin:10px 0;">${titleEs}</p>
                    <button class="btn-nasa btn-small" onclick="saveFavorite({title:'${titleEs.replace(/'/g, "")}', url:'${imgUrl}'})" style="width:100%">★</button>
                </div>
            `;
        }
    } catch { resultsDiv.innerHTML = 'Error en el buscador.'; }
}

function saveFavorite(data = window.currentData) {
    if (!data) return;
    let favs = JSON.parse(localStorage.getItem('nasa_favs')) || [];
    if (!favs.find(f => f.url === data.url)) {
        favs.push(data);
        localStorage.setItem('nasa_favs', JSON.stringify(favs));
        renderFavs();
    }
}

function removeFav(url) {
    let favs = JSON.parse(localStorage.getItem('nasa_favs')).filter(f => f.url !== url);
    localStorage.setItem('nasa_favs', JSON.stringify(favs));
    renderFavs();
}

function renderFavs() {
    const list = document.getElementById('favList');
    const favs = JSON.parse(localStorage.getItem('nasa_favs')) || [];

    // --- Lógica de Telemetría (COMENTADA PARA QUE NO SE VEA) ---
    // const size = encodeURI(JSON.stringify(localStorage)).length / 1024;
    // document.getElementById('storageQuota').innerHTML = `📡 TELEMETRÍA: Sincronización base terrestre: ${(size / 5120 * 100).toFixed(2)}% (${size.toFixed(1)} KB)`;

    list.innerHTML = favs.length ? favs.map(f => `
        <div class="result-item">
            <button onclick="removeFav('${f.url}')" style="position:absolute; top:5px; right:5px; background:red; border:none; color:white; border-radius:50%; width:20px; cursor:pointer;">&times;</button>
            <img src="${f.url}">
            <p style="font-size:0.7rem; margin-top:8px;">${f.title}</p>
        </div>
    `).join('') : 'No hay favoritos guardados.';
}

function initObserver() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => e.isIntersecting && e.target.classList.add('visible'));
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
}