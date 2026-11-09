# Jogo de clãs de Tianguá — notas para continuar

Última atualização: 2026-11-03 (pasta limpa: só o que o jogo e a conversão usam; o resto está no histórico do git). Este arquivo existe para você (ou o Claude) retomar de outro computador sem perder nada.

## O que é o projeto
Jogo de clãs multiplayer no mapa real do centro de **Tianguá (CE)**. As **praças** são os objetivos.
- Disputa em horário marcado, no modelo dos castelos do *Warspear Online*: 4 portões/ruas de entrada; clãs de fora matam um chefe para ganhar o "passe", entram e destroem um objeto central antes do tempo acabar.
- Quem conquista a praça fica protegido por 4 semanas; uma praça disputada por semana.
- Visual: **pixel art isométrico** (referência faroeste "General Store" e cenas de interior escuras que o dono mostrou).
- Combate/multiplayer ainda não existem. Futuro: servidor de jogo (Colyseus/PartyKit), não só Supabase Realtime.

## Como abrir (não precisa de servidor, dá duplo clique)
| Arquivo | O que mostra |
|---|---|
| `teste_personagem.html` | **O personagem com 8 direções**: WASD/setas, Shift corre, painel com todas as poses (andar, correr, parado), reflexo no chão |
| `tileset.html` | Amostra do tileset (chão, casas, árvore, poste, banco), com o personagem na mesma escala |
| `index.html` | Mapa isométrico de Tianguá jogável **com o personagem principal** (8 direções, Shift corre). Mapa na escala do tileset (losango 128×64 = 3 m, andar ≈ 100 px); zoom só inteiro (1×/2×/3×) |
| `pista.js` | As peças de asfalto em código (`PISTA.T`, `PISTA.tileFor`), usadas por `pista.html` e pelo mapa `index.html` (as ruas do mapa usam esse asfalto, mas desenhadas pixel a pixel a partir do eixo de cada via: `map.js` agora traz `roads` com os segmentos, e `PISTA.roadChunk` faz a borda reta, sem os degraus da grade de 3 m). Grama, praça e prédios ainda seguem a grade |
| `praca.html` | **Praça pequena** (inspirada na Praça do Relógio de Tianguá, desenho próprio; não foi traçada do print do Google): chão pixel a pixel (lajes, calçada, ruas com faixa e faixa de pedestre), espelho d'água quadrado com anéis animados e estátua de bronze sobre pedestal com quedas d'água (`statueSprite`), 4 árvores redondas em canteiros de tijolo (`treeSprite`, `planterSprite`), 4 bancos com encosto, 2 postes, prédios dos lados. Usa `isoBox` (caixa isométrica por pixel) para prédios e torre. Parâmetros: `?x=&y=&z=0|1|2`. Ainda não está no mapa |
| `poste.html` | Dois postes (iluminação e energia) na escala do personagem. Ainda não estão no mapa |
| `arvore_ia.html` | Árvore gerada no Gemini (`arvore_gemini1.jpg`), convertida por `convert_arvore.mjs` em `arvore1.png`. Origem/licença a confirmar. Ainda não está no mapa |
| `pista.html` | **Peças de asfalto que se encaixam** (4 asfaltos lisos, faixa tracejada ↘/↙, óleo, remendo, rachadura) montadas numa rua, com o personagem andando. Cenário claro, sem luz (o dono pediu para tirar a noite e a lanterna) |
| `casa.html` | **Casa em corte, só paredes** (peças: parede ↘/↙, com vão de porta, cortada baixa, pilar). 3 cômodos em 15×12 m; a planta é a lista `PLAN` no código. Colisão e personagem atrás das paredes já funcionam. Referência: a cozinha escura |


## Mapa (OpenStreetMap)
- `osm.json` → `build.mjs` → `map.js` (grade de tiles de 3 m: 0 terra, 1 rua, 3 prédio, 4 grama, 5 praça). Lugares: Praça do Eucalipto, Praça do Fiscal, Igreja Matriz, Praça Jacques Nunes, Praça São Francisco, Igreja N. Sra. Aparecida.
- Crédito obrigatório na tela: **© OpenStreetMap contributors** (ODbL). Overpass exige User-Agent próprio.
- Não usar print do Google Maps/satélite para traçar mapa.

## Personagem (homem de camiseta verde, barba, cabelo castanho)
Sem capa. A "cor do clã" precisa de um lugar no corpo (ainda não definido).

**Andar e correr:** vêm da folha `sheet7.gif` (8 quadros, pixel de 2×2), convertida por `convert7.mjs` → `sprites7.js` (`SPR7`: slots `walkN/NW/W/SW/S` e `runN/NW/W/SW/S`; NE/E/SE são o espelho).

**Parado (5 poses, todas com 55 de altura):** desenhadas/recortadas pelo dono e convertidas:
| Pose | Fonte |
|---|---|
| S | `cut_S.png` → `cutS.json` |
| N | `cut_N2.png` → `cutN.json` |
| E / W | `draw_E.png` → `drawE.json` (olha para a direita = E; W é o espelho) |
| SE / SW | `cut_SE.png` → `cutSE.json` → `cutSW.json` (olha para a direita = SE; SW é o espelho) |
| NW / NE | `draw_NW2.png` (desenho com o miolo vazado) → `nw2_filled.json` (+2 linhas de perna para ficar com 55) |

`make_idles.mjs` junta tudo e grava **`idles.js`** (`IDLES`). Rode `node make_idles.mjs` depois de mexer em qualquer fonte.

## Como converter uma pose nova (o que deu certo)
1. O dono manda um recorte com fundo xadrez (cinza 76/85/160) ou um desenho com contorno.
2. Descobrir o tamanho do pixel: `an14b.mjs` (copie e troque o nome do arquivo) varre tamanho/fase. **O pixel muda a cada recorte** (8,4 a 12,7 px). Se o resultado der metade do esperado, teste o dobro.
3. `conv_cut.mjs <png> <saida.json> <tamanho> <faseX> <faseY> <mapa.json>` amostra as células, junta tons parecidos (granulado) e troca por letras da paleta. Para desenhos que já usam a paleta certa: `conv_pal.mjs` (cor mais próxima) e `fill_hollow.mjs` (preenche miolo vazado).
4. **Cores do cenário não servem** (luz do banheiro deixa tudo avermelhado): mapear por *papel* (camisa→A, cabelo→B, pele→C, calça→D…) para a paleta da folha (`sprites7.js`, campo `pal`). Sapato = K (marrom) com contorno I.
5. Cuidado com imagens **suavizadas/borradas**: convertem mal. Preferir recorte limpo ou desenho.
6. Recortes de perfil e 3/4 olham para a **direita** (E/SE). Os slots W/SW da engine olham para a esquerda, então `make_idles.mjs` espelha.

## Tileset (`tileset.html`)
Losango **128×64** (lado de 3 m, igual ao mapa; personagem 55 px ≈ 1,75 m; parede ≈ 100 px). Paleta do personagem, contorno marrom-escuro (`#362826`), sem preto puro, sem degradê. Fraco ainda: telhado/parede iguais entre as casas, copa da árvore é uma bola só. Faltam: Igreja Matriz com torre do relógio, esquinas/curvas de rua, meio-fio, muros.

## Ferramentas
- `cdpshot.mjs <url> <saida.png> [seg] [largura] [altura]`: tira print com Edge headless (Windows, Edge instalado). **Sempre salvar com nome novo** (o Claude cacheia imagens por nome) e **conferir que não sobrou Edge headless aberto** (acumulados já travaram o PC).
- `pngdec.mjs`, `pngenc.mjs`, `jpgdec.mjs`, `gifdec.mjs`: leitura/escrita de imagens sem dependência pesada. `jpgdec`/`gifdec` precisam de `npm install` (jpeg-js, omggif).

## Preferências do dono (importante)
- Fala português, é experiente. Quer que o Claude **faça** (não mande instruções).
- Fidelidade pixel a pixel ao que ele desenha/escolhe; cores devem seguir a paleta do personagem.
- Quer **ver** antes de aplicar, em página para abrir com duplo clique.
- Não usar PowerShell para o dia a dia (preferir bash); nada de vibração/efeitos exagerados.

## Pendências / próximos passos
1. ~~Colocar o personagem no mapa~~ ✅ feito em 2026-11-01 (código do personagem em `personagem.js`: `PERS.create/step/draw`). Faltam: **cor do clã** (o dono ainda não disse onde no corpo) e decidir a **velocidade** (hoje ~1,7 m/s andando, igual ao teste, para o pé não deslizar; atravessar o centro demora).
2. **Cenário peça por peça, no estilo das referências, mas claro** (o dono prefere sem luz por enquanto): já feitos a pista (`pista.html`) e as paredes da casa (`casa.html`). Próximo: o que o dono escolher, por exemplo piso, portas, janelas e móveis da casa, ou cones e caixas na pista. Ainda nada disso está no mapa (`index.html`). Não copiar objetos das referências, só o estilo.
3. Tileset completo para o mapa de Tianguá (ver "Fraco ainda" acima); perguntar se o dono prefere gerar peças-chave (igreja, casa típica) na IA e converter.
4. Decidir **estilo** (faroeste × atual) e como preencher os quarteirões vazios do mapa (casas genéricas, mato ou vazio).
5. Marcar as praças como objetivos; depois segundo jogador (multiplayer).

## Atenção: origem das imagens
`sheet7.gif` (e as poses derivadas) vieram de material enviado pelo dono, de **origem/licença desconhecida**. Servem como teste. Para o jogo final, usar personagem próprio ou com licença comercial (a conversão é a mesma).


## Terreno novo (grama baixa + terra) — estado em 2026-11-06, para retomar de outro computador
**Onde abrir:** `chao.html` (Editor da cabana). Duplo clique, sem servidor. Paleta só com **Grama** e **Terra** (teclas 1 e 2) + árvores; mapa 24×24 começa limpo, personagem no centro. Salvo no navegador com a chave `cabana_mapa_v2` (os materiais antigos — grama, terra, floresta, lama, cascalho, madeira — estão escondidos da paleta, mas continuam no código; o mapa antigo foi ignorado).
- **Pintar:** clicar/arrastar. Pincel 1×1, 2×2 ou 3×3. **Shift + arrastar** = linha reta de células ao longo dos eixos da grade (as diagonais da tela). Botão direito apaga objeto. T = grade, E = esconde o painel.
- **Como o terreno funciona (`terreno_motor.js`, `terreno_dados.js`, pasta `terreno/`):** a terra fica numa camada de baixo (9 azulejos `terreno/terra_i_j.png`, escolhidos por posição mod 3, a textura repete a cada 3 células) e por cima vai só a grama (camada com transparência). A borda é **calculada no navegador** a partir dos vizinhos 5×5: terra ocupa a célula inteira, cantos arredondados por fora e por dentro (raio 0,46 de célula; 0,5 faz a trilha de 1 célula sumir), serrilhado fino (wobble .035), tufos de grama e faixa de sombra. Trilha de 1 célula, curva, ponta e ilha funcionam. Vizinho de outro material = borda reta.
- **Removido a pedido do dono:** caminho contínuo nas diagonais (N/S/E/W) e o recorte de grama sobre ele. Motivo: não vira tileset exportável (só células). Se o jogo precisar de PNGs fixos, a ideia é a "grade deslocada" com 6 desenhos (vazio, 1 canto, 2 cantos lado a lado, 2 em diagonal, 3 cantos, cheio) — não feito.
- **Exemplo pronto:** `chao.html?demot&x=12&y=13` (trilhas, ilhas, mancha). `teste_terreno.html` é a versão separada mais simples (só grama/terra).
- **Arte aprovada pelo dono:** `arte_terreno/` (bloco de terra 3×3 que encaixa, grama baixa 128×64, 9 azulejos de terra, comparações). Textura da terra aprovada = a "mais salpicada e uniforme", `teste_encaixe_blocos_2x2.png`.
- **Os scripts que geraram a arte (Node, na pasta temporária) se perderam;** os PNGs finais estão salvos. Método: ruído de valor periódico (rede em torno de 3 células), limiares por percentil (4/14/50 %), abertura morfológica para tirar fragmentos finos, 6 tons de `#745843` a `#9e7c57`.
- **Pendente:** grama baixa que emenda sem linha (mesmo método da terra); peças PNG fixas (grade deslocada); transição com os materiais antigos (hoje borda reta); o dono ainda não testou arrastar com o mouse no último ajuste.
- **Outros projetos salvos aqui por segurança:** `editor-pixel/` (editor de pixel art no estilo CorelDRAW, arquivo único). O fork `tracedraw-pixel` está no GitHub (repo privado `emersonszalmeida/tracedraw-pixel`, compila só pelo GitHub Actions).

## Decorações de chão — 2026-11-09
- 32 decorações em **pixel art feita por código** (grama alta ×4, flores ×8, pedras ×6, cogumelos ×10, folhas/galho/trevo ×4). Não são recortes do Gemini: a folha do Gemini serviu só de referência de desenho.
- Gerador: `gerar_decoracao.mjs` (`node gerar_decoracao.mjs`) → `decoracao/*.png` + `decoracao/_conferencia.png`. Paleta no topo do arquivo (`P`). Para mudar um desenho, edite o gerador e rode de novo.
- No `chao.html`: seção "Decorações" no painel; cada uma ocupa uma célula (centro), desenhada em 2× o pixel como o personagem e as árvores.
- Pendentes: pincel de espalhar (flores/grama alta aleatórias), recolorir árvores para a paleta nova, decorações sobre terra (hoje ficam bem só na grama).
- **Versão em uso (decoracao/)**: a folha do Gemini (`arte_terreno/decoracoes_gemini_ref.png`) convertida por `decoracao_do_gemini.mjs` (`node decoracao_do_gemini.mjs [fator=0.2] [cores=14]`): recorta, tira fundo/franja, reduz, trava paleta por item, pixel duro. Foi a que o dono preferiu.
- A versão desenhada por código ficou guardada em `decoracao_codigo/` (gerada por `gerar_decoracao.mjs`; ele grava em `decoracao/`, então copie para `decoracao_codigo/` antes de rodar se quiser preservar).
- Escala das decorações no editor: desenhadas em **1×** (metade do pixel do personagem/árvores, que usam 2×), `ESC` em `desenhaObj` do `chao.html`. Testei reduzir o fator de redução em vez disso, mas as imagens ficaram borradas; 1× mantém o detalhe e dá proporção natural com o personagem. Para mudar o tamanho geral: `ESC` em `desenhaObj`.
