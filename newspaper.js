import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

const PINK = 0xE879B5;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const newspaperSlashCommands = [
  new SlashCommandBuilder().setName("jornal").setDescription("Configura e publica o Jornal de Konohagakure.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("configurar").setDescription("Escolhe o canal do jornal.")
      .addChannelOption(o => o.setName("canal").setDescription("Canal onde o jornal será publicado.").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName("publicar").setDescription("Publica uma edição com os acontecimentos recentes."))
    .addSubcommand(s => s.setName("ignorar-adicionar").setDescription("Impede o jornal de registrar acontecimentos deste canal.")
      .addChannelOption(o => o.setName("canal").setDescription("Canal que o jornal deve ignorar.").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName("ignorar-remover").setDescription("Permite que o jornal volte a registrar este canal.")
      .addChannelOption(o => o.setName("canal").setDescription("Canal que deixará de ser ignorado.").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName("ignorar-listar").setDescription("Mostra os canais ignorados pelo jornal."))
    .addSubcommand(s => s.setName("categoria-adicionar").setDescription("Ignora uma categoria inteira.")
      .addChannelOption(o => o.setName("categoria").setDescription("Categoria a proteger.").addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
    .addSubcommand(s => s.setName("categoria-remover").setDescription("Remove uma categoria da lista de ignoradas.")
      .addChannelOption(o => o.setName("categoria").setDescription("Categoria a liberar.").addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
    .addSubcommand(s => s.setName("categoria-listar").setDescription("Mostra as categorias ignoradas pelo Jornal."))
];

async function getState(repository, guildId) {
  return await repository.getCommunityState(guildId) || { active: null };
}
async function saveState(repository, guildId, state) {
  await repository.setCommunityState(guildId, state);
}
function newspaperEmbed(label, headline, entries, weekly = false) {
  const edition = weekly ? "EDIÇÃO SEMANAL" : "PLANTÃO EXTRAORDINÁRIO";
  const embed = new EmbedBuilder()
    .setColor(0xB85C87)
    .setAuthor({ name: "📰  O CORREIO DE KONOHAGAKURE  •  IMPRENSA DA VILA" })
    .setTitle(headline)
    .setDescription("**" + edition + "  |  " + label.toLocaleUpperCase("pt-BR") + "**\n\n" +
      (weekly
        ? "Boa noite, Konohagakure! 🌙 A semana foi cheia de acontecimentos, encontros e histórias. Nossa redação reuniu os fatos que merecem ficar na memória da vila."
        : "Atenção, moradores! 📯 Aconteceu, a Momoka ficou sabendo — e a notícia chegou à redação! Confira o que está movimentando a nossa vila."))
    .setFooter({ text: "Momoka • Repórter de Konohagakure  |  Shinobi no Michi" })
    .setTimestamp();

  for (const item of entries.slice(-6)) {
    const category = String(item.category || "Notícia da vila").slice(0, 80);
    const text = String(item.text || "Um acontecimento chamou a atenção dos moradores.").slice(0, 900);
    embed.addFields({ name: "✦ " + category, value: text });
  }
  embed.addFields({
    name: "🌸 Comentário da Momoka",
    value: weekly
      ? "Que semana, hein? Cada morador ajudou a escrever um pedacinho dessa história. Já estou curiosa para descobrir o que vem pela frente!"
      : "Parece que a vila não sabe ficar parada nem por um instante! Vou continuar de olho — qualquer novidade importante, vocês serão os primeiros a saber. 😉"
  });
  return embed;
}

let newspaperClient = null;
const pendingEditions = new Map();

function articleHeadline(item) {
  const category = String(item.category || "").toLowerCase();
  if (category.includes("interação")) return "Gestos simples, histórias que aproximam";
  if (category.includes("rp") || category.includes("interpretação")) return "Uma nova história começa a ser escrita";
  if (category.includes("jogo") || category.includes("partida")) return "Disputa movimenta a comunidade";
  if (category.includes("missão")) return "Shinobis entram em ação";
  if (category.includes("evento")) return "A vila se reúne em clima de celebração";
  return "Acontecimento movimenta Konohagakure";
}


async function isNewspaperExcluded(client, state, channelId) {
  if (!channelId) return false;
  const ignoredChannels = Array.isArray(state.newspaperIgnoredChannelIds) ? state.newspaperIgnoredChannelIds : [];
  if (ignoredChannels.includes(channelId)) return true;
  const channel = client.channels.cache.get(channelId) || await client.channels.fetch(channelId).catch(() => null);
  const parentId = channel?.parentId || null;
  const ignoredCategories = Array.isArray(state.newspaperIgnoredCategoryIds) ? state.newspaperIgnoredCategoryIds : [];
  if (parentId && ignoredCategories.includes(parentId)) return true;
  const categoryName = String(channel?.parent?.name || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return /staff|equipe|modera|administra|diretoria|reuniao/.test(categoryName);
}

async function publishEdition(client, repository, guildId, label, entries, weekly = false) {
  const state = await getState(repository, guildId);
  const channelId = state.newspaperChannelId;
  const channel = channelId ? await client.channels.fetch(channelId).catch(() => null) : null;
  if (!channel?.isTextBased?.() || !channel.guild) {
    console.error("Jornal automático: canal configurado não encontrado ou sem acesso.", { guildId, channelId });
    return false;
  }

  const stories = [];
  for (const item of entries) if (!(await isNewspaperExcluded(client, state, item.channelId))) stories.push(item);
  const visibleStories = stories.slice(-6);
  const headline = visibleStories.length === 1
    ? articleHeadline(visibleStories[0])
    : weekly ? "Os acontecimentos que marcaram a semana"
      : "As últimas notícias da nossa vila";
  const edition = newspaperEmbed(label, headline, visibleStories, weekly);
  await channel.send({
    content: "@everyone",
    embeds: [edition],
    allowedMentions: { parse: ["everyone"] }
  });
  if (weekly) {
    state.lastWeeklyNewspaperAt = Date.now();
    state.newspaperEntries = [];
    await saveState(repository, guildId, state);
  }
  return true;
}

export async function recordNewspaperMoment(repository, guildId, moment) {
  if (!guildId || !moment?.text) return;
  const state = await getState(repository, guildId);
  if (newspaperClient && await isNewspaperExcluded(newspaperClient, state, moment.channelId)) return;
  const entries = Array.isArray(state.newspaperEntries) ? state.newspaperEntries : [];
  const entry = { at: Date.now(), channelId: moment.channelId || null, category: moment.category || "Momento da vila", text: String(moment.text).slice(0, 450) };
  entries.push(entry);
  state.newspaperEntries = entries.slice(-150);
  await saveState(repository, guildId, state);

  // Junta acontecimentos muito próximos em um plantão, sem transformar o jornal em spam.
  if (!newspaperClient) {
    console.error("Jornal automático: cliente Discord ainda não está pronto.", { guildId });
    return;
  }
  if (!state.newspaperChannelId) {
    console.warn("Jornal automático: nenhum canal configurado para este servidor.", { guildId });
    return;
  }
  const pending = pendingEditions.get(guildId) || { entries: [], timer: null };
  pending.entries.push(entry);
  if (pending.timer) clearTimeout(pending.timer);
  pending.timer = setTimeout(async () => {
    pendingEditions.delete(guildId);
    try {
      const published = await publishEdition(newspaperClient, repository, guildId, "Plantão • Aconteceu na vila", pending.entries.slice(-8), false);
      if (published) console.log("Jornal automático publicado.", { guildId, stories: pending.entries.length });
      else console.error("Jornal automático não publicado: confira o canal e as permissões.", { guildId });
    } catch (error) {
      console.error("Falha ao enviar plantão do jornal:", error.message);
    }
  }, 20000);
  pendingEditions.set(guildId, pending);
}

export async function handleNewspaperCommand(interaction, client, repository) {
  if (interaction.commandName !== "jornal") return false;
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ content: "Este comando é exclusivo da staff com permissão de gerenciar o servidor. 🌸", ephemeral: true });
    return true;
  }
  const action = interaction.options.getSubcommand();
  const state = await getState(repository, interaction.guildId);
  if (action === "configurar") {
    const channel = interaction.options.getChannel("canal");
    state.newspaperChannelId = channel.id;
    await saveState(repository, interaction.guildId, state);
    await interaction.reply({ content: "📰 O Jornal de Konohagakure será publicado em " + channel + ". As edições e notícias importantes marcarão @everyone.", ephemeral: true });
    return true;
  }
  if (action === "ignorar-adicionar") {
    const channel = interaction.options.getChannel("canal");
    const ignored = Array.isArray(state.newspaperIgnoredChannelIds) ? state.newspaperIgnoredChannelIds : [];
    if (ignored.includes(channel.id)) {
      await interaction.reply({ content: channel + " já está na lista de canais ignorados pelo jornal. 🌸", ephemeral: true });
      return true;
    }
    state.newspaperIgnoredChannelIds = [...ignored, channel.id];
    state.newspaperEntries = (state.newspaperEntries || []).filter(item => item.channelId !== channel.id);
    const pending = pendingEditions.get(interaction.guildId);
    if (pending) {
      pending.entries = pending.entries.filter(item => item.channelId !== channel.id);
      if (!pending.entries.length) {
        if (pending.timer) clearTimeout(pending.timer);
        pendingEditions.delete(interaction.guildId);
      }
    }
    await saveState(repository, interaction.guildId, state);
    await interaction.reply({ content: "🔒 " + channel + " agora está ignorado pelo Jornal. A Momoka não registrará acontecimentos desse canal nas próximas edições.", ephemeral: true });
    return true;
  }
  if (action === "ignorar-remover") {
    const channel = interaction.options.getChannel("canal");
    const ignored = Array.isArray(state.newspaperIgnoredChannelIds) ? state.newspaperIgnoredChannelIds : [];
    if (!ignored.includes(channel.id)) {
      await interaction.reply({ content: channel + " não está na lista de canais ignorados. 🌸", ephemeral: true });
      return true;
    }
    state.newspaperIgnoredChannelIds = ignored.filter(id => id !== channel.id);
    await saveState(repository, interaction.guildId, state);
    await interaction.reply({ content: "🌸 " + channel + " deixou de ser ignorado. O jornal poderá registrar acontecimentos futuros desse canal.", ephemeral: true });
    return true;
  }
  if (action === "ignorar-listar") {
    const ignored = Array.isArray(state.newspaperIgnoredChannelIds) ? state.newspaperIgnoredChannelIds : [];
    await interaction.reply({
      content: ignored.length ? "🔒 **Canais ignorados pelo Jornal:**\n" + ignored.map(id => "<#" + id + ">").join("\n") : "A lista de canais ignorados está vazia. 🌸",
      ephemeral: true
    });
    return true;
  }

  if (action === "categoria-adicionar") {
    const category = interaction.options.getChannel("categoria");
    const ignored = Array.isArray(state.newspaperIgnoredCategoryIds) ? state.newspaperIgnoredCategoryIds : [];
    if (ignored.includes(category.id)) return interaction.reply({ content: "Essa categoria já está protegida. 🌸", ephemeral: true });
    state.newspaperIgnoredCategoryIds = [...ignored, category.id];
    const kept = [];
    for (const item of state.newspaperEntries || []) if (!(await isNewspaperExcluded(client, state, item.channelId))) kept.push(item);
    state.newspaperEntries = kept;
    const pending = pendingEditions.get(interaction.guildId);
    if (pending) {
      const next = [];
      for (const item of pending.entries) if (!(await isNewspaperExcluded(client, state, item.channelId))) next.push(item);
      pending.entries = next;
      if (!next.length) { clearTimeout(pending.timer); pendingEditions.delete(interaction.guildId); }
    }
    await saveState(repository, interaction.guildId, state);
    return interaction.reply({ content: "🔒 A categoria **" + category.name + "** e todos os canais dentro dela estão excluídos do Jornal.", ephemeral: true });
  }
  if (action === "categoria-remover") {
    const category = interaction.options.getChannel("categoria");
    const ignored = Array.isArray(state.newspaperIgnoredCategoryIds) ? state.newspaperIgnoredCategoryIds : [];
    state.newspaperIgnoredCategoryIds = ignored.filter(id => id !== category.id);
    await saveState(repository, interaction.guildId, state);
    return interaction.reply({ content: "A categoria **" + category.name + "** foi removida da lista manual de bloqueio. Categorias identificadas como staff continuam protegidas automaticamente. 🌸", ephemeral: true });
  }
  if (action === "categoria-listar") {
    const ignored = Array.isArray(state.newspaperIgnoredCategoryIds) ? state.newspaperIgnoredCategoryIds : [];
    return interaction.reply({ content: ignored.length ? "🔒 **Categorias ignoradas:**\\n" + ignored.map(id => "<#" + id + ">").join("\\n") : "Nenhuma categoria adicionada manualmente. Categorias com nomes de staff continuam protegidas automaticamente. 🌸", ephemeral: true });
  }
  await interaction.deferReply({ ephemeral: true });
  const entries = (state.newspaperEntries || []).slice(-20);
  const ok = await publishEdition(client, repository, interaction.guildId, "Edição especial • Acontecimentos recentes", entries, false);
  await interaction.editReply(ok ? "A edição especial foi publicada no canal do jornal! 🌸" : "Configure primeiro o canal com /jornal configurar.");
  return true;
}

export function startNewspaperWeekly(client, repository) {
  const run = async () => {
    for (const guild of client.guilds.cache.values()) {
      try {
        const state = await getState(repository, guild.id);
        if (!state.newspaperChannelId) continue;
        if (!state.lastWeeklyNewspaperAt) {
          state.lastWeeklyNewspaperAt = Date.now();
          await saveState(repository, guild.id, state);
          continue;
        }
        const last = Number(state.lastWeeklyNewspaperAt || 0);
        if (Date.now() - last < WEEK_MS) continue;
        const entries = (state.newspaperEntries || []).filter(item => Date.now() - item.at <= WEEK_MS).slice(-20);
        await publishEdition(client, repository, guild.id, "Edição semanal • Resumo da semana", entries, true);
      } catch (error) {
        console.error("Falha ao publicar edição semanal:", error.message);
      }
    }
  };
  newspaperClient = client;
  run();
  setInterval(run, 60 * 60 * 1000);
}
