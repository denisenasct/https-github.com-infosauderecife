
let mapa = L.map('map').setView([-8.05, -34.9], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

let marcadores = [];

fetch('data/postos_saude_recife_completo.json')
  .then(response => response.json())
  .then(data => {
    window.postos = data;
    preencherFiltros(data);
    exibirPostos(data);
  });

function preencherFiltros(data) {
  const bairros = [...new Set(data.map(p => p.bairro))].sort();
  const especialidades = [...new Set(data.flatMap(p => p.especialidades))].sort();
  const distritos = [...new Set(data.map(p => p.distrito_sanitario))].sort();

  const filtroBairro = document.getElementById("filtro-bairro");
  const filtroEspecialidade = document.getElementById("filtro-especialidade");
  const filtroDistrito = document.getElementById("filtro-distrito");

  filtroBairro.innerHTML = '<option value="">Todos</option>';
  filtroEspecialidade.innerHTML = '<option value="">Todos</option>';
  filtroDistrito.innerHTML = '<option value="">Todos</option>';

  bairros.forEach(b => filtroBairro.innerHTML += `<option value="${b}">${b}</option>`);
  especialidades.forEach(e => filtroEspecialidade.innerHTML += `<option value="${e}">${e}</option>`);
  distritos.forEach(d => filtroDistrito.innerHTML += `<option value="${d}">${d}</option>`);

  filtroBairro.addEventListener('change', aplicarFiltros);
  filtroEspecialidade.addEventListener('change', aplicarFiltros);
  filtroDistrito.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  const bairro = document.getElementById("filtro-bairro").value;
  const especialidade = document.getElementById("filtro-especialidade").value;
  const distrito = document.getElementById("filtro-distrito").value;

  const filtrados = window.postos.filter(p => {
    return (!bairro || p.bairro === bairro) &&
           (!especialidade || p.especialidades.includes(especialidade)) &&
           (!distrito || p.distrito_sanitario === distrito);
  });

  exibirPostos(filtrados);
}

function exibirPostos(postos) {
  marcadores.forEach(m => mapa.removeLayer(m));
  marcadores = [];

  const container = document.getElementById("postos-container");
  container.innerHTML = '<h2>Resultados da Busca</h2>';
  container.innerHTML += `<p>${postos.length} posto(s) encontrado(s)</p>`;

  if (postos.length === 0) {
    container.innerHTML += '<p class="nenhum-posto">Nenhum posto encontrado com os filtros aplicados.</p>';
  }

  postos.forEach(p => {
    const marcador = L.marker([p.latitude, p.longitude])
      .addTo(mapa)
      .bindPopup(`<strong>${p.nome_unidade}</strong><br>${p.endereco}`);
    marcadores.push(marcador);

    const aberto = estaAberto(p.horario_funcionamento);
    const status = aberto ? '<span class="aberto">Aberto agora</span>' : '<span class="fechado">Fechado</span>';

    container.innerHTML += `
      <div class="posto-card">
        <h3>${p.nome_unidade}</h3>
        <p><strong>Endereço:</strong> ${p.endereco}</p>
        <p><strong>Bairro:</strong> ${p.bairro}</p>
        <p><strong>Distrito:</strong> ${p.distrito_sanitario}</p>
        ${status}
      </div>`;
  });
}

function estaAberto(horario) {
  const hora = new Date().getHours();
  const [inicio, fim] = horario.replace("ÀS", "AS").split("AS").map(h => parseInt(h));
  return hora >= inicio && hora < fim;
}

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

document.getElementById("btn-mais-proximo").addEventListener("click", () => {
  if (!navigator.geolocation) return alert("Geolocalização não suportada");

  navigator.geolocation.getCurrentPosition(pos => {
    const usuario = { lat: pos.coords.latitude, lng: pos.coords.longitude };

    L.marker([usuario.lat, usuario.lng])
      .addTo(mapa)
      .bindPopup("Você está aqui")
      .openPopup();

    let maisProximo = window.postos[0];
    let menorDist = calcularDistancia(usuario, {
      lat: maisProximo.latitude,
      lng: maisProximo.longitude
    });

    for (let i = 1; i < window.postos.length; i++) {
      const posto = window.postos[i];
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
