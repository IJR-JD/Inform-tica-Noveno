/* IJR CAD ninth grade progression — pure, testable school exercise logic. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object" && module.exports)module.exports=api;
  root.CADProgress=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";
  const MIN_REPORT_CHARS=40, MIN_REPORT_WORDS=7, MIN_REFERENCE_CHARS=6;
  function normalizedText(value){return String(value==null?"":value).trim().replace(/\s+/g," ");}
  function validateReport(report,reference,confirmed){
    const description=normalizedText(report), evidence=normalizedText(reference);
    if(!confirmed)return {ok:false,message:"Confirma que realizaste los pasos del taller."};
    if(description.length<MIN_REPORT_CHARS || description.split(" ").filter(Boolean).length<MIN_REPORT_WORDS)
      return {ok:false,message:"Describe cómo resolviste el ejercicio con al menos 40 caracteres y 7 palabras."};
    if(evidence.length<MIN_REFERENCE_CHARS)
      return {ok:false,message:"Registra la referencia de tu evidencia (archivo, cuaderno o captura) con al menos 6 caracteres."};
    return {ok:true,description,evidence};
  }
  function cleanState(input,count){
    const s=input&&typeof input==="object"?input:{};
    const valid=i=>Number.isInteger(i)&&i>=0&&i<count;
    const reviewed=Array.isArray(s.reviewed)?Array.from(new Set(s.reviewed.filter(valid))):[];
    const quizzes=Array.isArray(s.quizzes)?Array.from(new Set(s.quizzes.filter(valid))):[];
    const exercises={};
    if(s.exercises&&typeof s.exercises==="object"){
      for(let i=0;i<count;i++){
        const e=s.exercises[i];if(!e||typeof e!=="object")continue;
        const result=validateReport(e.description,e.evidence,e.confirmed===true);
        if(result.ok)exercises[i]={description:result.description,evidence:result.evidence,confirmed:true,submittedAt:typeof e.submittedAt==="string"?e.submittedAt:""};
      }
    }
    const attempts={};
    if(s.attempts&&typeof s.attempts==="object")for(let i=0;i<count;i++){
      const n=s.attempts[i];if(Number.isSafeInteger(n)&&n>=0)attempts[i]=n;
    }
    return {reviewed,quizzes,exercises,attempts};
  }
  function completed(s,i){return s.reviewed.includes(i)&&s.quizzes.includes(i)&&Boolean(s.exercises[i]);}
  function unlocked(s,i,count){return Number.isInteger(i)&&i>=0&&i<count&&(i===0||completed(s,i-1));}
  function countCompleted(s,count){let total=0;for(let i=0;i<count;i++){if(!unlocked(s,i,count)||!completed(s,i))break;total++;}return total;}
  function correctAnswer(q,selected){return Array.isArray(q)&&q.length>=4&&(q[3]===0||q[3]===1)&&selected===q[3]&&typeof q[1+selected]==="string"&&q[1+selected].length>0;}
  return {MIN_REPORT_CHARS,MIN_REPORT_WORDS,MIN_REFERENCE_CHARS,normalizedText,validateReport,cleanState,completed,unlocked,countCompleted,correctAnswer};
});