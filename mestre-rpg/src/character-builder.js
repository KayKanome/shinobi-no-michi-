import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags
} from "discord.js";
import { CLANS, STYLES, SKILLS, ATTRIBUTE_LABELS, normalize, rollDie, getSkillBonus, getClanBonus } from "./engine.js";

const sessions=new Map();
const ATTRIBUTES=Object.keys(ATTRIBUTE_LABELS);
const pick=items=>items[rollDie(items.length)-1];
function rollFourDropLowest(){const dice=Array.from({length:4},()=>rollDie(6)).sort((a,b)=>a-b);return {dice,total:dice.slice(1).reduce((s,n)=>s+n,0)};}
function render(s){
  if(!s.clan)return {content:"**RENKAGE — CRIAÇÃO DE FICHA**\nPersonagem: **"+s.name+"**\nClique para sortear clã e especializações.",components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("rk:draw:"+s.id).setLabel("🎲 Sortear clã e estilos").setStyle(ButtonStyle.Primary))]};
  if(!s.rolls)return {content:"**SORTEIO CONCLUÍDO**\nClã: **"+s.clan+"**\nEstilo principal: **"+s.primary+"**\nEstilo secundário: **"+s.secondary+"**\n\nRole os seis atributos: 4d6, descartando o menor dado.",components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("rk:roll:"+s.id).setLabel("🎲 Rolar os 6 atributos").setStyle(ButtonStyle.Success))]};
  const results=s.rolls.map((r,i)=>"**"+(i+1)+". "+r.total+"** (dados "+r.dice.join(", ")+")"+(s.used.includes(i)?" — distribuído":"")).join("\n");
  if(s.used.length<6){
    const rollMenu=new StringSelectMenuBuilder().setCustomId("rk:pickroll:"+s.id).setPlaceholder("Escolha um dos seis resultados").addOptions(s.rolls.map((r,i)=>({label:"Resultado "+(i+1)+": "+r.total,value:String(i),description:r.dice.join(", ")+" (menor descartado)"})));
    const available=ATTRIBUTES.filter(a=>!s.assigned[a]);
    const attrMenu=new StringSelectMenuBuilder().setCustomId("rk:pickattr:"+s.id).setPlaceholder("Escolha o atributo que receberá o resultado").addOptions(available.map(a=>({label:ATTRIBUTE_LABELS[a],value:a})));
    const chosenRoll=s.selectedRoll===null?"nenhum":(Number(s.selectedRoll)+1)+" ("+s.rolls[Number(s.selectedRoll)].total+")";
    const chosenAttr=s.selectedAttribute?ATTRIBUTE_LABELS[s.selectedAttribute]:"nenhum";
    return {content:"**DISTRIBUIÇÃO DOS SEIS RESULTADOS**\n"+results+"\n\nResultado selecionado: **"+chosenRoll+"**\nAtributo selecionado: **"+chosenAttr+"**\nEscolha um resultado e um atributo, depois clique em distribuir.",components:[new ActionRowBuilder().addComponents(rollMenu),new ActionRowBuilder().addComponents(attrMenu),new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("rk:apply:"+s.id).setLabel("Distribuir resultado").setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId("rk:undo:"+s.id).setLabel("Desfazer última").setStyle(ButtonStyle.Secondary).setDisabled(s.used.length===0))]};
  }
  const attrs=ATTRIBUTES.map(a=>ATTRIBUTE_LABELS[a]+": **"+s.assigned[a]+"**").join("\n");
  const bonuses=Object.entries(SKILLS).map(([k,skill])=>skill.label+": estilo +"+getSkillBonus({primary_style:s.primary,secondary_style:s.secondary},k)+", clã +"+getClanBonus({clan:s.clan},k)).join("\n");
  return {content:"**REVISÃO DA FICHA**\nNome: **"+s.name+"**\nClã: **"+s.clan+"**\nEspecialização principal: **"+s.primary+"**\nEspecialização secundária: **"+s.secondary+"**\n\n**Atributos**\n"+attrs+"\n\n**Bônus automáticos**\n"+bonuses+"\n\nConfirme para salvar.",components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("rk:save:"+s.id).setLabel("Confirmar e salvar").setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId("rk:cancel:"+s.id).setLabel("Cancelar").setStyle(ButtonStyle.Secondary))]};
}
export async function startCharacterCreation(message){
 const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("rk:open:"+message.author.id).setLabel("Abrir criação de personagem").setStyle(ButtonStyle.Primary));
 await message.reply({content:"🎲 **Renkage está pronto para criar sua ficha.** O painel será privado e só você poderá controlá-lo.",components:[row]});
}
export async function handleCharacterInteraction(i,pool){
 if(!i.isButton()&&!i.isStringSelectMenu()&&!i.isModalSubmit())return false;
 if(!i.customId?.startsWith("rk:"))return false;
 const [prefix,action,id]=i.customId.split(":");
 if(action==="open"){
  if(i.user.id!==id){await i.reply({content:"Este botão pertence a outro jogador.",flags:MessageFlags.Ephemeral});return true;}
  const modal=new ModalBuilder().setCustomId("rk:name:"+id).setTitle("Criar personagem");
  modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("name").setLabel("Nome do personagem").setStyle(TextInputStyle.Short).setMinLength(2).setMaxLength(24).setRequired(true)));
  await i.showModal(modal);return true;
 }
 if(action==="name"){
  const name=i.fields.getTextInputValue("name").trim();
  const old=await pool.query("SELECT name FROM mestre_characters WHERE guild_id=$1 AND owner_id=$2",[i.guildId,i.user.id]);
  if(old.rowCount){await i.reply({content:"Você já possui a ficha **"+old.rows[0].name+"**. Use !mestre ficha.",flags:MessageFlags.Ephemeral});return true;}
  const sid=i.id;sessions.set(sid,{id:sid,owner:i.user.id,guild:i.guildId,name,assigned:{},assignmentIndex:{},used:[],selectedRoll:null,selectedAttribute:null});
  await i.reply({...render(sessions.get(sid)),flags:MessageFlags.Ephemeral});return true;
 }
 const s=sessions.get(id);
 if(!s){await i.reply({content:"Painel expirado. Inicie !renkage criar novamente.",flags:MessageFlags.Ephemeral});return true;}
 if(s.owner!==i.user.id||s.guild!==i.guildId){await i.reply({content:"Este painel pertence a outro jogador.",flags:MessageFlags.Ephemeral});return true;}
 if(action==="draw"){s.clan=pick(CLANS);s.primary=pick(STYLES);s.secondary=pick(STYLES.filter(v=>normalize(v)!==normalize(s.primary)));await i.update(render(s));return true;}
 if(action==="roll"){s.rolls=Array.from({length:6},rollFourDropLowest);s.used=[];await i.update(render(s));return true;}
 if(action==="pickroll"){const index=Number(i.values[0]);if(!Number.isInteger(index)||index<0||index>5||s.used.includes(index)){await i.reply({content:"Escolha um resultado ainda não distribuído.",flags:MessageFlags.Ephemeral});return true;}s.selectedRoll=index;await i.update(render(s));return true;}
 if(action==="pickattr"){const attr=i.values[0];if(!ATTRIBUTES.includes(attr)||s.assigned[attr]){await i.reply({content:"Escolha um atributo disponível.",flags:MessageFlags.Ephemeral});return true;}s.selectedAttribute=attr;await i.update(render(s));return true;}
 if(action==="apply"){
  const index=s.selectedRoll,attr=s.selectedAttribute;
  if(index===null||!attr||s.used.includes(index)||s.assigned[attr]){await i.reply({content:"Selecione um resultado e um atributo disponível.",flags:MessageFlags.Ephemeral});return true;}
  s.assigned[attr]=s.rolls[index].total;s.assignmentIndex[attr]=index;s.used.push(index);s.selectedRoll=null;s.selectedAttribute=null;await i.update(render(s));return true;
 }
 if(action==="undo"){
  const index=s.used.pop();
  if(index===undefined){await i.reply({content:"Ainda não há distribuição para desfazer.",flags:MessageFlags.Ephemeral});return true;}
  const attr=Object.keys(s.assignmentIndex).find(key=>s.assignmentIndex[key]===index);
  if(attr){delete s.assigned[attr];delete s.assignmentIndex[attr];}
  s.selectedRoll=null;s.selectedAttribute=null;
  await i.update(render(s));return true;
 }
 if(action==="cancel"){sessions.delete(id);await i.update({content:"Criação cancelada. Nada foi salvo.",components:[]});return true;}
 if(action==="save"){
  if(s.used.length!==6||Object.keys(s.assigned).length!==6){await i.reply({content:"Distribua os seis resultados antes de confirmar.",flags:MessageFlags.Ephemeral});return true;}
  const skills={};for(const key of Object.keys(SKILLS))skills[key]={style:getSkillBonus({primary_style:s.primary,secondary_style:s.secondary},key),clan:getClanBonus({clan:s.clan},key)};
  await pool.query("INSERT INTO mestre_characters (guild_id,owner_id,name,clan,primary_style,secondary_style,attributes,rolls,skills) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb)",[s.guild,s.owner,s.name,s.clan,s.primary,s.secondary,JSON.stringify(s.assigned),JSON.stringify(s.rolls),JSON.stringify(skills)]);
  sessions.delete(id);await i.update({content:"✅ **Ficha de "+s.name+" salva!**\nClã: "+s.clan+"\nEspecializações: "+s.primary+" / "+s.secondary+"\nUse !mestre ficha para consultar.",components:[]});return true;
 }
 return true;
}
