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

test("module zero checks 16 answerable questions across exactly four competency domains",()=>{
 const M=require("../module-zero.js");
 assert.equal(M.questions.length,16);
 assert.equal(M.groups.length,4);
 for(const cat of M.groups)assert.equal(M.questions.filter(q=>q.category===cat).length,4);
 for(const q of M.questions){
  assert.equal(q.options.length,4);
  assert.equal(new Set(q.options).size,4);
  assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);
  assert.ok(q.prompt.length>30&&q.explanation.length>35);
 }
});
test("module zero evaluates all responses and never demands a minimum passing score",()=>{
 const M=require("../module-zero.js");
 const correct=Object.fromEntries(M.questions.map(q=>[q.id,q.correct]));
 const good=M.evaluate(correct);
 assert.equal(good.answered,16);
 assert.equal(good.correct,16);
 assert.deepEqual(good.breakdown.map(b=>b.total),[4,4,4,4]);
 const incorrect=Object.fromEntries(M.questions.map(q=>[q.id,(q.correct+1)%4]));
 assert.equal(M.evaluate(incorrect).correct,0);
 assert.equal(M.evaluate(incorrect).answered,16);
});
test("module zero requires all responses, persists safely and does not accept invalid saved answers",()=>{
 const M=require("../module-zero.js");
 const invalidStorage={getItem:()=>JSON.stringify({submitted:true,answers:{1:15,2:0}})};
 assert.equal(M.isComplete(invalidStorage),false);
 const responses=Object.fromEntries(M.questions.map(q=>[q.id,(q.correct+2)%4]));
 const storage={getItem:()=>JSON.stringify({submitted:true,answers:responses})};
 assert.equal(M.isComplete(storage),true);
 const dirty={...responses,3:99,4:-2,5:"2"};
 assert.equal(M.evaluate(dirty).answered,13);
});
