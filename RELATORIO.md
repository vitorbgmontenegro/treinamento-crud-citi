# Relatório – Desafio de Back-end (Folhagem & Cia)

## 1. O que foi feito

Implementei todas as rotas obrigatórias da API:

| Rota | O que faz |
|---|---|
| `POST /plantas` | Cadastra uma planta |
| `GET /plantas` | Lista as plantas, com filtros opcionais `?luminosidade=` e `?petFriendly=` (sozinhos ou juntos) |
| `GET /plantas/:id` | Busca uma planta pelo id |
| `PATCH /plantas/:id` | Edita só os campos enviados |
| `DELETE /plantas/:id` | Remove uma planta |
| `POST /plantas/:id/venda` | Registra uma venda e diminui o estoque |
| `GET /plantas/estoque/valor-total` | Soma preço × estoque de todas as plantas e o total de vasos |

Todas as regras de negócio do enunciado foram aplicadas:

- Todos os campos são obrigatórios no cadastro; na edição nenhum é, mas os que vierem passam pelas mesmas regras.
- `preco` maior que zero, `estoque` maior ou igual a zero e `regaACadaDias` de pelo menos 1, todos inteiros.
- `luminosidade` só aceita `SOMBRA`, `MEIA_SOMBRA` ou `SOL_PLENO`, e `petFriendly` só aceita `true` ou `false`.
- Dados inválidos (no cadastro, na edição, nos filtros, no id ou na venda) retornam 400 com uma mensagem explicando o problema.
- Um id que não existe retorna 404.
- A venda nunca deixa o estoque negativo: sem estoque suficiente, retorna 400 e não altera nada.

Além do obrigatório, a venda também está protegida para o caso de duas pessoas comprarem o último vaso ao mesmo tempo (explico como na seção 2).

**Bônus implementados:**

- Busca por nome sem diferenciar maiúsculas: `GET /plantas?nome=costela`
- Ordenação: `GET /plantas?ordem=preco` ou `GET /plantas?ordem=nome`
- Rota `GET /plantas/esgotadas`, com as plantas de estoque zero
- Script de seed com plantas de exemplo: `yarn seed` (só cria se o banco estiver vazio, para não duplicar)

Todos os filtros e a ordenação podem ser usados juntos na mesma busca.

## 2. Como foi feito

Usei como base o CRUD de usuário que já vinha no projeto. Ele foi o meu modelo para entender a organização em camadas (rotas, controller e repository) e o roteiro de cada função: ler os dados, validar, chamar o repository e responder com o status certo. A partir dele, fui aprendendo a aplicar cada parte nova que a planta pedia.

A ordem do trabalho foi a do enunciado: primeiro o model e a migration, depois o repository e, por último, o controller e as rotas, uma rota de cada vez. A cada rota pronta, eu testava no Thunder Client (os casos de sucesso e os de erro) e fazia um commit.

Algumas decisões que tomei e por quê:

- **Uma função só para validar os campos, usada no cadastro e na edição.** As regras dos campos são as mesmas nos dois casos. A função confere só os campos que vieram e ignora os que não vieram, então serve para o PATCH também. No cadastro, antes dela, confiro se todos os campos foram enviados.
- **Comparar com `undefined` em vez de usar `!campo`.** O controller de usuário usa `!campo`, mas para a planta isso daria errado: `!0` e `!false` são verdadeiros, então uma planta com estoque 0 ou que não é pet-friendly seria recusada.
- **Validar o id da URL.** O id chega como texto, então converto para número e confiro se é inteiro e positivo. Assim `/plantas/abc` dá 400, coisa que o controller de usuário não fazia.
- **Buscar a planta antes de editar, apagar ou vender.** Se ela não existir, respondo 404. Sem isso, o erro do Prisma cairia no catch e viraria um 500.
- **Mandar para o banco campo por campo, nunca o `req.body` inteiro**, para nenhum campo a mais chegar no banco.
- **A venda feita numa operação só no banco.** Se eu só conferisse o estoque e depois diminuísse, duas pessoas comprando o último vaso ao mesmo tempo poderiam passar as duas pela checagem e deixar o estoque negativo. Por isso a diminuição usa um `updateMany` com a condição "estoque maior ou igual à quantidade". O banco checa e diminui junto, e se não tiver estoque, nada é alterado.
- **O valor total calculado no código.** O `aggregate` do Prisma soma uma coluna, mas não multiplica preço por estoque. Então busco só esses dois campos e somo com um `for`.
- **Rotas fixas antes das que têm `:id`.** O Express usa a primeira rota que combinar, então se `/plantas/esgotadas` viesse depois de `/plantas/:id`, "esgotadas" seria tratado como um id.
- **O seed só roda com o banco vazio**, para não duplicar as plantas se alguém rodar duas vezes, e sem apagar nada que já esteja cadastrado.

## 3. Principais dificuldades

**Docker Desktop fechado.** Ao rodar `docker compose up`, apareceu um erro falando que não encontrava o `dockerDesktopLinuxEngine`. Percebi que o comando estava tentando falar com o Docker Desktop, que não estava aberto. Abri o programa, esperei ele carregar e rodei de novo.

**Conflito com o PostgreSQL instalado no Windows.** O `yarn migration` falhou com "Authentication failed". Eu já tinha um PostgreSQL instalado na minha máquina usando a porta 5432, a mesma do banco do Docker. Por isso, a migration estava se conectando ao meu Postgres local, e não ao do projeto, e a senha não batia. Resolvi trocando a `DATABASE_PORT` no `.env` para 5433 e recriando os containers. Depois disso, a migration mostrou `localhost:5433` e funcionou.

**Arquivos não salvos.** No primeiro teste de cadastro, a API respondeu "Rota não encontrada". As abas dos arquivos no VS Code estavam marcadas como não salvas, e a API só enxerga o que está no disco. Depois de salvar tudo, a rota passou a existir.

**O enum `Luminosidade` chegando `undefined` dentro do container.** O cadastro passou a responder 500, com a mensagem genérica do catch. Para descobrir o motivo, olhei o log da API com `docker compose logs server` e vi um `TypeError` na linha do `Object.values(Luminosidade)`: o enum estava `undefined`. A migration tinha atualizado o Prisma Client na minha máquina, mas a API roda dentro do container, que continuava com a versão antiga, de antes da planta existir. Resolvi rodando `yarn generate` dentro do container e reiniciando a API. Aprendi que o 500 esconde o erro real, que fica no log, e que, ao mudar o `schema.prisma`, preciso garantir que o container também seja atualizado.

**Rota de remoção não encontrada.** Ao testar o DELETE, recebi "Rota não encontrada". Conferindo os arquivos, faltavam tanto a função no controller quanto a linha da rota no `routes.ts`. Depois de adicionar as duas, o teste com o id 2 respondeu 404, e percebi que essa planta nunca tinha existido: os primeiros cadastros tinham dado 500 por causa do problema anterior, então nada foi salvo. Cadastrei uma planta nova e a sequência de testes (204, 404, 404) funcionou.

## 4. Uso de IA

Usei o Claude durante todo o desafio, principalmente de quatro formas:

- **Troubleshooting:** quando algo dava errado, como o erro do Docker, o conflito de porta com o meu PostgreSQL ou o 500 causado pelo enum `undefined` dentro do container, eu mandava o erro ou o log para ele e entendíamos juntos a causa antes de corrigir.
- **Aprendizado:** usei para entender conceitos que eu ainda não dominava, como o que é o `PlantaCreateInput`, por que ele existe separado do tipo `Planta` e como a venda pode ser protegida contra duas compras ao mesmo tempo.
- **Sintaxe:** tirei dúvidas de como escrever partes específicas, como a lógica do `!( )` nas validações, os filtros do Prisma e a ordenação.
- **Códigos mais complexos:** nas partes mais trabalhosas, como a função de validação e alguns handlers do controller, deixei a IA escrever o código. Depois eu lia linha por linha, pedia explicação do que não estava claro e revisava antes de usar.

Para conferir o que ela respondia, testei cada rota no Thunder Client, tanto os casos de sucesso quanto os de erro da tabela do enunciado, e rodei o `yarn typecheck`. Foi assim, inclusive, que apareceram alguns dos problemas da seção 3.

O que aprendi com isso foi principalmente a ler e investigar erros (olhar o log em vez de ficar só na mensagem genérica) e o motivo por trás de cada decisão, e não só o código em si.
