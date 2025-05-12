let postosFiltrados = [];

async function carregarFiltros() {
  const response = await fetch("https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=54232db8-ed15-4f1f-90b0-2b5a20eef4cf&limit=1000");
  const data = await response.json();
  const postos = data.result.records;

  const bairros = [...new Set(postos.map(p => p.bairro).filter(Boolean))].sort();
  const distritos = [...new Set(postos.map(p => p.distrito_sanitario).filter(Boolean))].sort();
  const especialidades = [...new Set(postos.map(p => p.especialidades).filter(Boolean))].sort();

  preencherSelect("bairro", bairros);
  preencherSelect("distrito", distritos);
  preencherSelect("especialidade", especialidades);

  postosFiltrados = postos;
}

function preencherSelect(id, valores) {
  const select = document.getElementById(id);
  valores.forEach(valor => {
    const opt = document.createElement("option");
    opt.value = valor;
    opt.textContent = valor;
    select.appendChild(opt);
  });
}

function filtrarPostos() {
  const bairro = document.getElementById("bairro").value;
  const distrito = document.getElementById("distrito").value;
  const especialidade = document.getElementById("especialidade").value;

  const resultados = postosFiltrados.filter(p => {
    return (!bairro || p.bairro === bairro) &&
           (!distrito || p.distrito_sanitario === distrito) &&
           (!especialidade || p.especialidades === especialidade);
  });

  const container = document.getElementById("resultado-postos");
  container.innerHTML = "";
  resultados.forEach(p => {
    const div = document.createElement("div");
    div.innerHTML = `<a href="detalhes.html?id=${p._id}">${p.nome}</a>`;
    container.appendChild(div);
  });
}

carregarFiltros();
