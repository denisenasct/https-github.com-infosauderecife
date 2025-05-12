let mapa;
let marcadores = [];
let postos = [];

function initMap() {
  mapa = L.map("map").setView([-8.0476, -34.8770], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(mapa);

  localizarUsuario();
  carregarPostos();
}

function localizarUsuario() {
  if (!navigator.geolocation) {
    alert("Geolocalização não é suportada pelo navegador.");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    mapa.setView([latitude, longitude], 15);

    L.marker([latitude, longitude])
      .addTo(mapa)
      .bindPopup("<strong>Você está aqui</strong>")
      .openPopup();

    const statusDiv = document.getElementById("map-status");
    if (statusDiv) {
      statusDiv.innerHTML = `<div class="localizacao-obtida">
        <strong>Localização obtida</strong><br/>
        Encontraremos os postos mais próximos de você.
      </div>`;
    }
  });
}

function carregarPostos() {
  fetch("data/postos_saude_recife_completo.json")
    .then(response => response.json())
    .then(data => {
      postos = data;
      preencherFiltros();
      exibirPostos(data);
    });
}

function preencherFiltros() {
  const distritos = [...new Set(postos.map(p => p.distrito_sanitario))].sort();
  const bairros = [...new Set(postos.map(p => p.bairro))].sort();
  const especialidades = [...new Set(postos.flatMap(p => p.especialidades))].sort();

  preencherSelect("filtro-distrito", distritos);
  preencherSelect("filtro-bairro", bairros);
  preencherSelect("filtro-especialidade", especialidades);

  document.getElementById("filtro-distrito").addEventListener("change", aplicarFiltros);
  document.getElementById("filtro-bairro").addEventListener("change", aplicarFiltros);
  document.getElementById("filtro-especialidade").addEventListener("change", aplicarFiltros);
}

function preencherSelect(id, lista) {
  const select = document.getElementById(id);
  select.innerHTML = '<option value="">Todos</option>';
  lista.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
}

function aplicarFiltros() {
  const distrito = document.getElementById("filtro-distrito").value;
  const bairro = document.getElementById("filtro-bairro").value;
  const especialidade = document.getElementById("filtro-especialidade").value;

  const filtrados = postos.filter(p => {
    return (!distrito || p.distrito_sanitario === distrito) &&
           (!bairro || p.bairro === bairro) &&
           (!especialidade || p.especialidades.includes(especialidade));
  });

  exibirPostos(filtrados);
}

function exibirPostos(lista) {
  marcadores.forEach(m => mapa.removeLayer(m));
  marcadores = [];

  const container = document.getElementById("postos-container");
  container.innerHTML = `<h2>Resultados da Busca</h2><p>${lista.length} posto(s) encontrado(s)</p>`;

  if (lista.length === 0) {
    container.innerHTML += '<p>Nenhum posto encontrado com os filtros aplicados.</p>';
    return;
  }

  lista.forEach(posto => {
    const marcador = L.marker([posto.latitude, posto.longitude])
      .addTo(mapa)
      .bindPopup(`<strong>${posto.nome_unidade}</strong><br>${posto.endereco}`);
    marcadores.push(marcador);

    container.innerHTML += `
      <div class="posto">
        <h3>${posto.nome_unidade}</h3>
        <p><strong>Endereço:</strong> ${posto.endereco}</p>
        <p><strong>Bairro:</strong> ${posto.bairro}</p>
        <p><strong>Distrito:</strong> ${posto.distrito_sanitario}</p>
      </div>`;
  });
}

document.getElementById("btn-mais-proximo").addEventListener("click", () => {
  if (!navigator.geolocation) return alert("Geolocalização não suportada");

  navigator.geolocation.getCurrentPosition(pos => {
    const usuario = { lat: pos.coords.latitude, lng: pos.coords.longitude };

    let maisProximo = postos[0];
    let menorDist = calcularDistancia(usuario, {
      lat: maisProximo.latitude,
      lng: maisProximo.longitude
    });

    for (let i = 1; i < postos.length; i++) {
      const posto = postos[i];
      const dist = calcularDistancia(usuario, {
        lat: posto.latitude,
        lng: posto.longitude
      });
      if (dist < menorDist) {
        menorDist = dist;
        maisProximo = posto;
      }
    }

    mapa.setView([maisProximo.latitude, maisProximo.longitude], 15);
    L.marker([maisProximo.latitude, maisProximo.longitude])
      .addTo(mapa)
      .bindPopup(`<strong>${maisProximo.nome_unidade}</strong><br>${maisProximo.endereco}`)
      .openPopup();

    exibirPostos([maisProximo]);
  });
});

function calcularDistancia(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const aCalc = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
  return R * c;
}

window.onload = initMap;
