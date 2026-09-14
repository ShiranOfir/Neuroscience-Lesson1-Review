(() => {
  'use strict';

  const STORAGE_KEY = 'neuro-review-game-v2';
  const MAX_ATTEMPTS = 3;

  // Private teacher submission endpoint.
  // Progress stays on the student's device. Answers are sent only when the student chooses to submit.
  const SUBMISSION_ENDPOINT = String(
    (window.NEURO_REVIEW_CONFIG && window.NEURO_REVIEW_CONFIG.submissionEndpoint) || ''
  ).trim();
  const SESSION_ID_KEY = 'neuro-review-session-id';

  let sessionId = getOrCreateSessionId();

  const stages = [
    {
      id: 'brain-parts',
      nav: 'מבנה המוח',
      badge: 'תחנה 1',
      title: 'מפת המוח',
      intro: 'ארבעה אזורים, שני פרטים לכל אזור: השם באנגלית והתפקוד העיקרי.',
      exactHeading: 'רשמו את השמות באנגלית ואת התפקוד העיקרי של האיזורים הבאים:',
      questions: [
        dualFieldQuestion('brainstem', 'גזע המוח', ['brainstem', 'brain stem', 'בריינסטם', 'בריין סטם'], [
          ['נשימה', 'לב', 'דופק', 'אוטונומי', 'חיוניים', 'עוררות', 'נשימ'],
        ], 'Brainstem: גזע המוח שולט בתפקודים חיוניים שפועלים בלי שנחשוב עליהם, כמו נשימה, דופק ורמת הערנות.'),
        dualFieldQuestion('cerebellum', 'המוח הקטן', ['cerebellum', 'cerebelum', 'סרבלום', 'צרבלום'], [
          ['תיאום', 'קואורדינציה', 'שיווי משקל', 'תנועה', 'למידה מוטורית', 'דיוק'],
        ], 'Cerebellum: המוח הקטן עוזר לתאם ולדייק תנועות, לשמור על שיווי משקל וללמוד תנועות חדשות.'),
        dualFieldQuestion('diencephalon', 'מוח הביניים', ['diencephalon', 'diencefalon', 'diencefalon', 'דיאנצפלון', 'דיאנספלון'], [
          ['תלמוס', 'היפותלמוס', 'תחוש', 'חושי', 'הומאוסטזיס', 'וויסות', 'בקרה'],
        ], 'Diencephalon: מוח הביניים כולל בין השאר את התלמוס וההיפותלמוס. התלמוס מעביר מידע חושי לקורטקס, וההיפותלמוס עוזר לווסת דברים כמו רעב, צמא, טמפרטורת הגוף ושינה.'),
        dualFieldQuestion('cerebrum', 'המוח הגדול', ['cerebrum', 'סרברום', 'צרברום'], [
          ['חשיבה', 'קוגניציה', 'חישה', 'תנועה', 'זיכרון', 'שפה', 'תפיסה', 'רצונית'],
        ], 'Cerebrum: המוח הגדול משתתף בתפיסה, בתנועה רצונית, בשפה, בזיכרון, בחשיבה ובקבלת החלטות.'),
      ],
    },
    {
      id: 'definitions',
      nav: 'מושגים',
      badge: 'תחנה 2',
      title: 'מחברים מושגים',
      intro: 'כתבו תשובה קצרצרה לכל מושג.',
      exactHeading: 'הגדירו:',
      questions: [
        openQuestion('hemispheres', 'המיספרות', [
          ['שני', 'שתיים'], ['חצי', 'חצאי', 'צדי', 'חלקי'], ['מוח', 'המוח הגדול']
        ], 'שני החצאים של המוח הגדול. יש המיספרה ימנית והמיספרה שמאלית.'),
        openQuestion('corpus-callosum', 'קורפוס קולוסום', [
          ['סיבים', 'אקסונים', 'חומר לבן', 'מסילות'], ['מחבר', 'מקשר', 'תקשורת'], ['המיספר']
        ], 'קבוצה גדולה של סיבי עצב שמחברת בין שתי ההמיספרות ומאפשרת להן להעביר מידע זו לזו.'),
        openQuestion('split-brain', 'split brain', [
          ['קורפוס', 'callosum', 'קולוסום'], ['חת', 'ניתוק', 'מנותק', 'הפרד'], ['המיספר']
        ], 'מצב שבו הקורפוס קולוסום נחתך או נותק. בעקבות זאת שתי ההמיספרות יכולות להעביר ביניהן הרבה פחות מידע.'),
        openQuestion('lateralization', 'לטרליזציה', [
          ['תפקוד', 'פונקציה'], ['המיספר', 'צד'], ['התמחות', 'דומיננט', 'יותר', 'שונה']
        ], 'מצב שבו תפקוד מסוים מתבצע יותר בהמיספרה אחת מאשר בשנייה. זה לא אומר שרק המיספרה אחת אחראית עליו בצורה בלעדית.'),
      ],
    },
    {
      id: 'hemisphere-functions',
      nav: 'ימין ושמאל',
      badge: 'תחנה 3',
      title: 'מי עושה מה?',
      intro: 'כתבו תשובה קצרצרה לכל תפקוד.',
      exactHeading: 'רישמו בקצרה על התפקודים המוחיים הבאים:',
      questions: [
        openQuestion('motor-right', 'תפקיד מוטורי המסיפרה ימין', [
          ['שמאל'], ['גוף', 'צד', 'תנוע']
        ], 'ההמיספרה הימנית שולטת בעיקר בתנועות רצוניות של צד שמאל של הגוף.'),
        openQuestion('motor-left', 'תפקיד מוטורי המיספרה שמאל', [
          ['ימין'], ['גוף', 'צד', 'תנוע']
        ], 'ההמיספרה השמאלית שולטת בעיקר בתנועות רצוניות של צד ימין של הגוף.'),
        openQuestion('visual-right', 'עיבוד ראייתי המיספרה ימין', [
          ['שדה', 'ראייה', 'חזות'], ['שמאל']
        ], 'מידע משדה הראייה השמאלי מגיע בעיקר להמיספרה הימנית, משתי העיניים.'),
        openQuestion('visual-left', 'עיבוד ראייתי המיספרה שמאל', [
          ['שדה', 'ראייה', 'חזות'], ['ימין']
        ], 'מידע משדה הראייה הימני מגיע בעיקר להמיספרה השמאלית, משתי העיניים.'),
        openQuestion('sensory-right', 'קליטת מידע חושי המיספרה ימין', [
          ['שמאל'], ['גוף', 'תחוש', 'סומטו', 'חושי']
        ], 'מידע על מגע ותחושות גוף מצד שמאל מגיע בעיקר להמיספרה הימנית.'),
        openQuestion('sensory-left', 'קליטת מידע חושי המיספרה שמאל', [
          ['ימין'], ['גוף', 'תחוש', 'סומטו', 'חושי']
        ], 'מידע על מגע ותחושות גוף מצד ימין מגיע בעיקר להמיספרה השמאלית.'),
        openQuestion('hemispheric-influence', 'השפעת ההמיספרות אחת על השניה', [
          ['קורפוס', 'callosum', 'קולוסום', 'סיבים'], ['מידע', 'תקשורת', 'השפעה', 'עיכוב', 'שיתוף']
        ], 'שתי ההמיספרות מעבירות מידע זו לזו ומשפיעות זו על הפעילות של זו, בעיקר דרך הקורפוס קולוסום. הן יכולות גם להפחית זו את הפעילות של זו. הדבר עוזר לתאם בין שני צדי הגוף. כשמנסים לבצע בשתי הידיים שתי פעולות שונות מאוד באותו זמן, כל צד של המוח צריך לשלוט בדפוס תנועה אחר, ולכן המשימה יכולה להיות קשה.'),
      ],
    },
    {
      id: 'research',
      nav: 'שאלות מחקריות',
      badge: 'תחנה 4',
      title: 'מעבדת המחקר',
      intro: 'ענו בתשובה קצרצרה. הרעיון הניסויי חשוב יותר מהניסוח.',
      exactHeading: 'שאלות מחקריות:',
      questions: [
        openQuestion('research-1', '1. תארו שני ניסויים שניתן לבצע על אדם עם split brain', [
          ['שדה', 'ראייה', 'חזות', 'תמונה', 'מילה'], ['יד', 'בחירה', 'ציור', 'מישוש', 'חפץ'], ['ימין', 'שמאל']
        ], 'לדוגמה, אפשר להציג תמונה לזמן קצר בשדה הראייה הימני או השמאלי ולבדוק אם הנבדק יכול לומר מה ראה. בניסוי נוסף אפשר לבקש ממנו לבחור ביד חפץ שמתאים למה שראה או מישש.'),
        openQuestion('research-2', '2. תארו ניסוי שמאפשר לבחון את ההבדלים בין ההמיספרות אצל אדם בריא', [
          ['שדה', 'ראייה', 'ימין', 'שמאל', 'אוזן', 'דיכוטי'], ['תגובה', 'זמן', 'דיוק', 'ביצוע', 'השווא']
        ], 'לדוגמה, אפשר להציג גירויים לזמן קצר בשדה הראייה הימני ובשדה הראייה השמאלי ולהשוות את הדיוק או את זמן התגובה. אפשרות אחרת היא להשתמש ב TMS כדי להחליש זמנית פעילות באזור בהמיספרה אחת, ואז לבדוק אם הביצוע במשימה משתנה.'),
        openQuestion('research-3', '3. מה קורה ליכולת היצירתיות בעת דיכוי המיספרה שמאל?', [
          ['יצירת', 'מקוריות', 'גמישות'], ['עול', 'משתפר', 'מוגבר', 'יותר']
        ], 'במחקרים מסוימים, דיכוי זמני של אזורים מסוימים בהמיספרה השמאלית גרם לעלייה במקוריות בחלק ממשימות היצירתיות. זה לא אומר שהיצירתיות נמצאת בהמיספרה הימנית.'),
      ],
    },
  ];

  const stageNav = document.getElementById('stage-nav');
  const game = document.getElementById('game');
  const template = document.getElementById('question-template');
  const progressFill = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');
  const progressTrack = document.querySelector('.progress-track');
  const stageLabel = document.getElementById('stage-label');
  const resetButton = document.getElementById('reset-progress');
  const participantNameInput = document.getElementById('participant-name');

  let state = loadState();
  participantNameInput.value = state.participantName || '';
  participantNameInput.addEventListener('input', () => {
    state.participantName = participantNameInput.value;
    saveState();
  });

  function dualFieldQuestion(id, prompt, englishAccepted, functionKeywordGroups, answer) {
    return {
      id,
      prompt,
      type: 'dual',
      englishAccepted,
      keywordGroups: functionKeywordGroups,
      answer,
    };
  }

  function openQuestion(id, prompt, keywordGroups, answer) {
    return { id, prompt, type: 'open', keywordGroups, answer };
  }

  function defaultState() {
    const questionState = {};
    stages.forEach(stage => stage.questions.forEach(q => {
      questionState[q.id] = {
        attempts: 0,
        status: 'open',
        answer: q.type === 'dual' ? { english: '', function: '' } : '',
      };
    }));
    return { currentStage: 0, participantName: '', questions: questionState, completedAt: null, showCompletion: false };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const fresh = defaultState();
      return {
        ...fresh,
        ...parsed,
        questions: { ...fresh.questions, ...(parsed.questions || {}) },
      };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getOrCreateSessionId() {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id = (window.crypto && typeof window.crypto.randomUUID === 'function')
      ? window.crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_ID_KEY, id);
    return id;
  }

  function hasMeaningfulProgress() {
    if ((state.participantName || '').trim()) return true;
    return getAllQuestions().some(q => {
      const qState = state.questions[q.id];
      if (!qState) return false;
      if (qState.attempts > 0 || qState.status !== 'open') return true;
      if (q.type === 'dual') {
        return Boolean((qState.answer?.english || '').trim() || (qState.answer?.function || '').trim());
      }
      return Boolean(String(qState.answer || '').trim());
    });
  }

  function buildSubmissionPayload() {
    return {
      sessionId,
      participantName: (state.participantName || '').trim(),
      submittedAt: new Date().toISOString(),
      completedAt: state.completedAt || null,
      currentStage: state.currentStage,
      completedCount: completedCount(),
      totalQuestions: getAllQuestions().length,
      responses: getAllQuestions().map(q => ({
        id: q.id,
        prompt: q.prompt,
        response: state.questions[q.id].answer,
        attempts: state.questions[q.id].attempts,
        status: state.questions[q.id].status,
      })),
    };
  }

  function setSyncStatus(message) {
    const el = document.getElementById('sync-status');
    if (el) el.textContent = message;
  }

  function jsonpCheckSubmission(id, timeoutMs = 9000) {
    return new Promise((resolve) => {
      if (!SUBMISSION_ENDPOINT) {
        resolve(false);
        return;
      }

      const callbackName = `__neuroReviewCheck_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const script = document.createElement('script');
      let finished = false;

      const cleanup = () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer);
        delete window[callbackName];
        script.remove();
      };

      window[callbackName] = (result) => {
        const found = Boolean(result && result.ok && result.found);
        cleanup();
        resolve(found);
      };

      const separator = SUBMISSION_ENDPOINT.includes('?') ? '&' : '?';
      script.src = `${SUBMISSION_ENDPOINT}${separator}action=check&submissionId=${encodeURIComponent(id)}&callback=${encodeURIComponent(callbackName)}&_=${Date.now()}`;
      script.async = true;
      script.onerror = () => {
        cleanup();
        resolve(false);
      };

      const timer = window.setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);

      document.head.appendChild(script);
    });
  }

  async function sendSubmission() {
    if (!SUBMISSION_ENDPOINT) {
      throw new Error('SUBMISSION_ENDPOINT_NOT_CONFIGURED');
    }

    const payload = buildSubmissionPayload();

    // no-cors avoids browser CORS restrictions while still allowing Apps Script to receive the POST.
    // We then verify the save with a read-free JSONP check that returns only a boolean.
    await fetch(SUBMISSION_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const confirmed = await jsonpCheckSubmission(sessionId);
    if (!confirmed) throw new Error('SUBMISSION_NOT_CONFIRMED');
    return true;
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0591-\u05C7]/g, '')
      .replace(/[״׳"'.,!?;:()\[\]{}\-_/\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compactTerm(value) {
    return normalize(value).replace(/\s+/g, '');
  }

  function levenshtein(a, b) {
    const left = compactTerm(a);
    const right = compactTerm(b);
    if (left === right) return 0;
    if (!left.length) return right.length;
    if (!right.length) return left.length;

    const previous = Array.from({ length: right.length + 1 }, (_, i) => i);
    const current = new Array(right.length + 1);

    for (let i = 1; i <= left.length; i += 1) {
      current[0] = i;
      for (let j = 1; j <= right.length; j += 1) {
        const cost = left[i - 1] === right[j - 1] ? 0 : 1;
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + cost
        );
      }
      for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
    }
    return previous[right.length];
  }

  function fuzzyTermMatch(value, variants) {
    const input = compactTerm(value);
    if (input.length < 3) return false;

    return variants.some(variant => {
      const target = compactTerm(variant);
      if (input === target) return true;
      const longest = Math.max(input.length, target.length);
      const maxDistance = longest >= 11 ? 3 : longest >= 7 ? 2 : 1;
      const distance = levenshtein(input, target);
      return distance <= maxDistance && distance / longest <= 0.24;
    });
  }

  function matchesKeywordGroups(text, groups) {
    const normalized = normalize(text);
    if (normalized.length < 2) return false;
    return groups.every(group => group.some(keyword => normalized.includes(normalize(keyword))));
  }

  function evaluate(question, response) {
    if (question.type !== 'dual') return false;
    const englishOk = fuzzyTermMatch(response.english, question.englishAccepted);
    const functionOk = matchesKeywordGroups(response.function, question.keywordGroups);
    return englishOk && functionOk;
  }

  function getAllQuestions() {
    return stages.flatMap(stage => stage.questions);
  }

  function isResolved(questionId) {
    const qState = state.questions[questionId];
    return qState.status === 'correct' || qState.status === 'revealed' || qState.status === 'reviewed';
  }

  function isStageComplete(index) {
    return stages[index].questions.every(q => isResolved(q.id));
  }

  function completedCount() {
    return getAllQuestions().filter(q => isResolved(q.id)).length;
  }

  function renderNav() {
    stageNav.innerHTML = '';
    stages.forEach((stage, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'stage-button';
      button.textContent = `${index + 1}. ${stage.nav}`;
      button.setAttribute('aria-current', index === state.currentStage ? 'step' : 'false');
      if (isStageComplete(index)) button.classList.add('is-complete');
      button.addEventListener('click', () => {
        state.showCompletion = false;
        state.currentStage = index;
        saveState();
        render();
        game.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      stageNav.appendChild(button);
    });
  }

  function renderProgress() {
    const total = getAllQuestions().length;
    const complete = completedCount();
    const percent = Math.round((complete / total) * 100);
    progressFill.style.width = `${percent}%`;
    progressLabel.textContent = `${percent}% הושלמו`;
    progressTrack.setAttribute('aria-valuenow', String(percent));
    stageLabel.textContent = `תחנה ${state.currentStage + 1} מתוך ${stages.length}`;
  }

  function render() {
    renderNav();
    renderProgress();

    if (state.showCompletion) {
      renderCompletion();
      return;
    }

    const stage = stages[state.currentStage];
    game.innerHTML = '';

    const heading = document.createElement('div');
    heading.className = 'stage-heading';
    heading.innerHTML = `
      <div>
        <h2>${escapeHtml(stage.title)}</h2>
        <p>${escapeHtml(stage.intro)}</p>
      </div>
      <span class="stage-badge">${escapeHtml(stage.badge)}</span>
    `;
    game.appendChild(heading);

    const exactHeading = document.createElement('h3');
    exactHeading.className = 'stage-exact-heading';
    exactHeading.textContent = stage.exactHeading;
    game.appendChild(exactHeading);

    const grid = document.createElement('div');
    grid.className = 'questions-grid';

    stage.questions.forEach((question, qIndex) => {
      grid.appendChild(renderQuestion(question, qIndex + 1));
    });

    game.appendChild(grid);

    const footer = document.createElement('div');
    footer.className = 'stage-footer';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'secondary-button';
    prev.textContent = 'לתחנה הקודמת';
    prev.disabled = state.currentStage === 0;
    prev.addEventListener('click', () => changeStage(-1));

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'primary-button';
    next.textContent = state.currentStage === stages.length - 1 ? 'לסיכום' : 'לתחנה הבאה';
    next.addEventListener('click', () => {
      if (state.currentStage < stages.length - 1) changeStage(1);
      else {
        state.showCompletion = true;
        saveState();
        render();
      }
    });

    footer.append(prev, next);
    game.appendChild(footer);
  }

  function renderQuestion(question, displayNumber) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('.question-card');
    const number = fragment.querySelector('.question-number');
    const prompt = fragment.querySelector('.question-prompt');
    const body = fragment.querySelector('.question-body');
    const attempts = fragment.querySelector('.attempts');
    const button = fragment.querySelector('.check-answer');
    const feedback = fragment.querySelector('.feedback');
    const reveal = fragment.querySelector('.answer-reveal');
    const qState = state.questions[question.id];

    card.dataset.questionId = question.id;
    number.textContent = `שאלה ${displayNumber}`;
    prompt.textContent = question.prompt;

    if (question.type === 'dual') {
      for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
        const dot = document.createElement('span');
        dot.className = 'attempt-dot';
        if (i < qState.attempts) dot.classList.add('is-used');
        dot.setAttribute('aria-hidden', 'true');
        attempts.appendChild(dot);
      }
      attempts.setAttribute('aria-label', `${Math.max(0, MAX_ATTEMPTS - qState.attempts)} ניסיונות נותרו`);
    } else {
      attempts.hidden = true;
      card.classList.add('is-self-check');
      button.textContent = 'בדקו אם אתם בכיוון';
    }

    if (question.type === 'dual') {
      body.append(
        makeField(question.id, 'english', 'השם באנגלית', 'תשובה קצרצרה', qState.answer.english),
        makeField(question.id, 'function', 'התפקוד העיקרי', 'תשובה קצרצרה', qState.answer.function)
      );
    } else {
      const label = document.createElement('label');
      label.className = 'sr-only';
      label.htmlFor = `answer-${question.id}`;
      label.textContent = `תשובה ל${question.prompt}`;

      const textarea = document.createElement('textarea');
      textarea.id = `answer-${question.id}`;
      textarea.name = question.id;
      textarea.placeholder = 'תשובה קצרצרה';
      textarea.autocomplete = 'off';
      textarea.value = qState.answer || '';
      textarea.addEventListener('input', () => {
        qState.answer = textarea.value;
        saveState();
      });
      body.append(label, textarea);
    }

    if (qState.status === 'correct') {
      card.classList.add('is-correct');
      feedback.textContent = 'מעולה, התשובה התקבלה.';
      feedback.classList.add('success');
      lockInputs(body);
      button.disabled = true;
      button.textContent = 'הושלם ✓';
    } else if (qState.status === 'revealed') {
      card.classList.add('is-revealed');
      feedback.textContent = 'שלושה ניסיונות הסתיימו. הנה התשובה.';
      feedback.classList.add('error');
      reveal.hidden = false;
      reveal.innerHTML = `<strong>תשובה:</strong><span>${escapeHtml(question.answer)}</span>`;
      lockInputs(body);
      button.disabled = true;
      button.textContent = 'התשובה נחשפה';
    } else if (qState.status === 'reviewed') {
      card.classList.add('is-reviewed');
      feedback.textContent = 'השוו לתשובה. מה היה אצלכם ומה הייתם מוסיפים?';
      feedback.classList.add('self-check');
      reveal.hidden = false;
      reveal.innerHTML = `<strong>כיוון לתשובה:</strong><span>${escapeHtml(question.answer)}</span>`;
      button.textContent = 'הציגו או הסתירו תשובה';
      button.addEventListener('click', () => {
        reveal.hidden = !reveal.hidden;
      });
    } else if (question.type === 'open') {
      button.addEventListener('click', () => reviewOpenQuestion(question, card));
    } else {
      button.addEventListener('click', () => checkQuestion(question, card));
    }

    return fragment;
  }

  function makeField(questionId, key, labelText, placeholder, value) {
    const group = document.createElement('div');
    group.className = 'field-group';

    const label = document.createElement('label');
    label.htmlFor = `${questionId}-${key}`;
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `${questionId}-${key}`;
    input.name = `${questionId}-${key}`;
    input.placeholder = placeholder;
    input.autocomplete = 'off';
    input.value = value || '';
    input.addEventListener('input', () => {
      state.questions[questionId].answer[key] = input.value;
      saveState();
    });

    group.append(label, input);
    return group;
  }

  function lockInputs(container) {
    container.querySelectorAll('input, textarea').forEach(el => {
      el.readOnly = true;
      el.setAttribute('aria-readonly', 'true');
    });
  }

  function reviewOpenQuestion(question, card) {
    const qState = state.questions[question.id];
    const feedback = card.querySelector('.feedback');
    const textarea = card.querySelector(`#${CSS.escape(`answer-${question.id}`)}`);
    const response = textarea.value;

    qState.answer = response;
    if (!response.trim()) {
      feedback.textContent = 'כתבו תשובה קצרצרה ואז בדקו אם אתם בכיוון.';
      feedback.className = 'feedback error';
      return;
    }

    qState.status = 'reviewed';
    saveState();
    render();

    const refreshed = game.querySelector(`[data-question-id="${question.id}"]`);
    refreshed?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function checkQuestion(question, card) {
    const qState = state.questions[question.id];
    const feedback = card.querySelector('.feedback');

    let response;
    if (question.type === 'dual') {
      response = {
        english: card.querySelector(`#${CSS.escape(`${question.id}-english`)}`).value,
        function: card.querySelector(`#${CSS.escape(`${question.id}-function`)}`).value,
      };
      qState.answer = response;
      if (!response.english.trim() || !response.function.trim()) {
        feedback.textContent = 'מלאו את שני השדות לפני הבדיקה.';
        feedback.className = 'feedback error';
        return;
      }
    } else {
      return;
    }

    const correct = evaluate(question, response);
    qState.attempts += 1;

    if (correct) {
      qState.status = 'correct';
    } else if (qState.attempts >= MAX_ATTEMPTS) {
      qState.status = 'revealed';
    } else {
      qState.status = 'open';
    }

    saveState();
    render();

    const refreshed = game.querySelector(`[data-question-id="${question.id}"]`);
    if (refreshed && qState.status === 'open') {
      const msg = refreshed.querySelector('.feedback');
      const left = MAX_ATTEMPTS - qState.attempts;
      msg.textContent = `עוד לא. נסו שוב. נשארו ${left} ${left === 1 ? 'ניסיון' : 'ניסיונות'}.`;
      msg.className = 'feedback error';
      refreshed.querySelector('input, textarea')?.focus();
    }
  }

  function changeStage(delta) {
    state.currentStage = Math.min(stages.length - 1, Math.max(0, state.currentStage + delta));
    saveState();
    render();
    game.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderCompletion() {
    const total = getAllQuestions().length;
    const correct = getAllQuestions().filter(q => state.questions[q.id].status === 'correct').length;
    const revealed = getAllQuestions().filter(q => state.questions[q.id].status === 'revealed').length;
    const reviewed = getAllQuestions().filter(q => state.questions[q.id].status === 'reviewed').length;
    const complete = completedCount();
    const remaining = total - complete;
    const attempts = getAllQuestions().reduce((sum, q) => sum + state.questions[q.id].attempts, 0);
    state.completedAt = state.completedAt || new Date().toISOString();
    saveState();

    game.innerHTML = `
      <section class="completion" aria-labelledby="completion-title">
        <div class="completion-emoji" aria-hidden="true">🧠✨</div>
        <h2 id="completion-title">${remaining === 0 ? 'סיימתם את החזרה' : 'הגעתם לסוף. אפשר להשלים בקצב שלכם'}</h2>
        <p>${remaining === 0 ? 'המסע הושלם.' : `נשארו ${remaining} שאלות שעדיין לא סומנו כהושלמו.`} אפשר לחזור בחופשיות לכל תחנה דרך הכפתורים למעלה.</p>
        <div class="summary-grid" aria-label="סיכום">
          <div class="summary-box"><strong>${complete}</strong><span>הושלמו או נבדקו</span></div>
          <div class="summary-box"><strong>${reviewed + revealed}</strong><span>תשובות הושוו לכיוון</span></div>
          <div class="summary-box"><strong>${remaining}</strong><span>נשארו להשלמה</span></div>
        </div>
        <button type="button" class="primary-button" id="submit-results">שליחת התשובות למורה</button>
        <p class="feedback" id="submit-feedback" role="status"></p>
      </section>
    `;

    document.getElementById('submit-results').addEventListener('click', submitResults);
  }

  async function submitResults() {
    const button = document.getElementById('submit-results');
    const feedback = document.getElementById('submit-feedback');

    if (!hasMeaningfulProgress()) {
      feedback.textContent = 'עדיין אין תשובות לשליחה.';
      feedback.className = 'feedback error';
      return;
    }

    if (!SUBMISSION_ENDPOINT) {
      feedback.textContent = 'הגיליון של המורה עדיין לא חובר לאתר.';
      feedback.className = 'feedback error';
      return;
    }

    button.disabled = true;
    feedback.textContent = 'שולח למורה...';
    feedback.className = 'feedback';

    try {
      await sendSubmission();
      localStorage.setItem('neuro-review-last-submitted-at', new Date().toISOString());
      feedback.textContent = 'התשובות נשלחו למורה בהצלחה. אפשר לסגור את העמוד.';
      feedback.className = 'feedback success';
      button.textContent = 'נשלח ✓';
      setSyncStatus('התשובות נשלחו למורה. ההתקדמות נשארת שמורה גם במכשיר הזה.');
    } catch (error) {
      console.warn('Submission failed.', error);
      feedback.textContent = 'לא הצלחנו לאשר שהשליחה הגיעה. התשובות עדיין שמורות במכשיר הזה ואפשר לנסות שוב.';
      feedback.className = 'feedback error';
      button.disabled = false;
    }
  }



  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }


  resetButton.addEventListener('click', () => {
    const confirmed = window.confirm('לאפס את כל ההתקדמות והתשובות במכשיר הזה?');
    if (!confirmed) return;
    state = defaultState();
    localStorage.removeItem(SESSION_ID_KEY);
    sessionId = getOrCreateSessionId();
    saveState();
    render();
  });

  render();
  setSyncStatus('ההתקדמות נשמרת במכשיר. התשובות נשלחות למורה רק כשלוחצים על שליחת התשובות למורה.');
})();
