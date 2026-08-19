const assert = require('assert');

// Mock router
const routerPushCalls = [];
const mockRouter = {
  push: (path) => {
    routerPushCalls.push(path);
  }
};

// Mock analyzeJourneyAPI
let mockAnalyzeJourneyRes = null;
const analyzeJourneyAPI = async (query, domicileState) => {
  return mockAnalyzeJourneyRes;
};

// Simulation of handleUnderstandGoal
async function handleUnderstandGoal(goalInput, domicileState, setErrorMessage, setIsAnalyzing, setGenerationStage, router) {
  const trimmedGoal = goalInput.trim();
  if (!trimmedGoal) {
    setErrorMessage("Tell us what you want to accomplish.");
    return;
  }
  if (!domicileState) {
    setErrorMessage("Select your domicile state.");
    return;
  }

  setIsAnalyzing(true);
  setGenerationStage(0);

  try {
    const res = await analyzeJourneyAPI(trimmedGoal, domicileState);
    setGenerationStage(4);
    
    if (res && res.journeyId) {
      router.push(`/journey/${res.journeyId}`);
    } else {
      throw new Error("Journey was not created.");
    }
  } catch (err) {
    setErrorMessage("We couldn't create your journey. Please try again.");
    setIsAnalyzing(false);
  }
}

async function runTests() {
  console.log("Running frontend redirect flow tests...");

  // Test 1: Empty goal query
  let errMsg = null;
  await handleUnderstandGoal("", "Rajasthan", (msg) => errMsg = msg, () => {}, () => {}, mockRouter);
  assert.strictEqual(errMsg, "Tell us what you want to accomplish.");
  console.log("✓ Test 1 Passed: Empty goal query validation works.");

  // Test 2: Empty domicile state
  errMsg = null;
  await handleUnderstandGoal("Study abroad", "", (msg) => errMsg = msg, () => {}, () => {}, mockRouter);
  assert.strictEqual(errMsg, "Select your domicile state.");
  console.log("✓ Test 2 Passed: Empty domicile validation works.");

  // Test 3: Successful analysis and redirection
  mockAnalyzeJourneyRes = { journeyId: "journey_rj_123" };
  let isAnalyzing = false;
  let stage = 0;
  routerPushCalls.length = 0; // reset
  await handleUnderstandGoal(
    "I want to go to Australia for masters", 
    "Rajasthan", 
    () => {}, 
    (val) => isAnalyzing = val, 
    (val) => stage = val, 
    mockRouter
  );
  assert.strictEqual(routerPushCalls[0], "/journey/journey_rj_123");
  console.log("✓ Test 3 Passed: Redirected to /journey/journey_rj_123 successfully.");

  // Test 4: API failure sets error message
  mockAnalyzeJourneyRes = null;
  errMsg = null;
  await handleUnderstandGoal(
    "I want to go to Australia for masters", 
    "Rajasthan", 
    (msg) => errMsg = msg, 
    (val) => isAnalyzing = val, 
    () => {}, 
    mockRouter
  );
  assert.strictEqual(errMsg, "We couldn't create your journey. Please try again.");
  assert.strictEqual(isAnalyzing, false);
  console.log("✓ Test 4 Passed: API error sets display error.");

  console.log("All frontend flow tests passed successfully!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
