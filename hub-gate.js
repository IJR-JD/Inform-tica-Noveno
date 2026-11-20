/* Route-level verified-session gate for the school learning pages.
 * Authentication is revalidated with Supabase before revealing content.
 * Static HTML/JS remains publicly downloadable on GitHub Pages. */
(function(){
"use strict";
const destination=(window.location.pathname.split("/").pop()||"hub.html")==="docente.html"?"docente.html":"hub.html";
document.documentElement.setAttribute("data-auth-pending","true");
function loginRoute(){
 const path=new URL("./",window.location.href);
 path.searchParams.set("next",destination);
 window.location.replace(path.href);
}
const auth=window.IJRCADAuth;
if(!auth){loginRoute();return}
auth.init().then(user=>{
 if(!user){loginRoute();return}
 document.documentElement.setAttribute("data-auth-pending","false");
 window.dispatchEvent(new CustomEvent("ijr-session-ready",{detail:{email:user.email}}));
}).catch(()=>loginRoute());
})();