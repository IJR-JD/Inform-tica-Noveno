/* Módulo 0 — Supabase-authenticated institutional email / formative diagnostic. */
(function(){
 "use strict";
 const D=window.IJRDiagnostic,A=window.IJRCADAuth,$=id=>document.getElementById(id);
 const DRAFT_PREFIX="ijr-cad9-draft-auth-v1-";
 let state={answers:{},submitted:false,submittedAt:null},current=0,saving=false,teacherMode=false;
 let draftTimer=null,draftQueue=Promise.resolve(),draftDirty=false;
 const ident=$("diagnosticIdentity"),nav=$("diagnosticNav"),body=$("diagnosticBody");
 const notice=$("diagnosticNotice"),status=$("diagnosticIdentityStatus");
 function setStatus(message){status.textContent=message}
 function setNotice(message){notice.textContent=message}
 function reportError(err){return err?.message||"No se pudo completar la operación."}
 function hide(el,on){el.classList.toggle("app-hidden",on)}
 function draftKey(){return A.user?DRAFT_PREFIX+A.user.id:null}
 function queueDraft(){
  if(!A.authenticated||teacherMode||state.submitted)return draftQueue;
  const snapshot=D.validAnswers(state.answers);
  draftQueue=draftQueue.catch(()=>{}).then(()=>A.saveDiagnostic({answers:snapshot,submittedAt:null,profile:{}}));
  return draftQueue;
 }
 function saveDraft(){
  const key=draftKey();if(!key||state.submitted||teacherMode)return;
  try{localStorage.setItem(key,JSON.stringify({answers:D.validAnswers(state.answers)}))}catch{}
  draftDirty=true;
  if(draftTimer)clearTimeout(draftTimer);
  draftTimer=setTimeout(()=>{
   draftTimer=null;draftDirty=false;
   queueDraft().catch(error=>{setNotice("Respuestas guardadas en este equipo; sincronización pendiente: "+error.message)});
  },500);
 }
 async function flushDraft(){
  if(draftTimer){clearTimeout(draftTimer);draftTimer=null}
  if(draftDirty){draftDirty=false;await queueDraft()}
  await draftQueue;
 }
 async function hydrate(){
  if(!A.authenticated){state={answers:{},submitted:false,submittedAt:null};teacherMode=false;window.setTeacherAccess?.(false);window.setDiagnosticComplete?.(false);await window.refreshStudentProgress?.();render();return}
  state={answers:{},submitted:false,submittedAt:null};
  try{
   const row=await A.loadDiagnostic();
   if(row){
    state.answers=D.validAnswers(row.answers);
    state.submitted=Boolean(row.submitted_at)&&D.evaluate(state.answers).answered===D.questions.length;
    state.submittedAt=state.submitted?row.submitted_at:null;
   }else{
    const raw=JSON.parse(localStorage.getItem(draftKey())||"{}");
    state.answers=D.validAnswers(raw.answers);
   }
  }catch(err){
   setNotice("No se pudo cargar el perfil desde Supabase. Se requiere conexión para finalizar: "+reportError(err));
   try{state.answers=D.validAnswers(JSON.parse(localStorage.getItem(draftKey())||"{}").answers)}catch{}
  }
  let teacher=false;try{teacher=await A.isTeacher()}catch(error){console.warn("No se pudo comprobar el acceso docente:",error.message)}
  teacherMode=teacher;
  window.setTeacherAccess?.(teacher);
  window.setDiagnosticComplete?.(state.submitted);
  await window.refreshStudentProgress?.();
  current=0;render();
 }
 function presentAuth(){
  const logged=A.authenticated;
  hide(ident,logged);hide($("diagnosticActiveStudent"),!logged);
  $("diagnosticStudentCode").textContent=logged?"Correo verificado: "+A.user.email:"";
  hide(nav,!logged||state.submitted||teacherMode);hide(body,!logged);
  for(const id of ["diagnosticPrev","diagnosticNext","diagnosticSubmit"])hide($(id),!logged||state.submitted||teacherMode);
  hide($("diagnosticGoCAD"),!logged||(!state.submitted&&!teacherMode));
  hide($("diagnosticExport"),!logged||!state.submitted||teacherMode);
  if(!logged){$("diagnosticCounter").textContent="0 / "+D.questions.length;$("diagnosticBar").style.width="0%"}
  $("diagnosticCardStatus").textContent=teacherMode?"CONTENIDO COMPLETO · ACCESO LIBRE":logged?(state.submitted?"PERFIL COMPLETADO":"EVALUACIÓN PENDIENTE"):"CORREO INSTITUCIONAL REQUERIDO";
  $("openDiagnostic").textContent=teacherMode?"Revisar Módulo 0 y soluciones →":logged&&state.submitted?"Consultar mi perfil":"Iniciar diagnóstico →";
  return logged;
 }
 function view(){
  document.querySelectorAll("#overview,#theory,#workshop,#lab,#diagnostic").forEach(el=>hide(el,el.id!=="diagnostic"));
  window.scrollTo(0,0);render();
 }
 function questionNav(){
  nav.replaceChildren();
  const tag=document.createElement("p");tag.className="eyebrow";tag.textContent="PREGUNTAS · ✓ RESPONDIDA";nav.append(tag);
  const grid=document.createElement("div");grid.className="diagnostic-nav-grid";
  D.questions.forEach((q,i)=>{
   const done=Object.hasOwn(state.answers,q.id),btn=document.createElement("button");btn.type="button";btn.className="diagnostic-nav-button";
   if(done)btn.classList.add("is-answered");if(i===current)btn.classList.add("is-current");
   btn.textContent=String(i+1).padStart(2,"0")+(done?" ✓":"");
   btn.setAttribute("aria-label","Pregunta "+(i+1)+(done?", respondida":", pendiente"));
   if(i===current)btn.setAttribute("aria-current","step");
   btn.onclick=()=>{current=i;render()};grid.append(btn);
  });nav.append(grid);
 }
 function question(){
  body.replaceChildren();questionNav();
  const q=D.questions[current],tag=document.createElement("p"),heading=document.createElement("h2");
  tag.className="eyebrow";tag.textContent=q.category+" · PREGUNTA "+(current+1)+" DE "+D.questions.length;
  heading.textContent=q.prompt;body.append(tag,heading,window.IJRVisuals.build(q.id));
  const answers=document.createElement("div");answers.className="diagnostic-options";
  q.options.forEach((option,i)=>{
   const label=document.createElement("label");label.className="diagnostic-choice";
   const input=document.createElement("input");input.type="radio";input.name="diagnosticAnswer";input.value=i;input.checked=state.answers[q.id]===i;
   input.onchange=()=>{
    state.answers[q.id]=i;saveDraft();updateProgress();questionNav();setNotice("Respuesta guardada. Se sincronizará con Supabase automáticamente.");
   };
   const copy=document.createElement("span");copy.textContent=option;label.append(input,copy);answers.append(label);
  });body.append(answers);
  $("diagnosticPrev").disabled=current===0;
  $("diagnosticNext").textContent=current===D.questions.length-1?"Revisar respuestas →":"Siguiente pregunta →";
  updateProgress();
 }
 function updateProgress(){
  const e=D.evaluate(state.answers);
  $("diagnosticCounter").textContent=e.answered+" / "+e.total+" respondidas";
  $("diagnosticBar").style.width=Math.round(100*e.answered/e.total)+"%";
  $("diagnosticSubmit").disabled=saving||e.answered!==e.total||!A.authenticated;
 }
 function summary(){
  body.replaceChildren();const e=D.evaluate(state.answers),p=D.profile(state.answers);
  const tag=document.createElement("p");tag.className="eyebrow";tag.textContent="PERFIL DIAGNÓSTICO · "+A.user.email;body.append(tag);
  const heading=document.createElement("h2");heading.className="diagnostic-total";heading.textContent=e.correct+" / "+e.total+" respuestas correctas";body.append(heading);
  const explanation=document.createElement("p");explanation.textContent="Resultados orientativos por competencia. No hay nota mínima y no constituyen una clasificación permanente.";body.append(explanation);
  const profile=document.createElement("section");profile.className="diagnostic-profile";
  const ptitle=document.createElement("h3");ptitle.textContent=p.level+" · "+p.percent+"%";
  const pdesc=document.createElement("p");pdesc.textContent=p.interpretation;
  const best=document.createElement("p");best.textContent="Fortalezas relativas: "+p.strongest.join(" y ")+".";
  profile.append(ptitle,pdesc,best);body.append(profile);
  const grid=document.createElement("div");grid.className="diagnostic-results";
  p.domains.forEach(g=>{
   const item=document.createElement("article");item.className="diagnostic-result-card";
   const h=document.createElement("h3");h.textContent=g.category;
   const val=document.createElement("p");val.textContent=g.correct+" de "+g.total+" · "+g.percent+"%";
   const bar=document.createElement("div");bar.className="progress-track";const fill=document.createElement("span");fill.style.width=g.percent+"%";bar.append(fill);
   item.append(h,val,bar);grid.append(item);
  });body.append(grid);
  const recommend=document.createElement("section");recommend.className="diagnostic-recommendations";
  const title=document.createElement("h3");title.textContent="Actividades recomendadas";recommend.append(title);
  if(!p.priorities.length){const row=document.createElement("p");row.textContent="Todas las competencias superaron el umbral orientativo de refuerzo. Continúa con ejercicios de profundización.";recommend.append(row)}
  p.priorities.forEach((r,i)=>{const row=document.createElement("p");row.textContent=(i+1)+". "+r.category+" ("+r.percent+"%): "+r.activity;recommend.append(row)});
  body.append(recommend);
  const details=document.createElement("details");details.className="diagnostic-review";
  const label=document.createElement("summary");label.textContent="Revisar respuestas y explicaciones";details.append(label);
  D.questions.forEach(q=>{const para=document.createElement("p");para.textContent=(state.answers[q.id]===q.correct?"✓ ":"• ")+q.id+". "+q.prompt+" Respuesta: "+q.options[q.correct]+". "+q.explanation;details.append(para)});
  body.append(details);
  $("diagnosticCounter").textContent=e.total+" / "+e.total+" respondidas";
  $("diagnosticBar").style.width="100%";
  setNotice("Diagnóstico guardado en Supabase bajo tu cuenta institucional.");
 }
 function teacherPreview(){
  body.replaceChildren();
  const tag=document.createElement("p");tag.className="eyebrow";tag.textContent="MÓDULO 0 · CONSULTA LIBRE AUTORIZADA";body.append(tag);
  const heading=document.createElement("h2");heading.textContent="24 preguntas, figuras y soluciones";body.append(heading);
  const intro=document.createElement("p");intro.textContent="Puedes revisar todas las preguntas y las claves sin presentar el diagnóstico, registrar respuestas ni modificar resultados de estudiantes.";body.append(intro);
  D.questions.forEach(q=>{
   const section=document.createElement("details");section.className="diagnostic-review";
   const summary=document.createElement("summary");summary.textContent=String(q.id).padStart(2,"0")+" · "+q.category+" · "+q.prompt;
   section.append(summary,window.IJRVisuals.build(q.id));
   const options=document.createElement("p");options.textContent="Opciones: "+q.options.join(" | ");
   const answer=document.createElement("p");answer.textContent="Respuesta correcta: "+q.options[q.correct];
   const explanation=document.createElement("p");explanation.textContent="Explicación: "+q.explanation;
   section.append(options,answer,explanation);body.append(section);
  });
  $("diagnosticCounter").textContent=D.questions.length+" preguntas disponibles";
  $("diagnosticBar").style.width="100%";
  setNotice("Vista libre de consulta. No se modifica el avance estudiantil.");
 }
 function render(){if(!presentAuth())return;if(teacherMode)teacherPreview();else if(state.submitted)summary();else question()}
 async function finish(){
  if(!A.authenticated||saving)return;
  const e=D.evaluate(state.answers);if(e.answered!==e.total){setNotice("Responde las "+e.total+" preguntas antes de finalizar.");return}
  saving=true;$("diagnosticSubmit").disabled=true;
  const date=new Date().toISOString();
  try{
   await flushDraft();
   await A.saveDiagnostic({answers:D.validAnswers(state.answers),submittedAt:date,profile:D.profile(state.answers)});
   state.submitted=true;state.submittedAt=date;
   window.setDiagnosticComplete?.(true);render();
  }catch(err){setNotice("No se guardó el resultado en Supabase. Vuelve a intentarlo: "+reportError(err))}
  finally{saving=false;updateProgress()}
 }
 $("openDiagnostic").onclick=view;
 $("fromDiagnostic").onclick=()=>window.returnCADHome?.();
 $("diagnosticSwitch").onclick=async()=>{await A.signOut();location.reload()};
 $("diagnosticPrev").onclick=()=>{if(current>0){current--;render()}};
 $("diagnosticNext").onclick=()=>{
  if(current<D.questions.length-1){current++;render();return}
  const missing=D.questions.findIndex(q=>!Object.hasOwn(state.answers,q.id));
  if(missing>=0){current=missing;render();setNotice("Completa la pregunta pendiente.");return}
  setNotice("Todas las preguntas están respondidas. Selecciona Finalizar diagnóstico.");
 };
 $("diagnosticSubmit").onclick=finish;
 $("diagnosticGoCAD").onclick=()=>{window.returnCADHome?.();$("topicGrid").scrollIntoView({behavior:"smooth"})};
 $("diagnosticExport").onclick=()=>{
  if(!state.submitted||!A.authenticated)return;
  const record={version:3,institutionalEmail:A.user.email,module:"Diagnóstico de habilidades fundamentales",submittedAt:state.submittedAt,profile:D.profile(state.answers),answers:D.validAnswers(state.answers)};
  const blob=new Blob([JSON.stringify(record,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob);
  const link=document.createElement("a");link.href=url;link.download="diagnostico_9_perfil.json";document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 A.init().then(hydrate).catch(err=>{setStatus("No se pudo iniciar la autenticación: "+reportError(err));render()});
 render();
})();