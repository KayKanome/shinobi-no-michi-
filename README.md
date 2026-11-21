# Shinobi no Michi

Primeira versão jogável de um RPG para WhatsApp, em português, feita com Node.js e a **API oficial WhatsApp Cloud da Meta**.

## O que já funciona

- Cadastro de personagem por número de WhatsApp;
- Ficha com vila, clã, patente, nível, XP, chakra, Ryos e missões concluídas;
- Treino que concede XP e Ryos, com intervalo de 1 hora;
- Três missões iniciais, com intervalo de 3 horas entre conclusões;
- Ranking dos cinco personagens com maior progresso;
- Armazenamento dos personagens em arquivo JSON;
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
2. Rode `npm test` para executar os testes.
3. Rode `node --env-file=.env index.js` para iniciar o servidor.
4. Abra `http://localhost:3000/health` para verificar se está ativo.

O projeto usa apenas módulos nativos do Node.js; não precisa instalar bibliotecas adicionais.

## Conectar ao WhatsApp

O servidor precisa estar publicado em uma hospedagem com HTTPS público e disponível para receber os webhooks da Meta.

No painel Meta for Developers, no produto WhatsApp, configure o webhook com:

- URL de callback: `https://SEU-ENDERECO/webhooks/whatsapp`;
- Token de verificação: o mesmo valor de `WHATSAPP_VERIFY_TOKEN`;
- Assinatura/campo de evento: `messages`.

Cadastre na hospedagem as variáveis `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` e `META_APP_SECRET`. O código nunca precisa que esses segredos sejam colocados no GitHub. Em produção, `META_APP_SECRET` é obrigatório.

A versão da Graph API é configurável em `WHATSAPP_GRAPH_API_VERSION`; o padrão foi definido como `v27.0`.

## Atenção ao armazenamento

Esta versão salva dados em `data/players.json`. Para uso real, a hospedagem precisa fornecer armazenamento persistente e a variável `DATA_DIR` deve apontar para ele. **Não coloque o bot em uma hospedagem com disco temporário para uma campanha real:** reinicializações ou novas implantações podem apagar personagens e progresso. Primeiro vamos escolher uma hospedagem e armazenamento adequados.

## Publicar os arquivos no GitHub pelo celular

1. Baixe o arquivo ZIP desta versão e extraia seu conteúdo no celular.
2. Abra o repositório `KayKanome/shinobi-no-michi-` no navegador e entre na sua conta.
3. Toque em **Add file** e depois em **Upload files**.
4. Selecione os cinco arquivos extraídos (`index.js`, `package.json`, `README.md`, `index.test.js` e `env.example`). Eles ficam todos na mesma pasta, sem precisar organizar subpastas.
5. Toque em **Commit changes** para salvar na branch `main`.

Não envie um arquivo `.env` com tokens ou senhas. O arquivo `env.example` contém apenas campos vazios para configuração, não contém segredos.

## Próximas etapas do RPG

Depois de publicar e conectar o WhatsApp, podemos acrescentar escolha de vila e clã, inventário, loja, equipes, batalhas e progressão mais completa.
