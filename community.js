import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

const IDLE_MS = 90 * 60 * 1000;
const AUTO_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const lastActivity = new Map();
const lastActivityChannel = new Map();
let automationStarted = false;

function isStaff(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
}
async function readState(repository, guildId) {
  return await repository.getCommunityState(guildId) || {
    eventChannelId: null, autoEnabled: false, lastAutoAt: 0, active: null
  };
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
    .setFooter({ text: event.status === "completed" ? "Missão concluída pela aldeia!" : "Missão comunitária • Shinobi no Michi" });
}
async function publishEvent(client, repository, guildId, channel, event) {
  const message = await channel.send({ embeds: [eventEmbed(event)] });
  event.messageId = message.id;
  const state = await readState(repository, guildId);
  state.active = event;
  await writeState(repository, guildId, state);
  return message;
}
async function createEvent(client, repository, guildId, channel, data) {
  const now = Date.now();
  const event = {
    id: now.toString(36), title: data.title, description: data.description,
    createdAt: now, endsAt: now + data.duration * 60000, goal: data.goal, channelId: channel.id,
    progress: 0, participants: [], status: "active", lastAnnouncedProgress: 0,
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
    .addSubcommand(s => s.setName("ativar").setDescription("Ativa missões surpresa após períodos de silêncio."))
    .addSubcommand(s => s.setName("desativar").setDescription("Desativa o início automático de missões.")),
  new SlashCommandBuilder().setName("evento").setDescription("Cria e controla eventos da aldeia.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("criar").setDescription("Cria um evento coletivo.")
      .addStringOption(o => o.setName("titulo").setDescription("Nome do evento").setMaxLength(80).setRequired(true))
      .addStringOption(o => o.setName("descricao").setDescription("História e objetivo do evento").setMaxLength(800).setRequired(true))
      .addIntegerOption(o => o.setName("duracao").setDescription("Duração em minutos").setMinValue(5).setMaxValue(10080).setRequired(true))
      .addIntegerOption(o => o.setName("meta").setDescription("Pontos coletivos necessários").setMinValue(10).setMaxValue(100000).setRequired(true)))
    .addSubcommand(s => s.setName("configurar").setDescription("Escolhe o canal dos eventos automáticos.")
      .addChannelOption(o => o.setName("canal").setDescription("Canal de eventos").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName("parar").setDescription("Encerra o evento ativo.")),
];

export async function handleCommunityCommand(interaction, client, repository) {
  if (!["missao", "evento"].includes(interaction.commandName)) return false;
  if (!isStaff(interaction)) {
    await interaction.reply({ content: "Este comando é exclusivo da staff com permissão de gerenciar o servidor. 🌸", ephemeral: true });
    return true;
  }
  const action = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  const state = await readState(repository, guildId);

  if (interaction.commandName === "missao" && action === "ativar") {
    state.autoEnabled = true;
    await writeState(repository, guildId, state);
    await interaction.reply({ content: "Missões surpresa ativadas! Se o chat ficar 90 minutos sem atividade, a Momoka poderá lançar uma missão automática. 🌸", ephemeral: true });
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
    if (!state.active || state.active.status !== "active") {
      await interaction.reply({ content: "Não há missão ou evento ativo neste momento.", ephemeral: true });
      return true;
    }
    state.active.status = "stopped";
    await writeState(repository, guildId, state);
    await interaction.reply({ content: "A missão/evento ativo foi encerrado. 🌸", ephemeral: true });
    return true;
  }
  if (interaction.commandName === "missao" && action === "forcar") {
    const channelId = state.eventChannelId || interaction.channelId;
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased?.()) {
      await interaction.reply({ content: "Não encontrei um canal de texto para publicar. Use /evento configurar primeiro.", ephemeral: true });
      return true;
    }
    if (state.active?.status === "active") {
      await interaction.reply({ content: "Já existe uma missão/evento ativo. Encerre-o antes de lançar outro.", ephemeral: true });
      return true;
    }
    const event = await createEvent(client, repository, guildId, channel, {
      title: "🚨 Missão surpresa: A névoa de chakra!",
      description: "Uma névoa de chakra fictícia começou a cobrir a praça central da aldeia! A Momoka precisa da ajuda dos shinobi para estabilizar os selos antes que o fenômeno alcance toda a vila.\n\nReúnam pontos jogando os desafios do painel. Cada partida concluída ajuda a conter a névoa!",
      duration: 30, goal: 120, kind: "momoka"
    });
    state.lastAutoAt = Date.now();
    await writeState(repository, guildId, state);
    await interaction.reply({ content: "Missão surpresa publicada em " + channel + "! 🌸", ephemeral: true });
    return true;
  }
  if ((interaction.commandName === "missao" && action === "criar") || (interaction.commandName === "evento" && action === "criar")) {
    if (state.active?.status === "active") {
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

export function noteCommunityActivity(message) {
  if (!message.guild || message.author.bot || !message.content?.trim()) return;
  lastActivity.set(message.guild.id, Date.now());
  lastActivityChannel.set(message.guild.id, message.channelId);
}

export async function recordCommunityGame(client, repository, guildId, playerId, points) {
  if (!guildId) return;
  const state = await readState(repository, guildId);
  const event = state.active;
  if (!event || event.status !== "active" || Date.now() > event.endsAt) return;
  event.progress += Math.max(0, Number(points) || 0);
  if (!event.participants.includes(playerId)) event.participants.push(playerId);
  if (event.progress >= event.goal) {
    event.status = "completed";
    await writeState(repository, guildId, state);
    const channel = await client.channels.fetch(state.eventChannelId || event.channelId).catch(() => null);
    if (channel?.isTextBased?.()) await channel.send("🎉 **MISSÃO CONCLUÍDA!** A aldeia conseguiu estabilizar os selos e dissipar a névoa de chakra! Parabéns a todos os participantes! 🌸");
    return;
  }
  if (event.progress - event.lastAnnouncedProgress >= 50) {
    event.lastAnnouncedProgress = event.progress;
    await writeState(repository, guildId, state);
    const channel = await client.channels.fetch(state.eventChannelId || event.channelId).catch(() => null);
    if (channel?.isTextBased?.()) await channel.send("🌸 A missão avançou! Progresso coletivo: **" + event.progress + "/" + event.goal + "** pontos.");
    return;
  }
  await writeState(repository, guildId, state);
}

export function startCommunityAutomation(client, repository) {
  if (automationStarted) return;
  automationStarted = true;
  setInterval(async () => {
    try {
      for (const [guildId, lastAt] of lastActivity.entries()) {
        const state = await readState(repository, guildId);
        if (!state.autoEnabled || state.active?.status === "active") continue;
        if (Date.now() - lastAt < IDLE_MS) continue;
        if (Date.now() - Number(state.lastAutoAt || 0) < AUTO_COOLDOWN_MS) continue;
        const channelId = state.eventChannelId || lastActivityChannel.get(guildId);
        const channel = channelId ? await client.channels.fetch(channelId).catch(() => null) : null;
        if (!channel?.isTextBased?.()) continue;
        const event = await createEvent(client, repository, guildId, channel, {
          title: "🌙 Missão surpresa: Um chamado na aldeia!",
          description: "A vila ficou tranquila por um bom tempo, mas um selo antigo começou a perder energia na praça! A Momoka convoca os shinobi para uma missão coletiva.\n\nJoguem os desafios do painel em `/jogo` para reunir pontos e restaurar o selo antes do prazo!",
          duration: 30, goal: 120, kind: "automatic"
        });
        state.lastAutoAt = Date.now();
        await writeState(repository, guildId, state);
      }
    } catch (error) {
      console.error("Falha na verificação de missões automáticas:", error.message);
    }
  }, 60 * 1000);
}

