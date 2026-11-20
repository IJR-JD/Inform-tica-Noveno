/* Route-level verified-session gate for the school learning pages.
 * Authentication is revalidated with Supabase before revealing content.
 * Static HTML/JS remains publicly downloadable on GitHub Pages. */
(function(){
"use strict";
const destination=(window.location.pathname.split("/").pop()||"hub.html")==="docente.html"?"docente.html":"hub.html";
document.documentElement.setAttribute("data-auth-pending","true");
function guestIdentity(){
 if(destination!=="hub.html")return null;
 try{
  const data=JSON.parse(sessionStorage.getItem("ijr-cad9-guest-v1")||"null");
  if(!data||!window.IJRCADAuth?.validEmail(data.email)||!Number.isFinite(data.createdAt)||Date.now()-data.createdAt>12*3600*1000)return null;
  return {email:data.email,verified:false};
 }catch{return null}
}
function permitGuest(guest){
 window.IJRGuest=guest;
 document.documentElement.setAttribute("data-auth-pending","false");
 document.documentElement.setAttribute("data-auth-ready","true");
 document.documentElement.setAttribute("data-guest-access","true");
 window.dispatchEvent(new CustomEvent("ijr-guest-ready",{detail:guest}));
}
function loginRoute(){
 const path=new URL("./",window.location.href);
 path.searchParams.set("next",destination);
 window.location.replace(path.href);
}
const auth=window.IJRCADAuth;
if(!auth){loginRoute();return}
auth.init().then(user=>{
 if(!user){
  const guest=guestIdentity();
  if(guest){permitGuest(guest);return}
  loginRoute();return
 }
 document.documentElement.setAttribute("data-auth-pending","false");
 document.documentElement.setAttribute("data-auth-ready","true");
 window.dispatchEvent(new CustomEvent("ijr-session-ready",{detail:{email:user.email}}));
}).catch(()=>{const guest=guestIdentity();if(guest)permitGuest(guest);else loginRoute()});
})();