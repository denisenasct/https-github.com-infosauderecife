let map;
let todosPostos = [];
let marcadorUsuario;

function initMap() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        iniciarMapa(userLocation);
        carregarPostos(userLocation);
      },
      () => {
        const fallback = { lat: -8.0476, lng: -34.8770 };
        iniciarMapa(fallback);
        carregarPostos(fallback);
      }
    );
  } else {
    const fallback = { lat: -8.0476, lng: -34.8770 };
    iniciarMapa(fallback);
    carregarPostos(fallback);
  }
}

function iniciarMapa(loc) {
  map = new google.maps.Map(document.getElementById("map"), {
    center: loc,
    zoom: 13
  });

  marcadorUsuario = new google.maps.Marker({
    position: loc,
    map,
    title: "Você está aqui",
    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
  });

  const btn = document.getElementById("btn-mais-proximo");
  if (btn) {
    btn.addEventListener("click", () => centralizarMaisProximo(loc));
  }
}

function calcularDistancia(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(p1.lat * Math.PI / 180) *
      Math.cos(p2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function carregarPostos(userLoc) {
  try {
    const res = await fetch("data/postos_saude_recife_completo.json");
    const dados = await res.json();

    todosPostos = dados.map(p => ({
      ...p,
      distancia:
        p.latitude && p.longitude
          ? calcularDistancia(userLoc, {
              lat: parseFloat(p.latitude),
              lng: parseFloat(p.longitude)
            })
          : null
    }));

    preencherFiltros(todosPostos);
    exibirPostos(todosPostos, userLoc);
  } catch (e) {
    console.error("Erro ao carregar dados:", e);
  }
}

function preencherFiltros(postos) {
  const distritos = [...new Set(postos.map(p => p.distrito_sanitario).filter(Boolean))].sort();
  const bairros = [...new Set(postos.map(p => p.bairro).filter(Boolean))].sort();
  const especialidades = [
    ...new Set(
      postos.flatMap(p => p.especialidades || []).map(e => e.trim()).filter(Boolean)
    )
  ].sort();

  preencherSelect("filtro-distrito", distritos);
  preencherSelect("filtro-bairro", bairros);
  preencherSelect("filtro-especialidade", especialidades);

  ["filtro-distrito", "filtro-bairro", "filtro-especialidade"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => exibirPostos(todosPostos));
  });
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

function exibirPostos(postos, userLoc = null) {
  const distrito = document.getElementById("filtro-distrito").value;
  const bairro = document.getElementById("filtro-bairro").value;
  const espec = document.getElementById("filtro-especialidade").value;

  const filtrados = postos
    .filter(p => {
      return (
        (!distrito || p.distrito_sanitario === distrito) &&
        (!bairro || p.bairro === bairro) &&
        (!espec || (p.especialidades && p.especialidades.includes(espec)))
      );
    })
    .sort((a, b) => (a.distancia ?? 999) - (b.distancia ?? 999));

  const cont = document.getElementById("postos-container");
  cont.innerHTML = "";

  filtrados.forEach(p => {
    if (p.latitude && p.longitude) {
      const marker = new google.maps.Marker({
        position: { lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) },
        map: map,
        title: p.nome_unidade
      });

      const infowindow = new google.maps.InfoWindow({
        content: `<strong>${p.nome_unidade}</strong><br>${p.endereco}`
      });

      marker.addListener("click", () => {
        infowindow.open(map, marker);
      });
    }

    const div = document.createElement("div");
    div.innerHTML = `
      <h3>${p.nome_unidade}</h3>
      <p><strong>Endereço:</strong> ${p.endereco}</p>
      <p><strong>Bairro:</strong> ${p.bairro}</p>
      <p><strong>Distrito:</strong> ${p.distrito_sanitario}</p>
      <p><strong>Telefone:</strong> ${p.telefone || "Não informado"}</p>
      <p><strong>Horário:</strong> ${p.horario_funcionamento || "Não informado"}</p>
      ${
        p.especialidades?.length
          ? `<p><strong>Especialidades:</strong> ${p.especialidades.join(", ")}</p>`
          : ""
      }
      ${
        p.distancia
          ? `<p><strong>Distância:</strong> ${p.distancia.toFixed(2)} km</p>`
          : ""
      }
      <hr/>
    `;
    cont.appendChild(div);
  });

  if (filtrados.length === 0) {
    cont.innerHTML = "<p>Nenhum posto encontrado com os filtros aplicados.</p>";
  }
}

function centralizarMaisProximo(userLoc) {
  if (todosPostos.length === 0) return;

  const maisProximo = todosPostos
    .filter(p => p.distancia !== null)
    .sort((a, b) => a.distancia - b.distancia)[0];

  if (maisProximo && maisProximo.latitude && maisProximo.longitude) {
    map.setCenter({
      lat: parseFloat(maisProximo.latitude),
      lng: parseFloat(maisProximo.longitude)
    });
    map.setZoom(15);
  }
}
