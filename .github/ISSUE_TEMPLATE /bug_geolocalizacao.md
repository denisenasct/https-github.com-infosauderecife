# 🐛 Bug: Geolocalização retorna posição incorreta (mar) ao clicar em “Posto mais próximo”

**Descrição:**
Ao clicar no botão “Posto mais próximo”, o mapa posiciona o marcador do usuário no meio do mar, em vez de usar sua localização real.

**Passos para reproduzir:**
1. Acesse: [https://denisenasct.github.io/infosauderecife](https://denisenasct.github.io/infosauderecife)
2. Clique no botão “Posto mais próximo”
3. Veja que o marcador aparece em uma posição inválida (oceano)

**Comportamento esperado:**
O sistema deve obter a localização correta (com permissão) e centralizar o mapa no posto mais próximo real.

**Comportamento atual:**
Marcador aparece no mar ou em coordenadas irreais.

**Imagem do erro:**
![Bug de geolocalização](https://denisenasct.github.io/infosauderecife/img/bug2.JPG)

**Ambiente de teste:**
- Navegador: Chrome 125
- Sistema: Windows 10
- Testado em: 02/06/2025

**Sugestão de correção:**
Adicionar verificação de permissão de localização e fallback de localização manual.
