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
- Decorações são **livres no mapa**: guardadas como `{x, y, id, f:1}` com x,y fracionários (várias por célula), não bloqueiam o personagem; arrastar espalha (espaço mínimo 0,5 célula); botão direito apaga a mais próxima (raio 0,5). Árvores continuam uma por célula, e bloqueiam. Mapas antigos com decorações em célula inteira são recentralizados ao abrir.
- Decorações ocupam só os **pixels desenhados**: apagar = botão direito sobre um pixel visível (a de cima, com 1 px de tolerância); espalhar ao arrastar só coloca se os pixels não encostarem em outra decoração (clique simples sempre coloca). As imagens ficam embutidas em `decoracao_dados.js` (gerado por `decoracao_do_gemini.mjs`), pois o file:// bloqueia ler pixels de PNG solto. Depois de regerar as decorações, o `decoracao_dados.js` é refeito junto.
- Verdes das decorações: `esverdeia()` em `decoracao_do_gemini.mjs` mantém só o brilho e repinta tudo que é verde com a rampa do chão (#3f4e30 … #6c7f50 #7a8e5a #849766 … #98ab78). Para o verde ficar mais claro/escuro ou mais perto do chão, mexa em `RAMPA` e no divisor `110` (faixa de brilho).
- Grama média/baixa (`grama_media_1..3`, `grama_baixa_1..2`): derivadas dos tufos altos por `decoracao_do_gemini.mjs` (passo 3b: só a parte de baixo, corte irregular; fração de altura na lista). As altas continuam no painel para usos pontuais (ex.: beira de mata). As entradas `grama_media/baixa` do `gerar_decoracao.mjs` (feitas por código) ficaram sem uso.
- Correção (2026-11-09): "Grama média 3" apagada; as **baixas** agora são os tufos altos achatados na vertical (modo `'achata'` no passo 3b), não cortados, para as pontas não ficarem numa linha reta. Médias 1 e 2 continuam por corte.

## Árvores novas — 2026-11-09
- Folha do Gemini em `arte_terreno/arvores_gemini_ref.png` → `node arvores_do_gemini.mjs [multiplicador=1] [cores=22]` → `arvore/*.png`, `arvore/_conferencia.png` e `arvore_dados.js` (imagens embutidas + ponto de apoio do tronco `cx`/`by`).
- 5 árvores (Carvalho, Árvore torta, Pinheiro, Árvore fina, Árvore seca) entram em **Objetos**: uma por célula, bloqueiam, desenhadas em 2× (como as antigas). 10 itens (arbusto, arbusto com flores, samambaia, toco, tronco caído, e a 2ª versão de cada) entram em **Decorações**: posição livre, não bloqueiam, 1×.
- Verde ajustado à rampa do chão (`esverdeia`, igual às decorações). Tamanhos por item na lista `ITENS` (fator .45 árvores, .4 o resto); o multiplicador do script muda tudo de uma vez.
- Árvores antigas (arvore_v*.png, arvore_pl0.png) continuam no painel; apagar quando o dono decidir.
- Limpeza do cinza preso nas copas: só na Árvore torta e na Árvore fina (variável `LIMPA` em `arvores_do_gemini.mjs`: a = nenhuma, c = só cinza liso claro [padrão], b = também quase-cinza). O Carvalho e as outras peças não passam por essa limpeza extra (os tons claros da copa são folha).
- Árvores (5 grandes): 56 cores por peça (`CORES_ARVORE`, antes 22: o tronco ficava em degraus) e **contorno de 1 px** em tom escuro (42%) da cor do pixel vizinho. `CONTORNO=0 node arvores_do_gemini.mjs` desliga; o 0.42 está no passo do contorno. Arbustos/toco/tronco ainda sem contorno.
- Contorno das árvores trocado por **sobretom** (padrão `CONTORNO=tom`): o pixel de borda vira um tom mais escuro da própria cor (fator `SOBRETOM`=.76; embaixo/à direita um pouco mais escuro), sem aumentar a peça. `CONTORNO=fora` volta à linha escura externa de 1 px; `CONTORNO=0` desliga. Ex.: `SOBRETOM=0.65 node arvores_do_gemini.mjs` (mais forte).
- Sobretom corrigido: o tom escuro da borda é calculado direto da cor do pixel (não buscado na paleta), porque o verde escuro achava um marrom como "mais próximo" e aparecia ponto marrom na borda da copa.
- **Escala dos pixels**: o personagem (`PERS.draw`) e o chão são desenhados em 1× (1 px da imagem = 1 px do mundo). As árvores antigas (128 px) eram desenhadas em 2× (pixel dobrado). As 5 árvores novas agora são geradas com o dobro da resolução (fator .9) e desenhadas em **1×** (`esc:1` em `arvore_dados.js`, lido por `desenhaObj`): mesmo tamanho na tela, pixel igual ao do personagem. Sobretom suavizado para `SOBRETOM=.87`. As árvores antigas continuam em 2×.
- Com as árvores em 1× (2× a resolução) voltaram o cinza e os pontos marrons na copa. Correção em `arvores_do_gemini.mjs`: (1) franja cinza-clara de borda (`sat<34`, brilho>150) é descascada em 2 passadas antes da paleta; (2) no sobretom, pixel de borda cercado de verde (5x5: ≥5 verdes e mais que o dobro dos não-verdes) herda a média dos verdes vizinhos × fator, nunca marrom/cinza; no tronco usa a própria cor.
- Árvores sem sobretom/contorno por padrão (`CONTORNO=0`): o arbusto, sem borda alguma, encaixa melhor no chão. `CONTORNO=tom` volta o sobretom (código mantido). Novos tratamentos em `arvores_do_gemini.mjs`: (a) mancha verde pequena cercada de marrom (musgo do tronco da Árvore torta) vira marrom de tronco mantendo o brilho; (b) pixel claro sem cor no meio da folhagem vira verde-claro de folha.
- **Cores das árvores = cores do cenário**: em `arvores_do_gemini.mjs`, cada árvore é recolorida por casamento de histograma de brilho com o arbusto (verdes) e o toco/tronco (marrons): ordem de claro/escuro mantida, tons passam a ser os já aprovados. Os 12% mais claros do verde do arbusto são cortados (`CLARO_MAX`=.88) para a copa ficar mais escura que o chão. Cada árvore é casada sozinha (juntas, a Árvore torta de folha clara virava cor de chão). `CORES_DO_CENARIO=0` desliga. Se mudar a cor do arbusto/toco, as árvores acompanham ao regerar.
- Limpeza das bordas das árvores, conferida sobre fundo azul (`inspeciona.mjs` marcava pixels suspeitos): pixel não-verde cercado de verde vira folha ANTES do casamento de cores (senão ia para os marrons do toco = pontinhos marrons/laranja na copa); tocos marrons ≤14 px colados na folhagem saem; pontas de 1–3 px recoloridas/removidas. Ver passos "pixel que não é verde mas está cercado de verde" e "tocos marrons minúsculos" em `arvores_do_gemini.mjs`.

## Edição manual das árvores no editor-pixel — 2026-11-09
Fluxo: `node arvores_para_editar.mjs` → `Downloads/arvores_para_editar.png` (900x309, 15 peças, cada uma num quadro com 12 px de margem) → abrir no editor-pixel (`C:\Users\emerson.souza.DIAMANTES\editor-pixel\index.html`, botão "Abrir PNG"; seletor "Fundo: azul vivo" só para ver) → editar à mão → "Exportar PNG" (`desenho.png` em Downloads) → `node arvores_aplicar_edicoes.mjs <png exportado>`.
- Só as peças que mudaram viram `arvore_editadas/<nome>.png`; o gerador (`arvores_do_gemini.mjs`) passa a respeitá-las (não reprocessa) e recalcula o ponto de apoio. Peça editada fica "congelada": mudanças futuras no gerador (cor, escala) não a alcançam; para voltar ao automático, apague o `arvore_editadas/<nome>.png` e rode o gerador.
- Não usar "Novo…" nem "Tamanho da tela…" no editor (a folha precisa manter 900x309). Dá para desenhar até 12 px além da peça. Só cores opacas (alpha é arredondado para 0/255).
- Testado: folha sem mexer = nada muda; edição simulada (3x3 vermelho + 1 pixel na margem) voltou ao jogo; teste desfeito.

## O que o gerador aprendeu com a edição do dono — 2026-11-09 (1ª rodada, `desenho.png`)
Comparação folha original x exportada (pixel a pixel): 822 pixels removidos, 14 acrescentados, 2057 recoloridos, só em 5 árvores. **Arbustos, samambaias, tocos e troncos caídos: nenhuma mudança (aprovados como estavam). Copa/folhagem: nenhuma mudança (bordas e verdes aprovados).** Tudo foi na madeira:
1. **Borda de tronco/galho**: o dono tirou a franja clara de 1 px (pixel de borda mais claro que o interior; 29% dos pixels de borda de madeira) e deixou/refez o resto como um contorno marrom contínuo, nunca mais claro que o interior. Medido: desvio do brilho da borda caiu de ~.12 para ~.05 e o p90 de +.2 para ~+.02. → implementado em `arvores_do_gemini.mjs` (regras `FRANJA_MADEIRA`): tira o pixel de borda de madeira com ΔBrilho > +.12 (5x5) e > +.08 (3x3) [precisão 78%, pega ~51–59% do que ele tira] e escurece o que sobra se ΔBrilho > +.02 até (interior − .01). Resultado do gerador sozinho: percentis do brilho de borda quase iguais aos do dono.
2. **Tronco do pinheiro**: escurecido (RGB médio 108,93,69 → 106,80,63) = tronco na sombra da copa. Cores novas, escolhidas por ele. Não automatizado (só o pinheiro; carvalho/torta não foram escurecidos).
3. **Interior do tronco do carvalho** (~1100 px recoloridos, 89% com cores que já existiam na peça): ajuste fino de casca; não deu para extrair regra. É onde a mão dele mais agrega.
Limite honesto: uma regra de 1–2 variáveis explica ~70% (F1) das remoções; o resto é julgamento pixel a pixel. `FRANJA_MADEIRA=0` desliga; `EDIT_DIR=<pasta inexistente>` roda o gerador ignorando as peças editadas (para testar).
Próxima rodada: pedir para ele olhar/editar só madeira (copas e arbustos já passam); comparar de novo e refinar as regras.

## Tileset da cabana (peças modulares) — rodada 1, 2026-11-09
Estilo: cabana de toras escuras com telhado verde (referência do dono). Peças modulares + telhado que some com o personagem dentro.
- Folha do Gemini (rodada 1): `arte_casa/pecas_gemini_rodada1.png`. Veio com DOIS conjuntos (parede ↙, parede ↘, canto + 4 pisos); o dono mandou usar o **de baixo** (6 toras; o de cima tem canto com topo estranho). `SET=1 node casa_do_gemini.mjs` volta ao de cima.
- `node casa_do_gemini.mjs` → `arte_casa/pecas/*.png` + `arte_casa/pecas.json`. Escala folha→jogo = 128/largura do piso (0,561). Parede = 1 aresta do losango (64 px de largura, ~83 px de altura vertical); o pedaço sai do meio da parede do Gemini (a ponta com toras redondas fica de fora). Inclinação corrigida para 2:1 (`cisalha`). Canto: 2 camadas cortadas (25 linhas) para não passar 35 px acima da parede. Pisos: só a face de cima, esticada para 128×64.
- `casa_pecas.html?z=2`: sala de teste (3×2 células) com o personagem. Pontos de apoio: parede ↙ (`parede_sw`) base-esquerda no vértice esquerdo da célula (aresta NW); parede ↘ (`parede_se`) base-esquerda no vértice de cima (aresta NE); canto = meio da base no vértice.
- Pendências: pisos com emendas visíveis (as tábuas não continuam entre pisos; plano: gerar o piso por código com as cores do Gemini); telhado verde (rodada 2), porta/janela/varanda (rodada 3), mobília (rodada 4); levar as peças para o `chao.html` (paredes nas arestas das células, colisão, telhado que some).
- **Atualização (mesma data): parede e canto agora são MONTADOS A PARTIR DE UMA TORA SÓ** (ideia do dono). `node casa_do_gemini.mjs && node casa_piso.mjs && node casa_toras.mjs`. `casa_toras.mjs` desenha uma tora (64 px de comprimento, 12 de altura, periódica no comprimento, cores do Gemini) e empilha N=7 (+ tampa de 5 linhas); o degrau 2:1 é aplicado em pares de colunas, então dois pedaços lado a lado emendam sem fresta. Canto = camadas de discos de ponta de tora (16×12) em duas colunas, a da direita meia camada mais baixa, com o topo em "^". `N=8 node casa_toras.mjs` deixa a parede mais alta. Piso por código (`casa_piso.mjs`, tábuas contínuas). `parede_gemini.png` (cópia da parede do Gemini) fica em `arte_casa/pecas/` só como fonte de cores.
- Referência de alvo (cabana em corte com lareira de pedra, cama de retalhos, mesa com lampião, tapete, prateleira com mochilas, janela, porta de tábuas verticais): ver conversa de 2026-11-09. Plano: porta/janela/lareira/móveis como peças soltas do Gemini, coladas sobre a parede por código.
- **Edição à mão da cabana (2026-11-09):** `node casa_para_editar.mjs` → `Downloads/casa_para_editar.png` (520×223): módulos `tora` (64×12), `capa` (64×5), `canto_topo`, `canto_camada`, `canto_base` e `piso`, cada um dentro de uma moldura MAGENTA (só o interior vale; em volta vem o contexto: toras vizinhas, camadas repetidas, pisos vizinhos). Depois de exportar no editor-pixel: `node casa_aplicar_edicoes.mjs <png>` grava `arte_casa/editadas/<nome>.png` e remonta as peças (`casa_piso.mjs` e `casa_toras.mjs` respeitam os desenhos). O dono desenha a forma e o Claude dá as cores (recolorir pela rampa de brilho da cabana). Referência da montagem atual: `Downloads/casa_montagem_atual.png`.
- **Conceito do dono (desenho "desenho (1).png", 2026-11-09)** — substitui o canto grosso: tora FINA (cilindro de 9 px de altura, 64 de comprimento), parede = 8 toras + tampa de 5 = 77 px (a altura que ele marcou com as linhas azuis), colunas de DISCOS (ponta redonda das toras) nas pontas livres perto da câmera, e onde duas paredes se encontram não há poste (só se encostam). `casa_toras.mjs` foi reescrito para isso (a versão com canto do Gemini ficou em `casa_toras_v1_canto.mjs`). Peças: `parede_se`, `parede_sw`, `ponta_se`, `ponta_sw`, pisos. Módulos para desenhar (folha `casa_para_editar.mjs`): `tora` (64×9), `capa` (64×5), `disco` (6×9), `piso`.
