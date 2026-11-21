# Shinobi no Michi

Primeira versão jogável de um RPG para WhatsApp, em português, feita com Node.js e a **API oficial WhatsApp Cloud da Meta**.

## O que já funciona

- Cadastro de personagem por número de WhatsApp;
- Ficha com vila, clã, patente, nível, XP, chakra, Ryos e missões concluídas;
- Treino que concede XP e Ryos, com intervalo de 1 hora;
- Três missões iniciais, com intervalo de 3 horas entre conclusões;
- Ranking dos cinco personagens com maior progresso;
- Armazenamento local em JSON para testes;
- Armazenamento PostgreSQL externo para hospedagem, usando `DATABASE_URL`;
- Webhook com verificação da Meta e validação de assinatura em produção;
- Proteção básica contra reprocessamento de mensagens repetidas da Meta.

## Comandos do jogo

| Comando | O que faz |
|---|---|
| `!ajuda` | Mostra o menu |
| `!registrar Naruto` | Cria um personagem |
| `!ficha` | Mostra sua ficha |
| `!treinar` | Treina e recebe XP/Ryos |
| `!missoes` | Lista as missões |
| `!missao 1` | Realiza a missão escolhida |
| `!ranking` | Mostra o ranking |

## Rodar localmente

Requisitos: Node.js 20.6 ou superior.

1. Crie um arquivo `.env` com as variáveis listadas em `env.example` e preencha os valores necessários.
2. Rode `npm install` para instalar as dependências.
3. Rode `npm test` para executar os testes.
4. Rode `node --env-file=.env index.js` para iniciar o servidor.
5. Abra `http://localhost:3000/health` para verificar se está ativo.

O projeto usa o driver `pg` somente quando `DATABASE_URL` estiver configurado.

Sem `DATABASE_URL`, o modo local salva os dados em `data/players.json`. Em produção, o servidor exige `DATABASE_URL` para evitar perda silenciosa de personagens.

## Conectar ao WhatsApp

O servidor precisa estar publicado em uma hospedagem com HTTPS público e disponível para receber os webhooks da Meta.

No painel Meta for Developers, no produto WhatsApp, configure o webhook com:

- URL de callback: `https://SEU-ENDERECO/webhooks/whatsapp`;
- Token de verificação: o mesmo valor de `WHATSAPP_VERIFY_TOKEN`;
- Assinatura/campo de evento: `messages`.

Cadastre na hospedagem as variáveis `DATABASE_URL`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` e `META_APP_SECRET`. O código nunca precisa que esses segredos sejam colocados no GitHub. Em produção, `DATABASE_URL` e `META_APP_SECRET` são obrigatórios.

Para o banco, use a URL PostgreSQL com pooling (host com `-pooler`) copiada do painel Neon. Guarde a URL como segredo no painel da hospedagem; ela contém a senha do banco.

A versão da Graph API é configurável em `WHATSAPP_GRAPH_API_VERSION`; o padrão foi definido como `v27.0`.

## Atenção ao armazenamento

Quando `DATABASE_URL` estiver configurada, os personagens e os IDs de mensagens processadas ficam em PostgreSQL. Isso permite usar uma hospedagem cujo disco local seja temporário. Sem `DATABASE_URL`, o modo local usa `data/players.json`, adequado apenas para testes no próprio computador.

**Atenção ao plano gratuito do servidor:** o Render desliga serviços gratuitos após 15 minutos sem tráfego e a primeira inicialização pode demorar cerca de um minuto. Use essa opção somente para validar o protótipo; para um bot comunitário confiável, será necessário escolher uma hospedagem sempre ativa. O banco Neon gratuito também tem limites de uso e pode suspender o compute quando fica ocioso.

## Publicar os arquivos no GitHub pelo celular

1. Baixe o arquivo ZIP desta versão e extraia seu conteúdo no celular.
2. Abra o repositório `KayKanome/shinobi-no-michi-` no navegador e entre na sua conta.
3. Toque em **Add file** e depois em **Upload files**.
4. Selecione os seis arquivos extraídos (`index.js`, `package.json`, `README.md`, `index.test.js`, `env.example` e `render.yaml`). Eles ficam todos na mesma pasta, sem precisar organizar subpastas.
5. Toque em **Commit changes** para salvar na branch `main`.

Não envie um arquivo `.env` com tokens ou senhas. O arquivo `env.example` contém apenas campos vazios para configuração, não contém segredos.

## Publicação inicial com Render + Neon

1. Crie um projeto PostgreSQL no Neon e copie a conexão com **Connection pooling** ativado (o endereço terá `-pooler`).
2. No Render, crie um Blueprint a partir deste repositório; o arquivo `render.yaml` prepara o serviço.
3. Quando o Render solicitar variáveis secretas, informe `DATABASE_URL`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e `META_APP_SECRET`. O `WHATSAPP_VERIFY_TOKEN` é gerado automaticamente pelo Blueprint; copie o mesmo valor para a configuração do webhook na Meta.
4. Após a publicação, teste `https://SEU-ENDERECO/health`. O resultado esperado é um JSON com `ok: true`.
5. Só então configure o webhook da Meta usando `https://SEU-ENDERECO/webhooks/whatsapp` e o token de verificação do serviço.

O plano gratuito do Render pode dormir após 15 minutos sem tráfego. Para o primeiro teste serve como protótipo, mas não é indicado para um RPG que precisa responder rapidamente a qualquer hora.

## Próximas etapas do RPG

Depois de publicar e conectar o WhatsApp, podemos acrescentar escolha de vila e clã, inventário, loja, equipes, batalhas e progressão mais completa.
