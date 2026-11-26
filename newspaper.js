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
function newspaperEmbed(label, body) {
  return new EmbedBuilder()
    .setColor(PINK)
    .setTitle("📰 Jornal de Konohagakure")
    .setDescription("*" + label.toLocaleUpperCase("pt-BR") + "*\n\n" + body)
    .setFooter({ text: "Momoka • As histórias da vila, contadas por quem vive nelas." })
    .setTimestamp();
}

export async function recordNewspaperMoment(repository, guildId, moment) {
  if (!guildId || !moment?.text) return;
  const state = await getState(repository, guildId);
  const entries = Array.isArray(state.newspaperEntries) ? state.newspaperEntries : [];
  entries.push({ at: Date.now(), category: moment.category || "Momento da vila", text: String(moment.text).slice(0, 450) });
  state.newspaperEntries = entries.slice(-150);
  await saveState(repository, guildId, state);
}

async function publishEdition(client, repository, guildId, label, entries, weekly = false) {
  const state = await getState(repository, guildId);
  const channelId = state.newspaperChannelId;
  const channel = channelId ? await client.channels.fetch(channelId).catch(() => null) : null;
  if (!channel?.isTextBased?.()) return false;
  const sections = entries.length
    ? entries.map((item, i) => "**" + (i + 1) + ". " + item.category + "**\n" + item.text).join("\n\n")
    : "A vila esteve tranquila desta vez, mas novas histórias ainda estão por vir. 🌸";
  const body = (weekly ? "**O que aconteceu nesta semana:**\n\n" : "**Acontecimento em destaque:**\n\n") + sections;
  await channel.send({
    content: "@everyone",
    embeds: [newspaperEmbed(label, body)],
    allowedMentions: { parse: ["everyone"] }
  });
  if (weekly) {
    state.lastWeeklyNewspaperAt = Date.now();
    state.newspaperEntries = [];
    await saveState(repository, guildId, state);
  }
  return true;
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
        const last = Number(state.lastWeeklyNewspaperAt || 0);
        if (Date.now() - last < WEEK_MS) continue;
        const entries = (state.newspaperEntries || []).filter(item => Date.now() - item.at <= WEEK_MS).slice(-20);
        await publishEdition(client, repository, guild.id, "Edição semanal • Resumo da semana", entries, true);
      } catch (error) {
        console.error("Falha ao publicar edição semanal:", error.message);
      }
    }
  };
  client.once("ready", () => { run(); setInterval(run, 60 * 60 * 1000); });
}
