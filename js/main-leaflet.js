let mapa;
let marcadores = [];
let postos = [];

async function carregarPostos() {
  try {
    const resposta = await fetch("data/postos_saude_recife_completo.json");
    postos = await resposta.json();
    inicializarMapa();
    preencherFiltros();
    exibirPostos(postos);
  } catch (erro) {
    console.error("Erro ao carregar JSON:", erro);
  }
}

function inicializarMapa() {
  mapa = L.map("map").setView([-8.0476, -34.877], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Map data © OpenStreetMap contributors"
  }).addTo(mapa);
}

function adicionarMarcador(posto) {
  const marcador = L.marker([posto.latitude, posto.longitude]).addTo(mapa);
  marcador.bindPopup(`<strong>${posto.nome_unidade}</strong><br>${posto.endereco}`);
  marcadores.push(marcador);
}

function limparMarcadores() {
  marcadores.forEach((m) => mapa.removeLayer(m));
  marcadores = [];
}

function exibirPostos(lista) {
  limparMarcadores();
  const container = document.getElementById("postos-container");
  container.innerHTML = "<h2>Resultados da Busca</h2>";
  if (lista.length === 0) {
    container.innerHTML += "<p>Nenhum posto encontrado com os filtros aplicados.</p>";
    return;
  }

  container.innerHTML += `<p>${lista.length} posto(s) encontrado(s)</p>`;

  lista.forEach((posto) => {
    adicionarMarcador(posto);
    const status = verificarAberto(posto.horario_funcionamento);
    const selo = status ? '<span class="status-aberto">Aberto agora</span>' : '<span class="status-fechado">Fechado</span>';
    container.innerHTML += `
      <div class="posto">
        <h3>${posto.nome_unidade}</h3>
        <p><strong>Endereço:</strong> ${posto.endereco}</p>
        <p><strong>Bairro:</strong> ${posto.bairro}</p>
        <p><strong>Distrito:</strong> ${posto.distrito_sanitario}</p>
        <p>${selo}</p>
      </div>
    `;
  });
}

function verificarAberto(horario) {
  const agora = new Date();
  const horaAtual = agora.getHours();
  const match = horario.match(/(\d{2}):(\d{2})\s*ÀS\s*(\d{2}):(\d{2})/);
  if (!match) return false;

  const [_, h1, m1, h2, m2] = match.map(Number);
  const inicio = h1 + m1 / 60;
  const fim = h2 + m2 / 60;
  return horaAtual >= inicio && horaAtual < fim;
}

function preencherFiltros() {
  const distritos = [...new Set(postos.map(p => p.distrito_sanitario))].sort();
  const bairros = [...new Set(postos.map(p => p.bairro))].sort();
  const especialidades = [...new Set(postos.flatMap(p => p.especialidades))].sort();

  preencherSelect("filtro-distrito", distritos, "Todos os distritos");
  preencherSelect("filtro-bairro", bairros, "Todos os bairros");
  preencherSelect("filtro-especialidade", especialidades, "Todas as especialidades");

  document.getElementById("filtro-distrito").addEventListener("change", aplicarFiltros);
  document.getElementById("filtro-bairro").addEventListener("change", aplicarFiltros);
  document.getElementById("filtro-especialidade").addEventListener("change", aplicarFiltros);
}

function preencherSelect(id, lista, padrao) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="">${padrao}</option>`;
  lista.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

function aplicarFiltros() {
  const d = document.getElementById("filtro-distrito").value;
  const b = document.getElementById("filtro-bairro").value;
  const e = document.getElementById("filtro-especialidade").value;

  const filtrados = postos.filter(p =>
    (d === "" || p.distrito_sanitario === d) &&
    (b === "" || p.bairro === b) &&
    (e === "" || p.especialidades.includes(e))
  );

  exibirPostos(filtrados);
}

function calcularDistancia(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function exibirPostoMaisProximo(posto) {
  const container = document.getElementById("postos-container");
  const status = verificarAberto(posto.horario_funcionamento);
  const selo = status ? '<span class="status-aberto">Aberto agora</span>' : '<span class="status-fechado">Fechado</span>';
  container.innerHTML = `
    <h2>Posto mais próximo</h2>
    <div class="posto">
      <h3>${posto.nome_unidade}</h3>
      <p><strong>Endereço:</strong> ${posto.endereco}</p>
      <p><strong>Bairro:</strong> ${posto.bairro}</p>
      <p><strong>Distrito:</strong> ${posto.distrito_sanitario}</p>
      <p>${selo}</p>
    </div>
  `;
}

document.getElementById("btn-mais-proximo").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocalização não é suportada.");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const usuario = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };

    let maisProximo = postos[0];
    let menorDist = calcularDistancia(usuario, {
      lat: postos[0].latitude,
      lng: postos[0].longitude
    });

    for (let i = 1; i < postos.length; i++) {
      const dist = calcularDistancia(usuario, {
        lat: postos[i].latitude,
        lng: postos[i].longitude
      });

      if (dist < menorDist) {
        menorDist = dist;
        maisProximo = postos[i];
      }
    }

    mapa.setView([maisProximo.latitude, maisProximo.longitude], 15);
    exibirPostoMaisProximo(maisProximo);
  });
});

carregarPostos();
