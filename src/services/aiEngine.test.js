import { test } from 'node:test';
import assert from 'node:assert';
import { analyzeJournal, analyzeQuickLog, getChatbotResponse, generateWellnessForecast } from './aiEngine.js';

const mockProfile = {
  name: 'Rahul',
  targetExam: 'JEE (Engineering)'
};

test('analyzeJournal: detects mock test stress triggers and scores appropriately', () => {
  const result = analyzeJournal(
    "I got a very low rank in my physics mock test. I am scared about disappointing my parents.",
    "Anxious",
    mockProfile
  );

  // Assert correct structure
  assert.ok(result.stressLevel >= 7, 'Stress score should be high for this prompt');
  assert.strictEqual(result.stressCategory, 'Severe', 'Stress category should be Severe');
  
  // Assert triggers matches
  assert.ok(result.detectedTriggers.includes('Mock Test Performance'), 'Should detect Mock Test trigger');
  assert.ok(result.detectedTriggers.includes('Family Expectations & Pressure'), 'Should detect Family trigger');
  assert.ok(result.detectedTriggers.includes('Syllabus & Subject Backlog'), 'Should detect Subject/physics trigger');
  
  // Assert encouragement personalized
  assert.ok(result.encouragement.includes('Rahul'), 'Encouragement should contain the student name');
  assert.ok(result.encouragement.includes('JEE'), 'Encouragement should mention target exam');
});

test('analyzeJournal: includes and respects custom user-inputted metrics', () => {
  const customMetrics = { energy: 3, stress: 9, motivation: 6, focus: 4 };
  const result = analyzeJournal(
    "Doing some revision today.",
    "Neutral",
    mockProfile,
    customMetrics
  );

  assert.strictEqual(result.stressLevel, 9, 'Stress level should match user input metric');
  assert.strictEqual(result.stressCategory, 'Severe', 'Category should align with stress level 9');
  assert.deepStrictEqual(result.metrics, {
    energy: 3,
    stress: 9,
    motivation: 6,
    focus: 4
  }, 'Returned metrics should exactly match input values');
});

test('analyzeQuickLog: returns tag compiled log results', () => {
  const result = analyzeQuickLog(
    ['Study Burnout', 'Lack of Sleep'],
    'Exhausted',
    mockProfile
  );

  assert.strictEqual(result.stressCategory, 'Severe');
  assert.ok(result.isQuickLog);
  assert.deepStrictEqual(result.detectedTriggers, ['Study Burnout', 'Lack of Sleep']);
});

test('getChatbotResponse: handles default greetings', () => {
  const response = getChatbotResponse('hello', [], mockProfile, {});
  
  assert.ok(response.reply.length > 0);
  assert.ok(response.reply[0].includes('Rahul'));
  assert.ok(response.reply[1].includes('JEE'));
});

test('getChatbotResponse: initiates and handles GAD-7 diagnostic state machine', () => {
  // Step 1: Trigger assessment
  let chat = getChatbotResponse('assess my stress', [], mockProfile, {});
  assert.ok(chat.state.inAssessment);
  assert.strictEqual(chat.state.currentQuestionIndex, 0);

  // Step 2: Answer Q1 (several days = 1 point)
  chat = getChatbotResponse('2', [], mockProfile, chat.state);
  assert.ok(chat.state.inAssessment);
  assert.strictEqual(chat.state.currentQuestionIndex, 1);
  assert.deepStrictEqual(chat.state.answers, [1]);

  // Step 3: Answer Q2 (more than half = 2 points)
  chat = getChatbotResponse('3', [], mockProfile, chat.state);
  assert.ok(chat.state.inAssessment);
  assert.strictEqual(chat.state.currentQuestionIndex, 2);
  
  // Step 4: Answer Q3 (not at all = 0 points)
  chat = getChatbotResponse('1', [], mockProfile, chat.state);
  assert.ok(chat.state.inAssessment);
  
  // Step 5: Answer Q4 (nearly every day = 3 points) -> assessment complete
  chat = getChatbotResponse('4', [], mockProfile, chat.state);
  assert.strictEqual(chat.state.inAssessment, false);
  assert.strictEqual(chat.state.currentQuestionIndex, null);
  
  // Total answers points: 1 + 2 + 0 + 3 = 6 points
  assert.ok(chat.reply.join(' ').includes('Score: 6/12'), 'Calculated GAD score should be 6');
  assert.ok(chat.reply.join(' ').includes('Moderate Academic Stress'), 'Diagnosis should be Moderate');
});

test('getChatbotResponse: processes guided box breathing cycle state machine', () => {
  // Step 1: Trigger breathing
  let chat = getChatbotResponse('breathe', [], mockProfile, {});
  assert.ok(chat.state.inBreathing);
  assert.strictEqual(chat.state.breathingStep, 0);

  // Step 2: Begin
  chat = getChatbotResponse('next', [], mockProfile, chat.state);
  assert.strictEqual(chat.state.breathingStep, 1);
  assert.ok(chat.reply[1].includes('Inhale'), 'Should prompt to inhale');

  // Step 3: Stop early
  chat = getChatbotResponse('stop', [], mockProfile, chat.state);
  assert.strictEqual(chat.state.inBreathing, false);
  assert.ok(chat.reply[0].includes('stopped'), 'Should confirm exit');
});

test('generateWellnessForecast: returns learning state if entries < 3', () => {
  const result = generateWellnessForecast([
    { timestamp: '2026-06-20T00:00:00Z', stressLevel: 5 }
  ]);
  assert.strictEqual(result.status, 'learning');
  assert.ok(result.title.includes('Analyzing'));
});

test('generateWellnessForecast: detects danger (Burnout Warning) trend', () => {
  const journals = [
    { timestamp: '2026-06-20T08:00:00Z', metrics: { stress: 5, energy: 7, focus: 5 } },
    { timestamp: '2026-06-21T08:00:00Z', metrics: { stress: 6, energy: 5, focus: 5 } },
    { timestamp: '2026-06-22T08:00:00Z', metrics: { stress: 7, energy: 3, focus: 5 } }
  ];
  const result = generateWellnessForecast(journals);
  assert.strictEqual(result.status, 'danger');
  assert.ok(result.title.includes('Burnout Risk'));
});

test('generateWellnessForecast: detects warning (Declining Energy) trend', () => {
  const journals = [
    { timestamp: '2026-06-20T08:00:00Z', metrics: { stress: 4, energy: 6, focus: 5 } },
    { timestamp: '2026-06-21T08:00:00Z', metrics: { stress: 4, energy: 5, focus: 5 } },
    { timestamp: '2026-06-22T08:00:00Z', metrics: { stress: 4, energy: 4, focus: 5 } }
  ];
  const result = generateWellnessForecast(journals);
  assert.strictEqual(result.status, 'warning');
  assert.ok(result.title.includes('Declining Energy'));
});

test('generateWellnessForecast: detects positive (Optimal Focus Window) trend', () => {
  const journals = [
    { timestamp: '2026-06-20T08:00:00Z', metrics: { stress: 3, energy: 6, focus: 4 } },
    { timestamp: '2026-06-21T08:00:00Z', metrics: { stress: 3, energy: 6, focus: 5 } },
    { timestamp: '2026-06-22T08:00:00Z', metrics: { stress: 3, energy: 6, focus: 6 } }
  ];
  const result = generateWellnessForecast(journals);
  assert.strictEqual(result.status, 'positive');
  assert.ok(result.title.includes('Optimal Focus'));
});

test('generateWellnessForecast: returns neutral stable rhythm fallback', () => {
  const journals = [
    { timestamp: '2026-06-20T08:00:00Z', metrics: { stress: 4, energy: 5, focus: 5 } },
    { timestamp: '2026-06-21T08:00:00Z', metrics: { stress: 4, energy: 5, focus: 5 } },
    { timestamp: '2026-06-22T08:00:00Z', metrics: { stress: 4, energy: 5, focus: 5 } }
  ];
  const result = generateWellnessForecast(journals);
  assert.strictEqual(result.status, 'neutral');
  assert.ok(result.title.includes('Stable Wellness'));
});

