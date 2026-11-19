/* Module 0 view controller — reuses the consolidated monochrome Learning Hub */
(function(){
"use strict";
const D=window.IJRDiagnostic;
const $=id=>document.getElementById(id);
const state=D.load(localStorage);
let current=0;

function persist(){
 try{localStorage.setItem(D.KEY,JSON.stringify(state));return true}catch{return false}
}
function show(){
 document.querySelectorAll('#overview,#theory,#workshop,#lab,#diagnostic').forEach(node=>node.classList.toggle('app-hidden',node.id!=='diagnostic'));
 window.scrollTo(0,0);
 render();
}
function questionNavigation(){
 const nav=$("diagnosticNav");nav.replaceChildren();
 if(state.submitted){nav.classList.add("app-hidden");return}
 nav.classList.remove("app-hidden");
 const label=document.createElement("p");label.className="eyebrow";label.textContent="SALTA A UNA PREGUNTA · ✓ RESPONDIDA";nav.append(label);
 const group=document.createElement("div");group.className="diagnostic-nav-grid";
 D.questions.forEach((q,i)=>{
   const btn=document.createElement("button");btn.type="button";btn.className="diagnostic-nav-button";
   const answered=Number.isInteger(state.answers[q.id]);
   btn.textContent=String(i+1).padStart(2,"0")+(answered?" ✓":"");
   btn.setAttribute("aria-label","Pregunta "+(i+1)+(answered?", respondida":", sin responder"));
   btn.setAttribute("aria-current",i===current?"step":"false");
   if(answered)btn.classList.add("is-answered");
   if(i===current)btn.classList.add("is-current");
   btn.onclick=()=>{current=i;render()};
   group.append(btn);
 });nav.append(group);
}
function questionUI(){
 const q=D.questions[current],value=state.answers[q.id];
 const frame=$('diagnosticBody');
 frame.replaceChildren();
 const tag=document.createElement('p');tag.className="eyebrow";tag.textContent=q.category+" · PREGUNTA "+(current+1)+" DE "+D.questions.length;frame.append(tag);
 const heading=document.createElement('h2');heading.textContent=q.prompt;frame.append(heading);
 frame.append(window.IJRVisuals.build(q.id));
 const opts=document.createElement('div');opts.className="diagnostic-options";
 q.options.forEach((option,index)=>{
  const label=document.createElement('label');label.className="diagnostic-choice";
  const input=document.createElement('input');input.type='radio';input.name="diagnosticAnswer";input.value=index;input.checked=value===index;
  input.addEventListener('change',()=>{
   state.answers[q.id]=index;
   if(!persist())$('diagnosticNotice').textContent="No se pudo guardar en el navegador. Revisa la configuración de almacenamiento.";
   else $('diagnosticNotice').textContent="Respuesta guardada en este dispositivo.";
   updateProgress();questionNavigation();
  });
  const copy=document.createElement('span');copy.textContent=option;
  label.append(input,copy);opts.append(label);
 });
 frame.append(opts);
 $('diagnosticPrev').disabled=current===0;
 $('diagnosticNext').textContent=current===D.questions.length-1?'Revisar respuestas →':'Siguiente pregunta →';
}
function updateProgress(){
 const e=D.evaluate(state.answers);
 $('diagnosticCounter').textContent=e.answered+" / "+e.total+" respondidas";
 $('diagnosticBar').style.width=(e.answered/e.total*100)+"%";
 $('diagnosticSubmit').disabled=e.answered!==e.total;
 if(e.answered===e.total)$('diagnosticNotice').textContent='Todas las preguntas están respondidas. Puedes finalizar el diagnóstico.';
}
function summary(){
 const e=D.evaluate(state.answers);
 const node=$('diagnosticBody');node.replaceChildren();
 const badge=document.createElement('p');badge.className="eyebrow";badge.textContent="RESULTADOS · DIAGNÓSTICO FORMATIVO";node.append(badge);
 const score=document.createElement('h2');score.className='diagnostic-total';score.textContent=e.correct+" / "+e.total+" respuestas correctas";node.append(score);
 const copy=document.createElement('p');copy.textContent="Tu evaluación inicial está registrada. No se exige una nota mínima: su propósito es identificar fortalezas y oportunidades de mejora antes de comenzar CAD.";node.append(copy);
 const groups=document.createElement('div');groups.className='diagnostic-results';
 e.breakdown.forEach(group=>{
  const item=document.createElement('article');item.className='diagnostic-result-card';
  const title=document.createElement('h3');title.textContent=group.category;
  const text=document.createElement('p');text.textContent=group.correct+' de '+group.total+' respuestas correctas · '+group.percent+' %';
  const bar=document.createElement('div');bar.className='progress-track';const fill=document.createElement('span');fill.style.width=group.percent+'%';bar.append(fill);
  const advice=document.createElement('p');advice.textContent=group.correct===group.total?'Fortaleza inicial.':group.correct>=2?'Repasa los conceptos y analiza tus errores.':'Se recomienda reforzar este tema con ejercicios introductorios.';
  item.append(title,text,bar,advice);groups.append(item);
 });node.append(groups);
 const details=document.createElement('details');details.className='diagnostic-review';
 const caption=document.createElement('summary');caption.textContent='Consultar explicación de todas las preguntas';details.append(caption);
 D.questions.forEach(q=>{
  const p=document.createElement('p');
  p.textContent=(state.answers[q.id]===q.correct?'✓ ':'• ')+q.id+'. '+q.prompt+' Respuesta: '+q.options[q.correct]+'. '+q.explanation;
  details.append(p);
 });node.append(details);
 $('diagnosticPrev').classList.add('app-hidden');
 $('diagnosticNext').classList.add('app-hidden');
 $('diagnosticSubmit').classList.add('app-hidden');
 $('diagnosticGoCAD').classList.remove('app-hidden');
 $('diagnosticNotice').textContent='Diagnóstico guardado localmente. Puedes comenzar la Unidad 1.';
}
function render(){
 questionNavigation();
 $('diagnosticPrev').classList.remove('app-hidden');
 $('diagnosticNext').classList.remove('app-hidden');
 $('diagnosticSubmit').classList.remove('app-hidden');
 $('diagnosticGoCAD').classList.add('app-hidden');
 if(state.submitted)summary();else{questionUI();updateProgress()}
}
function finish(){
 const e=D.evaluate(state.answers);
 if(e.answered!==e.total){$('diagnosticNotice').textContent='Responde las 16 preguntas antes de finalizar.';return}
 state.submitted=true;state.submittedAt=new Date().toISOString();
 if(!persist()){state.submitted=false;$('diagnosticNotice').textContent='No se pudo guardar el diagnóstico. Habilita el almacenamiento local antes de continuar.';return}
 render();window.refreshCADHome?.();
 updateCard();
}
function updateCard(){
 const status=$('diagnosticCardStatus');
 if(status)status.textContent=state.submitted?'DIAGNÓSTICO COMPLETADO':'DIAGNÓSTICO PENDIENTE';
 const btn=$('openDiagnostic');
 if(btn)btn.textContent=state.submitted?'Ver resultados del Módulo 0':'Iniciar Módulo 0 →';
}
$('openDiagnostic').addEventListener('click',show);
$('fromDiagnostic').addEventListener('click',()=>{if(!state.submitted)$('diagnosticNotice').textContent='Puedes volver luego: tus respuestas quedan guardadas en este dispositivo.';window.returnCADHome?.()});
$('diagnosticPrev').addEventListener('click',()=>{if(current>0){current--;render()}});
$('diagnosticNext').addEventListener('click',()=>{if(current<D.questions.length-1){current++;render()}else{const missing=D.questions.findIndex(q=>!Object.prototype.hasOwnProperty.call(state.answers,q.id));if(missing>=0){current=missing;render();$('diagnosticNotice').textContent='Completa esta pregunta pendiente antes de finalizar.'}else{$('diagnosticNotice').textContent='Todas las preguntas están contestadas. Pulsa Finalizar diagnóstico.';window.scrollTo(0,0)}}});
$('diagnosticSubmit').addEventListener('click',finish);
$('diagnosticGoCAD').addEventListener('click',()=>{window.returnCADHome?.();document.getElementById('topicGrid').scrollIntoView({behavior:'smooth'})});
updateCard();
})();