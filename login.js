/* IJR: email-first, code-free institutional SSO. */
(function(){
"use strict";
const A=window.IJRCADAuth,$=id=>document.getElementById(id);
const emailForm=$("loginEmailForm"),notice=$("loginMessage"),loading=$("loginLoading");
const allowedRoutes=new Set(["hub.html","docente.html"]);
function destination(){
 const route=new URLSearchParams(location.search).get("next")||"hub.html";
 return allowedRoutes.has(route)?route:"hub.html";
}
function redirect(){window.location.replace(new URL(destination(),location.href).href)}
function status(value,type="info"){notice.textContent=value;notice.dataset.type=type}
function busy(on){$("loginSend").disabled=on;loading.hidden=!on}
async function boot(){
 busy(true);status("Verificando tu cuenta institucional…");
 try{
  const user=await A.init();
  if(user){redirect();return}
  status("");
 }catch(error){status(error.message||"No fue posible iniciar sesión. Intenta nuevamente.","error")}
 finally{busy(false)}
}
emailForm.addEventListener("submit",async event=>{
 event.preventDefault();
 const email=A.normalizeEmail($("loginEmail").value);
 if(!A.validEmail(email)){
  status("Solo se permite el correo institucional @"+A.DOMAIN+".","error");return;
 }
 busy(true);status("Solicitando enlace de acceso al correo institucional…");
 try{
  await A.sendInstitutionalLink(email,destination());
  status("Enlace solicitado para "+email+". Abre tu correo institucional y pulsa el enlace para ingresar. No necesitas introducir códigos.","success");
  emailForm.hidden=true;
  const confirmation=$("loginLinkSent");
  if(confirmation){
   confirmation.hidden=false;
   $("loginLinkEmail").textContent=email;
  }
 }catch(error){
  status(error.status===429?"Se alcanzó el límite temporal de envíos. Intenta más tarde.":error.message||"No se pudo enviar el enlace de acceso.","error");
 }finally{busy(false)}
});
const change=$("loginChangeEmail");
if(change)change.addEventListener("click",()=>{
 $("loginLinkSent").hidden=true;emailForm.hidden=false;
 $("loginEmail").focus();status("");
});
boot();
})();