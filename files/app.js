// Minhas Finanças — aplicativo
if(!Auth.current())location.replace('login.html');
const U=Auth.user();
if(!U){Auth.logout();location.replace('login.html')}
const D=U.data;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const hoje=iso(new Date());
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const fd=d=>new Date(d+'T00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.','');
const fmes=m=>new Date(m+'-01T00:00').toLocaleDateString('pt-BR',{month:'short'}).replace('.','');
const fmtM=n=>n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const parseM=v=>(/-/.test(v)?-1:1)*(parseInt(String(v).replace(/\D/g,'')||'0',10)/100);
function maskM(el){const neg=el.dataset.neg&&/-/.test(el.value);el.value=(neg?'-':'')+fmtM(parseInt(el.value.replace(/\D/g,'')||'0',10)/100)}
const dias=d=>Math.round((new Date(d+'T00:00')-new Date(hoje+'T00:00'))/864e5);

/* ---------- dados padrão e migração ---------- */
const S=(...n)=>n.map((nome,i)=>({id:'s'+i,nome}));
const DEF={despesa:[
 {id:'moradia',nome:'Moradia',icon:'home',limite:1500,subs:S('Aluguel','Condomínio','Luz','Água','Internet')},
 {id:'alimentacao',nome:'Alimentação',icon:'utensils',limite:1200,subs:S('Supermercado','Restaurantes','Delivery')},
 {id:'transporte',nome:'Transporte',icon:'car',limite:800,subs:S('Combustível','Aplicativos','Transporte público')},
 {id:'lazer',nome:'Lazer',icon:'gamepad',limite:500,subs:S('Cinema','Viagens','Assinaturas')},
 {id:'saude',nome:'Saúde',icon:'heart',limite:0,subs:S('Farmácia','Consultas')},
 {id:'educacao',nome:'Educação',icon:'cap',limite:0,subs:[]},
 {id:'compras',nome:'Compras',icon:'bag',limite:0,subs:[]},
 {id:'outros',nome:'Outros',icon:'tag',limite:0,subs:[]}],
 receita:[
 {id:'salario',nome:'Salário',icon:'briefcase',subs:[]},
 {id:'freelance',nome:'Freelance',icon:'laptop',subs:[]},
 {id:'invest',nome:'Investimentos',icon:'trending',subs:S('Dividendos','Rendimentos')},
 {id:'presente',nome:'Presentes',icon:'gift',subs:[]},
 {id:'outros_r',nome:'Outros',icon:'tag',subs:[]}]};
const okId=s=>typeof s==='string'?/^[\w.-]{1,60}$/.test(s):Number.isFinite(s);
const num=v=>v===undefined||v===''||Number.isFinite(v);
const DEFACC=()=>[{id:'cc',nome:'Conta Corrente',tipo:'conta',saldo:0},{id:'pp',nome:'Poupança',tipo:'poupanca',saldo:0},{id:'cartao',nome:'Cartão',tipo:'cartao',limite:0,venc:10}];
function migrar(X){
 if(X.v!==2){
  const old=X.limits||{};
  X.cats=JSON.parse(JSON.stringify(DEF));
  X.cats.despesa.forEach(c=>{if(old[c.nome]>0)c.limite=old[c.nome]});
  X.accounts=DEFACC();
  const mc=(t,n)=>(X.cats[t].find(c=>norm(c.nome)===norm(n||''))||X.cats[t][X.cats[t].length-1]).id;
  const ma=n=>(X.accounts.find(a=>norm(a.nome)===norm(n||''))||X.accounts[0]).id;
  X.tx=(X.tx||[]).map(t=>({id:t.id,tipo:t.tipo,desc:t.desc,valor:t.valor,data:t.data,cat:mc(t.tipo,t.cat),sub:'',conta:ma(t.conta)}));
  (X.bills||[]).filter(b=>!b.pago).forEach(b=>X.tx.push({id:b.id,tipo:'despesa',desc:b.desc,valor:b.valor,data:b.venc,cat:mc('despesa',b.cat),sub:'',conta:'cc'}));
  delete X.bills;delete X.limits;X.v=2;
 }
 X.tx=X.tx||[];X.goals=X.goals||[];
 X.cats=X.cats||JSON.parse(JSON.stringify(DEF));X.accounts=X.accounts&&X.accounts.length?X.accounts:DEFACC();
 return X;
}
function validar(X){   // dados vindos de arquivo nunca são confiáveis: confere tudo antes de usar
 const bad=m=>{throw new Error('Arquivo inválido: '+m)},ISO=/^\d{4}-\d{2}-\d{2}$/,MES=/^\d{4}-\d{2}$/;
 if(X.tx.length>20000)bad('lançamentos demais.');
 ['despesa','receita'].forEach(t=>{if(!Array.isArray(X.cats[t]))bad('categorias ausentes.');
  X.cats[t].forEach(c=>{if(!okId(c.id)||typeof c.nome!=='string'||!Array.isArray(c.subs)||!num(c.limite))bad('categoria inválida.');
   c.subs.forEach(s=>{if(!okId(s.id)||typeof s.nome!=='string')bad('subcategoria inválida.')})})});
 X.accounts.forEach(a=>{if(!okId(a.id)||typeof a.nome!=='string'||!TIPOS[a.tipo]||!num(a.saldo)||!num(a.limite)||!num(a.venc)||!num(a.fech))bad('conta inválida.')});
 X.tx.forEach(t=>{if(!t||!okId(t.id)||!['despesa','receita'].includes(t.tipo)||typeof t.desc!=='string'||!Number.isFinite(t.valor)||!ISO.test(t.data)||!okId(t.conta)
  ||(t.cat&&!okId(t.cat))||(t.sub&&!okId(t.sub))||(t.grp&&!okId(t.grp))||(t.card&&!okId(t.card))||(t.fkey&&!MES.test(t.fkey))||!num(t.n)||!num(t.N))bad('lançamento inválido.')});
 X.goals.forEach(g=>{if(!okId(g.id)||typeof g.nome!=='string'||!Number.isFinite(g.alvo)||!Number.isFinite(g.atual)||(g.prazo&&!MES.test(g.prazo)))bad('objetivo inválido.');
  if(!/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]*$/.test(g.img||''))g.img=''});
 return X;
}
const preparar=p=>{
 if(!p||typeof p!=='object'||!Array.isArray(p.tx))throw new Error('Arquivo inválido: não parece um arquivo do Minhas Finanças.');
 return validar(migrar(JSON.parse(JSON.stringify(p))));
};
{const novo=D.v!==2;migrar(D);if(novo)Auth.save(D)}

/* ---------- utilidades ---------- */
const save=()=>{try{Auth.save(D)}catch{alert('Não foi possível salvar: o espaço do navegador acabou. Remova imagens grandes dos objetivos.')}render()};
const cat=(t,id)=>D.cats[t].find(c=>c.id===id)||{nome:'Sem categoria',icon:'tag',subs:[]};
const acc=id=>D.accounts.find(a=>a.id===id)||{nome:'—',tipo:'conta'};
const eff=t=>t.data<=hoje;                       // lançamentos futuros ficam agendados
const sum=(l,t)=>l.filter(x=>x.tipo===t).reduce((s,x)=>s+x.valor,0);
const byDate=(a,b)=>b.data.localeCompare(a.data)||b.id-a.id;
const bal=a=>{const l=D.tx.filter(t=>t.conta===a.id&&eff(t));return(a.saldo||0)+sum(l,'receita')-sum(l,'despesa')};
const saldoTotal=()=>D.accounts.filter(a=>a.tipo!=='cartao').reduce((s,a)=>s+bal(a),0);
const TIPOS={conta:'Conta corrente',poupanca:'Poupança',dinheiro:'Dinheiro',cartao:'Cartão de crédito'};
const TICON={conta:'bank',poupanca:'coin',dinheiro:'coin',cartao:'card'};
const label=t=>{const c=cat(t.tipo,t.cat),s=c.subs.find(x=>x.id===t.sub);return esc(c.nome)+(s?' › '+esc(s.nome):'')};
const pct=(g,l)=>Math.min(100,g/l*100);
const cor=p=>p>1?'#C2410C':p>=.85?'#E0A030':'#0B8F72';

/* ---------- cartões: faturas e fechamento ---------- */
const gasto=t=>t.tipo==='despesa'&&!t.pagFat;      // pagamento de fatura não é gasto novo
const cur=hoje.slice(0,7);
const addM=(m,n)=>{const d=new Date(m+'-01T00:00');d.setMonth(d.getMonth()+n);return iso(d).slice(0,7)};
const ult=m=>new Date(+m.slice(0,4),+m.slice(5,7),0).getDate();
const dia2=(m,d)=>m+'-'+String(Math.min(d,ult(m))).padStart(2,'0');
const isCard=id=>acc(id).tipo==='cartao';
const fechaDia=a=>a.fech||Math.max(1,(a.venc||10)-7);
function fat(a,d){                                   // em qual fatura cai uma compra feita em d
 const v=a.venc||10,c=fechaDia(a),m=d.slice(0,7),cm=+d.slice(8)<=c?m:addM(m,1),vm=addM(cm,v>c?0:1);
 return{fecha:dia2(cm,c),venc:dia2(vm,v),key:vm};
}
function faturasDe(a){
 const m={};
 D.tx.filter(t=>t.conta===a.id&&!t.pagFat).forEach(t=>{const f=fat(a,t.data),x=m[f.key]||(m[f.key]={...f,items:[],total:0});x.items.push(t);x.total+=t.tipo==='despesa'?t.valor:-t.valor});
 Object.values(m).forEach(f=>f.paga=D.tx.some(t=>t.pagFat&&t.card===a.id&&t.fkey===f.key));
 return m;
}
const cartoesL=()=>D.accounts.filter(a=>a.tipo==='cartao');
const fatAbertas=()=>cartoesL().flatMap(a=>Object.values(faturasDe(a)).filter(f=>!f.paga&&f.total>0).map(f=>({a,f})));
const compact=n=>(n<0?'−':'')+Math.abs(n).toLocaleString('pt-BR',{notation:'compact',maximumFractionDigits:1});
const fmesAno=m=>new Date(m+'-01T00:00').toLocaleDateString('pt-BR',{month:'short',year:'numeric'}).replace('.','');
const mdiff=(a,b)=>(+b.slice(0,4)-+a.slice(0,4))*12+(+b.slice(5,7)-+a.slice(5,7));

function txRow(t,pend){
 const r=t.tipo==='receita',d=dias(t.data),card=isCard(t.conta);
 const quando=pend?`${r?'Recebe':card?'Compra':'Vence'} ${fd(t.data)} · ${d===1?'amanhã':'em '+d+' dias'}`:fd(t.data);
 return `<div class="row"><div class="ic ${r?'inc':'exp'}">${ic(t.pagFat?'card':cat(t.tipo,t.cat).icon)}</div>
 <div class="t">${esc(t.desc)}${t.grp?` <span class="par">${t.n}/${t.N}</span>`:''}<small>${quando} · ${t.pagFat?'Pagamento de fatura':label(t)} · ${esc(acc(t.conta).nome)}</small></div>
 <div class="v ${r?'pos':'neg'}">${r?'+':'−'} ${brl(t.valor)}</div>
 ${pend&&!card?`<button class="pay" data-act="pay" data-id="${t.id}">${r?'Receber':'Pagar'}</button>`:''}
 ${t.pagFat?'':`<button class="x" data-act="edit" data-id="${t.id}" aria-label="Editar ${esc(t.desc)}">${ic('edit',16)}</button>`}
 <button class="x" data-act="del" data-id="${t.id}" aria-label="Excluir ${esc(t.desc)}">${ic('trash',16)}</button></div>`}
const fatRow=({a,f})=>`<div class="row"><div class="ic exp">${ic('card')}</div><div class="t">Fatura ${esc(a.nome)}<small>Vence ${fd(f.venc)} · fecha ${fd(f.fecha)} · ${f.items.length} ${f.items.length>1?'lançamentos':'lançamento'}</small></div><div class="v neg">− ${brl(f.total)}</div><button class="pay" data-act="payfat" data-card="${a.id}" data-key="${f.key}">Pagar fatura</button></div>`;

function chartMeses(i0,i1){
 const ms=[];for(let i=i0;i<=i1;i++){const k=addM(mes,i),l=D.tx.filter(t=>t.data.startsWith(k));ms.push({k,r:sum(l,'receita'),d:sum(l.filter(gasto),'despesa')})}
 const mx=Math.max(1,...ms.map(m=>Math.max(m.r,m.d)));
 return `<div class="bars">${ms.map(m=>{const fu=m.k>cur,o=fu?.45:1,s=m.r-m.d;
  return `<button class="bc${m.k===mes?' sel':''}" data-act="gomes" data-id="${m.k}" title="${fmes(m.k)}: receitas ${brl(m.r)}, despesas ${brl(m.d)}${fu?' (previsto)':''}"><span class="bp"><i style="height:${m.r/mx*150}px;background:#0B8F72;opacity:${o}"></i><i style="height:${m.d/mx*150}px;background:#C2410C;opacity:${o}"></i></span><b>${fmes(m.k)}</b><small class="${s<0?'neg':'pos'}">${compact(s)}</small></button>`}).join('')}</div>
 <div class="lg"><span><i style="background:#0B8F72"></i>Receitas</span><span><i style="background:#C2410C"></i>Despesas</span><span style="color:var(--mut);font-weight:500">Meses futuros mostram o previsto (agendados, parcelas e cartão).</span></div>`}
function chartDias(){
 const n=ult(mes),l=D.tx.filter(t=>gasto(t)&&t.data.startsWith(mes));
 const v=[...Array(n)].map((_,i)=>{const d=dia2(mes,i+1),x=l.filter(t=>t.data===d);return{d,n:i+1,e:sum(x.filter(eff),'despesa'),p:sum(x.filter(t=>!eff(t)),'despesa')}});
 const mx=Math.max(1,...v.map(x=>x.e+x.p)),top=v.reduce((a,b)=>b.e+b.p>a.e+a.p?b:a);
 return {top:top.e+top.p>0?`Maior gasto: dia ${top.n} · ${brl(top.e+top.p)}`:'Sem gastos neste mês',
 html:`<div class="dias">${v.map(x=>`<div class="dc${x.d===hoje?' hj':''}" title="Dia ${x.n}: ${brl(x.e+x.p)}${x.p?' (inclui agendado)':''}"><i style="height:${x.p/mx*140}px;background:#F2A184"></i><i style="height:${x.e/mx*140}px;background:#C2410C"></i><span>${x.n===1||x.n%5===0?x.n:'&nbsp;'}</span></div>`).join('')}</div>
 <div class="lg"><span><i style="background:#C2410C"></i>Realizado</span><span><i style="background:#F2A184"></i>Agendado</span></div>`}}

const goalPct=g=>g.alvo>0?Math.min(100,g.atual/g.alvo*100):0;
function goalCard(g){
 const p=goalPct(g),falta=Math.max(0,g.alvo-g.atual);let pz='Sem prazo definido';
 if(!falta)pz='Meta concluída';else if(g.prazo){const n=mdiff(cur,g.prazo);pz=n<0?'Prazo encerrado':`Até ${fmesAno(g.prazo)} · guardar ${brl(falta/Math.max(1,n))} por mês`}
 return `<article class="goal"><div class="gimg"${g.img?` style="background-image:url('${g.img}')"`:''}>${g.img?'':ic('target',44)}<div class="gov"><b>${esc(g.nome)}</b><span>${Math.round(p)}%</span></div></div>
 <div class="gb"><div style="display:flex;justify-content:space-between;font-weight:700;font-size:14px"><span>${brl(g.atual)}</span><span style="color:var(--mut)">de ${brl(g.alvo)}</span></div>
 <div class="bar"><i style="width:${p}%;background:${p>=100?'#0B8F72':'#1F4E9C'}"></i></div><small>${pz}</small>
 <div class="acoes" style="margin-top:14px;align-items:center"><button class="sec" style="height:44px" data-act="dep" data-id="${g.id}">Guardar valor</button><button class="x" style="flex:none" data-act="editgoal" data-id="${g.id}" aria-label="Editar ${esc(g.nome)}">${ic('edit',16)}</button><button class="x" style="flex:none" data-act="delgoal" data-id="${g.id}" aria-label="Excluir ${esc(g.nome)}">${ic('trash',16)}</button></div></div></article>`}

const lista=(l,pend,vazio)=>l.length?l.map(t=>txRow(t,pend)).join(''):`<div class="vazio">${vazio}</div>`;

/* ---------- telas ---------- */
let codigo='',mes=hoje.slice(0,7),cfgTipo='despesa',F={q:'',tipo:'',cat:''},view='inicio';
const VIEWS={inicio:['Início','home'],transacoes:['Transações','list'],contas:['Contas','bank'],cartoes:['Cartões','card'],objetivos:['Objetivos','target'],relatorios:['Relatórios','chart'],config:['Configurações','sliders']};
const SUB={transacoes:'Todos os lançamentos do mês.',contas:'Saldo de cada conta.',cartoes:'Faturas, fechamento e limites.',objetivos:'Sonhos e metas para guardar dinheiro.',relatorios:'Para onde vai o seu dinheiro.',config:'Categorias, subcategorias e dados.'};

const V={
inicio(){
 const fut=mes>cur,inc=t=>fut||eff(t);
 const mt=D.tx.filter(t=>t.data.startsWith(mes)&&inc(t)),rec=sum(mt,'receita'),des=sum(mt.filter(gasto),'despesa'),sobra=rec-des;
 const saldo=saldoTotal(),pt=D.tx.filter(t=>!eff(t)&&!isCard(t.conta)),fa=fatAbertas();
 const ate=pt.filter(t=>t.data.slice(0,7)<=mes),fate=fa.filter(x=>x.f.key<=mes);
 const prev=saldo+sum(ate,'receita')-sum(ate,'despesa')-fate.reduce((s,x)=>s+x.f.total,0);
 const pm=[...pt.filter(t=>t.data.startsWith(mes)),...fa.filter(x=>x.f.key===mes).map(x=>({...x,data:x.f.venc,inv:1}))].sort((a,b)=>a.data.localeCompare(b.data));
 const pg=rec?Math.min(100,Math.round(des/rec*100)):0;
 const lim=iso(new Date(Date.now()+7*864e5)),prox=pt.filter(t=>t.tipo==='despesa'&&t.data<=lim),fpx=fa.filter(x=>x.f.venc>=hoje&&x.f.venc<=lim);
 const tot=sum(prox,'despesa')+fpx.reduce((s,x)=>s+x.f.total,0),n=prox.length+fpx.length,atr=fa.filter(x=>x.f.venc<hoje);
 let al='';
 if(atr.length)al+=`<div class="alerta ruim" role="status">Fatura em aberto após o vencimento: ${atr.map(x=>esc(x.a.nome)+' ('+fd(x.f.venc)+', '+brl(x.f.total)+')').join('; ')}.</div>`;
 if(n){const d=saldo-tot;al+=`<div class="alerta${d<0?' ruim':''}" role="status">${n} ${n>1?'contas vencem':'conta vence'} em até 7 dias, total de ${brl(tot)}. ${d<0?`Seu saldo não cobre tudo: faltam ${brl(-d)}.`:`Seu saldo cobre tudo e sobram ${brl(d)}.`}</div>`}
 const orc=D.cats.despesa.filter(c=>c.limite>0).map(c=>{const g=sum(mt.filter(t=>t.cat===c.id&&gasto(t)),'despesa'),p=g/c.limite;
  return `<div class="bt"><div><span class="n"><span class="ic neu" style="width:32px;height:32px;border-radius:9px">${ic(c.icon,16)}</span>${esc(c.nome)}</span><span class="${p>1?'neg':''}">${p>1?brl(g-c.limite)+' acima da meta':brl(g)+' de '+brl(c.limite)}</span></div><div class="bar"><i style="width:${pct(g,c.limite)}%;background:${cor(p)}"></i></div></div>`}).join('');
 const cts=D.accounts.map(a=>{const c=a.tipo==='cartao',f=c?faturasDe(a)[fat(a,hoje).key]:null,b=c?(f?f.total:0):bal(a);
  return `<div class="row"><div class="ic ${c?'exp':'neu'}">${ic(TICON[a.tipo])}</div><div class="t">${esc(a.nome)}<small>${c?'Fatura atual · fecha '+fd(fat(a,hoje).fecha):TIPOS[a.tipo]}</small></div><div class="v ${c&&b?'neg':b<0?'neg':''}">${c&&b?'− ':''}${brl(b)}</div></div>`}).join('');
 const metas=D.goals.slice(0,3).map(g=>{const p=goalPct(g);return `<div class="row"><div class="gth"${g.img?` style="background-image:url('${g.img}')"`:''}>${g.img?'':ic('target')}</div><div class="t">${esc(g.nome)}<small>${brl(g.atual)} de ${brl(g.alvo)}</small><div class="bar" style="margin-top:6px"><i style="width:${p}%;background:#1F4E9C"></i></div></div><div class="v">${Math.round(p)}%</div></div>`}).join('');
 const cd=chartDias();
 return `${bannerLocal()}<section class="hero"><div style="flex:1 1 280px"><small>Saldo atual</small><div class="big">${brl(saldo)}</div><small>Contas correntes, poupança e dinheiro</small>
 ${mes>=cur?`<div style="margin-top:10px"><small>Previsto até o fim de ${fmes(mes)}</small><div style="font-weight:800;font-size:18px;color:${prev<0?'#F2A184':'#fff'}">${brl(prev)}</div></div>`:''}</div>
 <div class="mets"><div class="g3"><div><small>${fut?'Receitas previstas':'Receitas do mês'}</small><b>${brl(rec)}</b></div><div><small>${fut?'Despesas previstas':'Despesas do mês'}</small><b>${brl(des)}</b></div><div><small>${fut?'Sobra prevista':'Sobra do mês'}</small><b style="color:${sobra<0?'#F2A184':'#7FE0C0'}">${brl(sobra)}</b></div></div>
 <div><div class="split"><i style="width:${pg}%"></i><u></u></div><div style="display:flex;justify-content:space-between;font-size:13px;color:#B9C6DB;margin-top:8px;font-weight:600"><span>${rec?`Gasto: ${pg}% da renda`:'Sem receitas neste mês'}</span><span>${rec?`Guardado: ${Math.max(0,100-pg)}% da renda`:''}</span></div></div></div></section>${al}
 <div class="g2"><section class="card"><h2 class="h">Gastos por dia<span style="font-size:13px;font-weight:600;color:var(--mut)">${cd.top}</span></h2>${cd.html}</section>
 <section class="card"><h2 class="h">Meses: passado e próximos</h2>${chartMeses(-2,4)}</section></div>
 <div class="cols"><div class="col">
 <section class="card"><h2 class="h">Vencimentos de ${fmes(mes)}</h2><div>${pm.length?pm.map(x=>x.inv?fatRow(x):txRow(x,true)).join(''):'<div class="vazio">Nada agendado neste mês. Lançamentos com data futura aparecem aqui e entram no saldo no dia.</div>'}</div></section>
 <section class="card"><h2 class="h">Últimas transações<a href="#transacoes">Ver todas</a></h2><div>${lista(D.tx.filter(t=>t.data.startsWith(mes)&&eff(t)).sort(byDate).slice(0,6),false,'Nenhuma transação realizada neste mês.')}</div></section></div>
 <div class="col"><section class="card"><h2 class="h">Minhas contas<a href="#contas">Gerenciar</a></h2><div>${cts}</div></section>
 <section class="card"><h2 class="h">Objetivos<a href="#objetivos">Ver todos</a></h2><div>${metas||'<div class="vazio">Crie um objetivo para acompanhar seus sonhos.</div>'}</div></section>
 <section class="card"><h2 class="h">Orçamento do mês<a href="#config">Editar metas</a></h2>${orc||'<div class="vazio">Defina metas mensais nas configurações.</div>'}</section></div></div>`},

transacoes(){
 const cats=[...D.cats.despesa,...D.cats.receita];
 return `<section class="card"><div class="filtros" id="tf"><div class="f"><label for="tq">Buscar</label><input id="tq" type="search" placeholder="Descrição…" value="${esc(F.q)}"></div>
 <div class="f"><label for="tt">Tipo</label><select id="tt"><option value="">Todos</option><option value="despesa"${F.tipo==='despesa'?' selected':''}>Despesas</option><option value="receita"${F.tipo==='receita'?' selected':''}>Receitas</option></select></div>
 <div class="f"><label for="tc">Categoria</label><select id="tc"><option value="">Todas</option>${cats.map(c=>`<option value="${c.id}"${F.cat===c.id?' selected':''}>${esc(c.nome)}</option>`).join('')}</select></div></div></section>
 <section class="card" id="tlist">${tList()}</section>`},

contas(){
 const cs=D.accounts.filter(a=>a.tipo!=='cartao');
 return `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><b style="font-size:18px">Total em contas: ${brl(saldoTotal())}</b><button class="go" style="padding:0 22px" data-act="newacc">+ Nova conta</button></div>
 <div class="g2">${cs.map(a=>{const mt=D.tx.filter(t=>t.conta===a.id&&t.data.startsWith(mes)&&eff(t));
 return `<section class="card"><div class="row" style="border:0;padding-top:0"><div class="ic neu">${ic(TICON[a.tipo])}</div><div class="t">${esc(a.nome)}<small>${TIPOS[a.tipo]}</small></div>
 <button class="x" data-act="editacc" data-id="${a.id}" aria-label="Editar ${esc(a.nome)}">${ic('edit',16)}</button><button class="x" data-act="delacc" data-id="${a.id}" aria-label="Excluir ${esc(a.nome)}">${ic('trash',16)}</button></div>
 <div style="font-size:30px;font-weight:800;color:${bal(a)<0?'var(--neg)':'inherit'}">${brl(bal(a))}</div>
 <div style="display:flex;gap:24px;margin-top:14px;font-size:13px;font-weight:600"><span class="pos">Entradas no mês: ${brl(sum(mt,'receita'))}</span><span class="neg">Saídas no mês: ${brl(sum(mt,'despesa'))}</span></div></section>`}).join('')||'<div class="vazio">Nenhuma conta. Crie a primeira.</div>'}</div>`},

cartoes(){
 const cs=cartoesL();
 return `<div style="display:flex;justify-content:flex-end"><button class="go" style="padding:0 22px" data-act="newacc" data-tipo="cartao">+ Novo cartão</button></div>
 <div class="g2">${cs.map(a=>{const F=faturasDe(a),at=fat(a,hoje),fa=F[mes],pr=F[addM(mes,1)];
 const usado=Object.values(F).filter(f=>!f.paga).reduce((s,f)=>s+f.total,0),st=!fa?'':fa.paga?'Paga':fa.fecha<hoje?'Fechada':'Aberta';
 return `<div class="col"><section class="cartao"><div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;gap:10px;align-items:center;font-weight:700">${ic('card',22)}${esc(a.nome)}</span><span><button class="x" style="color:#fff" data-act="editacc" data-id="${a.id}" aria-label="Editar ${esc(a.nome)}">${ic('edit',16)}</button><button class="x" style="color:#fff" data-act="delacc" data-id="${a.id}" aria-label="Excluir ${esc(a.nome)}">${ic('trash',16)}</button></span></div>
 <div><small>Fatura com vencimento em ${fmes(mes)}${mes===at.key?' · fatura atual':''}</small><br><b>${brl(fa?fa.total:0)}</b>${st?`<span class="st">${st}</span>`:''}</div>
 <small>Fecha dia ${fechaDia(a)}${fa?' ('+fd(fa.fecha)+')':''} · Vence dia ${a.venc||'—'}${fa?' ('+fd(fa.venc)+')':''}</small>
 ${a.limite>0?`<div><div class="bar"><i style="width:${pct(usado,a.limite)}%"></i></div><div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13px;font-weight:600;color:#B9C6DB"><span>Disponível: ${brl(Math.max(0,a.limite-usado))}</span><span>Limite: ${brl(a.limite)}</span></div></div>`:'<small>Defina o limite editando o cartão.</small>'}
 <small>Próxima fatura (${fmes(addM(mes,1))}): ${brl(pr?pr.total:0)}</small>
 ${fa&&!fa.paga&&fa.total>0?`<button class="pay" style="align-self:flex-start" data-act="payfat" data-card="${a.id}" data-key="${fa.key}">Pagar fatura</button>`:''}</section>
 <section class="card"><h2 class="h">Compras desta fatura</h2><div>${fa?lista(fa.items.sort(byDate),false,''):'<div class="vazio">Nenhuma compra nesta fatura. Compras feitas até o dia do fechamento entram na fatura do mês; depois dele, na seguinte.</div>'}</div></section></div>`}).join('')||'<div class="vazio">Nenhum cartão cadastrado.</div>'}</div>`},

objetivos(){
 return `<div style="display:flex;justify-content:flex-end"><button class="go" style="padding:0 22px" data-act="newgoal">+ Novo objetivo</button></div>
 <div class="g3c">${D.goals.map(goalCard).join('')||'<div class="vazio">Nenhum objetivo ainda. Crie o primeiro e escolha uma imagem para lembrar do seu sonho.</div>'}</div>`},

relatorios(){
 const fut=mes>cur,mt=t=>D.tx.filter(x=>x.tipo===t&&(t==='receita'||gasto(x))&&(fut||eff(x))&&x.data.startsWith(mes));
 const bloco=(t,tit)=>{const l=mt(t),tot=sum(l,t),g={};l.forEach(x=>g[x.cat]=(g[x.cat]||0)+x.valor);
  const it=Object.entries(g).sort((a,b)=>b[1]-a[1]).map(([id,v])=>`<div class="bt"><div><span class="n"><span class="ic ${t==='receita'?'inc':'exp'}" style="width:32px;height:32px;border-radius:9px">${ic(cat(t,id).icon,16)}</span>${esc(cat(t,id).nome)}</span><span>${brl(v)} · ${Math.round(v/tot*100)}%</span></div><div class="bar"><i style="width:${v/tot*100}%;background:${t==='receita'?'#0B8F72':'#C2410C'}"></i></div></div>`).join('');
  return `<section class="card"><h2 class="h">${tit}<span style="font-weight:700">${brl(tot)}</span></h2>${it||'<div class="vazio">Sem lançamentos neste mês.</div>'}</section>`};
 return `<section class="card"><h2 class="h">Receitas e despesas dos últimos 6 meses</h2>${chartMeses(-5,0)}</section>
 <div class="g2">${bloco('despesa','Despesas por categoria'+(fut?' (previsto)':''))}${bloco('receita','Receitas por categoria'+(fut?' (previsto)':''))}</div>`},

config(){
 const t=cfgTipo;
 return `${bannerLocal()}<div class="tabs" role="tablist"><button data-act="tab" data-id="despesa" class="${t==='despesa'?'on':''}">Despesas</button><button data-act="tab" data-id="receita" class="${t==='receita'?'on':''}">Receitas</button></div>
 <section class="card"><h2 class="h">Categorias de ${t==='despesa'?'despesas':'receitas'}<button data-act="newcat">+ Nova categoria</button></h2><div>
 ${D.cats[t].map(c=>`<div class="row" style="align-items:flex-start"><div class="ic neu">${ic(c.icon)}</div><div class="t">${esc(c.nome)}<small>${t==='despesa'?(c.limite?'Meta mensal: '+brl(c.limite):'Sem meta mensal'):'Receita'}</small>
 <div class="chips">${c.subs.map(s=>`<span class="chip">${esc(s.nome)}<button data-act="delsub" data-cat="${c.id}" data-id="${s.id}" aria-label="Remover ${esc(s.nome)}">${ic('x',14)}</button></span>`).join('')}<button class="chip add" data-act="newsub" data-id="${c.id}">+ Subcategoria</button></div></div>
 <button class="x" data-act="editcat" data-id="${c.id}" aria-label="Editar ${esc(c.nome)}">${ic('edit',16)}</button><button class="x" data-act="delcat" data-id="${c.id}" aria-label="Excluir ${esc(c.nome)}">${ic('trash',16)}</button></div>`).join('')}</div></section>
 ${Auth.cloud?`<section class="card"><h2 class="h">Conta e segurança</h2><p class="mu2">${esc(U.email)}</p><button class="sec" data-act="chpw">Alterar senha</button><p style="color:var(--mut);font-size:13px;margin:14px 0 0">Enviamos um link de redefinição para o seu e-mail.</p></section>`:`<section class="card"><h2 class="h">Segurança</h2><p class="mu2" style="margin-bottom:16px">O código de recuperação serve para redefinir a senha na tela "Esqueci a senha". ${Auth.user().rec?'Você já tem um código ativo.':'Você ainda não tem um código.'} Gerar um novo invalida o anterior.</p>
 ${codigo?`<div class="codigo" style="margin-bottom:12px">${codigo}</div><p style="color:var(--neg);font-size:13px;font-weight:600;margin:0 0 16px">Anote agora: ele não será mostrado de novo.</p><button class="sec" data-act="copy" style="margin-right:12px">Copiar código</button>`:''}
 <button class="sec" data-act="newcode">${Auth.user().rec||codigo?'Gerar novo código':'Gerar código de recuperação'}</button></section>`}
 <section class="card"><h2 class="h">Dados e sincronização</h2>${syncRow()}<p class="mu2" style="margin:14px 0">Exporte uma cópia ou importe um arquivo do Minhas Finanças (JSON).</p>
 <div style="display:flex;gap:12px;flex-wrap:wrap"><button class="sec" data-act="export">${ic('down',18)} Exportar dados</button><button class="sec" style="background:var(--blue);border-color:var(--blue);color:#fff" data-act="importar">${ic('up',18)} Importar dados</button></div></section>
 <section class="card"><h2 class="h">Zona de risco</h2><p class="mu2">Apaga todos os lançamentos. Não dá para desfazer.</p><button class="sec" style="color:var(--neg)" data-act="clear">Apagar todos os lançamentos</button></section>`}
};

function tList(){
 const q=norm(F.q),l=D.tx.filter(t=>t.data.startsWith(mes)&&(!F.tipo||t.tipo===F.tipo)&&(!F.cat||t.cat===F.cat)&&(!q||norm(t.desc).includes(q))).sort(byDate);
 const ag=l.filter(t=>!eff(t)),ok=l.filter(eff);
 return `<h2 class="h">${l.length} ${l.length===1?'lançamento':'lançamentos'}<span style="font-size:13px">Receitas ${brl(sum(ok,'receita'))} · Despesas ${brl(sum(ok,'despesa'))}</span></h2>
 <div>${ag.length?`<div class="vazio" style="padding:8px 0 0;font-weight:700">Agendados</div>${ag.sort((a,b)=>a.data.localeCompare(b.data)).map(t=>txRow(t,true)).join('')}<div class="vazio" style="padding:14px 0 0;font-weight:700">Efetivados</div>`:''}${lista(ok,false,'Nenhum lançamento encontrado neste mês.')}</div>`}

function render(){
 view=VIEWS[location.hash.slice(1)]?location.hash.slice(1):'inicio';
 $('#nav').innerHTML=Object.entries(VIEWS).map(([k,[n,i]])=>`<a href="#${k}" class="nv${k===view?' on':''}">${ic(i,20)}<span>${n}</span></a>`).join('');
 $('#ttl').textContent=view==='inicio'?`Olá, ${U.nome.split(' ')[0]}`:VIEWS[view][0];
 $('#psub').textContent=view==='inicio'?`Hoje é ${new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}.`:SUB[view];
 $('#mn').hidden=['config','contas','objetivos'].includes(view);
 $('#mlbl').textContent=new Date(mes+'-01T00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 $('#mhoje').hidden=mes===cur;
 $('.fab').hidden=!(view==='inicio'||view==='transacoes');
 if(view!=='config')codigo='';
 $('#view').innerHTML=V[view]();
}

/* ---------- janela de lançamento ---------- */
let tf={tipo:'despesa',cat:'',sub:''},ed=null,cd={},ad=null,gd={},dd=null;
const getData=()=>{const q=$('#ftx').elements.quando.value;return q==='hoje'?hoje:q==='amanha'?iso(new Date(Date.now()+864e5)):$('#fd').value};
function fgrid(){
 $('#cg').innerHTML=D.cats[tf.tipo].map(c=>`<button type="button" class="${c.id===tf.cat?'on':''}" data-act="pickcat" data-id="${c.id}">${ic(c.icon,22)}<span>${esc(c.nome)}</span></button>`).join('')+`<button type="button" class="add" data-act="newcat-f">${ic('plus',22)}<span>Nova</span></button>`;
 const c=tf.cat?cat(tf.tipo,tf.cat):null;$('#subw').hidden=!c;
 if(c)$('#fsub').innerHTML='<option value="">Sem subcategoria</option>'+c.subs.map(s=>`<option value="${s.id}"${s.id===tf.sub?' selected':''}>${esc(s.nome)}</option>`).join('');
}
function dica(){
 const f=$('#ftx').elements,d=getData(),rep=f.rep.value,n=parseInt(f.n.value)||0,v=parseM(f.valor.value),a=acc(f.conta.value),m=[];
 $('#flv').textContent=rep==='parc'?'Valor total (R$)':'Valor (R$)';$('#fnw').hidden=!rep;$('#fnl').textContent=rep==='parc'?'Número de parcelas':'Repetir por quantos meses?';
 if(rep==='parc'&&n>=2&&v>0)m.push(`${n}x de ${brl(v/n)}.`);
 if(rep==='mensal'&&n>=2&&d)m.push(`Repete por ${n} meses, sempre no dia ${+d.slice(8)}.`);
 if(d&&d>hoje&&a.tipo!=='cartao')m.push(`Agendado: entra no saldo em ${fd(d)}.`);
 if(d&&a.tipo==='cartao')m.push(`Entra na fatura que vence em ${fd(fat(a,d).venc)}.`);
 $('#dica').textContent=m.join(' ');
}
function openTx(id){
 const f=$('#ftx'),t=id?D.tx.find(x=>x.id==id):null;ed=t?t.id:null;
 f.reset();$('#ferr').hidden=true;$('#dtt').textContent=t?'Editar lançamento':'Novo lançamento';
 tf={tipo:t?t.tipo:'despesa',cat:t?t.cat:'',sub:t?t.sub||'':''};
 f.elements.tipo.value=tf.tipo;f.elements.valor.value=fmtM(t?t.valor:0);f.elements.desc.value=t?t.desc:'';
 const q=!t||t.data===hoje?'hoje':'outra';f.elements.quando.value=q;f.elements.data.value=t?t.data:hoje;$('#fd').hidden=q!=='outra';
 $('#repw').hidden=!!t;f.elements.rep.value='';
 $('#fc').innerHTML=D.accounts.map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join('');if(t)$('#fc').value=t.conta;
 fgrid();dica();$('#dtx').showModal();
}
$('#ftx').onsubmit=e=>{
 e.preventDefault();const f=e.target.elements,valor=parseM(f.valor.value),d=getData(),rep=f.rep.value,N=parseInt(f.n.value)||0,er=m=>{$('#ferr').textContent=m;$('#ferr').hidden=false};
 if(!f.desc.value.trim())return er('Informe uma descrição.');
 if(!(valor>0))return er('Informe um valor maior que zero.');
 if(!d)return er('Escolha a data.');
 if(!tf.cat)return er('Escolha uma categoria.');
 if(!ed&&rep&&(N<2||N>60))return er('Informe de 2 a 60 '+(rep==='parc'?'parcelas.':'meses.'));
 const b={tipo:tf.tipo,desc:f.desc.value.trim(),cat:tf.cat,sub:tf.sub||'',conta:f.conta.value};
 if(ed){const i=D.tx.findIndex(x=>x.id===ed);D.tx[i]={...D.tx[i],...b,valor,data:d}}
 else if(!rep)D.tx.push({id:Date.now(),...b,valor,data:d});
 else{const g='g'+Date.now(),base=Math.floor(valor/N*100)/100;
  for(let i=0;i<N;i++){const m=addM(d.slice(0,7),i),v=rep==='parc'?(i<N-1?base:Math.round((valor-base*(N-1))*100)/100):valor;
   D.tx.push({id:Date.now()+i,...b,valor:v,data:dia2(m,+d.slice(8)),grp:g,n:i+1,N})}}
 $('#dtx').close();save();
};

/* ---------- janela de categoria ---------- */
const igrid=()=>$('#ig').innerHTML=CAT_ICONS.map(n=>`<button type="button" class="${n===cd.icon?'on':''}" data-act="pickicon" data-id="${n}" aria-label="Ícone ${n}">${ic(n,22)}</button>`).join('');
function openCat(o){
 cd=o;const c=o.id&&D.cats[o.tipo].find(x=>x.id===o.id);cd.icon=c?c.icon:CAT_ICONS[0];
 $('#dct').textContent=o.parent?'Nova subcategoria':c?'Editar categoria':'Nova categoria';
 $('#cnome').value=c?c.nome:'';$('#clim').value=fmtM(c&&c.limite||0);$('#cerr').hidden=true;
 $('#clw').hidden=!(o.tipo==='despesa'&&!o.parent);$('#ciw').hidden=!!o.parent;igrid();$('#dcat').showModal();$('#cnome').focus();
}
$('#fcat').onsubmit=e=>{
 e.preventDefault();const nome=$('#cnome').value.trim(),list=D.cats[cd.tipo],lim=parseM($('#clim').value);
 if(!nome){$('#cerr').textContent='Informe um nome.';$('#cerr').hidden=false;return}
 if(cd.parent){const p=list.find(c=>c.id===cd.parent),s={id:'s'+Date.now(),nome};p.subs.push(s);if(cd.after)cd.after(p.id,s.id)}
 else if(cd.id)Object.assign(list.find(c=>c.id===cd.id),{nome,icon:cd.icon,limite:lim});
 else{const c={id:'c'+Date.now(),nome,icon:cd.icon,subs:[],limite:lim};list.push(c);if(cd.after)cd.after(c.id,'')}
 $('#dcat').close();save();
};

/* ---------- janela de conta ---------- */
const atipo=()=>{const c=$('#atipo').value==='cartao';$('#acw').hidden=!c;$('#asw').hidden=c};
$('#atipo').onchange=atipo;
function openAcc(id,tipo){
 const a=id?D.accounts.find(x=>x.id===id):null;ad=a?a.id:null;
 $('#dat').textContent=a?'Editar':(tipo==='cartao'?'Novo cartão':'Nova conta');
 $('#anome').value=a?a.nome:'';$('#atipo').value=a?a.tipo:(tipo||'conta');$('#asaldo').value=fmtM(a?a.saldo||0:0);
 $('#alim').value=fmtM(a&&a.limite||0);$('#afech').value=a&&a.fech||'';$('#avenc').value=a&&a.venc||'';$('#aerr').hidden=true;atipo();$('#dacc').showModal();$('#anome').focus();
}
$('#facc').onsubmit=e=>{
 e.preventDefault();const nome=$('#anome').value.trim(),tipo=$('#atipo').value;
 if(!nome){$('#aerr').textContent='Informe um nome.';$('#aerr').hidden=false;return}
 const o={nome,tipo,saldo:tipo==='cartao'?0:parseM($('#asaldo').value),limite:tipo==='cartao'?parseM($('#alim').value):0,venc:parseInt($('#avenc').value)||'',fech:parseInt($('#afech').value)||''};
 if(ad)Object.assign(D.accounts.find(a=>a.id===ad),o);else D.accounts.push({id:'a'+Date.now(),...o});
 $('#dacc').close();save();
};

/* ---------- objetivos ---------- */
const gprev=()=>{$('#gpv').style.backgroundImage=gd.img?`url("${gd.img}")`:'';$('#gpv').textContent=gd.img?'':'Nenhuma imagem';$('#grm').hidden=!gd.img};
function openGoal(id){
 const g=id&&D.goals.find(x=>x.id===id);gd={id:g?g.id:null,img:g?g.img||'':''};
 $('#dgt').textContent=g?'Editar objetivo':'Novo objetivo';$('#gnome').value=g?g.nome:'';$('#galvo').value=fmtM(g?g.alvo:0);$('#gatual').value=fmtM(g?g.atual:0);
 $('#gprazo').value=g?g.prazo||'':'';$('#gerr').hidden=true;$('#gfile').value='';gprev();$('#dgoal').showModal();$('#gnome').focus();
}
$('#gfile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,900/im.width),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
  c.getContext('2d').drawImage(im,0,0,c.width,c.height);gd.img=c.toDataURL('image/jpeg',.8);gprev()};im.src=r.result};r.readAsDataURL(f)};
$('#fgoal').onsubmit=e=>{
 e.preventDefault();const nome=$('#gnome').value.trim(),alvo=parseM($('#galvo').value),er=m=>{$('#gerr').textContent=m;$('#gerr').hidden=false};
 if(!nome)return er('Dê um nome ao objetivo.');if(!(alvo>0))return er('Informe o valor da meta.');
 const o={nome,alvo,atual:Math.max(0,parseM($('#gatual').value)),prazo:$('#gprazo').value,img:gd.img||''};
 if(gd.id)Object.assign(D.goals.find(x=>x.id===gd.id),o);else D.goals.push({id:'g'+Date.now(),...o});
 $('#dgoal').close();save();
};
$('#fdep').onsubmit=e=>{
 e.preventDefault();const g=D.goals.find(x=>x.id===dd),v=parseM($('#dval').value);if(!(v>0))return;
 g.atual=Math.max(0,g.atual+(e.target.elements.dop.value==='sub'?-v:v));$('#ddep').close();save();
};

/* ---------- importar dados e nuvem ---------- */
const SYNC={ok:['Sincronizado com a nuvem','Acessível em qualquer aparelho','#0B8F72'],salvando:['Salvando…','Enviando suas alterações','#E0A030'],erro:['Erro ao sincronizar','Tentaremos de novo no próximo salvamento. Verifique sua conexão.','#C2410C'],conflito:['Conflito de versões','Seus dados mudaram em outro aparelho. Recarregue a página para ver a versão mais recente.','#C2410C'],local:['Salvo apenas neste navegador','Para acessar de qualquer aparelho, ative a nuvem (veja o LEIA-ME.md).','#566274']};
function syncRow(){const s=SYNC[Auth.status]||SYNC.local;return `<div class="row" style="align-items:center"><span class="dot" style="background:${s[2]}"></span><div class="t">${s[0]}<small>${esc(Auth.status==='erro'&&Auth.msg?Auth.msg:s[1])}</small></div>${Auth.status==='conflito'?'<button class="pay" data-act="reload">Recarregar</button>':''}</div>`}
function pintaSync(){const s=SYNC[Auth.status]||SYNC.local;$('#sync').innerHTML=`<span class="dot" style="background:${s[2]}"></span>${s[0]}`;if(view==='config')render()}
Auth.onStatus=pintaSync;
const novoId=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function juntar(X){
 const cm={t:{despesa:{},receita:{}}},sm={},am={};let novos=0,rep=0;
 ['despesa','receita'].forEach(t=>X.cats[t].forEach(c=>{
  let e=D.cats[t].find(x=>norm(x.nome)===norm(c.nome));
  if(!e){e={...c,id:D.cats[t].some(x=>x.id===c.id)?novoId('c'):c.id,subs:[]};D.cats[t].push(e)}
  cm.t[t][c.id]=e.id;
  c.subs.forEach(s=>{let f=e.subs.find(x=>norm(x.nome)===norm(s.nome));
   if(!f){f={id:e.subs.some(x=>x.id===s.id)?novoId('s'):s.id,nome:s.nome};e.subs.push(f)}sm[t+'|'+c.id+'|'+s.id]=f.id})}));
 X.accounts.forEach(a=>{let e=D.accounts.find(x=>norm(x.nome)===norm(a.nome)&&x.tipo===a.tipo);
  if(!e){e={...a,id:D.accounts.some(x=>x.id===a.id)?novoId('a'):a.id};D.accounts.push(e)}am[a.id]=e.id});
 const key=t=>[t.tipo,t.data,Math.round(t.valor*100),norm(t.desc),t.conta].join('|');
 const have=new Set(D.tx.map(key)),ids=new Set(D.tx.map(t=>t.id));let k=0;
 X.tx.forEach(t=>{
  const n={...t,conta:am[t.conta]||D.accounts[0].id,cat:t.pagFat?'':(cm.t[t.tipo][t.cat]||t.cat),sub:t.sub?(sm[t.tipo+'|'+t.cat+'|'+t.sub]||''):''};
  if(t.card)n.card=am[t.card]||t.card;
  if(have.has(key(n))){rep++;return}
  while(ids.has(n.id))n.id=Date.now()+(++k);ids.add(n.id);D.tx.push(n);novos++});
 X.goals.forEach(g=>{if(D.goals.some(x=>norm(x.nome)===norm(g.nome)&&x.alvo===g.alvo))return;D.goals.push({...g,id:D.goals.some(x=>x.id===g.id)?novoId('g'):g.id})});
 return{novos,rep};
}
function aplicar(X,modo){
 if(modo==='subst'){Object.keys(D).forEach(k=>delete D[k]);Object.assign(D,X);save();return null}
 const r=juntar(X);save();return r;
}
const resumo=X=>({tx:X.tx.length,cats:X.cats.despesa.length+X.cats.receita.length,contas:X.accounts.length,obj:X.goals.length});
let imp=null;
function openImp(){imp=null;$('#fimp').reset();$('#impn').textContent='Nenhum arquivo escolhido';$('#imps').textContent='Escolha um arquivo .json exportado pelo Minhas Finanças.';
 $('#impc').hidden=true;$('#imperr').hidden=true;$('#impgo').disabled=true;$('#dimp').showModal()}
$('#impf').onchange=async e=>{
 const f=e.target.files[0];if(!f)return;
 const er=m=>{$('#imperr').textContent=m;$('#imperr').hidden=false;imp=null;$('#impgo').disabled=true;$('#impc').hidden=true};
 $('#imperr').hidden=true;
 if(f.size>20*1024*1024)return er('Arquivo muito grande (máximo 20 MB).');
 try{const txt=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsText(f)});imp=preparar(JSON.parse(txt))}
 catch(x){return er(x instanceof SyntaxError?'Arquivo inválido: não é um JSON válido.':x.message)}
 const r=resumo(imp);$('#impn').textContent=f.name;$('#imps').textContent=Math.max(1,Math.round(f.size/1024))+' KB';
 ['tx','cats','contas','obj'].forEach((k,i)=>$('#ic'+(i+1)).textContent=r[k]);$('#impc').hidden=false;$('#impgo').disabled=false;
};
$('#fimp').onsubmit=e=>{
 e.preventDefault();if(!imp)return;const modo=e.target.elements.modo.value;
 if(modo==='subst'&&!confirm('Substituir TODOS os dados atuais pelo conteúdo do arquivo? Isso não pode ser desfeito.'))return;
 const r=aplicar(imp,modo);$('#dimp').close();
 setTimeout(()=>alert(modo==='subst'?'Dados substituídos com sucesso.':`Importação concluída: ${r.novos} lançamento(s) novo(s)${r.rep?` e ${r.rep} já existente(s) ignorado(s)`:''}.`),50);
};
function dadosLocais(){            // dados deste navegador, oferecidos para envio à nuvem
 if(!Auth.cloud)return null;
 const us=read(DB,{}),ks=Object.keys(us),em=Auth.user().email;
 if(!ks.length||localStorage.getItem('mf_skip_'+em))return null;
 const k=us[em]?em:ks.find(x=>us[x].data&&((us[x].data.tx||[]).length||(us[x].data.bills||[]).length));
 if(!k||!us[k].data)return null;
 try{const X=preparar(us[k].data);return X.tx.length?{X}:null}catch{return null}
}
function bannerLocal(){
 const l=dadosLocais();if(!l)return'';const r=resumo(l.X);
 return `<div class="aviso"><div style="flex:1;min-width:260px"><b>Encontramos dados salvos neste navegador</b>${r.tx} lançamentos, ${r.cats} categorias e ${r.contas} contas. Quer enviar para a sua conta na nuvem?</div><button class="go" style="padding:0 20px;height:48px" data-act="enviar">Enviar para a nuvem</button><button class="sec" style="height:48px" data-act="skip">Agora não</button></div>`;
}

/* ---------- eventos ---------- */
const usado=(k,v)=>D.tx.filter(t=>t[k]===v).length;
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 const a=b.dataset.act,id=b.dataset.id,t=D.tx.find(x=>x.id==id);
 if(a==='close')$('#'+b.dataset.d).close();
 else if(a==='newtx')openTx();
 else if(a==='edit')openTx(id);
 else if(a==='pay'){t.data=hoje;save()}
 else if(a==='del'){
  if(t.grp&&D.tx.filter(x=>x.grp===t.grp).length>1){
   if(confirm('Esta é uma parcela/repetição. Excluir também todas as seguintes?\n\nOK = esta e as seguintes · Cancelar = escolher')){D.tx=D.tx.filter(x=>!(x.grp===t.grp&&x.data>=t.data));save()}
   else if(confirm('Excluir somente esta?')){D.tx=D.tx.filter(x=>x.id!=id);save()}
  }else if(confirm('Excluir este lançamento?')){D.tx=D.tx.filter(x=>x.id!=id);save()}}
 else if(a==='payfat'){const c=acc(b.dataset.card),f=faturasDe(c)[b.dataset.key],cc=D.accounts.find(x=>x.tipo!=='cartao');
  if(!cc)alert('Crie uma conta para pagar a fatura.');
  else if(confirm(`Pagar a fatura de ${brl(f.total)} do ${c.nome} com a conta ${cc.nome}?`)){D.tx.push({id:Date.now(),tipo:'despesa',desc:'Fatura '+c.nome,valor:f.total,data:hoje,cat:'',sub:'',conta:cc.id,pagFat:true,card:c.id,fkey:b.dataset.key});save()}}
 else if(a==='mprev'){mes=addM(mes,-1);render()}
 else if(a==='mnext'){mes=addM(mes,1);render()}
 else if(a==='mhoje'){mes=cur;render()}
 else if(a==='gomes'){mes=id;render()}
 else if(a==='newgoal')openGoal();
 else if(a==='editgoal')openGoal(id);
 else if(a==='rmimg'){gd.img='';gprev()}
 else if(a==='delgoal'){if(confirm('Excluir este objetivo?')){D.goals=D.goals.filter(g=>g.id!==id);save()}}
 else if(a==='dep'){dd=id;$('#ddt').textContent='Guardar em '+D.goals.find(g=>g.id===id).nome;$('#fdep').reset();$('#dval').value='0,00';$('#ddep').showModal();$('#dval').focus()}
 else if(a==='pickcat'){tf.cat=id;tf.sub='';fgrid()}
 else if(a==='newcat-f')openCat({tipo:tf.tipo,after:i=>{tf.cat=i;tf.sub='';fgrid()}});
 else if(a==='newsub-f')openCat({tipo:tf.tipo,parent:tf.cat,after:(c,s)=>{tf.sub=s;fgrid()}});
 else if(a==='pickicon'){cd.icon=id;igrid()}
 else if(a==='tab'){cfgTipo=id;render()}
 else if(a==='newcat')openCat({tipo:cfgTipo});
 else if(a==='editcat')openCat({tipo:cfgTipo,id});
 else if(a==='newsub')openCat({tipo:cfgTipo,parent:id});
 else if(a==='delcat'){const n=usado('cat',id);if(n)alert(`Esta categoria é usada em ${n} lançamento(s). Edite esses lançamentos antes de excluir.`);else if(confirm('Excluir esta categoria?')){D.cats[cfgTipo]=D.cats[cfgTipo].filter(c=>c.id!==id);save()}}
 else if(a==='delsub'){const c=D.cats[cfgTipo].find(x=>x.id===b.dataset.cat);if(confirm('Remover esta subcategoria?')){c.subs=c.subs.filter(s=>s.id!==id);D.tx.forEach(x=>{if(x.sub===id)x.sub=''});save()}}
 else if(a==='newacc')openAcc(null,b.dataset.tipo);
 else if(a==='editacc')openAcc(id);
 else if(a==='delacc'){const n=usado('conta',id);if(n)alert(`Esta conta tem ${n} lançamento(s). Exclua ou edite esses lançamentos antes.`);else if(confirm('Excluir esta conta?')){D.accounts=D.accounts.filter(x=>x.id!==id);save()}}
 else if(a==='newcode'){Auth.newCode().then(c=>{codigo=c;render()})}
 else if(a==='copy'){if(navigator.clipboard)navigator.clipboard.writeText(codigo)}
 else if(a==='importar')openImp();
 else if(a==='enviar'){const l=dadosLocais();if(l){localStorage.setItem('mf_skip_'+Auth.user().email,'1');const r=aplicar(l.X,'juntar');alert(`Pronto! ${r.novos} lançamento(s) enviado(s) para a sua conta.`)}}
 else if(a==='skip'){localStorage.setItem('mf_skip_'+Auth.user().email,'1');render()}
 else if(a==='chpw'){Auth.resetEmail(Auth.user().email).then(()=>alert('Enviamos um link para criar uma nova senha no seu e-mail.')).catch(x=>alert(x.message))}
 else if(a==='reload')location.reload();
 else if(a==='export'){const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([JSON.stringify(D,null,2)],{type:'application/json'}));l.download='minhas-financas.json';l.click()}
 else if(a==='clear'){if(confirm('Apagar TODOS os lançamentos? Isso não pode ser desfeito.')){D.tx=[];save()}}
});
document.addEventListener('change',e=>{
 const t=e.target,fm=t.closest&&t.closest('#ftx');
 if(t.name==='tipo'&&fm){tf={tipo:t.value,cat:'',sub:''};fgrid()}
 else if(t.name==='quando'){$('#fd').hidden=t.value!=='outra';dica()}
 else if(fm&&(t.id==='fd'||t.name==='rep'||t.name==='conta'))dica();
 else if(t.id==='fsub')tf.sub=t.value;
});
document.addEventListener('input',e=>{
 const t=e.target,m=t.dataset&&t.dataset.m!==undefined;
 if(m)maskM(t);
 if(t.closest('#ftx'))dica();
 if(m||!t.closest('#tf'))return;
 F={q:$('#tq').value,tipo:$('#tt').value,cat:$('#tc').value};$('#tlist').innerHTML=tList();
});
$('#sair').onclick=async()=>{await Auth.logout();location.replace('login.html')};
$('#usr').textContent=U.nome;pintaSync();
window.addEventListener('hashchange',render);
render();
