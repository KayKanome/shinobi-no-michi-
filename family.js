import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from "discord.js";
import { renderFamilyTree } from "./family-tree.js";

export function familyCommands() {
  return [
    new SlashCommandBuilder().setName("familia").setDescription("Veja sua família, casamento e pedidos recebidos."),
    new SlashCommandBuilder().setName("adotar").setDescription("Envie um pedido de adoção.").addUserOption(o => o.setName("jogador").setDescription("Quem você deseja adotar como filho ou filha.").setRequired(true)),
    new SlashCommandBuilder().setName("aceitar_adocao").setDescription("Aceite um pedido de adoção.").addUserOption(o => o.setName("responsavel").setDescription("Quem enviou o pedido.").setRequired(true)),
    new SlashCommandBuilder().setName("recusar_adocao").setDescription("Recuse um pedido de adoção.").addUserOption(o => o.setName("responsavel").setDescription("Quem enviou o pedido.").setRequired(true)),
    new SlashCommandBuilder().setName("cancelar_adocao").setDescription("Cancele um pedido de adoção.").addUserOption(o => o.setName("jogador").setDescription("A outra pessoa envolvida.").setRequired(true)),
    new SlashCommandBuilder().setName("desertar").setDescription("Encerre um vínculo de adoção com confirmação.").addUserOption(o => o.setName("jogador").setDescription("Seu responsável ou filho adotivo.").setRequired(true)),
    new SlashCommandBuilder().setName("casar").setDescription("Peça outra pessoa em casamento.").addUserOption(o => o.setName("jogador").setDescription("Com quem deseja se casar.").setRequired(true)),
    new SlashCommandBuilder().setName("aceitar_casamento").setDescription("Aceite um pedido de casamento.").addUserOption(o => o.setName("pessoa").setDescription("Quem enviou o pedido.").setRequired(true)),
    new SlashCommandBuilder().setName("recusar_casamento").setDescription("Recuse um pedido de casamento.").addUserOption(o => o.setName("pessoa").setDescription("Quem enviou o pedido.").setRequired(true)),
    new SlashCommandBuilder().setName("cancelar_casamento").setDescription("Encerre um casamento ou cancele um pedido.").addUserOption(o => o.setName("pessoa").setDescription("A outra pessoa envolvida.").setRequired(true)),
    new SlashCommandBuilder().setName("papel").setDescription("Altere como deseja aparecer no casamento.").addStringOption(o => o.setName("papel").setDescription("Seu papel").setRequired(true).addChoices({name:"Cônjuge",value:"conjuge"},{name:"Marido",value:"marido"},{name:"Esposa",value:"esposa"}))
  ];
}
const validOther = (user, interaction) => user && !user.bot && user.id !== interaction.user.id;

export async function handleFamilyCommand(interaction, repository) {
  const actorId = `discord:${interaction.user.id}`;
  const command = interaction.commandName;
  if (command === "familia") {
    await interaction.deferReply({ephemeral:true});
    const player=await repository.getPlayer(actorId);
    if(!player)return interaction.editReply("Você ainda não criou seu personagem. Use !registrar SeuNome primeiro.");
    const family=await repository.getFamily(actorId);
    const png=await renderFamilyTree({player,family,ownerId:interaction.user.id,client:interaction.client});
    const attachment=new AttachmentBuilder(png,{name:"arvore-genealogica.png"});
    const embed=new EmbedBuilder().setColor(0xB68A45).setTitle(`🌳 Linhagem de ${player.name}`).setDescription("Uma história, muitos laços. Cada retrato representa alguém que faz parte da sua família.").setImage("attachment://arvore-genealogica.png").setFooter({text:"Shinobi no Michi • Árvore genealógica"});
    return interaction.editReply({embeds:[embed],files:[attachment]});
  }
  if (command === "adotar") {
    const target = interaction.options.getUser("jogador");
    if (!validOther(target, interaction)) return interaction.reply({ content: "Escolha outro jogador que tenha personagem registrado. 🌸", ephemeral: true });
    if (!await repository.getPlayer(actorId)) return interaction.reply({ content: "Você precisa registrar seu personagem com !registrar antes de adotar.", ephemeral: true });
    if (!await repository.getPlayer(`discord:${target.id}`)) return interaction.reply({ content: "Essa pessoa ainda não registrou um personagem no RPG.", ephemeral: true });
    const result = await repository.createAdoptionRequest(actorId, `discord:${target.id}`);
    if (result !== "created") return interaction.reply({ content: "Já existe um pedido ou vínculo ativo entre vocês.", ephemeral: true });
    await interaction.reply({content:"🌸 Convite publicado neste canal.",ephemeral:true});
    const embed=new EmbedBuilder().setColor(0x8DBB83).setTitle("🌱 Um novo laço pode nascer").setDescription(`${interaction.user} deseja adotar ${target} e construir uma família no Shinobi no Michi. ${target}, você aceita?`).setFooter({text:"A decisão é sua. O vínculo só começa com seu consentimento."});
    const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`family:adoption:accept:${interaction.user.id}:${target.id}`).setLabel("Aceitar").setEmoji("🌸").setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`family:adoption:decline:${interaction.user.id}:${target.id}`).setLabel("Recusar").setEmoji("🍃").setStyle(ButtonStyle.Secondary));
    await interaction.channel.send({content:target.toString(),embeds:[embed],components:[row],allowedMentions:{users:[target.id]}});
    return;
  }
  if (command === "desertar") {
    const other = interaction.options.getUser("jogador");
    if (!validOther(other, interaction)) return interaction.reply({ content: "Selecione a outra pessoa envolvida na adoção.", ephemeral: true });
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import("discord.js");
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`family:desertar:confirm:${interaction.user.id}:${other.id}`).setLabel("Sim, desvincular").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`family:desertar:cancel:${interaction.user.id}:${other.id}`).setLabel("Não, voltar").setStyle(ButtonStyle.Secondary)
    );
    return interaction.reply({ content: `🌿 Você confirma que deseja encerrar o vínculo de adoção com ${other}? A árvore familiar será atualizada e o histórico será preservado.`, components: [row], ephemeral: true });
  }
  if (command === "cancelar_adocao") {
    const other = interaction.options.getUser("jogador");
    if (!validOther(other, interaction)) return interaction.reply({ content: "Selecione a outra pessoa envolvida na adoção.", ephemeral: true });
    const ok = await repository.cancelAdoption(actorId, `discord:${other.id}`);
    return interaction.reply({ content: ok ? "🌿 Pedido/vínculo de adoção encerrado. O histórico foi preservado." : "Não encontrei pedido pendente ou adoção ativa entre vocês.", ephemeral: true });
  }
  if (["aceitar_adocao", "recusar_adocao"].includes(command)) {
    const parent = interaction.options.getUser("responsavel");
    if (!validOther(parent, interaction)) return interaction.reply({ content: "Selecione quem enviou o pedido.", ephemeral: true });
    const parentId = `discord:${parent.id}`;
    const childPlayer = await repository.getPlayer(actorId);
    const parentPlayer = await repository.getPlayer(parentId);
    if (!childPlayer || !parentPlayer) return interaction.reply({ content: "Os dois jogadores precisam ter personagens registrados.", ephemeral: true });
    if (command === "recusar_adocao") {
      const ok = await repository.declineAdoptionRequest(parentId, actorId);
      return interaction.reply({ content: ok ? "Pedido de adoção recusado." : "Não encontrei um pedido pendente dessa pessoa.", ephemeral: true });
    }
    const result = await repository.acceptAdoptionRequest(parentId, actorId);
    if (result === "missing") return interaction.reply({ content: "Não encontrei um pedido pendente dessa pessoa.", ephemeral: true });
    if (result === "cycle") return interaction.reply({ content: "Esse vínculo criaria um ciclo na árvore familiar e não pode ser registrado.", ephemeral: true });
    if (result === "exists") return interaction.reply({ content: "Esse vínculo familiar já existe.", ephemeral: true });
    return interaction.reply({ content: `🌳 A adoção foi confirmada! ${parentPlayer.name} agora é responsável por ${childPlayer.name}.`, ephemeral: false });
  }
  if (command === "casar") {
    const target = interaction.options.getUser("jogador");
    if (!validOther(target, interaction)) return interaction.reply({ content: "Escolha outra pessoa para pedir em casamento.", ephemeral: true });
    if (!await repository.getPlayer(actorId) || !await repository.getPlayer(`discord:${target.id}`)) return interaction.reply({ content: "Os dois jogadores precisam ter personagens registrados.", ephemeral: true });
    const result = await repository.createMarriageRequest(actorId, `discord:${target.id}`);
    if (result === "married") return interaction.reply({ content: "Uma das pessoas já possui casamento ativo. Para casar novamente, encerre o vínculo atual primeiro.", ephemeral: true });
    if (result === "related") return interaction.reply({ content: "Não é possível casar com alguém que já faz parte da sua família ou possui parentesco registrado com você.", ephemeral: true });
    if (result !== "created") return interaction.reply({ content: "Já existe um pedido de casamento entre vocês.", ephemeral: true });
    await interaction.reply({content:"💍 Pedido publicado neste canal.",ephemeral:true});
    const embed=new EmbedBuilder().setColor(0xE89BB5).setTitle("💍 Um pedido especial").setDescription(`${interaction.user} gostaria de construir uma história a dois com ${target} no Shinobi no Michi. ${target}, você aceita?`).setFooter({text:"O registro inicial será neutro: Cônjuge. Use /papel para alterar entre esposa ou marido quando quiser."});
    const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`family:marriage:accept:${interaction.user.id}:${target.id}`).setLabel("Aceitar").setEmoji("💗").setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`family:marriage:decline:${interaction.user.id}:${target.id}`).setLabel("Recusar").setEmoji("🍃").setStyle(ButtonStyle.Secondary));
    await interaction.channel.send({content:target.toString(),embeds:[embed],components:[row],allowedMentions:{users:[target.id]}});
    return;
  }
  if (["aceitar_casamento", "recusar_casamento"].includes(command)) {
    const proposer = interaction.options.getUser("pessoa");
    if (!validOther(proposer, interaction)) return interaction.reply({ content: "Selecione quem enviou o pedido.", ephemeral: true });
    const proposerId = `discord:${proposer.id}`;
    if (!await repository.getPlayer(actorId) || !await repository.getPlayer(proposerId)) return interaction.reply({ content: "Os dois jogadores precisam ter personagens registrados.", ephemeral: true });
    if (command === "recusar_casamento") {
      const ok = await repository.declineMarriageRequest(proposerId, actorId);
      return interaction.reply({ content: ok ? "Pedido de casamento recusado." : "Não encontrei um pedido pendente dessa pessoa.", ephemeral: true });
    }
    const result = await repository.acceptMarriageRequest(proposerId, actorId);
    if (result === "missing") return interaction.reply({ content: "Não encontrei um pedido pendente dessa pessoa.", ephemeral: true });
    if (result === "married") return interaction.reply({ content: "Uma das pessoas já possui casamento ativo.", ephemeral: true });
    if (result === "related") return interaction.reply({ content: "O casamento não pode ser confirmado porque existe parentesco registrado entre vocês.", ephemeral: true });
    return interaction.reply({ content: `💍 Casamento confirmado! ${interaction.user.username} e ${proposer.username} agora estão casados no Shinobi no Michi.`, ephemeral: false });
  }
  if (command === "papel") {
    const role=interaction.options.getString("papel"),ok=await repository.setMarriageRole(actorId,role);
    return interaction.reply({content:ok?`🌸 Seu papel agora está registrado como **${role==="conjuge"?"Cônjuge":role}**. As árvores da família serão atualizadas.`:"Você precisa ter um casamento ativo para alterar seu papel.",ephemeral:true});
  }
  if (command === "cancelar_casamento") {
    const other = interaction.options.getUser("pessoa");
    if (!validOther(other, interaction)) return interaction.reply({ content: "Selecione a outra pessoa envolvida.", ephemeral: true });
    const ok = await repository.cancelMarriage(actorId, `discord:${other.id}`);
    return interaction.reply({ content: ok ? "💔 Casamento/pedido encerrado. O histórico foi preservado." : "Não encontrei casamento ativo ou pedido pendente entre vocês.", ephemeral: true });
  }
}
