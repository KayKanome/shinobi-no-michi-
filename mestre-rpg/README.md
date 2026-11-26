# Renkage — Shinobi no Michi

Bot Discord independente da Momoka, dedicado a missões, treinamentos, personagens e campanhas de RPG.

## Identidade e modos

- **Renkage** é o mestre carismático, estratégico e imparcial das aventuras.
- Em canais com campanha ativa, mensagens são interpretadas como ações/falas dentro do RP.
- Fora de campanhas, Renkage responde quando é mencionado, sem transformar conversa comum em ação de personagem.
- Cada jogador tem uma ficha vinculada ao ID Discord no servidor.
- `!renkage solo @amigo Nome` cria uma sala privada (thread) para uma aventura com o autor e o amigo mencionado.
- Campanhas e históricos são separados por canal/thread.

## Criação interativa de ficha

- `!renkage criar` abre uma mensagem de entrada; o botão abre um painel privado.
- O jogador informa o nome do personagem.
- Clã, especialização principal e secundária são sorteados aleatoriamente.
- Os seis atributos são rolados de uma vez: **4d6, descartando o menor dado**.
- O jogador distribui os seis resultados pelos seis atributos usando menus e botões.
- O painel mostra os bônus de estilo e clã calculados antes da confirmação.
- A ficha salva os resultados originais, atributos distribuídos e bônus de perícia em JSONB.

## Sistema inicial

- Testes: **1d20 + atributo + bônus de estilo/clã** contra uma dificuldade.
- Estilo principal: +3 nas perícias associadas.
- Estilo secundário: +1 nas perícias associadas.
- No protótipo atual, Uchiha tem +1 em Genjutsu e +2 em Resistência Mental; os bônus dos demais clãs ainda precisam ser projetados e balanceados.
- Este é um sistema original em desenvolvimento, não uma implementação oficial de Tormenta20.

## Comandos

- `!renkage ajuda`
- `!renkage criar`
- `!renkage solo @amigo Nome da aventura`
- `!mestre campanha Nome` — inicia RP no canal atual.
- `!mestre encerrar` — encerra o RP no canal atual.
- `!mestre ficha`
- `!mestre teste genjutsu 15`

Clãs atuais: Sem clã, Uchiha, Hyūga, Inuzuka, Nara, Akimichi, Aburame.

Estilos atuais: Ninjutsu, Genjutsu, Taijutsu, Médico, Marionetista, Especialista em Armamentos.

## Variáveis de ambiente

- `MESTRE_DISCORD_TOKEN`: token do novo aplicativo/bot Renkage (não reutilizar o token da Momoka).
- `OPENROUTER_API_KEY`: chave OpenRouter.
- `DATABASE_URL`: conexão Neon/Postgres; usa tabelas próprias com prefixo `mestre_`.
- `MESTRE_AI_MODEL`: opcional; padrão `openai/gpt-4o-mini`.
- `PORT`: opcional; padrão 3001.

## Estado

Implementação inicial em desenvolvimento. Ainda requer testes no Discord, definição dos bônus de todos os clãs, bônus extras opcionais, regras de progressão/combate/recursos e configuração de um serviço de teste independente antes de ser considerada pronta para jogadores.
