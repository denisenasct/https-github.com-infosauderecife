(async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  if (!id) return;

  const response = await fetch("https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=54232db8-ed15-4f1f-90b0-2b5a20eef4cf&limit=1000");
  const data = await response.json();
  const posto = data.result.records.find(p => p._id == id);

  const container = document.getElementById("detalhes-posto");
  if (posto) {
    container.innerHTML = `
      <h2>${posto.nome}</h2>
      <p><strong>Bairro:</strong> ${posto.bairro}</p>
      <p><strong>Distrito Sanitário:</strong> ${posto.distrito_sanitario}</p>
      <p><strong>Especialidades:</strong> ${posto.especialidades}</p>
      <p><strong>Endereço:</strong> ${posto.endereco}</p>
    `;
  } else {
    container.innerHTML = `<p>Posto não encontrado.</p>`;
  }
})();
