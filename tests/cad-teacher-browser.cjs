const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const D=require("../module-zero.js");
(async()=>{
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1290,height:850},acceptDownloads:true});
const teacher="juandiego.perez@ijr.edu.co",student="alumno9@ijr.edu.co";
const users=new Map([
 [teacher,{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",email:teacher}],
 [student,{id:"11111111-1111-4111-8111-111111111111",email:student}]
]);
const all=Object.fromEntries(D.questions.map(q=>[q.id,q.correct]));
const profile=D.profile(all);
const sample={
 user_id:users.get(student).id,institutional_email:student,answers:all,
 submitted_at:"2026-11-20T12:00:00Z",profile,
 updated_at:"2026-11-20T12:00:00Z"
};
const savedProgress={
 user_id:users.get(student).id,institutional_email:student,progress:{
 reviewed:[0],quizzes:[0],exercises:{"0":{description:"Dibujé el objeto utilizando las medidas indicadas y realicé todas las comprobaciones del modelo.",evidence:"Cuaderno de pruebas, página uno",confirmed:true}}
 }};
const reply=(route,value,status=200)=>route.fulfill({status,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify(value)});
const userFor=request=>{
 const authorization=request.headers().authorization||"";
 return users.get(authorization.replace("Bearer fake-",""))||null
};
await page.route("https://rlfxnjbqxbozjdzkbwlz.supabase.co/**",async route=>{
 const req=route.request(),url=new URL(req.url()),path=url.pathname,body=req.method()==="POST"?JSON.parse(req.postData()||"{}"):{};
 if(path==="/auth/v1/otp")return reply(route,{});
 if(path==="/auth/v1/verify"){
  const u=users.get(body.email);
  if(!u||body.token!=="123456")return reply(route,{message:"Código incorrecto"},403);
  return reply(route,{access_token:"fake-"+u.email,refresh_token:"fake-refresh-"+u.email,expires_in:3600,user:u});
 }
 if(path==="/auth/v1/user")return reply(route,userFor(req)||{message:"Sin sesión"},userFor(req)?200:401);
 if(path==="/auth/v1/logout")return reply(route,{});
 if(path==="/auth/v1/token")return reply(route,{message:"No requerida"},400);
 const u=userFor(req);
 if(!u)return reply(route,{message:"No autorizado"},401);
 if(path==="/rest/v1/rpc/cad9_teacher_authorized")return reply(route,u.email===teacher);
 if(path==="/rest/v1/cad9_diagnostic_results_v1")return reply(route,u.email===teacher?[sample]:u.email===student?[sample]:[]);
 if(path==="/rest/v1/cad9_course_progress_v1")return reply(route,u.email===teacher?[savedProgress]:u.email===student?[savedProgress]:[]);
 return reply(route,{message:"Ruta desconocida"},404);
});
const errors=[];page.on("pageerror",err=>errors.push(err.message));
async function login(email){
 await page.locator("#loginEmail").fill(email);
 await page.locator("#loginSend").click();
 await page.locator("#loginOtpForm").waitFor({state:"visible"});
 await page.locator("#loginOtp").fill("123456");
 await page.locator("#loginVerify").click();
}

try{
 await page.goto("http://127.0.0.1:8765/docente.html",{waitUntil:"load"});
 await page.waitForURL(/\/\?next=docente\.html|\/index\.html\?next=docente\.html/);
 assert.equal(await page.locator("#teacherDashboard").count(),0,"Protected docente page redirects before login");
 await login(student);
 await page.waitForURL(/\/docente\.html$/);
 await page.locator("#teacherDenied").waitFor({state:"visible"});
 assert.equal(await page.locator("#teacherDashboard").isVisible(),false,"Student cannot access class reports");
 await page.locator("#teacherSignOut").click();
 await page.waitForURL(/\/$|\/index\.html$/);
 await login(teacher);
 await page.waitForURL(/\/hub\.html$/);
 await page.goto("http://127.0.0.1:8765/docente.html",{waitUntil:"load"});
 await page.locator("#teacherDashboard").waitFor({state:"visible"});
 await page.locator("#teacherRows tr").first().waitFor({state:"visible"});
 assert.ok((await page.locator("#teacherAccount").textContent()).includes(teacher));
 assert.equal(await page.locator("#teacherStudents").textContent(),"1");
 assert.equal(await page.locator("#teacherCompleted").textContent(),"1");
 assert.equal(await page.locator("#teacherLibraryList details").count(),24,"Teacher sees 24 questions and solutions");
 await page.locator("#teacherShowLessons").click();
 assert.equal(await page.locator("#teacherLibraryList details").count(),26,"Teacher sees all CAD lesson guides");
 await page.locator("#teacherShowDiagnostic").click();
 assert.equal(await page.locator("#teacherPractices").textContent(),"1");
 assert.ok((await page.locator("#teacherRows").textContent()).includes(student));
 await page.locator("#teacherRows .teacher-detail-button").click();
 assert.equal(await page.locator("#teacherDomainStats article").count(),6,"All skill categories present");
 assert.equal(await page.locator("#teacherUnitRecords article").count(),26,"All CAD units visible");
 await page.locator(".teacher-answer-review summary").click();
 await page.locator("#teacherAnswers").locator("p").first().waitFor();
 assert.equal(await page.locator("#teacherAnswers p").count(),24,"All diagnostic answers visible");
 const csvPromise=page.waitForEvent("download");await page.locator("#teacherExportCsv").click();
 assert.ok((await csvPromise).suggestedFilename().endsWith(".csv"));
 const jsonPromise=page.waitForEvent("download");await page.locator("#teacherExportJson").click();
 assert.ok((await jsonPromise).suggestedFilename().endsWith(".json"));
 await page.goto("http://127.0.0.1:8765/hub.html",{waitUntil:"load"});
 await page.waitForFunction(()=>document.querySelector("#topicGrid .hub-topic-card:last-child .theory-action")?.disabled===false);
 assert.equal(await page.locator("#teacherAccessLink").count(),0,"No teacher dashboard link in student hub");
 assert.equal(await page.locator("#topicGrid .hub-topic-card").count(),26);
 assert.equal(await page.locator("#topicGrid .hub-topic-card").nth(25).locator(".theory-action").isEnabled(),true,"Teacher can see lesson 26");
 assert.equal(await page.locator("#topicGrid .hub-topic-card").nth(25).locator(".workshop-action").isEnabled(),true,"Teacher can open practice 26 without reviewing theory");
 await page.locator("#topicGrid .hub-topic-card").nth(25).locator(".workshop-action").click();
 assert.equal(await page.locator("#continueNext").isDisabled(),true,"No lesson past 26");
 assert.equal(await page.locator("#saveExercise").isDisabled(),true,"Teacher view cannot submit as a student");
 await page.locator("#checkAnswer").click();
 assert.ok((await page.locator("#assessmentResult").textContent()).includes("Clave docente"));
 await page.locator("#fromWorkshop").click();
 await page.locator("#openDiagnostic").click();
 await page.waitForFunction(()=>document.querySelectorAll("#diagnosticBody details.diagnostic-review").length===24);
 assert.equal(await page.locator("#diagnosticBody details.diagnostic-review").count(),24,"Teacher can inspect every diagnostic solution");
 await page.locator("#diagnosticBody details.diagnostic-review").first().locator("summary").click();
 assert.ok((await page.locator("#diagnosticBody details.diagnostic-review").first().textContent()).includes("Respuesta correcta"));
 assert.equal(await page.locator("#diagnosticSubmit").isVisible(),false,"Teacher does not need to submit Module 0");
 await page.setViewportSize({width:390,height:844});
 await page.goto("http://127.0.0.1:8765/docente.html",{waitUntil:"load"});
 await page.locator("#teacherDashboard").waitFor({state:"visible"});
 assert.equal(await page.locator("#teacherStudents").textContent(),"1");
 assert.deepEqual(errors,[]);
 console.log("PASS: OTP role proof, student denied, teacher dashboard, six skills, 24 answers, 26 units, exports and mobile");
}finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
