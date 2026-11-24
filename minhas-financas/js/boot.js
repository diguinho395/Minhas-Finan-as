// Carrega a sessão (e os dados da nuvem, se ativada) antes de iniciar o app
(async()=>{
 try{await Auth.init(true)}catch(e){
  document.body.innerHTML=`<div style="font-family:Manrope,system-ui,sans-serif;max-width:480px;margin:15vh auto;padding:24px;text-align:center"><h1 style="font-size:22px">Não foi possível carregar seus dados</h1><p style="color:#566274">${String(e.message).replace(/[<>&]/g,'')}</p><button onclick="location.reload()" style="height:48px;padding:0 24px;border:0;border-radius:12px;background:#1F4E9C;color:#fff;font-weight:700;cursor:pointer">Tentar de novo</button></div>`;return}
 if(!Auth.current()){location.replace('login.html');return}
 const s=document.createElement('script');s.src='js/app.js';document.body.appendChild(s);
})();
