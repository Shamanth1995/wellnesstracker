/**
 * MindMirror - Simulated AI Engine
 * Synthesizes realistic Generative AI analysis of student journals and chatbot dialogue
 * designed specifically for competitive exam prep stress (NEET, JEE, UPSC, etc.).
 */

// Custom vocabulary list to parse stress triggers
const TRIGGER_KEYWORDS = {
  subject: {
    words: ['physics', 'chemistry', 'biology', 'math', 'calculus', 'history', 'geography', 'polity', 'organic', 'mechanics', 'syllabus', 'backlog', 'chapters', 'topics'],
    label: 'Syllabus & Subject Backlog'
  },
  mockTest: {
    words: ['mock', 'test', 'marks', 'score', 'rank', 'percentile', 'series', 'coaching', 'failure', 'failed', 'paper', 'negative marking'],
    label: 'Mock Test Performance'
  },
  family: {
    words: ['parents', 'dad', 'mom', 'father', 'mother', 'expectations', 'pressure', 'family', 'relatives', 'society', 'disappoint'],
    label: 'Family Expectations & Pressure'
  },
  sleep: {
    words: ['sleep', 'insomnia', 'night', 'tired', 'exhausted', 'headache', 'fatigue', 'caffeine', 'energy', 'awake', 'sleepless'],
    label: 'Physical Fatigue & Sleep Debt'
  },
  peer: {
    words: ['friends', 'peers', 'others', 'topper', 'comparison', 'everyone else', 'behind', 'slow', 'cheating'],
    label: 'Social & Peer Comparison'
  },
  future: {
    words: ['future', 'career', 'drop', 'attempt', 'year', 'what if', 'scared', 'fail', 'ruined', 'lifes', 'selected', 'crack'],
    label: 'Fear of Exam Day & Future Uncertainty'
  }
};

const EMOTIONAL_KEYWORDS = {
  severe: ['crying', 'cry', 'hopeless', 'quit', 'give up', 'suicidal', 'depressed', 'worthless', 'panic', 'shaking', 'chest pain', 'screaming'],
  high: ['anxious', 'stressed', 'overwhelmed', 'scared', 'worry', 'worrying', 'burnout', 'burnt out', 'exhausted', 'pressure', 'stress', 'afraid'],
  moderate: ['tired', 'nervous', 'tense', 'frustrated', 'backlog', 'behind', 'lazy', 'bored', 'distracted', 'confused'],
  low: ['okay', 'fine', 'neutral', 'surviving', 'managing', 'calm', 'hopeful', 'steady', 'study']
};

/**
 * Analyzes journal text and returns a structured mental wellness analysis
 * @param {string} text - Open ended journal input
 * @param {string} mood - Current mood selected by student
 * @param {object} profile - Active user profile details (name, targetExam)
 */
export function analyzeJournal(text, mood, profile, metrics = {}) {
  const lowercaseText = text.toLowerCase();
  const name = profile?.name || 'Student';
  const exam = profile?.targetExam || 'Competitive Exam';
  
  // 1. Detect Triggers
  const detectedTriggers = [];
  Object.entries(TRIGGER_KEYWORDS).forEach(([key, group]) => {
    const matchedWords = group.words.filter(word => lowercaseText.includes(word));
    if (matchedWords.length > 0) {
      detectedTriggers.push({
        type: key,
        label: group.label,
        matched: matchedWords
      });
    }
  });

  // Default trigger if none matched but user says they are stressed
  if (detectedTriggers.length === 0 && ['Stressed', 'Anxious', 'Exhausted', 'Down'].includes(mood)) {
    detectedTriggers.push({
      type: 'general',
      label: 'General Academic Performance Anxiety',
      matched: []
    });
  }

  // 2. Determine Stress Score (1 - 10)
  let baseScore = 5; // Default average
  
  // Adjust base score depending on selected mood
  if (mood === 'Calm') baseScore = 2;
  else if (mood === 'Motivated') baseScore = 3;
  else if (mood === 'Neutral') baseScore = 4;
  else if (mood === 'Exhausted') baseScore = 7;
  else if (mood === 'Anxious') baseScore = 8;
  else if (mood === 'Stressed') baseScore = 8;
  else if (mood === 'Down') baseScore = 8;

  // Search text for emotional intensity keyword matches
  let severeMatches = EMOTIONAL_KEYWORDS.severe.filter(w => lowercaseText.includes(w)).length;
  let highMatches = EMOTIONAL_KEYWORDS.high.filter(w => lowercaseText.includes(w)).length;
  let modMatches = EMOTIONAL_KEYWORDS.moderate.filter(w => lowercaseText.includes(w)).length;

  if (severeMatches > 0) baseScore += 2.5;
  else if (highMatches > 0) baseScore += 1.5;
  else if (modMatches > 0) baseScore += 0.5;

  // Add points for each unique trigger type detected
  baseScore += detectedTriggers.length * 0.4;

  // Cap score between 1 and 10, round to 1 decimal place
  let stressLevel = metrics.stress !== undefined 
    ? Number(metrics.stress) 
    : Math.max(1, Math.min(10, Math.round(baseScore * 10) / 10));

  // Determine stress category
  let stressCategory;
  if (stressLevel <= 3) stressCategory = 'Low';
  else if (stressLevel <= 6) stressCategory = 'Moderate';
  else if (stressLevel <= 8.5) stressCategory = 'High';
  else stressCategory = 'Severe';

  // 3. Generate Coping Strategies & Encouragement
  const copingStrategies = [];
  let recommendedBreakActivity = 'Step away from your desk for 5 minutes and stretch.';
  let encouragement;

  // Tailored suggestions based on triggers
  const triggerTypes = detectedTriggers.map(t => t.type);
  
  if (triggerTypes.includes('sleep')) {
    copingStrategies.push('Prioritize 7 hours of sleep tonight. A sleep-deprived brain retains 40% less information.');
    recommendedBreakActivity = 'Close your eyes for a 15-minute power nap or do a progressive muscle relaxation check.';
  }
  
  if (triggerTypes.includes('mockTest')) {
    copingStrategies.push('Do a "No-Blame Analysis" of your wrong answers. Group them into Concept Error, Silly Mistake, or Time Issue.');
    copingStrategies.push('Mock tests are test-drives, not the real road. They are tools to find gaps, not measure your intelligence.');
  }

  if (triggerTypes.includes('subject')) {
    copingStrategies.push('Break down your backlog chapter into 3 micro-topics. Master one 20-minute chunk today instead of staring at the whole book.');
    copingStrategies.push('Use active recall (closing the book and listing main points) rather than re-reading notes endlessly.');
  }

  if (triggerTypes.includes('family')) {
    copingStrategies.push('Remember that your parents worry because they love you, but they do not live your academic path. Focus on what is under your control.');
    copingStrategies.push('Write down 3 personal wins you achieved today that have nothing to do with external scores.');
  }

  if (triggerTypes.includes('peer')) {
    copingStrategies.push('Mute exam study groups for 48 hours. Focus entirely on your own track. Comparison is the thief of confidence.');
  }

  if (triggerTypes.includes('future')) {
    copingStrategies.push('Ground yourself in the present. Focus on matching today\'s study targets. One day at a time.');
    copingStrategies.push('Write down a "Worst-Case-Plan" (e.g., repeating, alternate degrees). Demystifying failure reduces its power over you.');
  }

  // General fallbacks if list is short
  if (copingStrategies.length < 2) {
    copingStrategies.push('Try the 4-7-8 deep breathing technique in the Coping Hub for 3 minutes to soothe your nervous system.');
  }
  if (copingStrategies.length < 3) {
    copingStrategies.push('Keep a structured Pomodoro study schedule: 25 minutes of focus, followed by 5 minutes of visual rest (no screens).');
  }

  // 4. Generate Highly Empathic, Customized Encouragement
  if (stressCategory === 'Low') {
    encouragement = `You are maintaining a steady, healthy rhythm, ${name}. Keep up this balanced approach for your ${exam} prep. Remind yourself to celebrate small wins!`;
  } else if (stressCategory === 'Moderate') {
    encouragement = `You're feeling some tension about your ${exam} prep, ${name}. It is completely natural to feel stretched during this phase. Take a short, intentional deep breath right now. You are making progress, even when it feels slow.`;
  } else if (stressCategory === 'High') {
    encouragement = `Hey ${name}, I hear you. The pressure of ${exam} is massive, and it's taking a heavy toll. Please give yourself permission to step back for a moment. You are not a machine. You are doing the best you can under immense stress, and that is enough.`;
  } else {
    // Severe Stress
    encouragement = `Dear ${name}, please take a pause. You are under extreme pressure right now, and your well-being is far more important than any percentile in ${exam}. Please talk to someone you trust, or check the student support helplines in our sidebar. Let's start by doing a quick 2-minute breathing exercise.`;
  }

  return {
    moodSentiment: `Mood: ${mood}. Stress: ${stressCategory}`,
    stressLevel,
    stressCategory,
    detectedTriggers: detectedTriggers.map(t => t.label),
    copingStrategies: copingStrategies.slice(0, 3),
    recommendedBreakActivity,
    encouragement,
    timestamp: new Date().toISOString(),
    isQuickLog: false,
    metrics: {
      energy: metrics.energy !== undefined ? Number(metrics.energy) : 5,
      stress: stressLevel,
      motivation: metrics.motivation !== undefined ? Number(metrics.motivation) : 5,
      focus: metrics.focus !== undefined ? Number(metrics.focus) : 5
    }
  };
}

/**
 * Handles quick logger tag submissions
 * @param {Array<string>} tags - List of tags selected (e.g., "Burned Out", "Physics Prep")
 * @param {string} mood - Selected mood
 * @param {object} profile - Active profile
 */
export function analyzeQuickLog(tags, mood, profile, metrics = {}) {
  const tagString = tags.join(' ');
  // Re-use analyzeJournal with compiled tag text
  const analysis = analyzeJournal(`Quick check-in with tags: ${tagString}. I am feeling ${mood.toLowerCase()}.`, mood, profile, metrics);
  analysis.isQuickLog = true;
  analysis.detectedTriggers = tags.filter(t => t !== mood);
  return analysis;
}

// Dialog flows for chatbot
const CHATBOT_RESPONSES = {
  greeting: (name, exam) => [
    `Hi ${name}! I'm ZenBuddy, your digital companion. 🧘`,
    `Preparing for ${exam} is a marathon, and it is completely normal to feel stressed, overwhelmed, or stuck.`,
    `I'm here for you 24/7. Would you like to check your stress levels, try a quick calming exercise, or simply vent about your preparation?`
  ],
  ventPrompt: `Go ahead, vent as much as you need. Talk about your mock scores, backlogs, sleep, or family expectations. I'm listening, and everything stays strictly private.`,
  examDayJitters: [
    `Exam jitters are just your body mobilizing energy to help you focus, but when it overflows, it causes panic.`,
    `Here is a quick exam-day calming rule: **The 5-5-5 Rule**. Look around you and name 5 things you can see, 5 things you can touch, and 5 sounds you can hear. This grounds you in the room immediately.`,
    `Shall we practice a quick, 1-minute box breathing cycle to calm your heart rate down?`
  ],
  burnout: [
    `Burnout happens when your brain is forced to run on empty for too long. If you continue studying in this state, your retention drops near zero.`,
    `The best remedy for burnout is **Active Recovery**: 15 minutes of doing absolutely nothing, walking outside without a phone, or taking a warm shower.`,
    `Let's pledge to stop studying for the next 20 minutes. What subject is causing the most pressure right now?`
  ],
  failedMock: [
    `Mock test failures are incredibly painful, but they are exactly what you need to succeed on the real exam.`,
    `Every mistake in a mock is a question you will get *right* on exam day because you caught it now.`,
    `Let's break it down: Did you lose marks due to running out of time, silly errors, or chapters you haven't revised?`
  ]
};

// GAD-7 adapted questions
const GAD7_QUESTIONS = [
  {
    id: 1,
    question: "1. Over the last few days, have you felt unable to stop or control your worrying about your studies or mock tests?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"]
  },
  {
    id: 2,
    question: "2. Have you had trouble relaxing or letting go during your study breaks?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"]
  },
  {
    id: 3,
    question: "3. Have you felt so restless or anxious that it's hard to sit still at your study desk?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"]
  },
  {
    id: 4,
    question: "4. Have you felt afraid or nervous, as if something awful might happen on exam day?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"]
  }
];

/**
 * Chatbot reply processor
 * @param {string} userMessage - Message sent by user
 * @param {Array} chatHistory - Previous chat history
 * @param {object} profile - Current active profile
 * @param {object} chatState - Current chat state (e.g. GAD-7 progress, breathing progress)
 */
export function getChatbotResponse(userMessage, chatHistory, profile, chatState = {}) {
  const msg = userMessage.toLowerCase().trim();
  const name = profile?.name || 'Friend';
  const exam = profile?.targetExam || 'exams';
  
  let reply;
  let newState = { ...chatState };

  // --- 1. GAD-7 Assessment Flow ---
  if (chatState.inAssessment) {
    const qIndex = chatState.currentQuestionIndex;
    const selectedOptionIndex = parseInt(msg);
    
    // Validate response option index
    if (isNaN(selectedOptionIndex) || selectedOptionIndex < 1 || selectedOptionIndex > 4) {
      return {
        reply: [`Please select a number from 1 to 4 to answer the question, ${name}.`],
        state: newState
      };
    }
    
    // Save answer (0 to 3 points per question)
    const points = selectedOptionIndex - 1;
    const newAnswers = [...(chatState.answers || []), points];
    newState.answers = newAnswers;

    if (qIndex < GAD7_QUESTIONS.length - 1) {
      // Move to next question
      const nextQIndex = qIndex + 1;
      newState.currentQuestionIndex = nextQIndex;
      const nextQ = GAD7_QUESTIONS[nextQIndex];
      
      reply = [
        `Thanks for sharing. Here is the next question:`,
        nextQ.question,
        ...nextQ.options.map((opt, i) => `[${i + 1}] ${opt}`)
      ];
    } else {
      // Assessment complete
      newState.inAssessment = false;
      newState.currentQuestionIndex = null;
      
      // Calculate score (out of 12)
      const totalScore = newAnswers.reduce((sum, val) => sum + val, 0);
      let stressDiagnosis;
      let advice;
      
      if (totalScore <= 3) {
        stressDiagnosis = 'Low/Mild Academic Stress';
        advice = `You are managing your ${exam} stress very well! Keep taking regular breaks and keep your current routine.`;
      } else if (totalScore <= 7) {
        stressDiagnosis = 'Moderate Academic Stress';
        advice = `You are carrying a notable amount of exam tension. I recommend setting up a strict 50-minute study and 10-minute break cycle. Let's do a quick breathing exercise now to release muscle tension.`;
      } else {
        stressDiagnosis = 'High Academic Stress / Burnout Risk';
        advice = `Your stress levels are very high, ${name}. Continued studying in this state will lead to exhaustion. Please consider cutting your study hours today by half, resting, and speaking with a mentor, teacher, or parent. Remember, your health always comes first.`;
      }

      reply = [
        `📊 **Anxiety Check-In Results:**`,
        `Your calculated Stress Indicator is **${stressDiagnosis}** (Score: ${totalScore}/12).`,
        advice,
        `Would you like to try a calming breathing exercise now? (Type 'breathe' or select the button)`
      ];
    }
    return { reply, state: newState };
  }

  // --- 2. Guided Breathing Flow ---
  if (chatState.inBreathing) {
    if (msg === 'stop' || msg === 'exit') {
      newState.inBreathing = false;
      newState.breathingStep = null;
      return {
        reply: [`Breathing exercise stopped. Whenever you feel tense again, just let me know. What else is on your mind?`],
        state: newState
      };
    }

    const step = chatState.breathingStep || 0;
    if (step === 0) {
      newState.breathingStep = 1;
      reply = [
        `Great. Sit straight, relax your shoulders, and let the air out of your lungs...`,
        `**Round 1:** Inhale deeply through your nose for 4 seconds... 🌬️ (Type 'next' when ready)`
      ];
    } else if (step === 1) {
      newState.breathingStep = 2;
      reply = [
        `**Hold:** Hold your breath in and feel the calmness for 4 seconds... 🧘 (Type 'next')`
      ];
    } else if (step === 2) {
      newState.breathingStep = 3;
      reply = [
        `**Exhale:** Let all the air drift slowly out of your mouth for 4 seconds... 🍃 (Type 'next')`
      ];
    } else if (step === 3) {
      newState.breathingStep = 4;
      reply = [
        `**Hold empty:** Hold your breath out for 4 seconds... 🧘 (Type 'next' for one more round, or 'stop' to finish)`
      ];
    } else if (step === 4) {
      // Round 2
      newState.breathingStep = 5;
      reply = [
        `**Round 2:** Inhale deeply through your nose... 🌬️ (4 seconds - Type 'next')`
      ];
    } else if (step === 5) {
      newState.breathingStep = 6;
      reply = [
        `**Hold:** Feel the peace inside your chest... 🧘 (4 seconds - Type 'next')`
      ];
    } else if (step === 6) {
      newState.breathingStep = 7;
      reply = [
        `**Exhale:** Release all the stress and worry... 🍃 (4 seconds - Type 'next')`
      ];
    } else {
      newState.inBreathing = false;
      newState.breathingStep = null;
      reply = [
        `**Hold empty:** Hold for 4 seconds... and relax. 🧘`,
        `Excellent job, ${name}. Feel the grounding in your body. Your heart rate should be calmer now.`,
        `Would you like to talk about your preparation goals, or take a look at your Dashboard?`
      ];
    }
    return { reply, state: newState };
  }

  // --- 3. Command & Text Triggers ---

  // Trigger: Assessment
  if (msg.includes('assess') || msg.includes('check-in') || msg.includes('diagnostic') || msg.includes('test stress') || msg === '1') {
    newState.inAssessment = true;
    newState.currentQuestionIndex = 0;
    newState.answers = [];
    const firstQ = GAD7_QUESTIONS[0];
    reply = [
      `Let's do a quick student anxiety check-in based on the clinical GAD-7 screening tool. I'll ask 4 short questions.`,
      firstQ.question,
      ...firstQ.options.map((opt, i) => `[${i + 1}] ${opt}`)
    ];
    return { reply, state: newState };
  }

  // Trigger: Breathing
  if (msg.includes('breathe') || msg.includes('calm me down') || msg.includes('panic') || msg.includes('anxious') || msg === '2') {
    newState.inBreathing = true;
    newState.breathingStep = 0;
    reply = [
      `Let's practice box breathing to calm your nervous system. 🧘`,
      `We will inhale, hold, exhale, and hold empty for 4 seconds each.`,
      `Type **'next'** to begin, or **'stop'** at any time to exit.`
    ];
    return { reply, state: newState };
  }

  // Trigger: Venting
  if (msg.includes('vent') || msg === '3') {
    reply = [CHATBOT_RESPONSES.ventPrompt];
    return { reply, state: newState };
  }

  // Keywords detection in normal chat
  if (msg.includes('mock') || msg.includes('test') || msg.includes('score') || msg.includes('marks')) {
    reply = CHATBOT_RESPONSES.failedMock;
  } else if (msg.includes('burnout') || msg.includes('exhausted') || msg.includes('give up') || msg.includes('tired') || msg.includes('stop studying')) {
    reply = CHATBOT_RESPONSES.burnout;
  } else if (msg.includes('jitter') || msg.includes('exam day') || msg.includes('scared') || msg.includes('worry')) {
    reply = CHATBOT_RESPONSES.examDayJitters;
  } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('greet')) {
    reply = CHATBOT_RESPONSES.greeting(name, exam);
  } else {
    // Empathetic fallback
    reply = [
      `I hear you, ${name}. Studying for ${exam} is incredibly demanding, and it is very natural to feel this way.`,
      `Remember, your preparation is built one day, one concept at a time. Do not try to solve the entire exam today. Just focus on what you can do in the next hour.`,
      `Would you like to try our breathing guide, check your anxiety level, or just tell me more about what chapter or mock test is worrying you?`
    ];
  }

  return { reply, state: newState };
}

/**
 * Generates a pattern-based mood and wellness forecast based on recent check-ins
 * @param {Array} journals - List of journal log objects
 */
export function generateWellnessForecast(journals) {
  if (!journals || journals.length < 3) {
    return {
      status: 'learning',
      title: 'Analyzing Study Trajectory...',
      description: 'We require at least 3 daily journal entries to analyze your stress slope and forecast burnout risks.',
      recommendation: 'Log today\'s study mood and physical energy metrics in the Daily Journal tab.'
    };
  }

  // Sort ascending by date (oldest to newest)
  const sorted = [...journals].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const recent = sorted.slice(-5); // last 5 entries

  const stressVals = recent.map(j => j.metrics?.stress !== undefined ? j.metrics.stress : j.stressLevel);
  const energyVals = recent.map(j => j.metrics?.energy !== undefined ? j.metrics.energy : 5);
  const focusVals = recent.map(j => j.metrics?.focus !== undefined ? j.metrics.focus : 5);

  // Linear Regression Slope Helper
  const getSlope = (arr) => {
    const n = arr.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = arr[i];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  };

  const stressSlope = getSlope(stressVals);
  const energySlope = getSlope(energyVals);
  const focusSlope = getSlope(focusVals);
  
  const currentStress = stressVals[stressVals.length - 1];
  const currentEnergy = energyVals[energyVals.length - 1];

  // 1. Burnout Warning Check
  if ((stressSlope > 0.3 && energySlope < -0.3 && currentStress >= 6.5) || currentStress >= 8.5) {
    return {
      status: 'danger',
      title: 'Burnout Risk: Critical',
      description: 'Your stress levels are rising rapidly while physical energy is in a steep decline. Studying in this state will cause severe retention drop and fatigue.',
      recommendation: 'Schedule a complete revision rest day. Stop studying by 8 PM tonight and sleep for at least 8 hours.'
    };
  }

  // 2. Declining Energy Warning
  if (energySlope < -0.4 && currentEnergy <= 4) {
    return {
      status: 'warning',
      title: 'Caution: Declining Energy',
      description: 'Your energy level is trending downwards over your past few logs. You are push-studying through physical fatigue.',
      recommendation: 'Incorporate a 15-minute active recovery break (stretch, drink water, walk outside) for every 90 minutes of study.'
    };
  }

  // 3. Optimal Focus Window
  if (focusSlope > 0.3 && currentStress < 5.5 && currentEnergy >= 5) {
    return {
      status: 'positive',
      title: 'Optimal Focus Window',
      description: 'Your focus is increasing while keeping stress levels low. This indicates excellent cognitive readiness and retention.',
      recommendation: 'This is a great study window to tackle your most challenging backlog chapters or mock test reviews!'
    };
  }

  // 4. Stable Balanced Rhythm (Fallback)
  return {
    status: 'neutral',
    title: 'Stable Wellness Rhythm',
    description: 'Your mental stress, focus, and physical energy have maintained a steady, healthy balance over your recent study sessions.',
    recommendation: 'Continue your current study cycles. Remember to take regular breaks and log your thoughts daily.'
  };
}

/**
 * Generates health and wellness insights from real/simulated health and weather data
 * @param {object} healthData - { steps, sleep, heartRate }
 * @param {object} weatherData - { temp, description, isRainy, isOvercast }
 * @param {Array} journals - Recent journals array
 */
export function generateHealthInsights(healthData, weatherData, journals = []) {
  const steps = healthData?.steps || 0;
  const sleep = healthData?.sleep || 7;
  const heartRate = healthData?.heartRate || 72;
  
  const temp = weatherData?.temp;
  const desc = weatherData?.description || 'Clear';
  const isRainy = !!weatherData?.isRainy;
  const isOvercast = !!weatherData?.isOvercast;

  let wellnessScore = 100;
  const insights = [];

  // Sleep analysis
  if (sleep < 6) {
    wellnessScore -= 20;
    insights.push(`Sleep Debt detected (${sleep}h). A sleep-deprived brain retains 40% less information. Prioritize 7-8h of sleep tonight.`);
  } else if (sleep < 7) {
    wellnessScore -= 10;
    insights.push(`Sub-optimal sleep (${sleep}h). Aim for a full 7-8 hours to improve memory consolidation.`);
  } else {
    insights.push(`Excellent sleep duration (${sleep}h). This supports clear concentration and peak brain performance.`);
  }

  // Steps analysis
  if (steps < 3000) {
    wellnessScore -= 20;
    insights.push(`Activity levels are low (${steps} steps). Physical inactivity decreases blood flow to the brain. Take a 10-minute walking break.`);
  } else if (steps < 6000) {
    wellnessScore -= 10;
    insights.push(`Moderate activity levels (${steps} steps). Try to add a quick walk after your next study session.`);
  } else {
    insights.push(`Great activity levels (${steps} steps)! Active movement stimulates neural growth factors, boosting learning.`);
  }

  // Heart rate analysis
  if (heartRate > 85) {
    wellnessScore -= 15;
    insights.push(`Elevated resting heart rate (${heartRate} bpm) suggests elevated physical or mental stress. Try a 2-minute box breathing cycle.`);
  } else if (heartRate < 60) {
    insights.push(`Low resting heart rate (${heartRate} bpm) indicates deep physical recovery and cardiovascular efficiency.`);
  } else {
    insights.push(`Resting heart rate is stable (${heartRate} bpm), indicating good autonomic balance.`);
  }

  // Weather insights
  if (isRainy) {
    insights.push(`It's rainy outside. Gloomy weather triggers melatonin release, making you feel drowsy. Keep your study area brightly lit.`);
  } else if (isOvercast) {
    insights.push(`It's overcast and cloudy. Lower natural light can decrease focus. Step outside for 5 minutes of fresh air to stay alert.`);
  } else if (desc.toLowerCase().includes('clear') || desc.toLowerCase().includes('sunny')) {
    insights.push(`The weather is sunny and clear (${temp !== undefined ? temp + '°C' : 'pleasant'}). Consider an outdoor study break to get some natural vitamin D.`);
  }

  // Correlate with journals/mood
  const recentJournals = journals.slice(-3);
  const highStressLogs = recentJournals.filter(j => (j.metrics?.stress || j.stressLevel) >= 7);
  if (highStressLogs.length > 0 && sleep < 6) {
    insights.push(`Warning: The combination of high academic stress and sleep debt increases severe exam burnout risk. Prioritize rest over extra study hours today.`);
  }
  if (highStressLogs.length > 0 && steps < 3000) {
    insights.push(`Coping tip: You are experiencing high stress while being inactive. Exercise is a powerful natural stress reducer. Step away for a walk.`);
  }

  wellnessScore = Math.max(10, Math.min(100, wellnessScore));

  let status = 'optimal';
  let summary = 'Your physical wellness is in an optimal zone for learning.';
  if (wellnessScore < 60) {
    status = 'critical';
    summary = 'Critical wellness indicators. High fatigue or inactivity is undermining your exam preparation.';
  } else if (wellnessScore < 85) {
    status = 'caution';
    summary = 'Moderate physical fatigue detected. Make small lifestyle adjustments to improve daily focus.';
  }

  return {
    wellnessScore,
    insights,
    summary,
    status
  };
}

