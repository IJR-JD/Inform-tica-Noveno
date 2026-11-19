/* Module 0 view controller — reuses the consolidated monochrome Learning Hub */
(function(){
"use strict";
const D=window.IJRDiagnostic;
const $=id=>document.getElementById(id);
const state=D.load(localStorage);
let current=0;
const artwork={
 axes:'<svg viewBox="0 0 360 210" role="img" aria-label="Ejes X, Y y Z en un sistema de coordenadas"><g fill="none" stroke="#151515" stroke-width="3"><path d="M120 150 L288 183 M120 150 L50 197 M120 150 L120 22"/></g><g fill="#151515" font-family="sans-serif" font-size="20" font-weight="700"><text x="298" y="191">X</text><text x="30" y="205">Y</text><text x="114" y="18">Z</text></g><path d="M130 117 201 132 247 108 173 92Z M130 117V165L201 184V132 M201 184 247 157V108" fill="#e5e5e5" stroke="#333" stroke-width="2"/></svg>',
 top:'<svg viewBox="0 0 360 190" role="img" aria-label="Bloque observado desde arriba, superficie rectangular de 50 por 30"><rect x="69" y="52" width="225" height="100" fill="#efefef" stroke="#111" stroke-width="3"/><path d="M69 31H294 M69 24V38 M294 24V38 M48 52V152 M42 52H55 M42 152H55" stroke="#111" stroke-width="2"/><g font-size="17" fill="#222" font-family="sans-serif"><text x="160" y="25">ancho</text><text x="12" y="108" transform="rotate(-90 12 108)">profundidad</text></g></svg>',
 front:'<svg viewBox="0 0 360 190" role="img" aria-label="Vista frontal de un bloque, ancho 40 milímetros y altura 25 milímetros"><rect x="78" y="40" width="205" height="117" fill="#f0f0f0" stroke="#111" stroke-width="3"/><g fill="#222" font-size="17" font-family="sans-serif"><text x="151" y="183">40 mm</text><text x="300" y="105">25 mm</text></g><path d="M78 165V172 M283 165V172 M78 171H283 M290 40H298 M290 157H298 M297 40V157" stroke="#555" stroke-width="2"/></svg>',
 cube:'<svg viewBox="0 0 360 210" role="img" aria-label="Cubo en perspectiva con tres caras visibles"><polygon points="110,61 177,23 254,61 187,103" fill="white" stroke="#111" stroke-width="3"/><polygon points="110,61 187,103 187,184 110,142" fill="#e2e2e2" stroke="#111" stroke-width="3"/><polygon points="187,103 254,61 254,142 187,184" fill="#b8b8b8" stroke="#111" stroke-width="3"/></svg>'
};
function persist(){
 try{localStorage.setItem(D.KEY,JSON.stringify(state));return true}catch{return false}
}
function show(){
 document.querySelectorAll('#overview,#theory,#workshop,#lab,#diagnostic').forEach(node=>node.classList.toggle('app-hidden',node.id!=='diagnostic'));
 window.scrollTo(0,0);
 render();
}
function questionUI(){
 const q=D.questions[current],value=state.answers[q.id],fig=q.visual?'<div class="diagnostic-figure">'+artwork[q.visual]+'</div>':'';
 const frame=$('diagnosticBody');
 frame.replaceChildren();
 const tag=document.createElement('p');tag.className="eyebrow";tag.textContent=q.category+" · PREGUNTA "+(current+1)+" DE "+D.questions.length;frame.append(tag);
 const heading=document.createElement('h2');heading.textContent=q.prompt;frame.append(heading);
 if(q.visual){const img=document.createElement('div');img.className="diagnostic-figure";img.innerHTML=artwork[q.visual];frame.append(img)}
 const opts=document.createElement('div');opts.className="diagnostic-options";
 q.options.forEach((option,index)=>{
  const label=document.createElement('label');label.className="diagnostic-choice";
  const input=document.createElement('input');input.type='radio';input.name="diagnosticAnswer";input.value=index;input.checked=value===index;
  input.addEventListener('change',()=>{
   state.answers[q.id]=index;
   if(!persist())$('diagnosticNotice').textContent="No se pudo guardar en el navegador. Revisa la configuración de almacenamiento.";
   else $('diagnosticNotice').textContent="Respuesta guardada en este dispositivo.";
   updateProgress();
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
$('diagnosticNext').addEventListener('click',()=>{if(current<D.questions.length-1){current++;render()}else{$('diagnosticNotice').textContent='Revisa tus respuestas y pulsa Finalizar diagnóstico.';window.scrollTo(0,0)}});
$('diagnosticSubmit').addEventListener('click',finish);
$('diagnosticGoCAD').addEventListener('click',()=>{window.returnCADHome?.();document.getElementById('topicGrid').scrollIntoView({behavior:'smooth'})});
updateCard();
})();