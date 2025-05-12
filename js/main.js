let map;
async function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -8.0476, lng: -34.877 },
    zoom: 12,
  });

  const response = await fetch("https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=54232db8-ed15-4f1f-90b0-2b5a20eef4cf&limit=1000");
  const data = await response.json();
  const postos = data.result.records;

  postos.forEach(posto => {
    if (posto.latitude && posto.longitude) {
      new google.maps.Marker({
        position: { lat: parseFloat(posto.latitude), lng: parseFloat(posto.longitude) },
        map,
        title: posto.nome,
      });
    }
  });
}
