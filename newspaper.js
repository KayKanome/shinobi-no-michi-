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
function newspaperEmbed(label, headline, body, editionNote = "Plantão da vila") {
  return new EmbedBuilder()
    .setColor(0xD96FA8)
    .setAuthor({ name: "KONOHAGAKURE • IMPRENSA DA VILA" })
    .setTitle("📰 Jornal de Konohagakure")
    .setDescription(("*" + label.toLocaleUpperCase("pt-BR") + "*\n\n# " + headline + "\n\n" + body).slice(0, 3900))
    .setThumbnail("https://cdn.discordapp.com/embed/avatars/5.png")
    .addFields({ name: "💬 Da redação", value: "“A vila nunca fica sem histórias. E eu estarei por aqui para contar cada uma delas!” — Momoka 🌸" })
    .setFooter({ text: editionNote + " • Shinobi no Michi" })
    .setTimestamp();
}

let newspaperClient = null;
const pendingEditions = new Map();

function articleHeadline(item) {
  const category = String(item.category || "").toLowerCase();
  if (category.includes("interação")) return "Pequenos gestos movimentam a vila";
  if (category.includes("rp") || category.includes("interpretação")) return "Uma nova história ganha vida em Konohagakure";
  if (category.includes("jogo") || category.includes("partida")) return "Competição e diversão agitam a comunidade";
  if (category.includes("missão")) return "Shinobis entram em ação";
  if (category.includes("evento")) return "A vila se reúne para um novo acontecimento";
  return "Um novo acontecimento entra para a história da vila";
}
function articleText(item) {
  const value = String(item.text || "").trim();
  return value ? value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1) : "Um acontecimento chamou a atenção dos moradores.";
}

async function publishEdition(client, repository, guildId, label, entries, weekly = false) {
  const state = await getState(repository, guildId);
  const channelId = state.newspaperChannelId;
  const channel = channelId ? await client.channels.fetch(channelId).catch(() => null) : null;
  if (!channel?.isTextBased?.() || !channel.guild) return false;
  const stories = entries.slice(-8);
  const headline = stories.length === 1
    ? articleHeadline(stories[0])
    : weekly ? "A semana em que a vila não ficou parada" : "A movimentação recente de Konohagakure";
  const opening = weekly
    ? "Boa noite, moradores! 🌙 A semana chega ao fim, e nossa equipe reuniu histórias que merecem ser lembradas. Confira os destaques:"
    : "Atenção, moradores! 📣 Nossa equipe acompanhou de perto os acontecimentos e traz agora os detalhes que estão movimentando Konohagakure.";
  const bodyStories = stories.length
    ? stories.map(item => "**" + String(item.category || "Notícia da vila") + "**\n" + articleText(item)).join("\n\n")
    : "Por enquanto, os corredores da vila estão tranquilos. Mas fiquem atentos: basta um novo acontecimento para a próxima edição chegar! 🌸";
  const closing = weekly
    ? "\n\n**E esse foi o resumo da semana!** Obrigada a todos que fizeram parte dessas histórias. Até a próxima edição! — Momoka 📰"
    : "\n\n**E a história continua...** Nossa equipe seguirá de olho nos próximos acontecimentos. Se algo movimentar a vila, vocês saberão por aqui! — Momoka 🌸";
  const body = (opening + "\n\n" + bodyStories + closing).slice(0, 3000);
  await channel.send({
    content: "@everyone",
    embeds: [newspaperEmbed(label, headline, body, weekly ? "Edição semanal" : "Plantão da vila")],
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
  client.once("ready", () => { newspaperClient = client; run(); setInterval(run, 60 * 60 * 1000); });
}
