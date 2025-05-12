let map;

function initMap() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      map = new google.maps.Map(document.getElementById("map"), {
        center: userLocation,
        zoom: 13,
      });

      new google.maps.Marker({
        position: userLocation,
        map,
        title: "Você está aqui!",
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      });

      carregarPostos(userLocation);
    }, () => {
      alert("Permissão de localização negada. Mapa será carregado com foco no Recife.");
      carregarMapaPadrao();
    });
  } else {
    alert("Geolocalização não suportada pelo navegador.");
    carregarMapaPadrao();
  }
}

function carregarMapaPadrao() {
  const defaultLocation = { lat: -8.0476, lng: -34.8770 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 12,
  });
  carregarPostos(defaultLocation);
}

function calcularDistancia(p1, p2) {
  const R = 6371; // km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function carregarPostos(userLocation) {
  try {
    const response = await fetch(
      "https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=d12dd6bd-e0e5-45f5-a3b3-17a0b2e956ba&limit=100"
    );
    const data = await response.json();
    let postos = data.result.records;

    postos = postos
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        ...p,
        distancia: calcularDistancia(userLocation, {
          lat: parseFloat(p.latitude),
          lng: parseFloat(p.longitude),
        }),
      }))
      .sort((a, b) => a.distancia - b.distancia);

    const container = document.getElementById("postos-container");
    container.innerHTML = "";

    postos.forEach(posto => {
      new google.maps.Marker({
        position: {
          lat: parseFloat(posto.latitude),
          lng: parseFloat(posto.longitude),
        },
        map,
        title: posto.nome_unidade,
      });

      const div = document.createElement("div");
      div.innerHTML = `
        <h3>${posto.nome_unidade}</h3>
        <p><strong>Endereço:</strong> ${posto.endereco}</p>
        <p><strong>Bairro:</strong> ${posto.bairro}</p>
        <p><strong>Distrito:</strong> ${posto.distrito_sanitario}</p>
        <p><strong>Telefone:</strong> ${posto.telefone}</p>
        <p><strong>Distância:</strong> ${posto.distancia.toFixed(2)} km</p>
        <hr/>
      `;
      container.appendChild(div);
    });
  } catch (erro) {
    console.error("Erro ao carregar postos:", erro);
  }
}
