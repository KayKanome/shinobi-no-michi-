import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags
} from "discord.js";
import { CLANS, STYLES, SKILLS, ATTRIBUTE_LABELS, normalize, rollDie, getSkillBonus, getClanBonus } from "./engine.js";

const sessions = new Map();
const ATTRIBUTES = Object.keys(ATTRIBUTE_LABELS);
const pick = (items) => items[rollDie(items.length) - 1];
function rollFourDropLowest() {
  const dice = Array.from({ length: 4 }, () => rollDie(6)).sort((a,b) => a-b);
  return { dice, total: dice.slice(1).reduce((sum,n) => sum+n,0) };
}
function render(session) {
  if (!session.clan) return {
    content: "**RENKAGE — CRIAÇÃO DE FICHA**\nPersonagem: **"+session.name+"**\nClique para sortear clã e especializações.",
    components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("rk:draw:"+session.id).setLabel("🎲 Sortear clã e estilos").setStyle(ButtonStyle.Primary))]
  };
  if (!session.rolls) return {
    content: "**SORTEIO CONCLUÍDO**\nClã: **"+session.clan+"**\nEstilo principal: **"+session.primary+"**\nEstilo secundário: **"+session.secondary+"**\n\nRole os seis atributos: 4d6, descartando o menor dado.",
    components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("rk:roll:"+session.id).setLabel("🎲 Rolar os 6 atributos").setStyle(ButtonStyle.Success))]
  };
  if (session.index < 6) {
    const result=session.rolls[session.index];
    const options=ATTRIBUTES.filter(key=>!session.assigned[key]).map(key=>({label:ATTRIBUTE_LABELS[key],value:key,description:"Distribuir o resultado "+result.total}));
    const menu=new StringSelectMenuBuilder().setCustomId("rk:assign:"+session.id+":"+session.index).setPlaceholder("Escolha onde colocar "+result.total).addOptions(options);
    const done=Object.entries(session.assigned).map(([key,value])=>ATTRIBUTE_LABELS[key]+": "+value).join("\n")||"Nenhum atributo distribuído.";
    return {content:"**DISTRIBUIÇÃO DOS ATRIBUTOS**\nResultado "+(session.index+1)+"/6: **"+result.total+"** (dados: "+result.dice.join(", ")+")\n\n**Já distribuídos**\n"+done,components:[new ActionRowBuilder().addComponents(menu)]};
  }
  const attrs=Object.entries(session.assigned).map(([key,value])=>ATTRIBUTE_LABELS[key]+": **"+value+"**").join("\n");
  const bonuses=Object.entries(SKILLS).map(([key,skill])=>skill.label+": estilo +"+getSkillBonus({primary_style:session.primary,secondary_style:session.secondary},key)+", clã +"+getClanBonus({clan:session.clan},key)).join("\n");
  return {content:"**REVISÃO DA FICHA**\nNome: **"+session.name+"**\nClã: **"+session.clan+"**\nEspecialização principal: **"+session.primary+"**\nEspecialização secundária: **"+session.secondary+"**\n\n**Atributos**\n"+attrs+"\n\n**Bônus automáticos**\n"+bonuses+"\n\nConfirme para salvar.",components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("rk:save:"+session.id).setLabel("Confirmar e salvar").setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId("rk:cancel:"+session.id).setLabel("Cancelar").setStyle(ButtonStyle.Secondary))]};
}
export async function startCharacterCreation(message) {
  const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("rk:open:"+message.author.id).setLabel("Abrir criação de personagem").setStyle(ButtonStyle.Primary));
  await message.reply({content:"🎲 **Renkage está pronto para criar sua ficha.** O painel será privado.",components:[row]});
}
export async function handleCharacterInteraction(interaction,pool) {
  if (!interaction.isButton()&&!interaction.isStringSelectMenu()&&!interaction.isModalSubmit()) return false;
  if (!interaction.customId?.startsWith("rk:")) return false;
  const parts=interaction.customId.split(":");
  const action=parts[1], id=parts[2], extra=parts[3];
  if(action==="open") {
    if(interaction.user.id!==id) {await interaction.reply({content:"Este botão pertence a outro jogador.",flags:MessageFlags.Ephemeral});return true;}
    const modal=new ModalBuilder().setCustomId("rk:name:"+id).setTitle("Criar personagem");
    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("name").setLabel("Nome do personagem").setStyle(TextInputStyle.Short).setMinLength(2).setMaxLength(24).setRequired(true)));
    await interaction.showModal(modal);return true;
  }
  if(action==="name") {
    const name=interaction.fields.getTextInputValue("name").trim();
    const old=await pool.query("SELECT name FROM mestre_characters WHERE guild_id=$1 AND owner_id=$2",[interaction.guildId,interaction.user.id]);
    if(old.rowCount){await interaction.reply({content:"Você já possui a ficha **"+old.rows[0].name+"**. Use !mestre ficha.",flags:MessageFlags.Ephemeral});return true;}
    const sessionId=interaction.id;
    sessions.set(sessionId,{id:sessionId,owner:interaction.user.id,guild:interaction.guildId,name,assigned:{},index:0});
    await interaction.reply({...render(sessions.get(sessionId)),flags:MessageFlags.Ephemeral});return true;
  }
  const session=sessions.get(id);
  if(!session){await interaction.reply({content:"Painel expirado. Inicie !renkage criar novamente.",flags:MessageFlags.Ephemeral});return true;}
  if(session.owner!==interaction.user.id||session.guild!==interaction.guildId){await interaction.reply({content:"Este painel pertence a outro jogador.",flags:MessageFlags.Ephemeral});return true;}
  if(action==="draw") {
    session.clan=pick(CLANS);session.primary=pick(STYLES);session.secondary=pick(STYLES.filter(s=>normalize(s)!==normalize(session.primary)));
    await interaction.update(render(session));return true;
  }
  if(action==="roll") {
    session.rolls=Array.from({length:6},rollFourDropLowest);session.index=0;
    await interaction.update(render(session));return true;
  }
  if(action==="assign") {
    const index=Number(extra), attribute=interaction.values[0];
    if(index!==session.index||!ATTRIBUTES.includes(attribute)||session.assigned[attribute]){await interaction.reply({content:"Distribuição inválida. Tente novamente.",flags:MessageFlags.Ephemeral});return true;}
    session.assigned[attribute]=session.rolls[index].total;session.index++;
    await interaction.update(render(session));return true;
  }
  if(action==="cancel"){sessions.delete(id);await interaction.update({content:"Criação cancelada. Nada foi salvo.",components:[]});return true;}
  if(action==="save") {
    if(session.index!==6||Object.keys(session.assigned).length!==6){await interaction.reply({content:"Distribua os seis resultados antes de confirmar.",flags:MessageFlags.Ephemeral});return true;}
    const skills={};
    for(const key of Object.keys(SKILLS))skills[key]={style:getSkillBonus({primary_style:session.primary,secondary_style:session.secondary},key),clan:getClanBonus({clan:session.clan},key)};
    await pool.query("INSERT INTO mestre_characters (guild_id,owner_id,name,clan,primary_style,secondary_style,attributes,rolls,skills) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb)",[session.guild,session.owner,session.name,session.clan,session.primary,session.secondary,JSON.stringify(session.assigned),JSON.stringify(session.rolls),JSON.stringify(skills)]);
    sessions.delete(id);await interaction.update({content:"✅ **Ficha de "+session.name+" salva!**\nClã: "+session.clan+"\nEspecializações: "+session.primary+" / "+session.secondary+"\nUse !mestre ficha para consultar.",components:[]});return true;
  }
  return true;
}
