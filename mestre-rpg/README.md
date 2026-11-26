# Mestre RPG — Shinobi no Michi

Bot Discord separado da Momoka, dedicado a conduzir aventuras com um sistema de regras original.

## Sistema inicial

- Testes: **1d20 + atributo + bônus de estilo/clã** contra uma dificuldade.
- Estilo principal: +3 em perícias associadas.
- Estilo secundário: +1 em perícias associadas.
- Clã pode conceder bônus próprios. No protótipo, Uchiha recebe +1 em Genjutsu e +2 em Resistência Mental; os demais bônus serão definidos após testes de equilíbrio.
- Atributos começam em 1 nesta versão de protótipo.

A estrutura usa conceitos gerais de RPG d20, mas o texto, a progressão e as regras são próprios; não é uma implementação oficial de Tormenta20.

## Variáveis de ambiente

- `MESTRE_DISCORD_TOKEN`: token do novo aplicativo/bot Discord (não reutilize o token da Momoka).
- `OPENROUTER_API_KEY`: chave OpenRouter.
- `DATABASE_URL`: conexão Neon/Postgres; usa tabelas próprias com prefixo `mestre_`.
- `MESTRE_AI_MODEL`: opcional; padrão `openai/gpt-4o-mini`.
- `PORT`: opcional; padrão 3001.

## Comandos

- `!mestre ajuda`
- `!mestre campanha Nome`
- `!mestre personagem Nome;Clã;Estilo principal;Estilo secundário`
- `!mestre ficha`
- `!mestre teste genjutsu 15`
- `!mestre encerrar`

Clãs: Sem clã, Uchiha, Hyūga, Inuzuka, Nara, Akimichi, Aburame.

Estilos: Ninjutsu, Genjutsu, Taijutsu, Médico, Marionetista, Especialista em Armamentos.

Perícias: Ninjutsu, Genjutsu, Taijutsu, Furtividade, Investigação, Percepção, Sobrevivência, Medicina, Resistência Mental, Controle de Chakra, Armamentos e Marionetes.

## Estado do projeto

Protótipo em desenvolvimento. A criação de ficha e os testes básicos estão implementados; combate, recursos, técnicas, evolução e memória de campanha ainda precisam ser construídos e testados antes de publicar.
