# 🐛 Bug: Geolocalização retorna posição incorreta (mar) ao clicar em “Posto mais próximo”

**Descrição:**
Ao clicar no botão “Posto mais próximo”, o mapa posiciona o marcador do usuário no meio do mar, em vez de usar sua localização real.

**Passos para reproduzir:**
1. Acesse o site: [https://denisenasct.github.io/https-github.com-infosauderecife/](https://denisenasct.github.io/https-github.com-infosauderecife/)
2. Clique no botão “Posto mais próximo”
3. Observe que o marcador aparece em uma posição inválida (ex: no oceano)

**Comportamento esperado:**
O sistema deve obter a localização correta do usuário (com permissão ativada) e centralizar o mapa no posto de saúde mais próximo.

**Comportamento atual:**
O marcador aparece no mar ou em coordenadas inválidas, mesmo com geolocalização ativa no navegador.

**Print do erro:**
![Bug de geolocalização](https://denisenasct.github.io/https-github.com-infosauderecife/img/bug2.JPG)

**Ambiente de teste:**
- Navegador: Chrome 125  
- Sistema: Windows 10  
- Testado em: 02/06/2025  

**Sugestão de correção:**
Adicionar verificação de permissão de geolocalização, usar `try/catch` para tratar falhas, e oferecer uma alternativa manual caso a geolocalização automática falhe.


