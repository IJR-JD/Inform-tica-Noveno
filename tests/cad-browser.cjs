/* Browser end-to-end QA with a deterministic, isolated Supabase mock (no real student emails). */
const { chromium }=require("playwright");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1365,height:900}});
 const users=new Map(),diagnostics=new Map(),course=new Map();
 let selectedEmail="test1@ijr.edu.co",otpCalls=0;
 const person=email=>{if(!users.has(email))users.set(email,{id:email.startsWith("test1")?"11111111-1111-4111-8111-111111111111":"22222222-2222-4222-8222-222222222222",email});return users.get(email)};
 const asUser=req=>{const token=(req.headers().authorization||"").replace(/^Bearer /,"");return token.startsWith("demo-token-")?person(token.slice(11)):null};
 const respond=(route,body,status=200)=>route.fulfill({status,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify(body)});
 await page.route("https://rlfxnjbqxbozjdzkbwlz.supabase.co/**",async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname,method=req.method();
  const data=method==="POST"?JSON.parse(req.postData()||"{}"):{};
  if(path==="/auth/v1/authorize"){
   const callback=url.searchParams.get("redirect_to");
   const fragment="#access_token="+encodeURIComponent("demo-token-"+selectedEmail)+"&refresh_token="+encodeURIComponent("demo-refresh-"+selectedEmail)+"&expires_in=3600&token_type=bearer";
   return route.fulfill({status:302,headers:{"location":callback+fragment},body:""});
  }
  if(path==="/auth/v1/otp"){otpCalls++;return respond(route,{message:"Legacy OTP disabled"},410)}
  if(path==="/auth/v1/verify"){
   const u=person(data.email);
   if(data.token!=="123456")return respond(route,{message:"Invalid OTP"},403);
   return respond(route,{access_token:"demo-token-"+u.email,refresh_token:"demo-refresh-"+u.email,expires_in:3600,user:u});
  }
  if(path==="/auth/v1/user"){const u=asUser(req);return u?respond(route,u):respond(route,{message:"Unauthorized"},401)}
  if(path==="/auth/v1/logout")return respond(route,{});
  if(path==="/auth/v1/token"){const email=(data.refresh_token||"").replace("demo-refresh-",""),u=person(email);return respond(route,{access_token:"demo-token-"+u.email,refresh_token:"demo-refresh-"+u.email,expires_in:3600,user:u})}
  const u=asUser(req);if(!u)return respond(route,{message:"Unauthorized"},401);
  if(path.endsWith("rpc/cad9_teacher_authorized"))return respond(route,false);
  if(path.endsWith("rpc/cad9_merge_course_progress")){
   const previous=course.get(u.id)?.progress||{reviewed:[],quizzes:[],exercises:{},attempts:{}};
   const incoming=data.p_progress||{};
   const union=(a,b)=>[...new Set([...(a||[]),...(b||[])])].sort((x,y)=>x-y);
   const merged={reviewed:union(previous.reviewed,incoming.reviewed),quizzes:union(previous.quizzes,incoming.quizzes),exercises:{...previous.exercises,...incoming.exercises},attempts:{...previous.attempts,...incoming.attempts}};
   course.set(u.id,{user_id:u.id,institutional_email:u.email,progress:merged});
   return respond(route,merged);
  }
  const map=path.endsWith("cad9_diagnostic_results_v1")?diagnostics:path.endsWith("cad9_course_progress_v1")?course:null;
  if(!map)return respond(route,{message:"Not found"},404);
  if(method==="GET"){const item=map.get(u.id);return respond(route,item?[item]:[])}
  if(method==="POST"){
   if(data.user_id!==u.id||data.institutional_email!==u.email)return respond(route,{message:"Row level security violation"},403);
   map.set(u.id,{...map.get(u.id),...data});return respond(route,[data]);
  }
  return respond(route,{message:"Method not allowed"},405);
 });
 const errors=[];page.on("pageerror",err=>errors.push(err.message));
 await page.goto("http://127.0.0.1:8765/hub.html",{waitUntil:"load"});
 await page.waitForURL(/\/index\.html\?next=hub\.html|\/\?next=hub\.html/);
 assert.equal(await page.locator("#topicGrid").count(),0,"Direct unauthenticated entry redirects to login");
 await page.locator("#loginEmail").fill("test1@gmail.com");
 await page.locator("#loginSend").click();
 assert.ok((await page.locator("#loginMessage").textContent()).includes("@ijr.edu.co"),"Reject non-school email");
 assert.equal(await page.locator("#loginOtpForm").count(),0,"No OTP input is shown");
 selectedEmail="test1@ijr.edu.co";
 await page.locator("#loginEmail").fill(selectedEmail);
 await page.locator("#loginSend").click();
 await page.waitForURL(/\/hub\.html$/,{timeout:9000}).catch(async()=>{throw Error("OAuth redirect did not complete. URL="+page.url()+" message="+(await page.locator("#loginMessage").textContent().catch(()=>"missing"))+" errors="+errors.join(";"))});
 await page.locator("#topicGrid .hub-topic-card").first().waitFor();
 await page.waitForFunction(()=>document.documentElement.getAttribute("data-auth-ready")==="true");
 assert.equal(await page.locator("#topicGrid .hub-topic-card").count(),26);
 assert.equal(await page.locator("#topicGrid .hub-topic-card").first().locator(".theory-action").isDisabled(),true,"Authenticated student still needs Module 0");
 await page.locator("#openDiagnostic").click();
 assert.ok((await page.locator("#diagnosticStudentCode").textContent()).includes("test1@ijr.edu.co"));
 assert.equal(await page.locator("#diagnosticNav .diagnostic-nav-button").count(),24);
 const answers=await page.evaluate(()=>window.IJRDiagnostic.questions.map(q=>q.correct));
 for(let i=0;i<24;i++){
  assert.equal(await page.locator("#diagnosticBody svg[role=img]").count(),1,"Diagram "+i);
  if(i===1||i===15){await page.locator("#diagnosticBody .figure-interact").click();assert.equal(await page.locator("#diagnosticBody .interactive-figure.is-interacted").count(),1)}
  const choice=i===0?(answers[i]+1)%4:answers[i];
  await page.locator('input[name="diagnosticAnswer"][value="'+choice+'"]').check();
  if(i<23)await page.locator("#diagnosticNext").click();
 }
 assert.equal(await page.locator("#diagnosticSubmit").isEnabled(),true);
 await page.locator("#diagnosticSubmit").click();
 await page.locator("#diagnosticBody .diagnostic-result-card").first().waitFor();
 assert.equal(diagnostics.size,1);
 assert.equal(diagnostics.get(person("test1@ijr.edu.co").id).profile.score,23);
 assert.equal(await page.locator("#diagnosticBody .diagnostic-result-card").count(),6);
 assert.equal(await page.locator("#diagnosticExport").isVisible(),true);
 await page.locator("#diagnosticGoCAD").click();
 assert.equal(await page.locator("#topicGrid .hub-topic-card").first().locator(".theory-action").isEnabled(),true);
 for(let i=0;i<26;i++){
  const card=page.locator("#topicGrid .hub-topic-card").nth(i);
  assert.equal(await card.locator(".theory-action").isEnabled(),true,"Lesson "+i+" must unlock");
  if(i<25)assert.equal(await page.locator("#topicGrid .hub-topic-card").nth(i+1).locator(".theory-action").isDisabled(),true);
  await card.locator(".theory-action").click();await page.locator("#markRead").click();await page.locator("#goWorkshop").click();
  assert.equal(await page.locator("#continueNext").isDisabled(),true);
  await page.locator('input[name="quizAnswer"][value="0"]').check();await page.locator("#checkAnswer").click();
  await page.locator("#exerciseReport").fill("Primero dibujé el boceto según la práctica, después revisé las medidas y guardé una captura con los pasos.");
  await page.locator("#exerciseReference").fill("Cuaderno de CAD ejercicio "+(i+1));
  await page.locator("#exerciseConfirm").check();await page.locator("#saveExercise").click();
  if(i<25)assert.equal(await page.locator("#continueNext").isEnabled(),true);
  await page.locator("#fromWorkshop").click();
 }
 assert.ok((await page.locator("#globalProgressCopy").textContent()).includes("26 / 26"));
 // An obsolete second-device snapshot must not erase server-confirmed completions.
 await page.evaluate(()=>window.IJRCADAuth.saveProgress({reviewed:[],quizzes:[],exercises:{},attempts:{}}));
 assert.equal(course.get(person("test1@ijr.edu.co").id).progress.reviewed.length,26,"Server merges rather than overwrites");
 assert.equal(Object.keys(course.get(person("test1@ijr.edu.co").id).progress.exercises).length,26,"All evidence remains on Supabase");

 await page.reload();await page.locator("#topicGrid .hub-topic-card").first().waitFor();
 await page.waitForFunction(()=>document.getElementById("globalProgressCopy").textContent.includes("26 / 26"));
 assert.equal(diagnostics.size,1);
 await page.setViewportSize({width:390,height:844});await page.reload();
 await page.locator("#topicGrid .hub-topic-card").first().waitFor();
 await page.locator("#hubSignOut").click();
 await page.waitForURL(/\/index\.html$|\/$/);
 assert.equal(await page.locator("#topicGrid").count(),0);
 selectedEmail="test2@ijr.edu.co";
 await page.locator("#loginEmail").fill(selectedEmail);
 await page.locator("#loginSend").click();
 await page.waitForURL(/\/hub\.html$/);
 await page.locator("#topicGrid .hub-topic-card").first().waitFor();
 await page.locator("#openDiagnostic").click();
 await page.waitForFunction(()=>document.getElementById("diagnosticStudentCode").textContent.includes("test2@ijr.edu.co"));
 assert.equal(await page.locator("#topicGrid .hub-topic-card").first().locator(".theory-action").isDisabled(),true,"Different user never inherits CAD");
 assert.equal(await page.locator("#diagnosticSubmit").isDisabled(),true,"Different user never inherits diagnostic");
 assert.equal(otpCalls,0,"No code-based authentication requests");
 assert.equal(errors.length,0,"JavaScript browser exceptions: "+errors.join("; "));
 console.log("PASS: code-free institutional OAuth, email domain enforcement, atomic progress merge, 24 diagnostic visuals, 26 CAD lessons, student isolation, reload and mobile.");
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});