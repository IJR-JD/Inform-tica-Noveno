/* Docente IJR: consulta protegida por Supabase RLS. */
(function(){
"use strict";
const A=window.IJRCADAuth,D=window.IJRDiagnostic,P=window.CADProgress;
const $=id=>document.getElementById(id);
let records=[],isReady=false,pending="";
function show(id,on){$(id).classList.toggle("app-hidden",!on)}
function message(value){$("teacherDataStatus").textContent=String(value)}
function count(progress){return P.countCompleted(P.cleanState(progress||{},26),26)}
function currentProfile(item){return item.diagnostic?.submitted_at?D.profile(item.diagnostic.answers):null}
function summarize(diagnostics,progresses){
 const byEmail=new Map();
 for(const d of diagnostics)byEmail.set(d.institutional_email,{email:d.institutional_email,diagnostic:d,progress:null});
 for(const p of progresses){
  let v=byEmail.get(p.institutional_email)||{email:p.institutional_email,diagnostic:null,progress:null};
  v.progress=p.progress;byEmail.set(v.email,v);
 }
 return [...byEmail.values()].sort((a,b)=>a.email.localeCompare(b.email));
}
function cell(row,value){const td=document.createElement("td");td.textContent=String(value);row.append(td)}
function render(){
 const body=$("teacherRows");body.replaceChildren();
 const filter=$("teacherSearch").value.trim().toLowerCase();
 for(const item of records.filter(x=>x.email.toLowerCase().includes(filter))){
  const tr=document.createElement("tr"),p=currentProfile(item);
  cell(tr,item.email);cell(tr,p?p.score+" / "+p.total:"Pendiente");
  cell(tr,p?.level||"Sin presentar");cell(tr,count(item.progress)+" / 26");
  const td=document.createElement("td"),button=document.createElement("button");
  button.type="button";button.className="teacher-detail-button";button.textContent="Examinar";
  button.onclick=()=>detail(item);td.append(button);tr.append(td);body.append(tr);
 }
}
function detail(item){
 show("teacherDetail",true);$("teacherDetailTitle").textContent=item.email;
 const p=currentProfile(item),progress=P.cleanState(item.progress||{},26);
 $("teacherDetailIntro").textContent=p?"Diagnóstico: "+p.score+" / "+p.total+" · "+p.level:"Diagnóstico pendiente";
 const domains=$("teacherDomainStats");domains.replaceChildren();
 const tips=$("teacherRecommendations");tips.replaceChildren();
 if(p){
  for(const domain of p.domains){
   const article=document.createElement("article"),h=document.createElement("h4"),v=document.createElement("p");
   h.textContent=domain.category;v.textContent=domain.correct+" / "+domain.total+" · "+domain.percent+"%";
   article.append(h,v);domains.append(article);
  }
  for(const tip of p.priorities){const line=document.createElement("p");line.textContent=tip.category+": "+tip.activity;tips.append(line)}
 }
 const units=$("teacherUnitRecords");units.replaceChildren();
 for(let i=0;i<26;i++){
  const article=document.createElement("article"),heading=document.createElement("h4"),note=document.createElement("p");
  heading.textContent="Unidad "+(i+1);
  const ex=progress.exercises[i];
  note.textContent=P.completed(progress,i)?"Completada":ex?"Registro parcial":"Pendiente";
  article.append(heading,note);
  if(ex){const explanation=document.createElement("p");explanation.textContent=ex.description;article.append(explanation);
   const evidence=document.createElement("p");evidence.textContent="Evidencia: "+ex.evidence;article.append(evidence)}
  units.append(article);
 }
 const answers=$("teacherAnswers");answers.replaceChildren();
 if(p){
  const saved=D.validAnswers(item.diagnostic.answers);
  for(const q of D.questions){
   const line=document.createElement("p"),index=saved[q.id];
   line.textContent=q.id+". "+q.prompt+" Respuesta: "+(Number.isInteger(index)?q.options[index]:"Sin responder")+". Clave: "+q.options[q.correct]+".";
   answers.append(line);
  }
 }
 $("teacherDetail").scrollIntoView({behavior:"smooth",block:"start"});
}
async function load(){
 if(!isReady)return;
 message("Consultando registros institucionales…");
 try{
  const [diagnostics,progress]=await Promise.all([A.loadClassDiagnostics(),A.loadClassProgress()]);
  records=summarize(diagnostics,progress);render();
  const done=records.map(currentProfile).filter(Boolean);
  $("teacherStudents").textContent=records.length;
  $("teacherCompleted").textContent=done.length;
  $("teacherAverage").textContent=done.length?Math.round(done.reduce((s,p)=>s+p.percent,0)/done.length)+"%":"—";
  $("teacherPractices").textContent=records.reduce((s,x)=>s+count(x.progress),0);
  message(records.length+" estudiantes registrados. Consulta de solo lectura.");
 }catch(e){message("No se pudieron cargar los datos: "+e.message)}
}
async function authorize(){
 isReady=false;show("teacherDashboard",false);
 if(!A.authenticated){show("teacherLogin",true);show("teacherDenied",false);show("teacherSignOut",false);return}
 show("teacherLogin",false);show("teacherSignOut",true);
 try{
  isReady=await A.isTeacher();
  show("teacherDenied",!isReady);show("teacherDashboard",isReady);
  if(isReady){$("teacherAccount").textContent="Docente: "+A.user.email;await load()}
 }catch(e){show("teacherDenied",true);$("teacherDeniedReason").textContent="No se pudo verificar el rol: "+e.message}
}
async function send(){
 const email=A.normalizeEmail($("teacherEmail").value);
 if(!A.validEmail(email)){$("teacherAuthStatus").textContent="Utiliza tu correo @ijr.edu.co.";return}
 $("teacherSend").disabled=true;
 try{pending=await A.requestOtp(email);show("teacherOtpZone",true);$("teacherAuthStatus").textContent="Introduce el código recibido."}
 catch(e){$("teacherAuthStatus").textContent=e.message}
 finally{$("teacherSend").disabled=false}
}
async function verify(){
 $("teacherVerify").disabled=true;
 try{await A.verifyOtp(pending,$("teacherOtp").value);await authorize()}
 catch(e){$("teacherAuthStatus").textContent=e.message}
 finally{$("teacherVerify").disabled=false}
}
$("teacherSend").onclick=send;$("teacherVerify").onclick=verify;
$("teacherEmail").onkeydown=e=>{if(e.key==="Enter")send()};
$("teacherOtp").onkeydown=e=>{if(e.key==="Enter")verify()};
function downloadFile(filename,mime,content){
 if(!isReady)return;
 const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function quoteCsv(value){
 const safe=String(value??"").replace(/[\r\n]+/g," ").replace(/^[=+\-@]/,"'$&");
 return '"'+safe.replace(/"/g,'""')+'"';
}
function exportSummary(){
 if(!isReady)return;
 const header=["Correo institucional","Puntaje","Preguntas","Porcentaje","Nivel orientativo","Unidades CAD"];
 const lines=[header,...records.map(item=>{
  const p=currentProfile(item);
  return [item.email,p?.score??"",p?.total??"",p?.percent??"",p?.level||"Pendiente",count(item.progress)];
 })].map(row=>row.map(quoteCsv).join(",")).join("\r\n");
 downloadFile("informatica9_resumen_docente.csv","text/csv;charset=utf-8","\uFEFF"+lines);
}
function exportRecords(){
 if(!isReady)return;
 const data=records.map(item=>({
  institutionalEmail:item.email,diagnosticSubmittedAt:item.diagnostic?.submitted_at||null,
  profile:currentProfile(item),diagnosticAnswers:item.diagnostic?.answers||null,
  cadProgress:item.progress||null
 }));
 downloadFile("informatica9_registros_docente.json","application/json",
  JSON.stringify({exportedAt:new Date().toISOString(),records:data},null,2));
}
$("teacherRefresh").onclick=load;$("teacherSearch").oninput=render;$("teacherExportCsv").onclick=exportSummary;$("teacherExportJson").onclick=exportRecords;
$("teacherCloseDetail").onclick=()=>show("teacherDetail",false);
$("teacherSignOut").onclick=async()=>{await A.signOut();records=[];await authorize()};
A.init().then(authorize).catch(e=>{$("teacherAuthStatus").textContent=e.message});
})();