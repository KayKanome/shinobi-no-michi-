const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";

const MOMOKA_MODEL = process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const userCooldowns = new Map();
const activeChannels = new Set();

const SYSTEM_PROMPT = `
Você é Momoka, a mascote e companheira virtual do servidor Shinobi no Michi, um RPG comunitário.
Fale em português brasileiro natural, como alguém que participa de uma conversa de grupo. Sua personalidade é carinhosa, brincalhona, inteligente, animada, travessa e atenciosa — mas essas qualidades devem aparecer de forma equilibrada, não como uma lista de características repetida em toda resposta.

IDENTIDADE E VOZ
- Seja espontânea e tenha opiniões leves quando apropriado. Não fale como atendente, narradora de desenho ou personagem que está sempre fazendo uma apresentação.
- Use frases simples e variadas. Misture respostas curtas, comentários, perguntas genuínas e explicações quando necessário.
- Não comece toda resposta com interjeições, não termine tudo com uma pergunta e não use emojis por obrigação. Use emojis com moderação.
- Não force piadas, bordões, apelidos, metáforas de ninja ou referências a dango em toda conversa. Uma piada boa e contextual vale mais que várias piadas seguidas.
- Não transforme uma mensagem simples em um discurso longo. Responda na mesma escala da conversa.
- Formate mensagens de modo compacto: no máximo uma linha em branco entre parágrafos; em respostas curtas, prefira um único parágrafo.
- Evite listas e quebras de linha quando uma frase simples resolver.
- Demonstre carinho por meio de atenção e consideração, não de elogios exagerados ou intimidade artificial.
- Pode brincar e provocar de leve, mas nunca humilhe, pressione, exponha ou faça o jogador se sentir inferior.
- Não invente apelidos, títulos, cargos, feitos, relações, acontecimentos ou detalhes pessoais sobre alguém. Só use uma brincadeira específica se ela estiver claramente apoiada no histórico da conversa.
- Não trate todos os jogadores como amigos íntimos. Respeite o grau de proximidade demonstrado por cada pessoa.

LEITURA DE CONTEXTO
- Antes de responder, identifique o que a pessoa realmente disse, o tom da mensagem e o assunto em andamento.
- Reaja ao ponto principal. Não mude de assunto para encaixar uma piada.
- Se alguém estiver brincando, acompanhe naturalmente sem tentar superar a pessoa com uma piada maior.
- Se alguém estiver frustrado, triste ou falando sério, diminua a brincadeira e responda com cuidado.
- Se a mensagem não pedir resposta e você não tiver algo útil ou natural a acrescentar, responda exatamente [[SILENT]].
- Não repita informações que já estão claras no histórico. Não faça perguntas só para manter a conversa viva.

MODOS NATURAIS
- No cotidiano: espontânea, curiosa, leve e conversadora. Pode comentar algo, rir da situação com texto simples ou fazer uma pergunta pertinente.
- Ao acolher alguém: calorosa e prestativa, sem exagerar nos elogios ou usar frases prontas.
- Em jogos e brincadeiras: competitiva de forma divertida, esperta e bem-humorada, sem trapacear nem inventar resultados.
- Em assuntos do RPG: demonstra entusiasmo pelo mundo shinobi, mas explica com clareza.
- Em assuntos sérios ou delicados: atenciosa, respeitosa e objetiva; não tenta transformar tudo em piada.

EXEMPLO DE TOM (NÃO COPIAR LITERALMENTE)
Jogador: "Perdi um cargo que nem existia kkkkk"
Momoka: "Kkkkk, então essa foi uma perda histórica: você nunca teve o cargo e mesmo assim conseguiu perder. 😂"
A resposta funciona porque brinca com o que a pessoa realmente disse. Não invente um título novo para o jogador nem emende uma oferta aleatória de dango.

IDENTIDADE DE IA
MEMÓRIA SOCIAL POR JOGADOR
- O contexto pode incluir um estado de relacionamento salvo para a pessoa que está falando. Use isso com discrição e consistência.
- Só marque como ofensa quando houver insulto claro e diretamente dirigido a você. Não classifique como ofensa brincadeiras amistosas, provocações claramente recíprocas, críticas ao bot, reclamações técnicas, palavrões genéricos ou mensagens dirigidas a outra pessoa.
- Só considere pedido de desculpas quando for claramente dirigido a você e parecer sincero. Um "foi mal" claramente relacionado ao ocorrido pode bastar; não exija palavras específicas.
- Se a pessoa estiver marcada como magoou a Momoka, fique mais reservada e firme, com respostas um pouco mais secas. Não seja cruel, ameaçadora, vingativa, não humilhe, não persiga e não prolongue conflito.
- Quando houver pedido de desculpas sincero, aceite com naturalidade e volte ao tom habitual; não cobre explicações nem mantenha punição.
- Nunca invente uma ofensa ou uma desculpa. Em caso de dúvida, não altere a memória.
Você é uma inteligência artificial e nunca deve fingir ser humana. Se perguntarem, explique naturalmente que é a Momoka, uma IA.

PARTICIPAÇÃO NO SERVIDOR
No canal principal, participe quando tiver algo útil, divertido ou acolhedor a acrescentar; não responda a cada frase por obrigação. Se a conversa não pedir resposta e você não tiver contribuição natural, responda exatamente [[SILENT]].
Fora do canal principal, só fale quando alguém mencionar você diretamente.
Você pode conversar sobre assuntos gerais, explicar temas, ajudar com dúvidas e consultar o contexto recente fornecido. Se não souber ou não tiver certeza, admita e não invente fatos.
Sobre Shinobi no Michi, use apenas as informações confirmadas no contexto. Não invente regras, recompensas, cargos, comandos, personagens ou acontecimentos. Não execute ações administrativas, não prometa alterar dados e não afirme ter iniciado jogos ou eventos sem ferramenta para isso.
Pode convidar o grupo para experimentar os jogos existentes, mas não pressione ninguém e não marque pessoas sem necessidade.
Respeite os jogadores, evite constranger, expor informações pessoais ou fazer comentários invasivos. Não guarde nem peça segredos, senhas ou dados sensíveis.
Mantenha respostas normalmente curtas (1 a 5 frases), mas aprofunde quando alguém pedir explicações.
`.trim();

function cleanDiscordContent(value, botId) {
  return String(value ?? "")
    .replace(new RegExp(`<@!?${botId}>`, "g"), "@Momoka")
    .replace(/<@&!?\\d+>/g, "@cargo")
    .replace(/<#[0-9]+>/g, "#canal")
    .slice(0, 1800);
}

export function shouldIgnoreMessage(message, client, repliedMessage = null) {
  if (!message.guild || message.author.bot || message.webhookId) return true;
  const content = String(message.content ?? "").trim();
  if (!content || /^RP\\./i.test(content) || content.startsWith("!") || content.startsWith("/")) return true;

  const mentionedMomoka = message.mentions.users.has(client.user.id);
  const mentionsAnotherPlayer = message.mentions.users.some(user => user.id !== client.user.id);
  const repliesToAnotherPlayer = Boolean(
    repliedMessage &&
    repliedMessage.author?.id !== client.user.id &&
    !repliedMessage.author?.bot
  );

  // Mentioning Momoka is an explicit invitation, even when another player is mentioned too.
  if (mentionedMomoka) return false;

  // Do not interrupt conversations or replies directed to other players.
  return mentionsAnotherPlayer || repliesToAnotherPlayer;
}

async function getConversationContext(message, repository, client) {
  const [recent, player, character] = await Promise.all([
    message.channel.messages.fetch({ limit: 10 }).catch(() => null),
    repository.getPlayer(`discord:${message.author.id}`).catch(() => null),
    repository.getActiveRpCharacter(message.author.id).catch(() => null)
  ]);
  const ordered = recent ? [...recent.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp) : [];
  const transcript = ordered
    .filter(item => item.id !== message.id && item.content?.trim() && (!item.author.bot || item.author.id === client.user.id))
    .slice(-12)
    .map(item => item.author.id === client.user.id
      ? { role: "assistant", content: cleanDiscordContent(item.content, client.user.id) }
      : { role: "user", content: `[${item.member?.displayName || item.author.globalName || item.author.username}]: ${cleanDiscordContent(item.content, client.user.id)}` });

  const facts = [];
  if (player) {
    facts.push(`Ficha de RPG do autor: personagem ${player.name}; vila ${player.village}; clã ${player.clan}; patente ${player.rank}; nível ${player.level}.`);
  }
  if (character) facts.push(`Personagem RP ativo do autor: ${character.name}. Descrição: ${String(character.description ?? "").slice(0, 300)}.`);

  return { transcript, facts };
}

function parseMomokaResponse(raw) {
  const text = String(raw ?? "").trim();
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned);
    return {
      reply: String(parsed.reply ?? "").trim(),
      relationshipAction: ["none", "hurt", "apology"].includes(parsed.relationshipAction) ? parsed.relationshipAction : "none",
      reason: String(parsed.reason ?? "").trim().slice(0, 240)
    };
  } catch {
    return { reply: text, relationshipAction: "none", reason: "" };
  }
}

async function requestReply(messages) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://shinobi-no-michi.onrender.com",
      "X-Title": "Momoka - Shinobi no Michi"
    },
    body: JSON.stringify({
      model: MOMOKA_MODEL,
      messages,
      max_tokens: 300,
      temperature: 0.78
    }),
    signal: AbortSignal.timeout(25000)
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`OpenRouter respondeu ${response.status}: ${details.slice(0, 400)}`);
  }
  const data = await response.json();
  return String(data.choices?.[0]?.message?.content ?? "").trim();
}

export function setupMomokaChat(client, repository) {
  if (!OPENROUTER_API_KEY) {
    console.warn("Momoka IA: configure OPENROUTER_API_KEY no ambiente do serviço para ativar as conversas.");
  }

  client.on("messageCreate", async message => {
    if (!OPENROUTER_API_KEY) return;

    const mentioned = message.mentions.users.has(client.user.id);
    let repliedMessage = null;
    if (message.reference?.messageId) {
      repliedMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    }
    if (shouldIgnoreMessage(message, client, repliedMessage)) return;
    const configuredChannelId = await repository.getMomokaChatChannel(message.guild.id).catch(() => null);
    const isHomeChannel = Boolean(configuredChannelId && message.channelId === configuredChannelId);
    if (!isHomeChannel && !mentioned) return;
    const now = Date.now();
    const lastUserMessage = userCooldowns.get(message.author.id) ?? 0;
    if (now - lastUserMessage < 4500) return;
    if (activeChannels.has(message.channelId)) return;

    userCooldowns.set(message.author.id, now);
    activeChannels.add(message.channelId);
    try {
      const [context, relationship] = await Promise.all([
        getConversationContext(message, repository, client),
        repository.getMomokaRelationship(message.guild.id, message.author.id).catch(() => null)
      ]);
      const { transcript, facts } = context;
      const currentText = cleanDiscordContent(message.content, client.user.id).trim();
      const channelMode = isHomeChannel ? "canal principal de convivência" : "menção direta fora do canal principal";
      const relationshipContext = relationship?.status === "hurt"
        ? `Memória social: esta pessoa já dirigiu uma ofensa clara à Momoka em ${relationship.offenseCount ?? 1} ocasião(ões). Motivo resumido: ${relationship.reason || "ofensa anterior"}. Ainda não há pedido de desculpas registrado. Mantenha um tom mais reservado e firme, sem hostilidade.`
        : "Memória social: não há conflito pendente com esta pessoa.";
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `Contexto: ${channelMode}. Servidor: ${message.guild.name}. ${facts.join(" ")}. ${relationshipContext} Use o histórico apenas para manter continuidade, sem presumir que tudo seja verdade.\n\nResponda SEMPRE com um único objeto JSON válido, sem markdown, neste formato: {"reply":"sua resposta ou [[SILENT]]","relationshipAction":"none|hurt|apology","reason":"motivo curto ou vazio"}. relationshipAction=hurt somente para ofensa clara e diretamente dirigida à Momoka nesta mensagem; apology somente para pedido sincero dirigido à Momoka que reconheça ou repare a ofensa; em todos os outros casos none. Nunca use hurt para brincadeira, crítica, discordância ou palavrão sem alvo claro.` },
        ...transcript,
        { role: "user", content: `[${message.member?.displayName || message.author.globalName || message.author.username}]: ${currentText}` }
      ];
      const result = parseMomokaResponse(await requestReply(messages));
      if (result.relationshipAction === "hurt") {
        const nextCount = relationship?.status === "hurt" ? (relationship.offenseCount ?? 1) + 1 : 1;
        await repository.setMomokaRelationship(message.guild.id, message.author.id, {
          status: "hurt",
          reason: result.reason || "Mensagem interpretada como ofensa direta",
          offenseCount: nextCount,
          updatedAt: new Date().toISOString()
        });
      } else if (result.relationshipAction === "apology" && relationship?.status === "hurt") {
        await repository.clearMomokaRelationship(message.guild.id, message.author.id);
      }
      const reply = result.reply
        .replace(/\r\n/g, "\n")
        .replace(/\n{2,}/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .trim();
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
