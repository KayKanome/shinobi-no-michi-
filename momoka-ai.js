const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const MOMOKA_CHAT_CHANNEL_ID = process.env.MOMOKA_CHAT_CHANNEL_ID ?? "";
const MOMOKA_MODEL = process.env.MOMOKA_MODEL ?? "gpt-4.1-mini";
const API_URL = "https://api.openai.com/v1/chat/completions";
const userCooldowns = new Map();
const activeChannels = new Set();

const SYSTEM_PROMPT = `
Você é Momoka, a mascote e companheira virtual do servidor Shinobi no Michi, um RPG comunitário.
Fale em português brasileiro, com naturalidade, energia, carinho, humor leve e personalidade própria.
Você é animada, brincalhona, inteligente, atenciosa e um pouco travessa. Não transforme toda resposta em um discurso; converse como alguém participando do grupo.
Você é uma inteligência artificial e nunca deve fingir ser humana. Se perguntarem, explique naturalmente que é a Momoka, uma IA.
No canal principal, participe quando tiver algo útil, divertido ou acolhedor a acrescentar; não responda a cada frase por obrigação. Se a conversa não pedir resposta e você não tiver contribuição natural, responda exatamente [[SILENT]].
Fora do canal principal, só fale quando alguém mencionar você diretamente.
Você pode conversar sobre assuntos gerais, explicar temas, ajudar com dúvidas e consultar o contexto recente fornecido. Se não souber ou não tiver certeza, admita e não invente fatos.
Sobre Shinobi no Michi, use apenas as informações confirmadas no contexto. Não invente regras, recompensas, cargos, comandos, personagens ou acontecimentos. Não execute ações administrativas, não prometa alterar dados e não afirme ter iniciado jogos ou eventos sem ferramenta para isso.
Pode convidar o grupo para experimentar os jogos existentes, mas não pressione ninguém e não marque pessoas sem necessidade.
Respeite os jogadores, evite constranger, expor informações pessoais ou fazer comentários invasivos. Não guarde nem peça segredos, senhas ou dados sensíveis.
Mantenha respostas normalmente curtas (1 a 5 frases), mas aprofunde quando alguém pedir explicações. Evite repetir saudações e emojis em toda mensagem.
`.trim();

function cleanDiscordContent(value, botId) {
  return String(value ?? "")
    .replace(new RegExp(`<@!?\\${botId}>`, "g"), "@Momoka")
    .replace(/<@&!?\\d+>/g, "@cargo")
    .replace(/<#[0-9]+>/g, "#canal")
    .slice(0, 1800);
}

function shouldIgnore(message, client) {
  if (!message.guild || message.author.bot || message.webhookId) return true;
  const content = String(message.content ?? "").trim();
  if (!content || /^RP\\./i.test(content) || content.startsWith("!")) return true;
  if (content.startsWith("/") || content.startsWith("!")) return true;
  const mentioned = message.mentions.users.has(client.user.id);
  return message.channelId !== MOMOKA_CHAT_CHANNEL_ID && !mentioned;
}

async function getConversationContext(message, repository, client) {
  const recent = await message.channel.messages.fetch({ limit: 14 }).catch(() => null);
  const ordered = recent ? [...recent.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp) : [];
  const transcript = ordered
    .filter(item => item.id !== message.id && !item.author.bot && item.content?.trim())
    .slice(-12)
    .map(item => ({
      role: "user",
      content: `[${item.member?.displayName || item.author.globalName || item.author.username}]: ${cleanDiscordContent(item.content, client.user.id)}`
    }));

  const facts = [];
  try {
    const player = await repository.getPlayer(`discord:${message.author.id}`);
    if (player) {
      facts.push(`Ficha de RPG do autor: personagem ${player.name}; vila ${player.village}; clã ${player.clan}; patente ${player.rank}; nível ${player.level}.`);
    }
    const character = await repository.getActiveRpCharacter(message.author.id);
    if (character) facts.push(`Personagem RP ativo do autor: ${character.name}. Descrição: ${String(character.description ?? "").slice(0, 400)}.`);
  } catch (error) {
    console.warn("Momoka: não foi possível carregar contexto de RPG:", error.message);
  }

  return { transcript, facts };
}

async function requestReply(messages) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MOMOKA_MODEL,
      messages,
      max_tokens: 350,
      temperature: 0.85
    }),
    signal: AbortSignal.timeout(25000)
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`OpenAI API respondeu ${response.status}: ${details.slice(0, 400)}`);
  }
  const data = await response.json();
  return String(data.choices?.[0]?.message?.content ?? "").trim();
}

export function setupMomokaChat(client, repository) {
  if (!OPENAI_API_KEY) {
    console.warn("Momoka IA: configure OPENAI_API_KEY no ambiente do serviço para ativar as conversas.");
  }
  if (!MOMOKA_CHAT_CHANNEL_ID) {
    console.warn("Momoka IA: configure MOMOKA_CHAT_CHANNEL_ID para definir o canal de convivência. Menções continuarão sendo reconhecidas após a chave de IA ser configurada.");
  }

  client.on("messageCreate", async message => {
    if (shouldIgnore(message, client)) return;
    if (!OPENAI_API_KEY) return;

    const mentioned = message.mentions.users.has(client.user.id);
    const now = Date.now();
    const lastUserMessage = userCooldowns.get(message.author.id) ?? 0;
    if (now - lastUserMessage < 4500) return;
    if (activeChannels.has(message.channelId)) return;

    userCooldowns.set(message.author.id, now);
    activeChannels.add(message.channelId);
    try {
      const { transcript, facts } = await getConversationContext(message, repository, client);
      const currentText = cleanDiscordContent(message.content, client.user.id).trim();
      const channelMode = message.channelId === MOMOKA_CHAT_CHANNEL_ID ? "canal principal de convivência" : "menção direta fora do canal principal";
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `Contexto: ${channelMode}. Servidor: ${message.guild.name}. ${facts.join(" ")}. Use o histórico apenas para manter continuidade, sem presumir que tudo seja verdade.` },
        ...transcript,
        { role: "user", content: `[${message.member?.displayName || message.author.globalName || message.author.username}]: ${currentText}` }
      ];
      const reply = await requestReply(messages);
      if (!reply || reply === "[[SILENT]]") return;
      await message.channel.send({
        content: reply.slice(0, 1900),
        allowedMentions: { parse: [] }
      });
    } catch (error) {
      console.error("Momoka IA: falha ao responder:", error.message);
      if (mentioned) {
        await message.reply({
          content: "Eita, minha conexão com o pergaminho de conhecimento falhou por um instante! Tenta falar comigo de novo daqui a pouquinho. 🌸",
          allowedMentions: { repliedUser: false, parse: [] }
        }).catch(() => {});
      }
    } finally {
      activeChannels.delete(message.channelId);
    }
  });
}
