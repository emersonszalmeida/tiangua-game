# Editor de pixel art

Editor de pixel art em uma página só (`index.html`), sem instalar nada: é só abrir o arquivo no navegador.
A ideia é ter as ferramentas de objeto do CorelDRAW (selecionar, escalar, girar, achatar, recortar) trabalhando em pixels exatos, sem suavização.

## Ferramentas
- **Selecionar (Q):** clique num objeto para escalar; clique de novo para girar; arraste para mover. Shift mantém a proporção.
- **Forma (F10):** recorta a imagem importada movendo os pontos dos cantos. Shift+clique soma pontos; arrastar vários move todos iguais; Shift ao arrastar trava em linha reta; duplo clique numa aresta cria ponto; Delete apaga ponto.
- Retângulo (R), Elipse (O), Losango 2:1 (D), Linha (L): viram objetos editáveis até clicar em "Rasterizar camada".
- Lápis (B), Borracha (E), Balde (G), Conta-gotas (I), Mover camada (M).
- **P:** centraliza o objeto na página. Ctrl+D duplica. Page Up/Down: frente/trás.
- Clique numa cor: preenche o objeto; botão direito: contorno.
- **Selecionar vários (Q):** arraste um retângulo começando fora dos objetos. Entra tudo o que está dentro dele: imagens e formas inteiras, os pixels dos traços que ficam dentro (a parte de fora do traço fica onde está) e os pixels soltos da camada; a pintura presa a uma imagem que entrou vem junto. Arraste dentro da seleção para mover tudo; setas movem 1 px (Shift = 8); Delete apaga; Esc ou Enter solta. Ctrl+A seleciona tudo o que está na tela.
- **Varinha (W):** clique num pixel e pega todos da mesma cor que se tocam (diagonal também; desmarque "Só os que se tocam" para pegar a cor na camada inteira). Shift soma, Alt tira. Com a seleção, **clique numa cor da paleta**, pegue uma cor da tela com o **conta-gotas (I)** ou com **Ctrl+clique** (sem trocar de ferramenta), mude a Cor 1 ou use o botão "Pintar com a Cor 1" e todos mudam de cor de uma vez; Delete apaga; Esc solta. Vale para os pixels e os traços da camada atual; imagem importada precisa ser unida antes (Ctrl+E).
- **Agrupar (Ctrl+G) / Desagrupar (Ctrl+Shift+G):** com vários itens selecionados, vira um grupo. Clicar em qualquer peça (ou um retângulo que encosta nela) pega o grupo inteiro; Ctrl+clique pega uma peça só. Pixels soltos que estavam na seleção viram um traço para entrar no grupo.
- **Unir em pixels (Ctrl+E):** o que está selecionado vira pixels comuns da camada atual, do jeito que aparece na tela (imagem com opacidade cheia). Depois dá para pegar só uma parte com o retângulo (começando fora do bloco) ou com Marcar pixels (S).
- **Marcar pixels (S):** arraste sobre os pixels que quer pegar (qualquer um, mesmo soltos); Alt ou botão direito tira da marcação.
- **Seleção de pixels** (Selecionar Q ou Marcar S): clique num grupo de pixels ou arraste um retângulo; **Shift soma** à seleção. Com a seleção: arraste para mover; **clique direito durante o arrasto, Alt+arrastar ou Ctrl+D clona** (deixa uma cópia no lugar; no arrasto cada clique direito, com o botão esquerdo apertado, deixa uma cópia onde a seleção está); **H / V espelham**; setas movem 1 px (Shift = 8); Ctrl+C / Ctrl+V **cola onde está o mouse**; Enter solta; Delete apaga. Há botões equivalentes no painel "Seleção de pixels".
- Imagem de referência: importar, colar (Ctrl+V) ou arrastar o arquivo; não entra na exportação.
- Camadas, desfazer/refazer, grade de pixels e grade isométrica 2:1, exportar PNG, salvar/abrir projeto.

## No celular / tablet

- Em tela estreita ou de toque, o painel da direita vira uma gaveta: botão **☰ Painel** (toque no desenho fecha).
- **Um dedo** usa a ferramenta (desenhar, selecionar, arrastar). **Dois dedos**: pinça dá zoom e arrastar move a tela, sem desenhar nada.
- Barra de baixo: **Shift / Ctrl / Alt** ficam ligados até tocar de novo (ex.: Ctrl + toque com a varinha = conta-gotas), e botões para Soltar, Esc, Apagar, Copiar, Colar, Clonar, espelhar, Agrupar, Unir e Ajustar zoom.
- Abrir um projeto do repositório pelo link: `.../editor-pixel/?abrir=../arte_casa/em_andamento/parede.pixel.json`.
- O salvamento automático fica no navegador do aparelho; para levar o trabalho de um aparelho para outro use **Salvar projeto** / **Abrir projeto**.

## Ideias para depois
- Ferramenta Forma nos objetos desenhados (cantos arredondados).
- Seleção de vários: escalar, girar, espelhar e duplicar (Ctrl+D) o conjunto; alinhar e distribuir.
- Inclinar pelas alças do meio; contorno com espessura constante ao achatar.
- Guardar a imagem de referência dentro do projeto.

## Inclinar e espelhar (do manual do TraceDraw)
- Selecionar (Q): clique de novo no objeto para entrar no modo girar. Os cantos giram (Shift = passos de 15°); as setas retas nos lados **inclinam** (o lado oposto fica parado; Shift = pela linha do meio; Ctrl = passos de 15°).
- Botões **Espelhar ↔ / ↕** no painel do objeto inverte só o objeto selecionado.
