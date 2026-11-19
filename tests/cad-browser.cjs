/* Browser QA: real UI interactions against locally served GitHub Pages files. */
const { chromium }=require("playwright");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1365,height:900}});
 try{
  page.on("pageerror",err=>{throw err});
  await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"load"});
  await page.locator("#topicGrid .hub-topic-card").first().waitFor();
  assert.equal(await page.locator("#topicGrid .hub-topic-card").count(),26);
  assert.equal(await page.locator("#topicGrid .hub-topic-card").first().locator(".theory-action").isDisabled(),true,"Module 0 must gate lesson 1");
  await page.locator("#openDiagnostic").click();
  assert.equal(await page.locator("#diagnosticSubmit").isDisabled(),true,"Cannot submit unanswered diagnostic");
  assert.equal(await page.locator("#diagnosticNav .diagnostic-nav-button").count(),16,"Question navigation has 16 accessible steps");
  await page.locator("#diagnosticNav .diagnostic-nav-button").nth(7).click();
  assert.ok((await page.locator("#diagnosticBody").textContent()).includes("PREGUNTA 8 DE 16"),"Question navigation works");
  await page.locator("#diagnosticNav .diagnostic-nav-button").first().click();

  assert.equal(await page.locator("#diagnosticBody svg[role=img]").count(),1,"First diagnostic question must include its own figure");
  assert.equal(await page.locator("#diagnosticBody .figure-toggle").count(),1,"Every figure must have an animation control");
  await page.locator("#diagnosticBody .figure-toggle").click();
  assert.equal(await page.locator("#diagnosticBody .interactive-figure.is-paused").count(),1,"Pause button must work");
  await page.locator("#diagnosticBody .figure-toggle").click();
  const correct=await page.evaluate(()=>window.IJRDiagnostic.questions.map(q=>q.correct));
  assert.equal(correct.length,16);
  for(let j=0;j<correct.length;j++){
   assert.equal(await page.locator("#diagnosticBody svg[role=img]").count(),1,"Visual diagram required in question "+(j+1));
   assert.equal(await page.locator("#diagnosticBody .figure-toggle").count(),1,"Pause control required "+(j+1));
   if(j===1||j===15){
    await page.locator("#diagnosticBody .figure-interact").click();
    assert.equal(await page.locator("#diagnosticBody .interactive-figure.is-interacted").count(),1,"Interactive visual must respond "+(j+1));
   }
   const choice=j===0?(correct[j]+1)%4:correct[j];
   await page.locator('input[name="diagnosticAnswer"][value="'+choice+'"]').check();
   if(j<correct.length-1)await page.locator("#diagnosticNext").click();
  }
  assert.equal(await page.locator("#diagnosticSubmit").isEnabled(),true);
  await page.locator("#diagnosticSubmit").click();
  assert.ok((await page.locator("#diagnosticBody").textContent()).includes("15 / 16"),"Diagnostic displays valid score without minimum threshold");
  await page.locator("#diagnosticGoCAD").click();
  assert.equal(await page.locator("#topicGrid .hub-topic-card").first().locator(".theory-action").isEnabled(),true,"Lesson 1 unlocks after completed diagnostic");
  await page.reload();
  await page.locator("#topicGrid .hub-topic-card").first().waitFor();
  assert.equal(await page.locator("#topicGrid .hub-topic-card").first().locator(".theory-action").isEnabled(),true,"Diagnostic completion persisted");

  assert.equal(await page.locator("#topicGrid .hub-topic-card").nth(1).locator(".theory-action").isDisabled(),true,"lesson 2 must be locked");
  for(let i=0;i<26;i++){
   const card=page.locator("#topicGrid .hub-topic-card").nth(i);
   assert.equal(await card.locator(".theory-action").isEnabled(),true,"Lesson "+i+" must unlock in order");
   if(i<25)assert.equal(await page.locator("#topicGrid .hub-topic-card").nth(i+1).locator(".theory-action").isDisabled(),true);
   await card.locator(".theory-action").click();
   assert.ok((await page.locator("#theoryTitle").textContent()).length>6);
   await page.locator("#markRead").click();
   await page.locator("#goWorkshop").click();
   assert.ok((await page.locator("#questionText").textContent()).trim().length>8);
   assert.equal(await page.locator("#choices input[type=radio]").count(),2,"Two answer options lesson "+i);
   assert.equal(await page.locator("#continueNext").isDisabled(),true);
   await page.locator("#saveExercise").click();
   assert.ok((await page.locator("#exerciseStatus").textContent()).includes("Confirma"),"Empty submission must fail");
   await page.locator('input[name="quizAnswer"][value="0"]').check();
   await page.locator("#checkAnswer").click();
   assert.ok((await page.locator("#assessmentResult").textContent()).includes("correcta"),"Correct choice must pass");
   assert.equal(await page.locator("#continueNext").isDisabled(),true,"Quiz alone cannot progress");
   await page.locator("#exerciseReport").fill("Primero dibujé el boceto con las medidas indicadas; después revisé las dimensiones y guardé la evidencia de la práctica.");
   await page.locator("#exerciseReference").fill("Cuaderno CAD, ejercicio "+(i+1));
   await page.locator("#exerciseConfirm").check();
   await page.locator("#saveExercise").click();
   assert.ok((await page.locator("#exerciseStatus").textContent()).includes("guardado"),"Practice must register");
   if(i<25)assert.equal(await page.locator("#continueNext").isEnabled(),true,"After registered practice next must unlock");
   await page.locator("#fromWorkshop").click();
  }
  assert.ok((await page.locator("#globalProgressCopy").textContent()).includes("26 / 26"),"All 26 completed");
  await page.reload();
  await page.locator("#topicGrid .hub-topic-card").first().waitFor();
  assert.ok((await page.locator("#globalProgressCopy").textContent()).includes("26 / 26"),"Saved evidence persists after reload");
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await page.locator("#topicGrid .hub-topic-card").first().waitFor();
  assert.equal(await page.locator("#topicGrid .hub-topic-card").count(),26,"All units remain present in mobile layout");
  console.log("PASS: 26/26 UI units, mandatory report, quiz, sequential locks, persistence and mobile rendering.");
 } finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
