import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

const PINK = 0xE879B5;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const newspaperSlashCommands = [
  new SlashCommandBuilder().setName("jornal").setDescription("Configura e publica o Jornal de Konohagakure.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("configurar").setDescription("Escolhe o canal do jornal.")
      .addChannelOption(o => o.setName("canal").setDescription("Canal onde o jornal será publicado.").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName("publicar").setDescription("Publica uma edição com os acontecimentos recentes."))
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

async function publishEdition(client, repository, guildId, label, entries, weekly = false) {
  const state = await getState(repository, guildId);
  const channelId = state.newspaperChannelId;
  const channel = channelId ? await client.channels.fetch(channelId).catch(() => null) : null;
  if (!channel?.isTextBased?.() || !channel.guild) return false;

  const stories = entries.slice(-6);
  const headline = stories.length === 1
    ? articleHeadline(stories[0])
    : weekly ? "Os acontecimentos que marcaram a semana"
      : "As últimas notícias da nossa vila";
  const edition = newspaperEmbed(label, headline, stories, weekly);
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
  const entries = Array.isArray(state.newspaperEntries) ? state.newspaperEntries : [];
  const entry = { at: Date.now(), category: moment.category || "Momento da vila", text: String(moment.text).slice(0, 450) };
  entries.push(entry);
  state.newspaperEntries = entries.slice(-150);
  await saveState(repository, guildId, state);

  // Junta acontecimentos muito próximos em um plantão, sem transformar o jornal em spam.
  if (!newspaperClient || !state.newspaperChannelId) return;
  const pending = pendingEditions.get(guildId) || { entries: [], timer: null };
  pending.entries.push(entry);
  if (pending.timer) clearTimeout(pending.timer);
  pending.timer = setTimeout(async () => {
    pendingEditions.delete(guildId);
    try {
      await publishEdition(newspaperClient, repository, guildId, "Plantão • Aconteceu na vila", pending.entries.slice(-8), false);
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
