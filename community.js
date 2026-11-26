import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { recordNewspaperMoment } from "./newspaper.js";

const IDLE_MS = 90 * 60 * 1000;
const AUTO_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const OFFLINE_GRACE_MS = 5 * 60 * 1000;
const SURPRISE_SCENARIOS = [
  {
    "id": "selos",
    "title": "🔮 Os Selos da Praça estão falhando!",
    "description": "Um selo mágico antigo perdeu o brilho. Reúnam energia nos jogos do painel para restaurar a proteção da praça.",
    "duration": 25,
    "goal": 100,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** Os Selos da Praça estão falhando! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "gato",
    "title": "🐈‍⬛ O gato mensageiro desapareceu!",
    "description": "O gato que leva os bilhetes sumiu nos telhados. Ajudem a Momoka a encontrá-lo reunindo pontos nos jogos.",
    "duration": 30,
    "goal": 120,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** O gato mensageiro desapareceu! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "festival",
    "title": "🏮 Preparativos do Festival das Lanternas!",
    "description": "O festival começa em breve e as lanternas mágicas ainda precisam de energia. A aldeia conta com vocês!",
    "duration": 35,
    "goal": 140,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** Preparativos do Festival das Lanternas! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "pergaminho",
    "title": "📜 O pergaminho levado pelo vento!",
    "description": "Um pergaminho escapou do arquivo e suas páginas voaram pela vila. Ajudem a recuperar todas as páginas!",
    "duration": 40,
    "goal": 160,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** O pergaminho levado pelo vento! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "raposa",
    "title": "🦊 Uma raposa espiritual está aprontando!",
    "description": "Uma raposinha espiritual escondeu objetos brilhantes pela aldeia. Ajudem a recuperá-los nos desafios!",
    "duration": 25,
    "goal": 180,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** Uma raposa espiritual está aprontando! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "meteorito",
    "title": "☄️ Fragmentos luminosos no bosque!",
    "description": "Fragmentos de uma estrela cadente estão perdendo o brilho. Reúnam energia para preservá-los!",
    "duration": 30,
    "goal": 100,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** Fragmentos luminosos no bosque! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "nevoa",
    "title": "🌫️ A névoa misteriosa está avançando!",
    "description": "Uma névoa mágica fictícia cobre a praça. Ativem os sinos encantados reunindo pontos nos jogos!",
    "duration": 35,
    "goal": 120,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** A névoa misteriosa está avançando! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "biblioteca",
    "title": "📚 Caos na biblioteca ninja!",
    "description": "Um jutsu travesso embaralhou os livros. Ajudem a Momoka a restaurar a ordem da biblioteca!",
    "duration": 40,
    "goal": 140,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** Caos na biblioteca ninja! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "dragao",
    "title": "🐉 O filhote de dragão perdeu o caminho!",
    "description": "Um pequeno dragão amistoso não encontra o caminho de volta. Reúnam energia para iluminar a trilha!",
    "duration": 25,
    "goal": 160,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** O filhote de dragão perdeu o caminho! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "flores",
    "title": "🌸 A chuva de flores começou!",
    "description": "Uma nuvem encantada está prestes a espalhar pétalas pela aldeia. Preparem a vila para a surpresa!",
    "duration": 30,
    "goal": 180,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** A chuva de flores começou! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "dango",
    "title": "🍡 Emergência na cozinha do festival!",
    "description": "A equipe do festival precisa preparar uma bandeja gigante de dango. Ajudem reunindo pontos!",
    "duration": 35,
    "goal": 100,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** Emergência na cozinha do festival! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "chama",
    "title": "🔥 A chama encantada no campo de treino!",
    "description": "Uma chama mágica fictícia surgiu após um jutsu. Reúnam energia para ativar os selos de contenção da história!",
    "duration": 40,
    "goal": 120,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** A chama encantada no campo de treino! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "sino",
    "title": "🎐 O sino da montanha parou de tocar!",
    "description": "O grande sino da montanha silenciou. Segundo a lenda, só a energia coletiva pode despertá-lo!",
    "duration": 25,
    "goal": 140,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** O sino da montanha parou de tocar! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "mascaras",
    "title": "🎭 As máscaras do teatro sumiram!",
    "description": "As máscaras da apresentação desapareceram misteriosamente. Ajudem a recuperar os itens antes do espetáculo!",
    "duration": 30,
    "goal": 160,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** As máscaras do teatro sumiram! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "aurora",
    "title": "🌌 Uma aurora apareceu sobre a aldeia!",
    "description": "Uma aurora rara está perdendo as cores. Compartilhem energia nos jogos para prolongar o fenômeno!",
    "duration": 35,
    "goal": 180,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** Uma aurora apareceu sobre a aldeia! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "mapa",
    "title": "🗺️ O mapa secreto foi rasgado!",
    "description": "Um mapa antigo se partiu em vários pedaços. Ajudem a Momoka a reunir as partes e revelar o segredo!",
    "duration": 40,
    "goal": 100,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** O mapa secreto foi rasgado! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "peixes",
    "title": "🐟 Os peixinhos do lago encantado!",
    "description": "Os peixes luminosos do lago perderam o brilho. A aldeia precisa reunir energia para reencantar as águas!",
    "duration": 25,
    "goal": 120,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** Os peixinhos do lago encantado! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "correio",
    "title": "✉️ Uma pilha de cartas precisa ser entregue!",
    "description": "As cartas da vila se misturaram e precisam chegar aos destinatários. Ajudem a Momoka nessa entrega especial!",
    "duration": 30,
    "goal": 140,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** Uma pilha de cartas precisa ser entregue! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "estrelas",
    "title": "⭐ A constelação desapareceu!",
    "description": "Uma constelação que guia viajantes sumiu do céu. Reúnam energia para fazê-la brilhar novamente!",
    "duration": 35,
    "goal": 160,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** A constelação desapareceu! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  },
  {
    "id": "fantasma",
    "title": "👻 O fantasma brincalhão da hospedaria!",
    "description": "Um espírito amistoso está escondendo as chaves da hospedaria. Participem dos jogos para convencê-lo a devolver!",
    "duration": 40,
    "goal": 180,
    "successMessage": "🎉 **MISSÃO CONCLUÍDA!** O fantasma brincalhão da hospedaria! A aldeia conseguiu completar o desafio graças à ajuda de todos! 🌸"
  }
];
const onlineMembers = new Map();
const offlineSince = new Map();
function chooseSurprise(state) {
  const recent = state.recentScenarioIds || [];
  const pool = SURPRISE_SCENARIOS.filter(s => !recent.includes(s.id));
  const choices = pool.length ? pool : SURPRISE_SCENARIOS;
  const selected = choices[Math.floor(Math.random() * choices.length)];
  state.recentScenarioIds = [...recent, selected.id].slice(-10);
  return selected;
}
const lastActivity = new Map();
const lastActivityChannel = new Map();
let automationStarted = false;

function isStaff(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
}
async function readState(repository, guildId) {
  const state = await repository.getCommunityState(guildId) || {
    eventChannelId: null, autoEnabled: true, lastAutoAt: 0, active: null
  };
  if (state.autoEnabled === undefined) state.autoEnabled = true;
  return state;
}
async function writeState(repository, guildId, state) {
  await repository.setCommunityState(guildId, state);
  return state;
}
function eventEmbed(event) {
  const end = new Date(event.endsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  return new EmbedBuilder().setColor(event.status === "completed" ? 0x8DBB83 : 0xE89BB5)
    .setTitle(event.title)
    .setDescription(event.description + "\n\n**Como participar:** jogue qualquer desafio em `/jogo`. Os pontos das partidas concluídas ajudam a comunidade a cumprir a missão.\n\n**Progresso coletivo:** " + event.progress + "/" + event.goal + " pontos\n**Participantes:** " + event.participants.length + "\n**Prazo:** até " + end)
    .addFields({ name: "🎁 Recompensa", value: "Participe pelo botão e receba um colecionável exclusivo deste evento." })
    .setFooter({ text: event.status === "completed" ? "Missão concluída pela aldeia!" : "Evento comunitário • Shinobi no Michi" });
}
async function publishEvent(client, repository, guildId, channel, event) {
  const ping = ["automatic", "momoka"].includes(event.kind) ? { content: "@everyone", allowedMentions: { parse: ["everyone"] } } : {};
  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("community:join:" + event.id).setLabel("Participar").setEmoji("🎁").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("community:leave:" + event.id).setLabel("Sair").setEmoji("↩️").setStyle(ButtonStyle.Secondary)
  );
  const message = await channel.send({ ...ping, embeds: [eventEmbed(event)], components: [controls] });
  event.messageId = message.id;
  const state = await readState(repository, guildId);
  state.active = event;
  await writeState(repository, guildId, state);
  await recordNewspaperMoment(repository, guildId, {
    category: event.kind === "momoka" ? "Missão surpresa" : "Evento comunitário",
    text: "A Momoka anunciou **" + event.title + "**. " + String(event.description || "").slice(0, 280),
    channelId: event.channelId
  });
  return message;
}
async function createEvent(client, repository, guildId, channel, data) {
  const now = Date.now();
  const event = {
    id: now.toString(36), title: data.title, description: data.description,
    createdAt: now, endsAt: now + data.duration * 60000, goal: data.goal, channelId: channel.id,
    progress: 0, participants: [], status: "active", lastAnnouncedProgress: 0,
    successMessage: data.successMessage || "🎉 **MISSÃO CONCLUÍDA!** A comunidade completou o desafio! Parabéns a todos! 🌸",
    kind: data.kind || "staff"
  };
  await publishEvent(client, repository, guildId, channel, event);
  return event;
}
async function announceProgress(client, repository, guildId, event, message) {
  const channel = await client.channels.fetch(event.channelId).catch(() => null);
  if (channel?.isTextBased?.()) {
    await channel.send(message);
  }
}
export const communitySlashCommands = [
  new SlashCommandBuilder().setName("missao").setDescription("Gerencia missões comunitárias da Momoka.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("criar").setDescription("Cria uma missão para a aldeia.")
      .addStringOption(o => o.setName("titulo").setDescription("Nome da missão").setMaxLength(80).setRequired(true))
      .addStringOption(o => o.setName("descricao").setDescription("O que a aldeia precisa fazer").setMaxLength(800).setRequired(true))
      .addIntegerOption(o => o.setName("duracao").setDescription("Duração em minutos").setMinValue(5).setMaxValue(1440).setRequired(true))
      .addIntegerOption(o => o.setName("meta").setDescription("Pontos coletivos necessários").setMinValue(10).setMaxValue(10000).setRequired(true)))
    .addSubcommand(s => s.setName("forcar").setDescription("Faz a Momoka lançar uma missão surpresa agora."))
    .addSubcommand(s => s.setName("parar").setDescription("Encerra a missão comunitária ativa."))
    .addSubcommand(s => s.setName("ativar").setDescription("Ativa missões surpresa quando não houver membros online."))
    .addSubcommand(s => s.setName("desativar").setDescription("Desativa o início automático de missões.")),
  new SlashCommandBuilder().setName("evento").setDescription("Cria e controla eventos da aldeia.")
    .addSubcommand(s => s.setName("criar").setDescription("Cria um evento coletivo.")
      .addStringOption(o => o.setName("titulo").setDescription("Nome do evento").setMaxLength(80).setRequired(true))
      .addStringOption(o => o.setName("descricao").setDescription("História e objetivo do evento").setMaxLength(800).setRequired(true))
      .addIntegerOption(o => o.setName("duracao").setDescription("Duração em minutos").setMinValue(5).setMaxValue(10080).setRequired(true))
      .addIntegerOption(o => o.setName("meta").setDescription("Pontos coletivos necessários").setMinValue(10).setMaxValue(100000).setRequired(true)))
    .addSubcommand(s => s.setName("configurar").setDescription("Escolhe o canal dos eventos automáticos.")
      .addChannelOption(o => o.setName("canal").setDescription("Canal de eventos").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName("parar").setDescription("Encerra o evento ativo."))
    .addSubcommand(s => s.setName("forcar").setDescription("Publica um evento surpresa imediatamente."))
    .addSubcommand(s => s.setName("inventario").setDescription("Mostra seus colecionáveis de eventos."))
    .addSubcommand(s => s.setName("ranking").setDescription("Mostra o ranking do evento atual."))
    .addSubcommand(s => s.setName("estatisticas").setDescription("Mostra suas estatísticas de eventos.")),
  new SlashCommandBuilder().setName("atividade").setDescription("Testa as atividades surpresa da Momoka.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("forcar").setDescription("Inicia uma missão ou sala de jogo surpresa agora.")),
];

export async function handleCommunityCommand(interaction, client, repository) {
  if (!["missao", "evento", "atividade"].includes(interaction.commandName)) return false;
  const action = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  const state = await readState(repository, guildId);
  if (interaction.commandName === "evento" && ["inventario", "ranking", "estatisticas"].includes(action)) {
    const inventory = state.eventInventories?.[interaction.user.id] || [];
    if (action === "inventario") {
      const summary = inventory.length ? inventory.map(item => "• " + item.emoji + " **" + item.name + "** — " + item.eventTitle).join("\\n") : "Você ainda não possui colecionáveis. Participe de um evento para ganhar o primeiro! 🌸";
      return interaction.reply({ content: "🎒 **Inventário de " + interaction.user.username + "**\\n" + summary, ephemeral: true });
    }
    if (action === "estatisticas") {
      const count = Number(state.eventStats?.[interaction.user.id]?.joined || 0);
      const earned = inventory.length;
      return interaction.reply({ content: "📊 **Suas estatísticas**\\nEventos participados: **" + count + "**\\nColecionáveis conquistados: **" + earned + "**", ephemeral: true });
    }
    const event = state.active;
    if (!event) return interaction.reply({ content: "Ainda não há um evento registrado para consultar o ranking. 🌸", ephemeral: true });
    const rows = Object.entries(event.pointsByUser || {}).sort((a,b) => b[1]-a[1]).slice(0,10);
    const ranking = rows.length ? rows.map(([id,points],i) => (i+1)+". <@"+id+"> — **"+points+" pts**").join("\\n") : "O ranking ainda está vazio. Jogue para marcar os primeiros pontos!";
    return interaction.reply({ content: "🏆 **Ranking — " + event.title + "**\\n" + ranking, ephemeral: true });
  }
  if (!isStaff(interaction)) {
    await interaction.reply({ content: "Este comando é exclusivo da staff com permissão de gerenciar o servidor. 🌸", ephemeral: true });
    return true;
  }

  if (interaction.commandName === "atividade" && action === "forcar") {
    if (state.active?.status === "active" && Date.now() <= state.active.endsAt) {
      await interaction.reply({ content: "Já existe uma atividade comunitária ativa. Encerre-a antes de iniciar outra.", ephemeral: true });
      return true;
    }
    const chatId = await repository.getMomokaChatChannel(guildId).catch(() => null);
    const channel = (chatId ? await client.channels.fetch(chatId).catch(() => null) : null)
      || (state.eventChannelId ? await client.channels.fetch(state.eventChannelId).catch(() => null) : null)
      || interaction.channel;
    if (!channel?.isTextBased?.() || !channel.threads?.create) {
      await interaction.reply({ content: "Não encontrei um canal de convivência compatível para abrir a atividade.", ephemeral: true });
      return true;
    }
    if (Math.random() < 0.5) {
      await startAutomaticGame(client, repository, guildId, channel, state);
      await interaction.reply({ content: "🎮 A Momoka abriu uma sala de jogo surpresa em " + channel + "! 🌸", ephemeral: true });
    } else {
      const event = await createEvent(client, repository, guildId, channel, {
        ...chooseSurprise(state), kind: "momoka"
      });
      const refreshed = await readState(repository, guildId);
      refreshed.lastAutoAt = Date.now();
      refreshed.recentScenarioIds = state.recentScenarioIds;
      await writeState(repository, guildId, refreshed);
      await interaction.reply({ content: "🌸 A Momoka lançou uma missão surpresa em " + channel + "!", ephemeral: true });
    }
    return true;
  }

  if (interaction.commandName === "missao" && action === "ativar") {
    state.autoEnabled = true;
    await writeState(repository, guildId, state);
    await interaction.reply({ content: "Missões surpresa ativadas! Quando o servidor estiver sem membros online e o chat estiver parado, a Momoka poderá lançar até três atividades surpresa por dia, respeitando um intervalo mínimo de quatro horas. 🌸", ephemeral: true });
    return true;
  }
  if (interaction.commandName === "missao" && action === "desativar") {
    state.autoEnabled = false;
    await writeState(repository, guildId, state);
    await interaction.reply({ content: "Missões surpresa automáticas desativadas. As missões criadas pela staff continuam disponíveis.", ephemeral: true });
    return true;
  }
  if (interaction.commandName === "evento" && action === "configurar") {
    const channel = interaction.options.getChannel("canal");
    state.eventChannelId = channel.id;
    await writeState(repository, guildId, state);
    await interaction.reply({ content: "Canal de eventos configurado: " + channel + ". 🌸", ephemeral: true });
    return true;
  }
  if ((interaction.commandName === "missao" && action === "parar") || (interaction.commandName === "evento" && action === "parar")) {
    if (!state.active || state.active.status !== "active" || Date.now() > state.active.endsAt) {
      await interaction.reply({ content: "Não há missão ou evento ativo neste momento.", ephemeral: true });
      return true;
    }
    state.active.status = "stopped";
    await writeState(repository, guildId, state);
    await recordNewspaperMoment(repository, guildId, {
      category: "Evento encerrado",
      text: "A staff encerrou **" + state.active.title + "** antes do prazo. Participantes registrados: " + (state.active.participants || []).length + ".",
      channelId: state.active.channelId
    });
    await interaction.reply({ content: "A missão/evento ativo foi encerrado. 🌸", ephemeral: true });
    return true;
  }
  if ((interaction.commandName === "missao" && action === "forcar") || (interaction.commandName === "evento" && action === "forcar")) {
    const channelId = state.eventChannelId || interaction.channelId;
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased?.()) {
      await interaction.reply({ content: "Não encontrei um canal de texto para publicar. Use /evento configurar primeiro.", ephemeral: true });
      return true;
    }
    if (state.active?.status === "active" && Date.now() <= state.active.endsAt) {
      await interaction.reply({ content: "Já existe uma missão/evento ativo. Encerre-o antes de lançar outro.", ephemeral: true });
      return true;
    }
    const event = await createEvent(client, repository, guildId, channel, {
      ...chooseSurprise(state), kind: "momoka"
    });
    const refreshed = await readState(repository, guildId);
    refreshed.lastAutoAt = Date.now();
    refreshed.recentScenarioIds = state.recentScenarioIds;
    await writeState(repository, guildId, refreshed);
    await interaction.reply({ content: "Missão surpresa publicada em " + channel + "! 🌸", ephemeral: true });
    return true;
  }
  if ((interaction.commandName === "missao" && action === "criar") || (interaction.commandName === "evento" && action === "criar")) {
    if (state.active?.status === "active" && Date.now() <= state.active.endsAt) {
      await interaction.reply({ content: "Já existe uma missão/evento ativo. Encerre-o antes de criar outro.", ephemeral: true });
      return true;
    }
    const configured = state.eventChannelId ? await client.channels.fetch(state.eventChannelId).catch(() => null) : null;
    const channel = configured?.isTextBased?.() ? configured : interaction.channel;
    const event = await createEvent(client, repository, guildId, channel, {
      title: interaction.options.getString("titulo"),
      description: interaction.options.getString("descricao"),
      duration: interaction.options.getInteger("duracao"),
      goal: interaction.options.getInteger("meta"),
      kind: interaction.commandName
    });
    await interaction.reply({ content: "Pronto! " + (interaction.commandName === "missao" ? "Missão" : "Evento") + " publicado em " + channel + ". 🌸", ephemeral: true });
    return true;
  }
  return true;
}


export async function handleCommunityInteraction(interaction, repository) {
  if (!interaction.isButton?.() || !interaction.customId.startsWith("community:")) return false;
  const [, action, eventId] = interaction.customId.split(":");
  const state = await readState(repository, interaction.guildId);
  const event = state.active;
  if (!event || event.id !== eventId) {
    await interaction.reply({ content: "Esse evento já terminou ou não está mais disponível. 🌸", ephemeral: true });
    return true;
  }
  if (event.status !== "active" || Date.now() > event.endsAt) {
    await interaction.reply({ content: "O prazo desse evento terminou. 🌸", ephemeral: true });
    return true;
  }
  event.participants = Array.isArray(event.participants) ? event.participants : [];
  event.rewardsByUser = event.rewardsByUser || {};
  if (action === "join") {
    if (event.participants.includes(interaction.user.id)) {
      await interaction.reply({ content: "Você já está participando deste evento! 🌸", ephemeral: true });
      return true;
    }
    event.participants.push(interaction.user.id);
    const collectibles = [
      { name: "Flor de Cerejeira", emoji: "🌸" },
      { name: "Selo da Vila", emoji: "🏮" },
      { name: "Fragmento Estelar", emoji: "⭐" },
      { name: "Amuleto da Raposa", emoji: "🦊" },
      { name: "Pétala Encantada", emoji: "🌷" },
      { name: "Pergaminho Miniatura", emoji: "📜" }
    ];
    let reward = event.rewardsByUser[interaction.user.id];
    if (!reward) {
      reward = collectibles[Math.floor(Math.random() * collectibles.length)];
      event.rewardsByUser[interaction.user.id] = reward;
      state.eventInventories = state.eventInventories || {};
      state.eventInventories[interaction.user.id] = state.eventInventories[interaction.user.id] || [];
      state.eventInventories[interaction.user.id].push({ ...reward, eventId: event.id, eventTitle: event.title, obtainedAt: Date.now() });
      state.eventStats = state.eventStats || {};
      state.eventStats[interaction.user.id] = state.eventStats[interaction.user.id] || { joined: 0 };
      state.eventStats[interaction.user.id].joined += 1;
    }
    await writeState(repository, interaction.guildId, state);
    await interaction.message.edit({ embeds: [eventEmbed(event)] }).catch(() => {});
    await interaction.reply({ content: reward ? "🎁 Você entrou em **" + event.title + "** e recebeu " + reward.emoji + " **" + reward.name + "**! Consulte com /evento inventario." : "Você entrou no evento! 🌸", ephemeral: true });
    return true;
  }
  if (action === "leave") {
    event.participants = event.participants.filter(id => id !== interaction.user.id);
    await writeState(repository, interaction.guildId, state);
    await interaction.message.edit({ embeds: [eventEmbed(event)] }).catch(() => {});
    await interaction.reply({ content: "Você saiu do evento. Seu colecionável conquistado continua no inventário. 🌸", ephemeral: true });
    return true;
  }
  return false;
}
\nexport function noteCommunityActivity(message) {
  if (!message.guild || message.author.bot || !message.content?.trim()) return;
  lastActivity.set(message.guild.id, Date.now());
  lastActivityChannel.set(message.guild.id, message.channelId);
}

export async function recordCommunityGame(client, repository, guildId, playerId, points) {
  if (!guildId) return;
  const state = await readState(repository, guildId);
  const event = state.active;
  if (!event || event.status !== "active" || event.kind === "automatic-game") return;
  if (Date.now() > event.endsAt) {
    event.status = "expired";
    await writeState(repository, guildId, state);
    await recordNewspaperMoment(repository, guildId, {
      category: "Evento encerrado por prazo",
      text: "**" + event.title + "** terminou. Resultado: " + event.progress + "/" + event.goal + " pontos e " + (event.participants || []).length + " participantes.",
      channelId: event.channelId
    });
    return;
  }
  const earnedPoints = Math.max(0, Number(points) || 0);
  event.progress += earnedPoints;
  event.pointsByUser = event.pointsByUser || {};
  event.pointsByUser[playerId] = (event.pointsByUser[playerId] || 0) + earnedPoints;
  if (!event.participants.includes(playerId)) event.participants.push(playerId);
  if (event.progress >= event.goal) {
    event.status = "completed";
    await writeState(repository, guildId, state);
    const channel = await client.channels.fetch(state.eventChannelId || event.channelId).catch(() => null);
    if (channel?.isTextBased?.()) await channel.send(event.successMessage);
    await recordNewspaperMoment(repository, guildId, {
      category: "Missão concluída",
      text: "A comunidade concluiu **" + event.title + "** com " + event.progress + " pontos coletivos e " + event.participants.length + " participantes. 🌸",
      channelId: event.channelId
    });
    return;
  }
  if (event.progress - event.lastAnnouncedProgress >= 50) {
    event.lastAnnouncedProgress = event.progress;
    await writeState(repository, guildId, state);
    const channel = await client.channels.fetch(state.eventChannelId || event.channelId).catch(() => null);
    if (channel?.isTextBased?.()) await channel.send("🌸 A missão avançou! Progresso coletivo: **" + event.progress + "/" + event.goal + "** pontos.");
    await recordNewspaperMoment(repository, guildId, {
      category: "Progresso de missão",
      text: "**" + event.title + "** alcançou " + event.progress + "/" + event.goal + " pontos coletivos. Participantes: " + event.participants.length + ".",
      channelId: event.channelId
    });
    return;
  }
  await writeState(repository, guildId, state);
}

export function initializeCommunityPresence(client) {
  for (const guild of client.guilds.cache.values()) {
    const online = new Set(guild.presences.cache.filter(p => p.status !== "offline" && p.user?.bot !== true).map(p => p.userId));
    onlineMembers.set(guild.id, online);
    if (online.size === 0) offlineSince.set(guild.id, Date.now());
    else offlineSince.delete(guild.id);
  }
}

export function updateCommunityPresence(oldPresence, newPresence) {
  const presence = newPresence || oldPresence;
  const guildId = presence?.guild?.id;
  const userId = presence?.userId;
  if (!guildId || !userId || presence.user?.bot) return;
  const online = onlineMembers.get(guildId) || new Set();
  if (!newPresence || newPresence.status === "offline") online.delete(userId);
  else online.add(userId);
  onlineMembers.set(guildId, online);
  if (online.size === 0) offlineSince.set(guildId, Date.now());
  else offlineSince.delete(guildId);
}


const AUTOMATIC_QUIZ = [
  { prompt: "Qual é a vila de Naruto?", options: ["Suna", "Konoha", "Kiri", "Iwa"], answer: 1 },
  { prompt: "Quem é conhecido como Ninja Copiador?", options: ["Kakashi", "Jiraiya", "Iruka", "Neji"], answer: 0 },
  { prompt: "Qual clã é conhecido pelo Byakugan?", options: ["Nara", "Akimichi", "Hyuga", "Aburame"], answer: 2 },
  { prompt: "Quem ensinou o Rasengan a Naruto?", options: ["Kakashi", "Jiraiya", "Minato", "Iruka"], answer: 1 },
  { prompt: "Qual é o nome da raposa selada em Naruto?", options: ["Shukaku", "Matatabi", "Kurama", "Gyuki"], answer: 2 },
  { prompt: "Quem foi o Segundo Hokage?", options: ["Hashirama", "Tobirama", "Hiruzen", "Minato"], answer: 1 }
];
const automaticGameRooms = new Map();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function startAutomaticGame(client, repository, guildId, channel, state) {
  const chosen = [...AUTOMATIC_QUIZ].sort(() => Math.random() - 0.5).slice(0, 3);
  const starter = await channel.send({
    content: "@everyone 🌸 **A Momoka abriu uma sala de jogo surpresa!** Entrem na conversa: vou jogar com vocês em um mini Quiz Shinobi de 3 rodadas!",
    allowedMentions: { parse: ["everyone"] }
  });
  const thread = await starter.startThread({
    name: "🎮 Sala surpresa • Quiz Shinobi",
    autoArchiveDuration: 60,
    reason: "Atividade automática da Momoka"
  });
  automaticGameRooms.set(guildId, thread.id);
  state.active = {
    id: "auto-game-" + Date.now().toString(36),
    kind: "automatic-game",
    status: "active",
    channelId: thread.id,
    endsAt: Date.now() + 3 * 60 * 1000
  };
  state.lastAutoAt = Date.now();
  await writeState(repository, guildId, state);

  const totals = new Map();
  await thread.send("📜 **Regras:** responda com o número da alternativa (1 a 4) ou com o texto dela. Cada pessoa conta uma vez por rodada. Eu também vou dar meus palpites! Temos 20 segundos por pergunta.");
  for (let index = 0; index < chosen.length; index++) {
    const item = chosen[index];
    const letters = item.options.map((option, i) => "**" + (i + 1) + ".** " + option).join("\n");
    await thread.send("**Rodada " + (index + 1) + "/3**\n" + item.prompt + "\n\n" + letters);
    const answers = new Map();
    const collector = thread.createMessageCollector({
      filter: message => !message.author.bot && !answers.has(message.author.id),
      time: 20000
    });
    collector.on("collect", message => {
      const value = message.content.trim().toLocaleLowerCase("pt-BR");
      const choice = item.options.findIndex(option => option.toLocaleLowerCase("pt-BR") === value);
      const numeric = /^[1-4]$/.test(value) ? Number(value) - 1 : choice;
      if (numeric >= 0 && numeric < 4) {
        answers.set(message.author.id, numeric === item.answer);
        if (numeric === item.answer) totals.set(message.author.id, (totals.get(message.author.id) || 0) + 1);
      }
    });
    await wait(4500);
    await thread.send("🌸 Meu palpite: **" + item.options[item.answer] + "**! Será que vocês também acertaram?");
    await new Promise(resolve => collector.once("end", resolve));
    const winners = [...answers].filter(([, correct]) => correct).length;
    await thread.send("🔎 Resposta: **" + item.options[item.answer] + "**. " + winners + " participante(s) acertaram esta rodada!");
  }
  const ranking = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const result = ranking.length
    ? ranking.map(([id, points], i) => (i + 1) + ". <@" + id + "> — " + points + "/3").join("\n")
    : "Ninguém enviou respostas desta vez, mas valeu pela brincadeira!";
  await thread.send("🏆 **Fim da partida!**\n" + result + "\n\nGostei de jogar com vocês! Qual pergunta foi a mais difícil? 🌸");
  automaticGameRooms.delete(guildId);
  const latest = await readState(repository, guildId);
  if (latest.active?.kind === "automatic-game") {
    latest.active.status = "completed";
    await writeState(repository, guildId, latest);
  }
}

export function startCommunityAutomation(client, repository) {
  if (automationStarted) return;
  automationStarted = true;
  setInterval(async () => {
    try {
      for (const guild of client.guilds.cache.values()) {
        const guildId = guild.id;
        const state = await readState(repository, guildId);
        if (state.active?.status === "active" && Date.now() > state.active.endsAt) {
          state.active.status = "expired";
          await writeState(repository, guildId, state);
        }
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
        if (state.activityDay !== today) { state.activityDay = today; state.activitiesToday = 0; await writeState(repository, guildId, state); }
        if (!state.autoEnabled || state.active?.status === "active" || Number(state.activitiesToday || 0) >= 3) continue;
        const offlineAt = offlineSince.get(guildId);
        if (!offlineAt || Date.now() - offlineAt < OFFLINE_GRACE_MS) continue;
        const idleAt = lastActivity.get(guildId) || offlineAt;
        if (Date.now() - idleAt < IDLE_MS) continue;
        if (Date.now() - Number(state.lastAutoAt || 0) < AUTO_COOLDOWN_MS) continue;
        const configuredChatId = await repository.getMomokaChatChannel(guildId).catch(() => null);
        const channelId = configuredChatId || state.eventChannelId || lastActivityChannel.get(guildId);
        const channel = channelId ? await client.channels.fetch(channelId).catch(() => null) : null;
        if (!channel?.isTextBased?.() || !channel.threads?.create) continue;
        if (Math.random() < 0.5) {
          await startAutomaticGame(client, repository, guildId, channel, state);
        } else {
          await createEvent(client, repository, guildId, channel, {
            ...chooseSurprise(state), kind: "automatic"
          });
          const refreshed = await readState(repository, guildId);
          refreshed.lastAutoAt = Date.now();
          refreshed.activitiesToday = Number(refreshed.activitiesToday || 0) + 1;
          refreshed.activityDay = today;
          refreshed.recentScenarioIds = state.recentScenarioIds;
          await writeState(repository, guildId, refreshed);
        }
      }
    } catch (error) {
      console.error("Falha na verificação de missões automáticas:", error.message);
    }
  }, 60 * 1000);
}

