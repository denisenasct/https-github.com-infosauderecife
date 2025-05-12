
// js/main.js atualizado com filtro por bairro, distrito, especialidade e localização atual

let map;
let markers = [];
let todosOsPostos = [];

async function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -8.0476, lng: -34.877 },
    zoom: 12,
  });

  todosOsPostos = await fetchPostos();
  preencherFiltros(todosOsPostos);
  exibirPostos(todosOsPostos);

  document.getElementById("bairro").addEventListener("change", aplicarFiltro);
  document.getElementById("distrito").addEventListener("change", aplicarFiltro);
  document.getElementById("especialidade").addEventListener("change", aplicarFiltro);
  document.getElementById("proximoBtn").addEventListener("click", () => localizarMaisProximo(todosOsPostos));
}

async function fetchPostos() {
  try {
    const url = "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=54232db8-ed15-4f1f-90b0-2b5a20eef4cf&limit=1000");
    const response = await fetch(url);
    const data = await response.json();
    return data.result.records.filter(p => p.latitude && p.longitude);
  } catch (err) {
    alert("Erro ao buscar dados da Prefeitura.");
    return [];
  }
}

function preencherFiltros(postos) {
  const bairroSel = document.getElementById("bairro");
  const distritoSel = document.getElementById("distrito");
  const espSel = document.getElementById("especialidade");

  const bairros = [...new Set(postos.map(p => p.bairro).filter(Boolean))].sort();
  const distritos = [...new Set(postos.map(p => p.distrito_sanitario).filter(Boolean))].sort();
  const especialidades = [...new Set(postos.map(p => p.especialidades).filter(Boolean))].sort();

  bairros.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b;
    bairroSel.appendChild(opt);
  });

  distritos.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    distritoSel.appendChild(opt);
  });

  especialidades.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e;
    opt.textContent = e;
    espSel.appendChild(opt);
  });
}

function aplicarFiltro() {
  const bairro = document.getElementById("bairro").value;
  const distrito = document.getElementById("distrito").value;
  const especialidade = document.getElementById("especialidade").value;

  const filtrados = todosOsPostos.filter(p =>
    (!bairro || p.bairro === bairro) &&
    (!distrito || p.distrito_sanitario === distrito) &&
    (!especialidade || p.especialidades === especialidade)
  );

  exibirPostos(filtrados);
}

function exibirPostos(postos) {
  const container = document.getElementById("resultado-postos");
  container.innerHTML = "";
  markers.forEach(m => m.setMap(null));
  markers = [];

  postos.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h4>${p.nome}</h4>
      <p><strong>Endereço:</strong> ${p.endereco || "Não informado"}</p>
      <p><strong>Bairro:</strong> ${p.bairro || "Não informado"}</p>
      <p><strong>Distrito:</strong> ${p.distrito_sanitario || "Não informado"}</p>
      <p><strong>Especialidades:</strong> ${p.especialidades || "Indisponível"}</p>
      <p><strong>Horário:</strong> ${p.horario || "Indisponível"}</p>
    `;
    container.appendChild(card);

    const marker = new google.maps.Marker({
      position: { lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) },
      map,
      title: p.nome,
    });
    markers.push(marker);
  });

  document.getElementById("total-postos").textContent = `${postos.length} postos encontrados`;
}

function localizarMaisProximo(postos) {
  if (!navigator.geolocation) {
    alert("Seu navegador não permite geolocalização.");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    map.setCenter(userPos);
    map.setZoom(14);
    document.getElementById("notificacao").style.display = "block";

    const proximos = postos
      .map(p => ({
        ...p,
        distancia: getDistancia(userPos, { lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) })
      }))
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 10); // mostra os 10 mais próximos

    exibirPostos(proximos);
  });
}

function getDistancia(coord1, coord2) {
  const R = 6371;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(val) {
  return val * Math.PI / 180;
}
