# Shinobi no Michi

RPG comunitário em português, desenvolvido com Node.js, PostgreSQL (Neon) e Discord Gateway. A Momoka responde a comandos em canais de texto dos servidores Discord.

## Plataforma

- Integração exclusiva com Discord usando `discord.js` e Gateway.
- Não utiliza webhook, tokens ou endpoints da Meta/WhatsApp.
- O bot responde em canais de servidor, ignora mensagens de outros bots e usa o prefixo `!` nesta etapa inicial.
- O intent **Message Content** precisa estar ativado no Discord Developer Portal.

## Comandos atuais

| Comando | O que faz |
|---|---|
| `!ajuda` | Mostra o menu |
| `/social` | Abre o painel social privado |
| `/hug jogador` | Abraça outro jogador com GIF |
| `/pat jogador` | Faz carinho em outro jogador com GIF |
| `/wave jogador` | Cumprimenta outro jogador com GIF |
| `!registrar Naruto` | Cria um personagem |
| `!ficha` | Mostra sua ficha |
| `!treinar` | Treina e recebe XP/Ryos |
| `!missoes` | Lista as missões |
| `!missao 1` | Realiza a missão escolhida |
| `!ranking` | Mostra o ranking |

## Dados e banco

- Em produção, `DATABASE_URL` é obrigatório.
- O Neon armazena as fichas na tabela `shinobi_players` e os IDs de mensagens processadas na tabela `shinobi_processed_messages`.
- Os identificadores Discord usam o prefixo `discord:`.
- Não apague essas tabelas: elas armazenam o progresso do RPG.
- Sem `DATABASE_URL`, o modo local usa `data/players.json`, adequado apenas para testes.

## Configuração no Render

Configure as variáveis secretas diretamente no serviço:

- `DATABASE_URL`: conexão PostgreSQL do Neon.
- `DISCORD_BOT_TOKEN`: token do bot Momoka.

Nunca coloque tokens ou senhas no GitHub nem os envie em mensagens.

## Testes e execução local

Requisitos: Node.js 20.6 ou superior.

```bash
npm install
npm test
node --env-file=.env index.js
```

A rota `GET /health` retorna o estado básico do serviço. As demais rotas HTTP não são utilizadas pela integração Discord.

## Desenvolvimento

O trabalho é feito primeiro na branch `discord-integration` e validado no serviço de testes `momoka-discord-test`. A branch `main` e o serviço antigo não devem ser alterados durante os testes.

### Painel social

- `/social` abre um painel efêmero, visível apenas para quem executou o comando.
- Os botões de navegação verificam a identidade do dono do painel e incluem a opção Voltar.
- A categoria Interações permite abraçar (`/hug`), fazer carinho (`/pat`) e cumprimentar (`/wave`) outros membros, pelo painel ou por comandos separados.
- As interações são publicadas no canal com menção aos participantes e um GIF selecionado aleatoriamente.
- As demais categorias aparecem no painel como áreas em desenvolvimento e serão implementadas em etapas posteriores.

As próximas funcionalidades sociais serão desenvolvidas em etapas pequenas, com testes antes de cada publicação.
