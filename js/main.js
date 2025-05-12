let map;
let markers = [];
let todosOsPostos = [];

async function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -8.0476, lng: -34.8770 },
    zoom: 12,
  });

  todosOsPostos = await fetchPostos();
  preencherFiltros(todosOsPostos);
  exibirPostos(todosOsPostos);

  document.getElementById("proximoBtn").addEventListener("click", () => localizarMaisProximo(todosOsPostos));

  document.getElementById("distrito").addEventListener("change", aplicarFiltro);
  document.getElementById("especialidade").addEventListener("change", aplicarFiltro);
}

async function fetchPostos() {
  try {
    const response = await fetch("https://corsproxy.io/?https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=54232db8-ed15-4f1f-90b0-2b5a20eef4cf&limit=1000");
    const data = await response.json();
    return data.result.records.filter(p => p.latitude && p.longitude);
  } catch (error) {
    console.error("Erro ao buscar dados da API:", error);
    return [];
  }
}

function preencherFiltros(postos) {
  const selDistrito = document.getElementById("distrito");
  const selEspecialidade = document.getElementById("especialidade");

  const distritos = [...new Set(postos.map(p => p.distrito_sanitario).filter(Boolean))].sort();

  distritos.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    selDistrito.appendChild(opt);
  });

  // Preenche todas as especialidades inicialmente
  const especialidades = [...new Set(postos.map(p => p.especialidades).filter(Boolean))].sort();
  especialidades.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e;
    opt.textContent = e;
    selEspecialidade.appendChild(opt);
  });
}

function aplicarFiltro() {
  const distritoSelecionado = document.getElementById("distrito").value;
  const especialidadeSelecionada = document.getElementById("especialidade").value;

  const filtrados = todosOsPostos.filter(p =>
    (!distritoSelecionado || p.distrito_sanitario === distritoSelecionado) &&
    (!especialidadeSelecionada || p.especialidades === especialidadeSelecionada)
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
      <p><strong>Bairro:</strong> ${p.bairro || "Não informado"}</p>
      <p><strong>Distrito:</strong> ${p.distrito_sanitario || "Não informado"}</p>
      <p class="status"><i class="fas fa-clock"></i> Horário: ${p.horario || "Indisponível"}</p>
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
    alert("Seu navegador não suporta geolocalização.");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    map.setCenter(userPos);
    map.setZoom(14);
    document.getElementById("notificacao").style.display = "block";

    let menorDist = Infinity;
    let maisProximo = null;

    postos.forEach(p => {
      const dist = getDistancia(userPos, {
        lat: parseFloat(p.latitude),
        lng: parseFloat(p.longitude)
      });

      if (dist < menorDist) {
        menorDist = dist;
        maisProximo = p;
      }
    });

    if (maisProximo) {
      map.setCenter({ lat: parseFloat(maisProximo.latitude), lng: parseFloat(maisProximo.longitude) });
    }
  }, err => {
    alert("Erro ao obter sua localização.");
    console.error(err);
  });
}

function getDistancia(coord1, coord2) {
  const R = 6371;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value) {
  return value * Math.PI / 180;
}
