let map;
let todosPostos = [];
let marcadorUsuario;
let marcadores = [];

function initMap() {
  map = L.map('map').setView([-8.0476, -34.8770], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      marcadorUsuario = L.marker(userLocation, { icon: blueIcon() }).addTo(map)
        .bindPopup("Você está aqui").openPopup();
      map.setView(userLocation, 13);
      carregarPostos(userLocation);
      document.getElementById("btn-mais-proximo").onclick = () => centralizarMaisProximo(userLocation);
    }, () => carregarPostos({ lat: -8.0476, lng: -34.8770 }));
  } else {
    carregarPostos({ lat: -8.0476, lng: -34.8770 });
  }
}

function blueIcon() {
  return L.icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

function calcularDistancia(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function carregarPostos(userLoc) {
  const res = await fetch("data/postos_saude_recife_completo.json");
  const dados = await res.json();
  todosPostos = dados.map(p => ({
    ...p,
    distancia: calcularDistancia(userLoc, { lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) })
  }));
  preencherFiltros(todosPostos);
  exibirPostos(todosPostos);
}

function preencherFiltros(postos) {
  const distritos = [...new Set(postos.map(p => p.distrito_sanitario))].sort();
  const bairros = [...new Set(postos.map(p => p.bairro))].sort();
  const especialidades = [...new Set(postos.flatMap(p => p.especialidades))].sort();
  preencherSelect("filtro-distrito", distritos);
  preencherSelect("filtro-bairro", bairros);
  preencherSelect("filtro-especialidade", especialidades);

  ["filtro-distrito", "filtro-bairro", "filtro-especialidade"].forEach(id =>
    document.getElementById(id).addEventListener("change", () => exibirPostos(todosPostos))
  );
}

function preencherSelect(id, lista) {
  const sel = document.getElementById(id);
  sel.innerHTML = "<option value=''>Todos</option>";
  lista.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    sel.appendChild(opt);
  });
}

function gerarHTMLPosto(p) {
  const horaAgora = new Date();
  const [hInicio, mInicio] = p.horario_funcionamento.split("ÀS")[0].trim().split(":");
  const [hFim, mFim] = p.horario_funcionamento.split("ÀS")[1].trim().split(":");
  const inicio = new Date();
  inicio.setHours(parseInt(hInicio), parseInt(mInicio));
  const fim = new Date();
  fim.setHours(parseInt(hFim), parseInt(mFim));
  const aberto = horaAgora >= inicio && horaAgora <= fim;

  const status = aberto
    ? "<span style='color: green; font-weight: bold'>✔️ Aberto agora</span>"
    : "<span style='color: gray;'>Fechado</span>";

  return `
    <h3>${p.nome_unidade}</h3>
    <p><strong>Endereço:</strong> ${p.endereco}</p>
    <p><strong>Bairro:</strong> ${p.bairro}</p>
    <p><strong>Distrito:</strong> ${p.distrito_sanitario}</p>
    <p><strong>Telefone:</strong> ${p.telefone}</p>
    <p><strong>Horário:</strong> ${p.horario_funcionamento}</p>
    <p><strong>Especialidades:</strong> ${p.especialidades.join(", ")}</p>
    <p>${status}</p>
    <p><strong>Distância:</strong> ${p.distancia.toFixed(2)} km</p>
    <hr/>
  `;
}

function exibirPostos(postos) {
  const distrito = document.getElementById("filtro-distrito").value;
  const bairro = document.getElementById("filtro-bairro").value;
  const espec = document.getElementById("filtro-especialidade").value;

  const filtrados = postos.filter(p =>
    (!distrito || p.distrito_sanitario === distrito) &&
    (!bairro || p.bairro === bairro) &&
    (!espec || p.especialidades.includes(espec))
  );

  marcadores.forEach(m => map.removeLayer(m));
  marcadores = [];

  const container = document.getElementById("postos-container");
  container.innerHTML = "";

  if (filtrados.length === 0) {
    container.innerHTML = "<h2>Resultados da Busca</h2><p>Nenhum posto encontrado com os filtros aplicados.</p>";
    return;
  }

  const titulo = document.createElement("div");
  titulo.innerHTML = `<h2>Resultados da Busca</h2><p><strong>${filtrados.length} posto(s) encontrado(s)</strong></p>`;
  container.appendChild(titulo);

  filtrados.forEach(p => {
    const marker = L.marker([p.latitude, p.longitude]).addTo(map)
      .bindPopup(`<strong>${p.nome_unidade}</strong><br>${p.endereco}`);
    marcadores.push(marker);

    const div = document.createElement("div");
    div.innerHTML = gerarHTMLPosto(p);
    container.appendChild(div);
  });
}

function centralizarMaisProximo(userLoc) {
  if (!todosPostos.length) return;
  const maisProximo = todosPostos
    .filter(p => p.latitude && p.longitude)
    .sort((a, b) => a.distancia - b.distancia)[0];

  map.setView([maisProximo.latitude, maisProximo.longitude], 15);

  const container = document.getElementById("postos-container");
  container.innerHTML = "<h2>Posto mais próximo:</h2>";
  const div = document.createElement("div");
  div.innerHTML = gerarHTMLPosto(maisProximo);
  container.appendChild(div);
}

// Scroll suave ao clicar nos links do menu
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.classList.add('highlight-section');
      setTimeout(() => {
        target.classList.remove('highlight-section');
      }, 1500);
    }
  });
});

document.addEventListener("DOMContentLoaded", initMap);
