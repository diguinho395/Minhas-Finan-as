// Dados e autenticação (localStorage). Para produção, troque por um backend com banco de dados.
const DB='mf_users',SES='mf_session';
const $=(s,r=document)=>r.querySelector(s);
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function hash(pw,salt){
  const e=new TextEncoder(),k=await crypto.subtle.importKey('raw',e.encode(pw),'PBKDF2',false,['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:e.encode(salt),iterations:150000,hash:'SHA-256'},k,256));
}
const CH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const gen=()=>{const a=crypto.getRandomValues(new Uint8Array(12));return[0,4,8].map(i=>[...a.slice(i,i+4)].map(x=>CH[x%32]).join('')).join('-')};
const ncode=c=>String(c).toUpperCase().replace(/[^A-Z0-9]/g,'');
const AuthLocal={
  cloud:false,status:'local',async init(){},
  current:()=>sessionStorage.getItem(SES)||localStorage.getItem(SES),
  user(){return read(DB,{})[this.current()]},
  save(data){const u=read(DB,{});u[this.current()].data=data;write(DB,u)},
  async register(nome,email,pw){
    email=email.trim().toLowerCase();const u=read(DB,{});
    if(u[email])throw new Error('Este e-mail já tem cadastro. Entre ou use outro e-mail.');
    const salt=crypto.randomUUID(),code=gen();
    u[email]={nome:nome.trim(),salt,hash:await hash(pw,salt),rec:await hash(ncode(code),salt+'rec'),data:{tx:[],bills:[]}};
    write(DB,u);sessionStorage.setItem(SES,email);return{code};
  },
  async newCode(){
    const u=read(DB,{}),e=this.current(),c=gen();
    u[e].rec=await hash(ncode(c),u[e].salt+'rec');write(DB,u);return c;
  },
  async reset(email,code,pw){
    email=email.trim().toLowerCase();const u=read(DB,{}),x=u[email];
    if(!x||!x.rec||x.rec!==await hash(ncode(code),x.salt+'rec'))throw new Error('E-mail ou código de recuperação incorretos.');
    x.salt=crypto.randomUUID();x.hash=await hash(pw,x.salt);
    const c=gen();x.rec=await hash(ncode(c),x.salt+'rec');write(DB,u);return c;
  },
  async login(email,pw,keep){
    email=email.trim().toLowerCase();const u=read(DB,{})[email];
    if(!u||u.hash!==await hash(pw,u.salt))throw new Error('E-mail ou senha incorretos. Confira os dados e tente de novo.');
    (keep?localStorage:sessionStorage).setItem(SES,email);
  },
  logout(){sessionStorage.removeItem(SES);localStorage.removeItem(SES)}
};

/* ---------- Nuvem (Supabase) ---------- */
const CFG=window.MF_CONFIG||{},CLOUD=!!(CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY&&window.supabase);
const sb=CLOUD?window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY):null;
let CU=null,tmr=null,busy=false,again=false;
const msgErro=e=>{const m=String((e&&e.message)||e);
  if(/Invalid login credentials/i.test(m))return'E-mail ou senha incorretos. Confira os dados e tente de novo.';
  if(/Email not confirmed/i.test(m))return'Confirme seu e-mail antes de entrar. Procure o link na sua caixa de entrada.';
  if(/rate limit|too many|security purposes/i.test(m))return'Muitas tentativas. Espere alguns minutos e tente de novo.';
  if(/Password should/i.test(m))return'A senha é muito fraca. Use pelo menos 8 caracteres.';
  if(/Failed to fetch|NetworkError|Load failed/i.test(m))return'Sem conexão com a internet.';
  return m};
const AuthCloud={
  cloud:true,status:'ok',msg:'',onStatus:null,
  setStatus(s,m){this.status=s;this.msg=m||'';if(this.onStatus)this.onStatus(s,m)},
  async init(dados=true){
    const{data:{session}}=await sb.auth.getSession();
    if(!session){CU=null;return}
    const u=session.user,b={id:u.id,email:u.email,nome:(u.user_metadata&&u.user_metadata.nome)||u.email.split('@')[0],rev:0,data:{tx:[],bills:[]}};
    if(dados){
      const{data:row,error}=await sb.from('financas').select('data,rev').eq('user_id',u.id).maybeSingle();
      if(error)throw new Error(msgErro(error));
      if(row){b.data=row.data||b.data;b.rev=row.rev}
    }
    CU=b;
    window.addEventListener('beforeunload',e=>{if(this.status==='salvando'||this.status==='erro'){e.preventDefault();e.returnValue=''}});
  },
  current:()=>CU?CU.email:null,
  user:()=>CU,
  save(d){CU.data=d;clearTimeout(tmr);this.setStatus('salvando');tmr=setTimeout(()=>this.flush(),700)},
  async flush(){
    if(busy){again=true;return}
    busy=true;this.setStatus('salvando');
    try{
      const r=CU.rev===0
        ?await sb.from('financas').insert({user_id:CU.id,data:CU.data,rev:1}).select('rev')
        :await sb.from('financas').update({data:CU.data,rev:CU.rev+1}).eq('user_id',CU.id).eq('rev',CU.rev).select('rev');
      if((r.error&&r.error.code==='23505')||(!r.error&&!(r.data&&r.data.length))){this.setStatus('conflito');return}
      if(r.error)throw r.error;
      CU.rev=r.data[0].rev;this.setStatus('ok');
    }catch(e){this.setStatus('erro',msgErro(e))}
    finally{busy=false;if(again&&this.status!=='conflito'){again=false;this.flush()}}
  },
  async register(nome,email,pw){
    const{data,error}=await sb.auth.signUp({email:email.trim(),password:pw,options:{data:{nome:nome.trim()},emailRedirectTo:new URL('login.html',location.href).href}});
    if(error)throw new Error(msgErro(error));
    return{confirmar:!data.session};
  },
  async login(email,pw){const{error}=await sb.auth.signInWithPassword({email:email.trim(),password:pw});if(error)throw new Error(msgErro(error))},
  async resetEmail(email){const{error}=await sb.auth.resetPasswordForEmail(email.trim(),{redirectTo:new URL('redefinir.html',location.href).href});if(error)throw new Error(msgErro(error))},
  async updatePassword(pw){const{error}=await sb.auth.updateUser({password:pw});if(error)throw new Error(msgErro(error))},
  async logout(){clearTimeout(tmr);if(CU&&(this.status==='salvando'||this.status==='erro'))await this.flush();await sb.auth.signOut();CU=null}
};
const Auth=CLOUD?AuthCloud:AuthLocal;
