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
 // Instant educational browsing is deliberately not an authenticated Supabase session.
 // No student's records or teacher privileges are available from a typed address.
 if(destination()==="hub.html"&&new URLSearchParams(location.search).get("verify")!=="1"){
  sessionStorage.setItem("ijr-cad9-guest-v1",JSON.stringify({email,createdAt:Date.now()}));
  status("Abriendo los contenidos en modo consulta. Para guardar tu progreso deberás verificar tu correo.","success");
  redirect();return;
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
const verifyLink=$("loginVerifyLink");
if(verifyLink)verifyLink.addEventListener("click",event=>{
 event.preventDefault();
 const target=new URL("./",location.href);
 target.searchParams.set("verify","1");
 location.assign(target.href);
});
if(new URLSearchParams(location.search).get("verify")==="1"){
 $("loginSend").textContent="Enviar enlace de verificación";
 const helper=$("loginHelp");
 if(helper)helper.textContent="Verifica la propiedad de tu correo mediante un enlace seguro para guardar tus avances en Supabase. No necesitas introducir códigos.";
}
const change=$("loginChangeEmail");
if(change)change.addEventListener("click",()=>{
 $("loginLinkSent").hidden=true;emailForm.hidden=false;
 $("loginEmail").focus();status("");
});
// Opening a magic link in the same browser tab may change only the URL fragment.
// Recover the verified session even when the document is not reloaded.
window.addEventListener("hashchange",()=>{
 if(new URLSearchParams(location.hash.slice(1)).has("access_token")||
    new URLSearchParams(location.hash.slice(1)).has("error"))boot();
});
boot();
})();