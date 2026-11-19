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
 async function requestOtp(email){
  const value=normalizeEmail(email);if(!validEmail(value))throw Error("Introduce tu correo institucional @"+DOMAIN+".");
  await request("/auth/v1/otp",{method:"POST",body:JSON.stringify({email:value,create_user:true})});
  return value;
 }
 async function verifyOtp(email,token){
  const value=normalizeEmail(email),pin=String(token||"").trim();
  if(!validEmail(value)||!/^[0-9]{6,8}$/.test(pin))throw Error("Verifica el correo y escribe el código numérico recibido.");
  const payload=await request("/auth/v1/verify",{method:"POST",body:JSON.stringify({email:value,token:pin,type:"email"})});
  return setSession(payload,payload.user);
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
 async function init(){
  session=readLocal();
  if(!session){user=null;notify();return null}
  try{return await verifySession()}catch{session=null;user=null;writeLocal(null);notify();return null}
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
  const row={user_id:user.id,institutional_email:user.email,progress,updated_at:new Date().toISOString()};
  return dataApi("cad9_course_progress_v1","POST",row,"?on_conflict=user_id");
 }
 return {URL,DOMAIN,SESSION_KEY,normalizeEmail,validEmail,onChange,init,requestOtp,verifyOtp,verifySession,signOut,
  get user(){return user},get authenticated(){return Boolean(user)},loadDiagnostic,saveDiagnostic,loadProgress,saveProgress};
});