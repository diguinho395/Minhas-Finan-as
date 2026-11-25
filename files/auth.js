// Login, cadastro e recuperação de senha (modo local ou nuvem/Supabase)
const form=$('form'),err=$('#err'),btn=$('.go'),modo=form.dataset.modo;
const erro=m=>{err.textContent=m;err.hidden=false};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ready=Auth.init(false).catch(()=>{});
const svg=d=>`<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="${d}"/></svg>`;
const OLHO=svg('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z');
const OLHO_X=svg('M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 5.2A9.6 9.6 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 4M6.1 6.1C3.4 8 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1');
// botão "olhinho" em todos os campos de senha
document.querySelectorAll('input[type=password]').forEach(i=>{
  const w=document.createElement('div');w.className='pw';i.parentNode.insertBefore(w,i);w.appendChild(i);
  const b=document.createElement('button');b.type='button';b.className='eye';
  b.setAttribute('aria-label','Mostrar senha');b.setAttribute('aria-pressed','false');b.innerHTML=OLHO;
  b.onclick=()=>{const ver=i.type==='password';i.type=ver?'text':'password';b.innerHTML=ver?OLHO_X:OLHO;
    b.setAttribute('aria-label',ver?'Ocultar senha':'Mostrar senha');b.setAttribute('aria-pressed',String(ver))};
  w.appendChild(b);
});
// tela de aviso/resultado (com código de recuperação opcional, só no modo local)
function tela(titulo,texto,botao,destino,code){
  form.innerHTML=`<div><h1>${titulo}</h1><p>${texto}</p></div>
  ${code?`<div class="codigo" id="cod">${code}</div><p>Guarde em um lugar seguro. Ele aparece só desta vez.</p>`:''}
  <div class="acoes">${code?'<button type="button" class="sec" id="cp">Copiar código</button>':''}<button type="button" class="go" id="ok">${botao}</button></div>`;
  if(code)$('#cp').onclick=async()=>{try{await navigator.clipboard.writeText(code);$('#cp').textContent='Copiado ✓'}catch{$('#cp').textContent='Copie manualmente'}};
  $('#ok').onclick=()=>location.replace(destino);
}
ready.then(()=>{
  if(modo==='redefinir'){
    if(!Auth.cloud)return location.replace('login.html');
    if(!Auth.current()){erro('Link inválido ou expirado. Peça um novo em "Esqueci a senha".');btn.disabled=true}
    return;
  }
  if(Auth.current())return location.replace('index.html');
  if(Auth.cloud&&modo==='esqueci'){
    ['codigo','senha','conf'].forEach(n=>{const f=form.elements[n];if(f)f.closest('.f').hidden=true});
    $('#edsc').textContent='Informe seu e-mail e enviaremos um link para criar uma nova senha.';$('#nota').hidden=true;btn.textContent='Enviar link';
  }
});
form.addEventListener('submit',async e=>{
  e.preventDefault();err.hidden=true;await ready;
  const v=n=>form.elements[n]?.value??'';
  try{
    if(modo==='cadastro'){
      if(v('nome').trim().length<2)return erro('Informe seu nome completo.');
      if(v('senha').length<8)return erro('A senha precisa ter pelo menos 8 caracteres.');
      if(v('senha')!==v('conf'))return erro('As senhas não são iguais.');
      if(!form.elements.termos.checked)return erro('Aceite os termos de uso para criar a conta.');
      btn.disabled=true;const r=await Auth.register(v('nome'),v('email'),v('senha'));
      if(r.code)return tela('Conta criada!','Este é o seu código de recuperação. Com ele você redefine a senha caso esqueça.','Continuar','index.html',r.code);
      if(r.confirmar)return tela('Confirme seu e-mail',`Enviamos um link de confirmação para <b>${esc(v('email').trim())}</b>. Clique nele e depois entre na sua conta.`,'Ir para o login','login.html');
      return location.replace('index.html');
    }
    if(modo==='esqueci'){
      if(!v('email').trim())return erro('Informe seu e-mail.');
      if(Auth.cloud){
        btn.disabled=true;await Auth.resetEmail(v('email'));
        return tela('Verifique seu e-mail',`Se existir uma conta para <b>${esc(v('email').trim())}</b>, enviamos um link para criar uma nova senha. Ele vale por tempo limitado.`,'Voltar ao login','login.html');
      }
      if(!v('codigo').trim())return erro('Informe o código de recuperação.');
      if(v('senha').length<8)return erro('A nova senha precisa ter pelo menos 8 caracteres.');
      if(v('senha')!==v('conf'))return erro('As senhas não são iguais.');
      btn.disabled=true;const code=await Auth.reset(v('email'),v('codigo'),v('senha'));
      return tela('Senha alterada!','Seu código antigo foi substituído por um novo. Guarde este:','Ir para o login','login.html',code);
    }
    if(modo==='redefinir'){
      if(v('senha').length<8)return erro('A nova senha precisa ter pelo menos 8 caracteres.');
      if(v('senha')!==v('conf'))return erro('As senhas não são iguais.');
      btn.disabled=true;await Auth.updatePassword(v('senha'));
      return tela('Senha alterada!','Sua nova senha já está valendo.','Ir para o app','index.html');
    }
    btn.disabled=true;await Auth.login(v('email'),v('senha'),form.elements.lembrar.checked);
    location.replace('index.html');
  }catch(x){erro(x.message);btn.disabled=false}
});
