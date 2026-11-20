/* IJR Grade 9 — institutional email verification via Supabase Auth REST.
   No secret or service-role key is shipped to the browser. */
(function(root,factory){
 "use strict";
 const instance=factory();
 if(typeof module==="object"&&module.exports)module.exports=instance;
 root.IJRCADAuth=instance;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const URL="https://rlfxnjbqxbozjdzkbwlz.supabase.co";
 const PUBLISHABLE_KEY="sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87";
 const DOMAIN="ijr.edu.co";
 const SESSION_KEY="ijr-cad9-auth-session-v1";
 const OAUTH_EMAIL_KEY="ijr-cad9-expected-email";
 let initPromise=null;
 let session=null,user=null;
 const listeners=new Set();
 function normalizeEmail(value){return String(value||"").trim().toLowerCase()}
 function validEmail(value){const e=normalizeEmail(value);return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+$/.test(e)&&e.endsWith("@"+DOMAIN)&&e.length<=254}
 function readLocal(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null")}catch{return null}}
 function writeLocal(value){try{if(value)localStorage.setItem(SESSION_KEY,JSON.stringify(value));else localStorage.removeItem(SESSION_KEY)}catch{}}
 function notify(){for(const callback of listeners)try{callback(user)}catch{}}
 function setSession(data,verifiedUser){
  if(!data?.access_token||!data?.refresh_token||!verifiedUser?.id||!validEmail(verifiedUser.email))throw Error("No se obtuvo una sesión institucional válida.");
  session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at||Math.floor(Date.now()/1000)+(data.expires_in||3600)};
  user={id:verifiedUser.id,email:normalizeEmail(verifiedUser.email)};
  writeLocal(session);notify();return user;
 }
 async function request(path,options={}){
  const response=await fetch(URL+path,{...options,headers:{"apikey":PUBLISHABLE_KEY,"content-type":"application/json",...(options.headers||{})}});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){const e=Error(payload.msg||payload.error_description||payload.message||payload.error||"Error de autenticación o conexión");e.status=response.status;throw e}
  return payload;
 }
 function beginInstitutionalSignIn(email,returnTo){
  const value=normalizeEmail(email);
  if(!validEmail(value))throw Error("Introduce un correo institucional válido @"+DOMAIN+".");
  if(typeof window==="undefined"||!window.location)throw Error("La autenticación institucional requiere navegador.");
  const allowed=new Set(["hub.html","docente.html"]);
  const dest=allowed.has(returnTo)?returnTo:"hub.html";
  const callback=new URL("./",window.location.href);
  callback.searchParams.set("next",dest);
  // The student controls the Google account, not the form's text.
  // No database identity is trusted until Supabase validates an OAuth session.
  sessionStorage.setItem(OAUTH_EMAIL_KEY,value);
  const url=new URL(URL+"/auth/v1/authorize");
  url.searchParams.set("provider","google");
  url.searchParams.set("redirect_to",callback.href);
  window.location.assign(url.href);
 }
 async function consumeOAuthRedirect(){
  if(typeof window==="undefined")return null;
  const h=new URLSearchParams(window.location.hash.replace(/^#/,""));
  if(h.has("error")||h.has("error_description")){
   const message=h.get("error_description")||h.get("error")||"Inicio de sesión cancelado";
   history.replaceState(null,"",window.location.pathname+window.location.search);
   throw Error(message);
  }
  if(!h.has("access_token"))return null;
  const received={access_token:h.get("access_token"),refresh_token:h.get("refresh_token"),expires_in:Number(h.get("expires_in")||3600)};
  const verified=await request("/auth/v1/user",{headers:{Authorization:"Bearer "+received.access_token}});
  if(!validEmail(verified.email))throw Error("La cuenta Google no pertenece al dominio institucional.");
  const expected=sessionStorage.getItem(OAUTH_EMAIL_KEY);
  if(expected&&normalizeEmail(verified.email)!==expected)throw Error("Seleccionaste otra cuenta Google. Accede con "+expected+".");
  const current=setSession(received,verified);
  sessionStorage.removeItem(OAUTH_EMAIL_KEY);
  history.replaceState(null,"",window.location.pathname+window.location.search);
  return current;
 }
  async function refresh(){
  if(!session?.refresh_token)throw Error("No hay sesión para renovar.");
  const data=await request("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:JSON.stringify({refresh_token:session.refresh_token})});
  return setSession(data,data.user);
 }
 async function verifySession(){
  if(!session?.access_token)throw Error("Debes ingresar mediante tu correo institucional.");
  if(session.expires_at&&session.expires_at<Math.floor(Date.now()/1000)+45)await refresh();
  try{
   const data=await request("/auth/v1/user",{headers:{Authorization:"Bearer "+session.access_token}});
   if(!validEmail(data.email))throw Error("El correo autenticado no pertenece a la institución.");
   const id=data.id;if(!id)throw Error("No existe una identidad verificable.");
   user={id,email:normalizeEmail(data.email)};notify();return user;
  }catch(err){
   if(err.status===401&&session.refresh_token){await refresh();return verifySession()}
   throw err;
  }
 }
 async function initInternal(){
  try{
   const oauth=await consumeOAuthRedirect();
   if(oauth)return oauth;
  }catch(error){
   session=null;user=null;writeLocal(null);notify();
   throw error;
  }
  session=readLocal();
  if(!session){user=null;notify();return null}
  try{return await verifySession()}catch{session=null;user=null;writeLocal(null);notify();return null}
 }
 function init(){
  if(!initPromise)initPromise=initInternal().finally(()=>{initPromise=null});
  return initPromise;
 }
 function onChange(callback){listeners.add(callback);return ()=>listeners.delete(callback)}
 async function signOut(){
  if(session?.access_token)try{await request("/auth/v1/logout",{method:"POST",headers:{Authorization:"Bearer "+session.access_token}})}catch{}
  session=null;user=null;writeLocal(null);notify();
 }
 async function dataApi(table,method,body,query=""){
  await verifySession();
  const path="/rest/v1/"+table+query,config={method,headers:{Authorization:"Bearer "+session.access_token,Prefer:"resolution=merge-duplicates,return=representation"}};
  if(body!==undefined)config.body=JSON.stringify(body);
  return request(path,config);
 }
 async function loadDiagnostic(){
  if(!user)return null;
  const rows=await dataApi("cad9_diagnostic_results_v1","GET",undefined,"?select=answers,submitted_at,profile&user_id=eq."+encodeURIComponent(user.id));
  return Array.isArray(rows)&&rows.length?rows[0]:null;
 }
 async function saveDiagnostic({answers,submittedAt,profile}){
  if(!user)throw Error("Identidad no autenticada.");
  const row={user_id:user.id,institutional_email:user.email,answers,submitted_at:submittedAt||null,profile:profile||{},updated_at:new Date().toISOString()};
  return dataApi("cad9_diagnostic_results_v1","POST",row,"?on_conflict=user_id");
 }
 async function loadProgress(){
  if(!user)return null;
  const rows=await dataApi("cad9_course_progress_v1","GET",undefined,"?select=progress&user_id=eq."+encodeURIComponent(user.id));
  return Array.isArray(rows)&&rows[0]?.progress||null;
 }
 async function saveProgress(progress){
  if(!user)throw Error("Identidad no autenticada.");
  if(!progress||typeof progress!=="object"||Array.isArray(progress))throw Error("Estado de avance inválido.");
  return dataApi("rpc/cad9_merge_course_progress","POST",{p_progress:progress});
 }
 async function isTeacher(){
  if(!user)return false;
  const allowed=await dataApi("rpc/cad9_teacher_authorized","POST",{});
  return allowed===true;
 }
 async function loadClassDiagnostics(){
  if(!await isTeacher())throw Error("Acceso exclusivo para docentes autorizados.");
  return dataApi("cad9_diagnostic_results_v1","GET",undefined,
    "?select=user_id,institutional_email,answers,submitted_at,profile,updated_at&order=institutional_email.asc");
 }
 async function loadClassProgress(){
  if(!await isTeacher())throw Error("Acceso exclusivo para docentes autorizados.");
  return dataApi("cad9_course_progress_v1","GET",undefined,
    "?select=user_id,institutional_email,progress,updated_at&order=institutional_email.asc");
 }
 return {URL,DOMAIN,SESSION_KEY,normalizeEmail,validEmail,onChange,init,beginInstitutionalSignIn,consumeOAuthRedirect,verifySession,signOut,
  get user(){return user},get authenticated(){return Boolean(user)},loadDiagnostic,saveDiagnostic,loadProgress,saveProgress,isTeacher,loadClassDiagnostics,loadClassProgress};
});