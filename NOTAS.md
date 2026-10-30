# Jogo de clãs de Tianguá — notas para continuar

Última atualização: 2026-10-30. Este arquivo existe para você (ou o Claude) retomar de outro computador sem perder nada.

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
| `index.html` | Mapa isométrico de Tianguá jogável (vaqueiro antigo). **Próximo passo: trocar pelo personagem novo** |
| `parados.html`, `comparar_ne_e.html`, `idles_all_view.html` | Páginas de comparação usadas para conferir poses |
| `mato.html`, `fp.html` | Versões 3D antigas (primeira pessoa). Descartadas, o dono escolheu o isométrico |

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
| N | `cut_N2.png` → `cutN2.json` → `cutN.json` |
| E / W | `draw_E.png` → `drawE.json` (olha para a direita = E; W é o espelho) |
| SE / SW | `cut_SE.png` → `cutSE.json` → `cutSW.json` (olha para a direita = SE; SW é o espelho) |
| NW / NE | `draw_NW2.png` (desenho com o miolo vazado) → `nw2_raw.json` → `nw2_filled.json` (+2 linhas de perna para ficar com 55) |

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
- Quase todos os `an*.mjs`, `grid*.mjs`, `match8.mjs`, `fid7.mjs` são scripts de investigação já usados; podem ser ignorados.

## Preferências do dono (importante)
- Fala português, é experiente. Quer que o Claude **faça** (não mande instruções).
- Fidelidade pixel a pixel ao que ele desenha/escolhe; cores devem seguir a paleta do personagem.
- Quer **ver** antes de aplicar, em página para abrir com duplo clique.
- Não usar PowerShell para o dia a dia (preferir bash); nada de vibração/efeitos exagerados.

## Pendências / próximos passos
1. **Colocar o personagem no mapa isométrico (`index.html`)**: 8 direções, andar/correr/parado, tamanho certo, sombra, cor do clã.
2. Tileset completo para o mapa de Tianguá (ver "Fraco ainda" acima); perguntar se o dono prefere gerar peças-chave (igreja, casa típica) na IA e converter.
3. Decidir **estilo** (faroeste × atual) e como preencher os quarteirões vazios do mapa (casas genéricas, mato ou vazio).
4. Marcar as praças como objetivos; depois segundo jogador (multiplayer).

## Atenção: origem das imagens
`sheet7.gif`, `sheet8.gif` e `sheet9.jpg` (e as poses derivadas) vieram de material enviado pelo dono, de **origem/licença desconhecida**. Servem como teste. Para o jogo final, usar personagem próprio ou com licença comercial (a conversão é a mesma).
