/* Institutional email entrance: only Supabase-verified session proceeds. */
(function(){
"use strict";
const A=window.IJRCADAuth;
const $=id=>document.getElementById(id);
const emailForm=$("loginEmailForm"),otpForm=$("loginOtpForm"),notice=$("loginMessage"),loading=$("loginLoading");
let pending="",busy=false;
const allowedRoutes=new Set(["hub.html","docente.html"]);
function destination(){
 const param=new URLSearchParams(location.search).get("next")||"hub.html";
 return allowedRoutes.has(param)?param:"hub.html";
}
function redirect(){location.replace(new URL(destination(),location.href).href)}
function status(value,type="info"){notice.textContent=value;notice.dataset.type=type}
function setBusy(on){
 busy=on;
 $("loginSend").disabled=on;$("loginVerify").disabled=on;$("loginChange").disabled=on;
 loading.hidden=!on;
}
async function boot(){
 setBusy(true);status("Comprobando la sesión institucional…");
 try{
  const user=await A.init();
  if(user){redirect();return}
  status("");emailForm.hidden=false;
 }catch{status("No fue posible recuperar la sesión. Ingresa con tu correo institucional.","error")}
 finally{setBusy(false)}
}
emailForm.addEventListener("submit",async event=>{
 event.preventDefault();if(busy)return;
 const email=A.normalizeEmail($("loginEmail").value);
 if(!A.validEmail(email)){status("Solo se permite correo institucional @"+A.DOMAIN+".","error");return}
 setBusy(true);status("Solicitando código de acceso…");
 try{
  pending=await A.requestOtp(email);
  emailForm.hidden=true;otpForm.hidden=false;
  $("loginOtpDescription").textContent="Código enviado a "+pending+". Revisa también la carpeta de correo no deseado.";
  $("loginOtp").focus();status("Escribe el código de verificación enviado a tu correo.","success");
 }catch(error){status(error.message||"No se pudo enviar el código. Inténtalo nuevamente.","error")}
 finally{setBusy(false)}
});
otpForm.addEventListener("submit",async event=>{
 event.preventDefault();if(busy)return;
 if(!pending){status("Solicita primero un código.","error");return}
 setBusy(true);status("Verificando tu cuenta institucional…");
 try{
  await A.verifyOtp(pending,$("loginOtp").value);
  status("Identidad verificada. Accediendo al Learning Hub…","success");
  redirect();
 }catch(error){status(error.message||"El código no se pudo verificar. Solicita otro si ha expirado.","error")}
 finally{setBusy(false)}
});
$("loginChange").addEventListener("click",()=>{
 if(busy)return;pending="";$("loginOtp").value="";
 otpForm.hidden=true;emailForm.hidden=false;status("");
 $("loginEmail").focus();
});
boot();
})();