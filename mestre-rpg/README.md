# Mestre RPG — Shinobi no Michi

Bot Discord separado da Momoka, dedicado a conduzir aventuras de RPG.

## Variáveis de ambiente

- `MESTRE_DISCORD_TOKEN`: token do novo aplicativo/bot Discord (não reutilize o token da Momoka).
- `OPENROUTER_API_KEY`: chave OpenRouter usada pelo mestre narrativo.
- `DATABASE_URL`: conexão Neon/Postgres; este bot usa tabelas próprias com prefixo `mestre_`.
- `MESTRE_AI_MODEL`: opcional; padrão `openai/gpt-4o-mini`.
- `PORT`: opcional; padrão 3001.

## Comandos iniciais

- `!mestre ajuda`
- `!mestre campanha Nome`
- `!mestre personagem Nome`
- `!mestre ficha`
- `!mestre teste percepcao 15`
- `!mestre encerrar`

## Estado do projeto

Protótipo inicial. O motor 2d8 é provisório e configurável; ainda não representa uma implementação oficial ou completa do Shinobi no Sho. Antes de fechar regras, atributos, técnicas e combate, comparar com o livro/referência que o administrador fornecer e respeitar a licença aplicável.
