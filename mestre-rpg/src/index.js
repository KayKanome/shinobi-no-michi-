import { Client, GatewayIntentBits, Partials } from "discord.js";
import pg from "pg";
import { ATTRIBUTE_LABELS, normalize, resolveCheck, formatCheck } from "./engine.js";

const { Pool } = pg;
const token = process.env.MESTRE_DISCORD_TOKEN;
const databaseUrl = process.env.DATABASE_URL;
const openRouterKey = process.env.OPENROUTER_API_KEY;
const model = process.env.MESTRE_AI_MODEL || "openai/gpt-4o-mini";
const port = Number(process.env.PORT || 3001);

if (!token) throw new Error("MESTRE_DISCORD_TOKEN não configurado.");
if (!databaseUrl) throw new Error("DATABASE_URL não configurado.");
if (!openRouterKey) throw new Error("OPENROUTER_API_KEY não configurado.");

const pool = new Pool({ connectionString: databaseUrl, max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });

await pool.query(`
  CREATE TABLE IF NOT EXISTS mestre_campaigns (
    channel_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS mestre_characters (
    id BIGSERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{"forca":1,"agilidade":1,"vitalidade":1,"inteligencia":1,"percepcao":1,"controleChakra":1}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (guild_id, owner_id)
  )
`);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

const SYSTEM_PROMPT = `Você é o Mestre de RPG do Shinobi no Michi, um narrador e árbitro imparcial de uma campanha shinobi original.
Fale em português brasileiro, com cenas envolventes, objetivas e fáceis de acompanhar.
NUNCA decida pensamentos, falas, escolhas ou ações pelo personagem de um jogador. Narre o mundo, NPCs e consequências; termine dando espaço para os jogadores agirem.
Mantenha continuidade com o histórico fornecido. Não invente que um teste foi rolado. Não altere fichas, HP, Chakra, XP ou inventário por conta própria.
Quando uma ação realmente exigir incerteza, indique um teste necessário. Use apenas estes atributos: forca, agilidade, vitalidade, inteligencia, percepcao, controleChakra.
Responda SOMENTE em JSON válido com as chaves: narration (string), needs_roll (boolean), attribute (uma chave válida ou null), difficulty (inteiro de 5 a 30 ou null), reason (string curta).
Não peça teste para ações triviais. Não force rolagens em toda fala. Para uma ação arriscada, escolha dificuldade proporcional e explique brevemente o que está em jogo na narração.`;

async function getCampaign(channelId) {
  const result = await pool.query("SELECT * FROM mestre_campaigns WHERE channel_id = $1 AND active = TRUE", [channelId]);
  return result.rows[0] ?? null;
}

async function getCharacter(guildId, ownerId) {
  const result = await pool.query("SELECT * FROM mestre_characters WHERE guild_id = $1 AND owner_id = $2", [guildId, ownerId]);
  return result.rows[0] ?? null;
}

async function callGM(history, playerContext) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://shinobi-no-michi.onrender.com",
      "X-Title": "Shinobi no Michi - Mestre RPG"
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      messages: [
        { role: "system", content: SYSTEM_PROMPT + "\\n\\nContexto de personagens: " + playerContext },
        ...history
      ],
      response_format: { type: "json_object" }
    })
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenRouter respondeu HTTP ${response.status}: ${details.slice(0, 300)}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("A IA não retornou uma resposta.");
  return JSON.parse(content);
}

async function replyLong(message, content) {
  const text = String(content ?? "").trim();
  if (!text) return;
  for (let i = 0; i < text.length; i += 1900) await message.reply(text.slice(i, i + 1900));
}

function helpText() {
  return [
    "**MESTRE RPG — COMANDOS**",
    "`!mestre campanha Nome` — inicia uma campanha neste canal",
    "`!mestre encerrar` — encerra a campanha deste canal",
    "`!mestre personagem Nome` — cria sua ficha inicial",
    "`!mestre ficha` — consulta sua ficha",
    "`!mestre teste atributo dificuldade` — rola um teste 2d8 + atributo",
    "`!mestre ajuda` — mostra esta ajuda",
    "",
    "Com uma campanha ativa, descreva suas ações normalmente no canal. O Mestre conduz a cena."
  ].join("\\n");
}

async function handleCommand(message, args) {
  const sub = normalize(args[0]);
  if (sub === "ajuda" || !sub) return replyLong(message, helpText());

  if (sub === "campanha") {
    const title = args.slice(1).join(" ").trim();
    if (title.length < 3) return message.reply("Dê um nome para a campanha. Exemplo: `!mestre campanha O Exame Chunin`");
    await pool.query(
      "INSERT INTO mestre_campaigns (channel_id, guild_id, title, history, active) VALUES ($1,$2,$3,'[]'::jsonb,TRUE) ON CONFLICT (channel_id) DO UPDATE SET guild_id=EXCLUDED.guild_id,title=EXCLUDED.title,history='[]'::jsonb,active=TRUE,updated_at=NOW()",
      [message.channelId, message.guildId, title]
    );
    return message.reply(`📜 **Campanha iniciada: ${title}**\\nA partir de agora, descrevam suas ações neste canal. Eu conduzirei a aventura.`);
  }

  if (sub === "encerrar") {
    await pool.query("UPDATE mestre_campaigns SET active=FALSE, updated_at=NOW() WHERE channel_id=$1", [message.channelId]);
    return message.reply("A campanha foi encerrada neste canal. O histórico permanece salvo.");
  }

  if (sub === "personagem") {
    const name = args.slice(1).join(" ").trim();
    if (name.length < 2 || name.length > 24) return message.reply("Informe um nome entre 2 e 24 caracteres.");
    const existing = await getCharacter(message.guildId, message.author.id);
    if (existing) return message.reply(`Você já possui a ficha de **${existing.name}**. Use `!mestre ficha`.`);
    const result = await pool.query(
      "INSERT INTO mestre_characters (guild_id, owner_id, name) VALUES ($1,$2,$3) RETURNING *",
      [message.guildId, message.author.id, name]
    );
    return message.reply(`Ficha inicial criada para **${result.rows[0].name}**. Todos os atributos começam em 1.\\nUse `!mestre ficha` para consultar.`);
  }

  if (sub === "ficha") {
    const character = await getCharacter(message.guildId, message.author.id);
    if (!character) return message.reply("Você ainda não tem ficha. Use `!mestre personagem SeuNome`.");
    const attributes = Object.entries(character.attributes).map(([key, value]) => `• ${ATTRIBUTE_LABELS[key] || key}: **${value}**`);
    return message.reply(`**FICHA — ${character.name}**\\n${attributes.join("\\n")}\\n*Ficha inicial de protótipo; criação completa será implementada depois.*`);
  }

  if (sub === "teste") {
    const attribute = normalize(args[1]).replace(/ /g, "");
    const key = Object.keys(ATTRIBUTE_LABELS).find(item => normalize(item) === attribute || normalize(ATTRIBUTE_LABELS[item]) === attribute);
    const difficulty = Number(args[2]);
    if (!key || !Number.isInteger(difficulty) || difficulty < 5 || difficulty > 30) {
      return message.reply("Formato: `!mestre teste percepcao 15`. Dificuldade entre 5 e 30.");
    }
    const character = await getCharacter(message.guildId, message.author.id);
    if (!character) return message.reply("Crie sua ficha primeiro com `!mestre personagem SeuNome`.");
    const result = resolveCheck({ attributeValue: Number(character.attributes[key] || 0), difficulty });
    return message.reply(formatCheck(result, ATTRIBUTE_LABELS[key]));
  }

  return message.reply("Não reconheci esse comando. Use `!mestre ajuda`.");
}

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guildId) return;
  const content = message.content.trim();
  if (content.toLowerCase().startsWith("!mestre")) {
    try {
      await handleCommand(message, content.split(/\\s+/).slice(1));
    } catch (error) {
      console.error("Erro no comando Mestre:", error);
      await message.reply("Ocorreu um erro ao executar esse comando. Verifique os logs ou tente novamente.");
    }
    return;
  }

  const campaign = await getCampaign(message.channelId).catch(error => {
    console.error("Erro ao consultar campanha:", error);
    return null;
  });
  if (!campaign) return;

  try {
    const character = await getCharacter(message.guildId, message.author.id);
    const playerContext = character
      ? `${message.author.username}: personagem ${character.name}; atributos ${JSON.stringify(character.attributes)}`
      : `${message.author.username}: ainda não criou ficha`;
    const history = Array.isArray(campaign.history) ? campaign.history.slice(-18) : [];
    history.push({ role: "user", content: `${message.author.username} diz/faz: ${content}` });
    await message.channel.sendTyping();
    const result = await callGM(history, playerContext);
    let narration = result.narration || "O mundo aguarda sua próxima ação.";
    if (result.needs_roll && result.attribute && ATTRIBUTE_LABELS[result.attribute]) {
      const player = character;
      if (player) {
        const check = resolveCheck({
          attributeValue: Number(player.attributes[result.attribute] || 0),
          difficulty: Number(result.difficulty) || 15
        });
        narration += `\\n\\n${formatCheck(check, ATTRIBUTE_LABELS[result.attribute])}`;
        narration += check.success
          ? "\\n**Resultado:** você consegue realizar a ação."
          : "\\n**Resultado:** você não consegue realizar a ação como pretendia; a situação muda.";
      } else {
        narration += `\\n\\nPara resolver isso, crie sua ficha com `!mestre personagem SeuNome`.`;
      }
    }
    await replyLong(message, narration);
    history.push({ role: "assistant", content: JSON.stringify(result) });
    await pool.query("UPDATE mestre_campaigns SET history=$1::jsonb,updated_at=NOW() WHERE channel_id=$2", [JSON.stringify(history.slice(-20)), message.channelId]);
  } catch (error) {
    console.error("Erro no Mestre IA:", error);
    await message.reply("Não consegui conduzir esta cena agora. A campanha continua salva; tente novamente em instantes.");
  }
});

const server = await import("node:http").then(({ default: http }) => http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true, service: "mestre-rpg" }));
  }
  res.writeHead(404);
  res.end("Not found");
}));
server.listen(port, "0.0.0.0", () => console.log(`Mestre RPG health server na porta ${port}`));

client.once("ready", () => console.log(`Mestre RPG conectado como ${client.user.tag}`));
await client.login(token);

async function shutdown() {
  await client.destroy();
  await pool.end();
  server.close();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
