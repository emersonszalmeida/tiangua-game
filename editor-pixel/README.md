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
- **Marcar pixels (S):** arraste sobre os pixels que quer pegar (qualquer um, mesmo soltos); Alt ou botão direito tira da marcação.
- **Seleção de pixels** (Selecionar Q ou Marcar S): clique num grupo de pixels ou arraste um retângulo; **Shift soma** à seleção. Com a seleção: arraste para mover; **Alt+arrastar ou Ctrl+D clona** (deixa uma cópia no lugar); **H / V espelham**; setas movem 1 px (Shift = 8); Ctrl+C / Ctrl+V **cola onde está o mouse**; Enter solta; Delete apaga. Há botões equivalentes no painel "Seleção de pixels".
- Imagem de referência: importar, colar (Ctrl+V) ou arrastar o arquivo; não entra na exportação.
- Camadas, desfazer/refazer, grade de pixels e grade isométrica 2:1, exportar PNG, salvar/abrir projeto.

## Ideias para depois
- Ferramenta Forma nos objetos desenhados (cantos arredondados).
- Selecionar vários objetos, alinhar e distribuir, agrupar.
- Inclinar pelas alças do meio; contorno com espessura constante ao achatar.
- Guardar a imagem de referência dentro do projeto.

## Inclinar e espelhar (do manual do TraceDraw)
- Selecionar (Q): clique de novo no objeto para entrar no modo girar. Os cantos giram (Shift = passos de 15°); as setas retas nos lados **inclinam** (o lado oposto fica parado; Shift = pela linha do meio; Ctrl = passos de 15°).
- Botões **Espelhar ↔ / ↕** no painel do objeto inverte só o objeto selecionado.
