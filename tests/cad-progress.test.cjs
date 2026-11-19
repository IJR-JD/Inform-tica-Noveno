const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const P=require("../cad-progress-core.js");
const html=fs.readFileSync("index.html","utf8");
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync("cad-curriculum.js","utf8"),sandbox);
const D=sandbox.window.CAD_CURRICULUM;
test("26 complete CAD lessons each have actionable instructions and solvable two-option quiz",()=>{
 assert.equal(D.topics.length,26);
 assert.equal(D.guides.length,26);
 for(let i=0;i<26;i++){
  const t=D.topics[i],g=D.guides[i],q=t[4];
  assert.equal(t.length,5,"topic "+i);
  assert.ok(t[0].length>=8&&t[2].length>=60,"explanation "+i);
  assert.ok(g.steps.length>=3&&g.steps.every(x=>x.trim().length>=12),"steps "+i);
  assert.ok(g.practice.trim().length>=18&&g.pitfall.trim().length>=15,"practice "+i);
  assert.equal(q.length,4);
  assert.ok(q[0].trim().length>=10&&q[1]!==q[2],"question "+i);
  assert.ok(P.correctAnswer(q,q[3]),"question correct answer achievable "+i);
  assert.equal(P.correctAnswer(q,1-q[3]),false,"question wrong answer rejected "+i);
 }
});
test("exercise report validation rejects empty, no evidence, too-short or unchecked attempts",()=>{
 const report="Dibujé la figura siguiendo las medidas, comprobé los ejes y guardé una captura clara.";
 assert.equal(P.validateReport(report,"cuaderno pagina 4",true).ok,true);
 assert.equal(P.validateReport("", "cuaderno pagina 4", true).ok,false);
 assert.equal(P.validateReport("Texto breve","cuaderno pagina 4",true).ok,false);
 assert.equal(P.validateReport(report,"x",true).ok,false);
 assert.equal(P.validateReport(report,"cuaderno pagina 4",false).ok,false);
});
test("all 26 units are sequentially unlockable using legitimate recorded work",()=>{
 const s=P.cleanState({},26);
 assert.equal(P.unlocked(s,0,26),true);
 assert.equal(P.unlocked(s,1,26),false);
 for(let i=0;i<26;i++){
  assert.equal(P.unlocked(s,i,26),true,"must open lesson "+i);
  assert.equal(P.unlocked(s,i+1,26),false,"next must remain locked before completion "+i);
  s.reviewed.push(i);
  s.quizzes.push(i);
  assert.equal(P.completed(s,i),false,"quiz alone is insufficient "+i);
  const v=P.validateReport("Dibujé el boceto, ejecuté la operación indicada, revisé dimensiones y conservé mi evidencia.","modelo en mi cuaderno pagina "+(i+1),true);
  assert.ok(v.ok);
  s.exercises[i]={description:v.description,evidence:v.evidence,confirmed:true};
  assert.equal(P.completed(s,i),true,"exercise registration required "+i);
  if(i<25)assert.equal(P.unlocked(s,i+1,26),true);
 }
 assert.equal(P.countCompleted(s,26),26);
 assert.equal(P.unlocked(s,26,26),false);
});
test("legacy quiz-only completions cannot skip recorded practice",()=>{
 const legacy=P.cleanState({reviewed:[0,1],completed:[0,1],quizzes:[0]},26);
 assert.equal(P.completed(legacy,0),false);
 assert.equal(P.unlocked(legacy,1,26),false);
});
test("malformed or tampered saved data is filtered and cannot unlock lessons",()=>{
 const s=P.cleanState({reviewed:[0,0,200,-1,"1"],quizzes:[0],exercises:{"0":{description:"short",evidence:"file",confirmed:true}},attempts:{"0":-5}},26);
 assert.equal(s.reviewed.length,1);
 assert.equal(P.completed(s,0),false);
 assert.equal(P.unlocked(s,1,26),false);
});
test("consolidated UI retains theory/assessment and includes required exercise registration fields",()=>{
 for(const id of ["topicGrid","theory","workshop","cadDeepDive","exerciseReport","exerciseReference","exerciseConfirm","saveExercise","continueNext","unlockStatus"])
  assert.ok(html.includes('id="'+id+'"'),"missing "+id);
 for(const resource of ["cad-curriculum.js","cad-progress-core.js","cad-polish.css","cad-accessibility.css"])
  assert.ok(html.includes(resource),"resource missing "+resource);
 assert.ok(html.includes('function eligible(i)'));
 assert.ok(html.includes('if(!eligible(i))return;'));
 assert.ok(html.includes('function saveExercise()'));
});


test("24 diagnostic questions across 6 competencies and unique answer options",()=>{
 const M=require("../module-zero.js");
 assert.equal(M.questions.length,24);
 assert.equal(M.groups.length,6);
 for(const group of M.groups)assert.equal(M.questions.filter(q=>q.category===group).length,4,group);
 for(const [i,q] of M.questions.entries()){
  assert.equal(q.id,i+1);
  assert.equal(q.options.length,4);
  assert.equal(new Set(q.options).size,4);
  assert.ok(q.prompt.length>24&&q.explanation.length>25);
  assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);
 }
});
test("individual profiles: 0, mid and high performance with valid domain breakdowns",()=>{
 const M=require("../module-zero.js");
 const make=(n)=>Object.fromEntries(M.questions.map((q,i)=>[q.id,i<n?q.correct:(q.correct+1)%4]));
 const low=M.profile(make(0)),mid=M.profile(make(12)),high=M.profile(make(24));
 assert.equal(low.percent,0);assert.equal(low.level,"Acompañamiento inicial");
 assert.equal(mid.percent,50);assert.equal(mid.level,"Desarrollo de fundamentos");
 assert.equal(high.percent,100);assert.equal(high.level,"Consolidación y profundización");
 assert.equal(low.domains.length,6);assert.equal(mid.score,12);
 assert.ok(low.priorities.length<=3&&low.priorities.length>0);
 assert.equal(high.priorities.length,0);
 assert.equal(M.profile({}),null);
 const oneWrong=M.profile(make(23));assert.equal(oneWrong.score,23);
});
test("separate students keep separate saved answers; invalid IDs and incomplete assessments blocked",()=>{
 const M=require("../module-zero.js");
 const db=new Map();const storage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k),key:i=>Array.from(db.keys())[i],get length(){return db.size}};
 const a=Object.fromEntries(M.questions.map(q=>[q.id,q.correct]));
 const b=Object.fromEntries(M.questions.map(q=>[q.id,(q.correct+1)%4]));
 assert.equal(M.cleanCode(" 9a-07 "),"9A-07");
 assert.equal(M.cleanCode("A"),null);
 assert.equal(M.cleanCode("student@example.com"),null);
 assert.equal(M.saveForCode(storage,"9A-07",{answers:a,submitted:true,submittedAt:"2026-11-19T10:00:00Z"}),true);
 assert.equal(M.isComplete(storage),true);
 assert.equal(M.saveForCode(storage,"9A-08",{answers:b,submitted:true}),true);
 assert.equal(M.getActiveCode(storage),"9A-08");
 assert.equal(M.loadForCode(storage,"9A-07").submitted,true);
 assert.equal(M.loadForCode(storage,"9A-08").submitted,true);
 assert.equal(M.profile(M.loadForCode(storage,"9A-07").answers).score,24);
 assert.equal(M.profile(M.loadForCode(storage,"9A-08").answers).score,0);
 assert.equal(M.existingCodes(storage).length,2);
 const report=M.exportRecord("9A-08",b,null);
 assert.equal(report.studentCode,"9A-08");assert.equal(report.profile.score,0);
 assert.ok(!("name" in report)&&!("email" in report));
 assert.equal(M.saveForCode(storage,"9A-09",{answers:{1:1},submitted:true}),true);
 assert.equal(M.isComplete(storage),false);
});
test("all modules retain content / assessment components and profile controls",()=>{
 for(const id of ["diagnosticIdentity","diagnosticCode","diagnosticSelect","diagnosticStudentCode","diagnosticSwitch","diagnosticExport","diagnosticNav","topicGrid","workshop"])
  assert.ok(html.includes('id="'+id+'"'),"Missing "+id);
 for(const resource of ["module-zero.js","module-zero-visuals.js","module-zero.css","module-zero-ui.js"])
  assert.ok(html.includes(resource));
});
