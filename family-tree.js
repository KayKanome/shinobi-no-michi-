import sharp from "sharp";

const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const short = (value, max=19) => { const s=String(value||""); return s.length>max?s.slice(0,max-1)+"…":s; };

async function avatarData(client, id) {
  try {
    const discordId=String(id||"").replace(/^discord:/,"");
    if(!/^\d{15,22}$/.test(discordId))return null;
    const user=await client.users.fetch(discordId);
    const response=await fetch(user.displayAvatarURL({extension:"png",size:128}));
    if(!response.ok)return null;
    const bytes=Buffer.from(await response.arrayBuffer());
    return "data:image/png;base64,"+bytes.toString("base64");
  } catch { return null; }
}

export async function renderFamilyTree({player,family,ownerId,client}) {
  const groups=[
    {label:"ANCESTRAIS",subtitle:"Avós",items:family.grandparents||[],color:"#A67C43"},
    {label:"GERAÇÃO ANTERIOR",subtitle:"Responsáveis",items:(family.parents||[]).map(x=>({...x,tag:x.tag||"Responsável"})),color:"#78956A"},
    {label:"SEU NÚCLEO",subtitle:"Irmãos e cônjuge",items:[...(family.siblings||[]).slice(0,2).map(x=>({...x,tag:"Irmão"})),...(family.spouse||[]).slice(0,1).map(x=>({...x,tag:x.role||"Cônjuge"}))],color:"#B88745"},
    {label:"PRÓXIMA GERAÇÃO",subtitle:"Filhos",items:(family.children||[]).map(x=>({...x,tag:x.tag||"Filho(a)"})),color:"#78956A"},
    {label:"RAMOS DA FAMÍLIA",subtitle:"Tios, primos e sobrinhos",items:[...(family.siblings||[]).slice(2).map(x=>({...x,tag:"Irmão"})),...(family.auntsUncles||[]).map(x=>({...x,tag:"Tio/tia"})),...(family.cousins||[]).map(x=>({...x,tag:"Primo(a)"})),...(family.niecesNephews||[]).map(x=>({...x,tag:"Sobrinho(a)"})),...(family.grandchildren||[]).map(x=>({...x,tag:"Neto(a)"}))],color:"#A67C43"}
  ];
  const rootUser=await client.users.fetch(ownerId).catch(()=>null);
  const rootTag=(family.parents||[]).length?"FILHO(A)":(player.familyGender==="masculino"?"MARIDO":player.familyGender==="feminino"?"ESPOSA":"CÔNJUGE");
  const root={id:"discord:"+ownerId,name:player.name,tag:rootTag,avatar:rootUser?await avatarData(client,ownerId):null,root:true};
  for(const group of groups) {
    group.items=group.items.filter(x=>x.id && x.id!=="discord:"+ownerId);
    await Promise.all(group.items.map(async item=>{item.avatar=await avatarData(client,item.id);}));
  }
  const W=1600, cardW=240, cardH=214, gap=34;
  let nextY=320;
  const layouts=groups.map((group,i)=>{
    const chunks=i===2?[group.items]:Array.from({length:Math.ceil(group.items.length/5)},(_,j)=>group.items.slice(j*5,(j+1)*5));
    const safeChunks=chunks.length?chunks:[[]];
    const layout={group,y:nextY,chunks:safeChunks,index:i};
    nextY+=safeChunks.length*270+75;
    return layout;
  });
  const H=nextY+100;
  function card(item,x,y,accent="#A67C43",rootCard=false) {
    const cx=x+cardW/2, avatarY=y+73, radius=48, clipId="avatarClip"+String(x).replace("-","m")+String(y);
    const avatar=item.avatar
      ? `<image href="${item.avatar}" x="${cx-radius}" y="${avatarY-radius}" width="${radius*2}" height="${radius*2}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`
      : `<circle cx="${cx}" cy="${avatarY}" r="${radius}" fill="#D9C59C"/><text x="${cx}" y="${avatarY+14}" text-anchor="middle" font-size="43" fill="#725735">忍</text>`;
    return `<g>
      <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="28" fill="${rootCard?"#F8E9C8":"#F1E4C9"}" stroke="${rootCard?"#D39B42":accent}" stroke-width="${rootCard?8:4}"/>
      <rect x="${x+10}" y="${y+10}" width="${cardW-20}" height="${cardH-20}" rx="21" fill="none" stroke="#C9AD79" stroke-width="1.5" opacity=".8"/>
      <circle cx="${cx}" cy="${avatarY}" r="${radius+7}" fill="#E5D3AE" stroke="${accent}" stroke-width="4"/>
      <clipPath id="${clipId}"><circle cx="${cx}" cy="${avatarY}" r="${radius}"/></clipPath>
      ${avatar}
      <text x="${cx}" y="${y+151}" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#493821">${esc(short(item.name,18))}</text>
      <text x="${cx}" y="${y+183}" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" letter-spacing="1.5" fill="#876C45">${esc(short(item.tag||"FAMÍLIA",22).toUpperCase())}</text>
      ${rootCard?`<path d="M ${x+cardW/2-18} ${y-14} l18 -18 18 18" fill="#D39B42"/>`:""}
    </g>`;
  }
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F8F0DC"/><stop offset=".5" stop-color="#E8D7B4"/><stop offset="1" stop-color="#D8C49B"/></linearGradient>
    <pattern id="grain" width="90" height="90" patternUnits="userSpaceOnUse"><path d="M0 45 Q22 20 45 45 T90 45 M45 0 Q20 22 45 45 T45 90" fill="none" stroke="#A98C5E" stroke-opacity=".10" stroke-width="2"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#paper)"/><rect width="${W}" height="${H}" fill="url(#grain)"/>
  <rect x="28" y="28" width="1544" height="${H-56}" rx="38" fill="none" stroke="#9B7744" stroke-width="8"/>
  <rect x="47" y="47" width="1506" height="${H-94}" rx="30" fill="none" stroke="#C2A36D" stroke-width="2"/>
  <g fill="none" stroke="#9B7744" stroke-width="5" opacity=".8"><path d="M80 180 Q80 90 180 90 M1520 180 Q1520 90 1420 90 M80 ${H-180} Q80 ${H-90} 180 ${H-90} M1520 ${H-180} Q1520 ${H-90} 1420 ${H-90}"/></g>
  <text x="800" y="126" text-anchor="middle" font-family="Georgia,serif" font-size="54" font-weight="bold" letter-spacing="5" fill="#59442B">ÁRVORE GENEALÓGICA</text>
  <text x="800" y="177" text-anchor="middle" font-family="Georgia,serif" font-size="27" letter-spacing="3" fill="#98774A">SHINOBI NO MICHI • CLÃ &amp; LEGADO</text>
  <path d="M480 218 Q800 260 1120 218" stroke="#B18A51" stroke-width="3" fill="none"/>
  <g fill="#9A7848"><circle cx="460" cy="218" r="7"/><circle cx="1140" cy="218" r="7"/><path d="M800 202 l13 16 -13 16 -13 -16z"/></g>
  <text x="800" y="266" text-anchor="middle" font-family="Georgia,serif" font-size="33" fill="#60492D">${esc(player.name)}</text>
  <path d="M800 285 V${H-115}" stroke="#9D8056" stroke-width="8" fill="none" stroke-linecap="round" opacity=".75"/>
  `;
  let coupleConnection = null;
  for(const layout of layouts){
    const {group:g,y,index}=layout;
    svg+=`<text x="95" y="${y-35}" font-family="Arial,sans-serif" font-size="21" font-weight="bold" letter-spacing="3" fill="${g.color}">${g.label}</text>`;
    if(index===2){
      const rootX=(W-cardW)/2,placements=[];
      const siblings=g.items.filter(x=>x.tag==="Irmão").slice(0,2);
      const spouses=g.items.filter(x=>x.tag!=="Irmão").slice(0,1);
      siblings.forEach((item,j)=>placements.push({item,x:rootX-(j+1)*(cardW+gap)}));
      placements.push({item:root,x:rootX});
      spouses.forEach((item,j)=>placements.push({item,x:rootX+(j+1)*(cardW+gap)}));
      placements.sort((a,b)=>a.x-b.x);
      const spousePlacement=placements.find(p=>!p.item.root && p.item.tag!=="Irmão");
      if(spousePlacement){
        const rootPlacement=placements.find(p=>p.item.root);
        coupleConnection={rootX:rootPlacement.x+cardW/2,spouseX:spousePlacement.x+cardW/2,unionY:y+cardH+28,childLineY:(layouts[3]?.y||y+cardH+100)-26};
      }
      drawPlacements(placements,y,g.color);
    } else {
      layout.chunks.forEach((items,row)=>{
        const rowY=y+row*270;
        if(!items.length){
          svg+=`<text x="800" y="${rowY+105}" text-anchor="middle" font-family="Georgia,serif" font-size="25" font-style="italic" fill="#9A8059">Este ramo ainda aguarda novos laços</text>`;
          return;
        }
        const total=items.length*cardW+(items.length-1)*gap,start=(W-total)/2;
        drawPlacements(items.map((item,j)=>({item,x:start+j*(cardW+gap)})),rowY,g.color);
      });
    }
  }
  function drawPlacements(placements,y,color){
    const centers=[];
    placements.forEach(({item,x})=>{centers.push(x+cardW/2);svg+=card(item,x,y,color,!!item.root);});
    const lineY=y-26;
    if(placements.length>1)svg+=`<path d="M ${centers[0]} ${lineY} H ${centers[centers.length-1]}" stroke="#9D8056" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    centers.forEach(cx=>svg+=`<path d="M ${cx} ${lineY} V ${y-4}" stroke="#9D8056" stroke-width="6" fill="none"/><circle cx="${cx}" cy="${lineY}" r="8" fill="#B48A4F"/>`);
  }
  if(coupleConnection){
    const {rootX,spouseX,unionY,childLineY}=coupleConnection;
    const center=(rootX+spouseX)/2;
    svg+=`<path d="M ${rootX} ${unionY-10} V ${unionY} H ${spouseX} V ${unionY-10} M ${center} ${unionY} V ${childLineY}" stroke="#9D8056" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="${center}" cy="${unionY}" r="10" fill="#B48A4F"/>`;
  }
  svg+=`<g fill="#8A6A3F" opacity=".8"><path d="M150 ${H-115} q35 -42 70 0 q-35 -12 -70 0 M1380 ${H-115} q35 -42 70 0 q-35 -12 -70 0"/></g>
  <text x="800" y="${H-90}" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#765B37">Cada vínculo é uma escolha. Cada geração, um novo capítulo.</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png({compressionLevel:9}).toBuffer();
}
