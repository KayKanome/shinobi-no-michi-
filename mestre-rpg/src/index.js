import http from "node:http";
import { Client, GatewayIntentBits, Partials, ChannelType } from "discord.js";
import { startCharacterCreation, handleCharacterInteraction } from "./character-builder.js";
import pg from "pg";
import { ATTRIBUTE_LABELS, STYLES, CLANS, SKILLS, normalize, resolveCheck, getSkillBonus, getClanBonus, formatCheck } from "./engine.js";

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
await pool.query("CREATE TABLE IF NOT EXISTS mestre_campaigns (channel_id TEXT PRIMARY KEY, guild_id TEXT NOT NULL, title TEXT NOT NULL, history JSONB NOT NULL DEFAULT '[]'::jsonb, active BOOLEAN NOT NULL DEFAULT TRUE, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
await pool.query("CREATE TABLE IF NOT EXISTS mestre_characters (id BIGSERIAL PRIMARY KEY, guild_id TEXT NOT NULL, owner_id TEXT NOT NULL, name TEXT NOT NULL, attributes JSONB NOT NULL DEFAULT '{\"forca\":1,\"agilidade\":1,\"vitalidade\":1,\"inteligencia\":1,\"percepcao\":1,\"controleChakra\":1}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (guild_id, owner_id))");

await pool.query("ALTER TABLE mestre_characters ADD COLUMN IF NOT EXISTS clan TEXT NOT NULL DEFAULT 'Sem clã'");
await pool.query("ALTER TABLE mestre_characters ADD COLUMN IF NOT EXISTS primary_style TEXT NOT NULL DEFAULT 'Ninjutsu'");
await pool.query("ALTER TABLE mestre_characters ADD COLUMN IF NOT EXISTS secondary_style TEXT NOT NULL DEFAULT 'Taijutsu'");
await pool.query("ALTER TABLE mestre_characters ADD COLUMN IF NOT EXISTS rolls JSONB NOT NULL DEFAULT '[]'::jsonb");
await pool.query("ALTER TABLE mestre_characters ADD COLUMN IF NOT EXISTS skills JSONB NOT NULL DEFAULT '{}'::jsonb");
await pool.query("ALTER TABLE mestre_campaigns ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'server'");
await pool.query("ALTER TABLE mestre_campaigns ADD COLUMN IF NOT EXISTS owner_id TEXT");
await pool.query("ALTER TABLE mestre_campaigns ADD COLUMN IF NOT EXISTS player_ids JSONB NOT NULL DEFAULT '[]'::jsonb");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });
const SYSTEM_PROMPT = "Você é o Mestre de RPG do Shinobi no Michi, narrador e árbitro imparcial de uma campanha shinobi original.\n" +
  "Fale em português brasileiro, com cenas envolventes e objetivas. Nunca decida pensamentos, falas, escolhas ou ações pelo personagem de um jogador. Narre mundo, NPCs e consequências, deixando espaço para os jogadores agirem.\n" +
  "Mantenha continuidade. Não invente rolagens nem altere fichas, HP, Chakra, XP ou inventário. Use apenas atributos: forca, agilidade, vitalidade, inteligencia, percepcao, controleChakra.\n" +
  "O sistema usa 1d20 + atributo + bônus de estilo/clã contra dificuldade.\n" +
  "Responda somente em JSON válido: narration (string), needs_roll (boolean), skill (chave de perícia ou null), difficulty (inteiro 5 a 30 ou null), reason (string curta). Perícias: " + Object.keys(SKILLS).join(", ") + ". Não peça teste para ações triviais.";

async function getCampaign(channelId) {
  const result = await pool.query("SELECT * FROM mestre_campaigns WHERE channel_id=$1 AND active=TRUE", [channelId]);
  return result.rows[0] ?? null;
}
async function getCharacter(guildId, ownerId) {
  const result = await pool.query("SELECT * FROM mestre_characters WHERE guild_id=$1 AND owner_id=$2", [guildId, ownerId]);
  return result.rows[0] ?? null;
}
async function callGM(history, playerContext) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + openRouterKey, "Content-Type": "application/json", "HTTP-Referer": "https://shinobi-no-michi.onrender.com", "X-Title": "Shinobi no Michi - Mestre RPG" },
    body: JSON.stringify({ model, temperature: 0.8, messages: [{ role: "system", content: SYSTEM_PROMPT + "\n\nContexto dos personagens: " + playerContext }, ...history], response_format: { type: "json_object" } })
  });
  if (!response.ok) throw new Error("OpenRouter HTTP " + response.status + ": " + (await response.text()).slice(0, 250));
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("A IA não retornou resposta.");
  return JSON.parse(content);
}
async function replyLong(message, content) {
  const value = String(content ?? "").trim();
  for (let i = 0; i < value.length; i += 1900) await message.reply(value.slice(i, i + 1900));
}
function helpText() {
  return ["**MESTRE RPG — COMANDOS**", "!mestre campanha Nome — inicia campanha neste canal", "!mestre encerrar — encerra a campanha", "!renkage criar — abre a criação privada da ficha", "!renkage solo @amigo Nome — abre RP privado com um amigo", "!mestre ficha — consulta ficha", "!mestre teste perícia dificuldade — rola 1d20 + atributo + bônus", "!mestre ajuda — mostra ajuda", "", "Com uma campanha ativa, descreva suas ações normalmente neste canal."].join("\n");
}
async function handleCommand(message, args) {
  const sub = normalize(args[0]);
  if (sub === "ajuda" || !sub) return replyLong(message, helpText());
  if (sub === "criar" || sub === "personagem") return startCharacterCreation(message);
  if (sub === "solo") {
    const friend = message.mentions.users.first();
    const title = args.slice(2).join(" ").trim() || "Aventura de Renkage";
    if (!friend || friend.bot || friend.id === message.author.id) return message.reply("Use !renkage solo @amigo Nome da aventura.");
    if (!message.channel.threads) return message.reply("Este canal não permite salas privadas.");
    const thread = await message.channel.threads.create({name:title.slice(0,90),type:ChannelType.PrivateThread,invitable:false,autoArchiveDuration:1440,reason:"Campanha privada de Renkage"});
    await thread.members.add(message.author.id);
    await thread.members.add(friend.id);
    await pool.query("INSERT INTO mestre_campaigns (channel_id,guild_id,title,history,active,mode,owner_id,player_ids) VALUES ($1,$2,$3,'[]'::jsonb,TRUE,'private',$4,$5::jsonb) ON CONFLICT (channel_id) DO UPDATE SET title=EXCLUDED.title,history='[]'::jsonb,active=TRUE,mode='private',owner_id=EXCLUDED.owner_id,player_ids=EXCLUDED.player_ids,updated_at=NOW()",[thread.id,message.guildId,title,message.author.id,JSON.stringify([message.author.id,friend.id])]);
    return message.reply("🔒 Sala privada criada: "+thread.toString()+". Renkage conduzirá a aventura apenas para vocês.");
  }
  if (sub === "campanha") {
    const title = args.slice(1).join(" ").trim();
    if (title.length < 3) return message.reply("Dê um nome. Exemplo: !mestre campanha O Exame Chunin");
    await pool.query("INSERT INTO mestre_campaigns (channel_id,guild_id,title,history,active) VALUES ($1,$2,$3,'[]'::jsonb,TRUE) ON CONFLICT (channel_id) DO UPDATE SET guild_id=EXCLUDED.guild_id,title=EXCLUDED.title,history='[]'::jsonb,active=TRUE,updated_at=NOW()", [message.channelId, message.guildId, title]);
    return message.reply("📜 **Campanha iniciada: " + title + "**\nDescrevam suas ações neste canal. Eu conduzirei a aventura.");
  }
  if (sub === "encerrar") {
    await pool.query("UPDATE mestre_campaigns SET active=FALSE,updated_at=NOW() WHERE channel_id=$1", [message.channelId]);
    return message.reply("Campanha encerrada neste canal. O histórico permanece salvo.");
  }
  if (sub === "personagem-antigo") {
    const fields = args.slice(1).join(" ").split(";").map(value => value.trim());
    const [name, clan = "Sem clã", primary = "Ninjutsu", secondary = "Taijutsu"] = fields;
    if (!name || name.length < 2 || name.length > 24) return message.reply("Formato: !mestre personagem Nome;Clã;Estilo principal;Estilo secundário");
    const chosenClan = CLANS.find(value => normalize(value) === normalize(clan));
    const chosenPrimary = STYLES.find(value => normalize(value) === normalize(primary));
    const chosenSecondary = STYLES.find(value => normalize(value) === normalize(secondary));
    if (!chosenClan || !chosenPrimary || !chosenSecondary || normalize(chosenPrimary) === normalize(chosenSecondary)) return message.reply("Clã ou estilo inválido. Clãs: " + CLANS.join(", ") + ". Estilos: " + STYLES.join(", ") + ". Escolha dois estilos diferentes.");
    const existing = await getCharacter(message.guildId, message.author.id);
    if (existing) return message.reply("Você já possui a ficha de " + existing.name + ". Use !mestre ficha.");
    const result = await pool.query("INSERT INTO mestre_characters (guild_id,owner_id,name,clan,primary_style,secondary_style) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *", [message.guildId, message.author.id, name, chosenClan, chosenPrimary, chosenSecondary]);
    return message.reply("Ficha criada para **" + result.rows[0].name + "**.\nClã: **" + chosenClan + "**\nEstilo principal: **" + chosenPrimary + "** (+3 nas perícias do estilo)\nEstilo secundário: **" + chosenSecondary + "** (+1 nas perícias do estilo)\nTodos os atributos começam em 1. Use !mestre ficha.");
  }
  if (sub === "ficha") {
    if (campaign.mode === "private" && !(campaign.player_ids || []).includes(message.author.id)) return;
    const character = await getCharacter(message.guildId, message.author.id);
    if (!character) return message.reply("Você ainda não tem ficha. Use !mestre personagem SeuNome.");
    const attributes = Object.entries(character.attributes).map(([key, value]) => "• " + (ATTRIBUTE_LABELS[key] || key) + ": **" + value + "**");
    return message.reply("**FICHA — " + character.name + "**\nClã: **" + character.clan + "**\nEstilo principal: **" + character.primary_style + "**\nEstilo secundário: **" + character.secondary_style + "**\n" + attributes.join("\n") + "\n*Bônus de estilo: +3 principal / +1 secundário.*");
  }
  if (sub === "teste") {
    const rawSkill = normalize(args[1]).replace(/ /g, "");
    const skillKey = Object.keys(SKILLS).find(item => normalize(item) === rawSkill || normalize(SKILLS[item].label).replace(/ /g, "") === rawSkill);
    const difficulty = Number(args[2]);
    if (!skillKey || !Number.isInteger(difficulty) || difficulty < 5 || difficulty > 30) return message.reply("Formato: !mestre teste genjutsu 15. Dificuldade de 5 a 30.");
    const character = await getCharacter(message.guildId, message.author.id);
    if (!character) return message.reply("Crie sua ficha primeiro: !mestre personagem SeuNome.");
    const skill = SKILLS[skillKey];
    const check = resolveCheck({ attributeValue: Number(character.attributes[skill.attribute] || 0), skillBonus: getSkillBonus(character, skillKey), clanBonus: getClanBonus(character, skillKey), difficulty });
    return message.reply(formatCheck(check, skill.label));
  }
  return message.reply("Comando não reconhecido. Use !mestre ajuda.");
}

client.on("interactionCreate", async interaction => {
  try { await handleCharacterInteraction(interaction,pool); }
  catch (error) { console.error("Erro no painel de ficha:",error); if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) await interaction.reply({content:"Não consegui concluir esta etapa. Tente novamente.",ephemeral:true}).catch(()=>{}); }
});

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guildId) return;
  const content = message.content.trim();
  if (normalize(content).startsWith("!mestre") || normalize(content).startsWith("!renkage")) {
    try { await handleCommand(message, content.split(/\s+/).slice(1)); }
    catch (error) { console.error("Erro no comando:", error); await message.reply("Ocorreu um erro ao executar o comando. Confira os logs."); }
    return;
  }
  const campaign = await getCampaign(message.channelId).catch(error => { console.error(error); return null; });
  if (!campaign) {
    if (message.mentions.has(client.user)) {
      try { const prompt=content.replace(/<@!?\d+>/g,"").trim(); const answer=await callGM([{role:"user",content:message.author.username+" conversa fora do RP: "+prompt}],"Conversa social fora de campanha. Não controle personagens nem altere fichas."); await replyLong(message,answer.narration || "Estou por aqui. Quer conversar ou começar uma aventura?"); }
      catch(error){console.error("Erro na conversa fora do RP:",error);}
    }
    return;
  }
  try {
    const character = await getCharacter(message.guildId, message.author.id);
    const playerContext = character
      ? message.author.username + ": personagem " + character.name + "; clã " + character.clan + "; estilo principal " + character.primary_style + "; estilo secundário " + character.secondary_style + "; atributos " + JSON.stringify(character.attributes)
      : message.author.username + ": ainda não criou ficha";
    const history = Array.isArray(campaign.history) ? campaign.history.slice(-18) : [];
    history.push({ role: "user", content: message.author.username + " diz/faz: " + content });
    await message.channel.sendTyping();
    const result = await callGM(history, playerContext);
    let narration = result.narration || "O mundo aguarda sua próxima ação.";
    if (result.needs_roll && result.skill && SKILLS[result.skill]) {
      if (character) {
        const skill = SKILLS[result.skill];
        const check = resolveCheck({ attributeValue: Number(character.attributes[skill.attribute] || 0), skillBonus: getSkillBonus(character, result.skill), clanBonus: getClanBonus(character, result.skill), difficulty: Number(result.difficulty) || 15 });
        narration += "\n\n" + formatCheck(check, skill.label);
        narration += check.success ? "\n**Resultado:** você consegue realizar a ação." : "\n**Resultado:** a ação não sai como planejado; a situação muda.";
      } else narration += "\n\nCrie sua ficha com !mestre personagem SeuNome para realizar testes.";
    }
    await replyLong(message, narration);
    history.push({ role: "assistant", content: JSON.stringify(result) });
    await pool.query("UPDATE mestre_campaigns SET history=$1::jsonb,updated_at=NOW() WHERE channel_id=$2", [JSON.stringify(history.slice(-20)), message.channelId]);
  } catch (error) {
    console.error("Erro no Mestre IA:", error);
    await message.reply("Não consegui conduzir a cena agora. A campanha continua salva; tente novamente.");
  }
});

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true, service: "mestre-rpg" }));
  }
  res.writeHead(404);
  res.end("Not found");
});
server.listen(port, "0.0.0.0", () => console.log("Mestre RPG health server na porta " + port));
client.once("ready", () => console.log("Mestre RPG conectado como " + client.user.tag));
await client.login(token);
async function shutdown() {
  await client.destroy();
  await pool.end();
  server.close();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
