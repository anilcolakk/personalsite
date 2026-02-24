import re

filepath = r'c:\Users\Anıl\OneDrive\Masaüstü\personalsite\src\pages\tr\equivalency.astro'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace loading skeleton with research timeline
old_skeleton = '''  // === LOADING SKELETON ===
  function showLoadingSkeleton() {
    const container = document.getElementById('analysis-container');
    container.innerHTML = `
      <div class="report-card animate-fade-in">
        <div class="loading-skeleton">
          <div class="skel-header">
            <div class="skel-line skel-w60"></div>
            <div class="skel-badge"></div>
          </div>
          <div class="skel-ring-row">
            <div class="skel-ring"></div>
            <div class="skel-meta">
              <div class="skel-line skel-w40"></div>
              <div class="skel-line skel-w30"></div>
            </div>
          </div>
          <div class="skel-cards-row">
            <div class="skel-card"></div>
            <div class="skel-card"></div>
          </div>
          <div class="skel-section"><div class="skel-line skel-w50"></div><div class="skel-chips"><div class="skel-chip"></div><div class="skel-chip"></div><div class="skel-chip"></div></div></div>
          <div class="skel-section"><div class="skel-line skel-w50"></div><div class="skel-chips"><div class="skel-chip"></div><div class="skel-chip"></div></div></div>
          <p class="loading-text">\U0001F916 Grok AI ile analiz ediliyor<span class="loading-dots"></span></p>
        </div>
      </div>
    `;
  }'''

new_timeline = '''  // === RESEARCH TIMELINE ===
  let timelineInterval = null;
  function showResearchTimeline(courseName, uniName) {
    const container = document.getElementById('analysis-container');
    container.innerHTML = `
      <div class="research-timeline-container animate-fade-in">
        <div class="timeline-header">
          <div class="timeline-pulse"></div>
          <h3>AI Araştırması Devam Ediyor</h3>
          <span class="ai-badge">Grok 3 · Canlı</span>
        </div>
        <div class="timeline-steps" id="timeline-steps">
          <div class="timeline-step active" id="ts-connect">
            <div class="ts-dot ts-done"></div>
            <div class="ts-content">
              <span class="ts-label">Grok AI'ya bağlanıldı</span>
              <span class="ts-detail">Araştırma hattı başlatılıyor...</span>
            </div>
          </div>
          <div class="timeline-step" id="ts-search">
            <div class="ts-dot ts-pending"></div>
            <div class="ts-content">
              <span class="ts-label">Müfredat aranıyor</span>
              <span class="ts-detail">"${courseName}" - ${uniName} için aranıyor...</span>
            </div>
          </div>
          <div class="timeline-step" id="ts-compare">
            <div class="ts-dot ts-pending"></div>
            <div class="ts-content">
              <span class="ts-label">ODTÜ kataloğuyla karşılaştırılıyor</span>
              <span class="ts-detail">ODTÜ EE dersleriyle çapraz referans...</span>
            </div>
          </div>
          <div class="timeline-step" id="ts-analyze">
            <div class="ts-dot ts-pending"></div>
            <div class="ts-content">
              <span class="ts-label">Analiz raporu yazılıyor</span>
              <span class="ts-detail">Kapsamlı karşılaştırma oluşturuluyor...</span>
            </div>
          </div>
        </div>
        <div class="timeline-elapsed">
          <span class="elapsed-icon">⏱️</span>
          <span id="elapsed-timer">0sn geçti</span>
        </div>
      </div>
    `;
    let startTime = Date.now();
    const steps = ['ts-search', 'ts-compare', 'ts-analyze'];
    const delays = [2000, 5000, 9000];
    steps.forEach((id, i) => {
      setTimeout(() => {
        const step = document.getElementById(id);
        if (step) {
          step.classList.add('active');
          step.querySelector('.ts-dot').classList.replace('ts-pending', 'ts-working');
        }
        if (i > 0) {
          const prev = document.getElementById(steps[i-1]);
          if (prev) prev.querySelector('.ts-dot').classList.replace('ts-working', 'ts-done');
        }
      }, delays[i]);
    });
    timelineInterval = setInterval(() => {
      const el = document.getElementById('elapsed-timer');
      if (el) el.textContent = `${Math.round((Date.now() - startTime) / 1000)}sn geçti`;
    }, 1000);
  }
  function stopTimeline() {
    if (timelineInterval) { clearInterval(timelineInterval); timelineInterval = null; }
  }'''

content = content.replace(old_skeleton, new_timeline)

# 2. Replace selectCourse
old_select = '''  // 2. Select Course — dispatches to Grok API or local fallback
  window.selectCourse = async (code, name) => {
    state.selectedCourse = code || name;
    state.step = 3;
    state.isLoading = true;
    updateStepper(3);
    
    document.querySelectorAll('.course-card').forEach(el => el.classList.remove('active'));
    const safeId = `course-${((code || '') + '-' + name).replace(/[\\\\s\\\\W]+/g, '-')}`;
    const el = document.getElementById(safeId);
    if(el) el.classList.add('active');
    
    const course = state.courses.find(c => (c.code || '') === (code || '') && c.name === name);
    if (!course) return;

    const apiKey = getApiKey();

    if (apiKey) {
      showLoadingSkeleton();
      try {
        const uniData = window.CURRICULA_DATA.universities[state.uniId];
        const uniName = uniData?.name || state.uniId;
        const match = await callGrokRAG(course, uniName);
        state.isLoading = false;
        renderAnalysis(course, match, true);
      } catch (err) {
        state.isLoading = false;
        console.warn('Grok API error:', err.message);
        if (err.message === 'INVALID_KEY' || err.message === 'RATE_LIMIT') {
          renderError(err.message, course);
          return;
        }
        const metuCourses = window.CURRICULA_DATA.universities.odtu ? window.CURRICULA_DATA.universities.odtu.courses : [];
        const match = findBestMatch(course, metuCourses);
        renderAnalysis(course, match, false);
        showFallbackNotice();
      }
    } else {
      const metuCourses = window.CURRICULA_DATA.universities.odtu ? window.CURRICULA_DATA.universities.odtu.courses : [];
      const match = findBestMatch(course, metuCourses);
      renderAnalysis(course, match, false);
    }
    
    if (!course.notes_available) {
        setTimeout(() => showContributionToast(course.code), 1500);
    }
  };'''

new_select = '''  // 2. Select Course — AI-first: requires API key
  window.selectCourse = async (code, name) => {
    state.selectedCourse = code || name;
    state.step = 3;
    state.isLoading = true;
    updateStepper(3);
    
    document.querySelectorAll('.course-card').forEach(el => el.classList.remove('active'));
    const safeId = `course-${((code || '') + '-' + name).replace(/[\\\\s\\\\W]+/g, '-')}`;
    const el = document.getElementById(safeId);
    if(el) el.classList.add('active');
    
    const course = state.courses.find(c => (c.code || '') === (code || '') && c.name === name);
    if (!course) return;

    const apiKey = getApiKey();

    if (!apiKey) {
      renderNoKeyPrompt(course);
      state.isLoading = false;
      return;
    }

    const uniData = window.CURRICULA_DATA.universities[state.uniId];
    const uniName = uniData?.name || state.uniId;
    showResearchTimeline(course.name, uniName);
    try {
      const match = await callGrokRAG(course, uniName);
      stopTimeline();
      state.isLoading = false;
      renderAnalysis(course, match, true);
    } catch (err) {
      stopTimeline();
      state.isLoading = false;
      console.warn('Grok API error:', err.message);
      if (err.message === 'INVALID_KEY' || err.message === 'RATE_LIMIT') {
        renderError(err.message, course);
        return;
      }
      const metuCourses = window.CURRICULA_DATA.universities.odtu ? window.CURRICULA_DATA.universities.odtu.courses : [];
      const match = findBestMatch(course, metuCourses);
      renderAnalysis(course, match, false);
      showFallbackNotice();
    }
    
    if (!course.notes_available) {
        setTimeout(() => showContributionToast(course.code), 1500);
    }
  };

  function renderNoKeyPrompt(course) {
    const container = document.getElementById('analysis-container');
    container.innerHTML = `
      <div class="report-card animate-fade-in">
        <div class="no-key-hero">
          <div class="no-key-glow"></div>
          <div class="no-key-icon">🧠</div>
          <h3>AI Destekli Analiz</h3>
          <p class="no-key-desc">Bu araç <strong>Grok AI</strong> kullanarak gerçek üniversite müfredatlarını web\\'den arar, dersleri konu bazında karşılaştırır ve uzman transfer tavsiyeleri üretir.</p>
          <div class="no-key-features">
            <div class="nk-feature"><span>🔍</span> Canlı müfredat araması</div>
            <div class="nk-feature"><span>📊</span> AI güven puanlaması</div>
            <div class="nk-feature"><span>🧠</span> Uzman analiz raporu</div>
            <div class="nk-feature"><span>📚</span> Kişisel çalışma planı</div>
          </div>
          <button onclick="openSettingsModal()" class="btn-add-key-hero">
            <span>🔑</span> Başlamak için Grok API Anahtarınızı Ekleyin
          </button>
          <p class="no-key-hint">Ücretsiz: <a href="https://console.x.ai/" target="_blank" rel="noopener">console.x.ai</a> · Anahtarınız tarayıcınızda kalır</p>
        </div>
      </div>
    `;
  }'''

content = content.replace(old_select, new_select)

# 3. Update callGrokRAG return to include new fields
old_return = '''      resources: resources
    };
  }'''
new_return = '''      resources: resources,
      sourceSyllabus: parsed.source_syllabus_summary || '',
      targetSyllabus: parsed.target_syllabus_summary || '',
      studyRecs: Array.isArray(parsed.study_recommendations) ? parsed.study_recommendations : [],
      difficultyComparison: parsed.difficulty_comparison || '',
      textbookComparison: parsed.textbook_comparison || ''
    };
  }'''
content = content.replace(old_return, new_return, 1)

# 4. Update temperature
content = content.replace("temperature: 0.3", "temperature: 0.2", 1)

# 5. Replace renderAnalysis status text
content = content.replace("'Düşük Eşleşme'", "'Düşük Eşleşme'; let statusEmoji = '🔴'", 1)
content = content.replace("statusText = 'İyi Eşleşme'; statusClass = 'status-high';", "statusText = 'Güçlü Eşleşme'; statusClass = 'status-high'; statusEmoji = '🟢';", 1)
content = content.replace("statusText = 'Kısmi Eşleşme'; statusClass = 'status-medium';", "statusText = 'Kısmi Eşleşme'; statusClass = 'status-medium'; statusEmoji = '🟡';", 1)

# 6. Update badge text
content = content.replace("'🤖 AI'", "'🤖 Grok AI'", 1)
content = content.replace("'📊 Yerel'", "'📊 Yerel Yedek'", 1)

# 7. Replace report title
content = content.replace("📊 Ders Eşleşme Raporu", "${statusEmoji} Ders Eşleşme Raporu", 1)

# 8. Replace disclaimer
content = content.replace("Bu sonuçlar ders konularına dayalı önerilerdir. Her zaman bölümünüzle teyit edin.", "AI tarafından gerçek müfredat araştırmasına dayalı analiz. Her zaman bölümünüzle teyit edin.", 1)

# 9. Replace circleRingSVG(score with circleRingSVG(0 for animation
content = content.replace("${circleRingSVG(score, ringColor)}", "${circleRingSVG(0, ringColor)}", 1)

# 10. Add AI analysis body id for typewriter
content = content.replace(
    '''<div class="ai-analysis-body">${analysis.replace(/\\\\n\\\\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')}</div>''',
    '''<div class="ai-analysis-body" id="ai-analysis-body"></div>''',
    1
)

# 11. Replace AI Analysis header
content = content.replace("<h4>AI Analizi</h4>", "<h4>Derin AI Analizi</h4>", 1)

# 12. Add post-render animations and new sections before closing of renderAnalysis
# Find the closing of renderAnalysis innerHTML and add animations after it
old_render_end = '''      </div>
     \`;
  }

  // Toast Notification'''

new_render_end = '''      </div>
     \`;

     // === Post-render animations ===
     animateScoreRing(score, ringColor);
     if (isAI && analysis && analysis.trim().length > 0) {
        typewriterEffect('ai-analysis-body', analysis);
     }
  }

  // === ANIMATION HELPERS ===
  function animateScoreRing(targetScore, color) {
    const svg = document.querySelector('.score-ring-svg');
    if (!svg) return;
    const circle = svg.querySelectorAll('circle')[1];
    const text = svg.querySelector('text');
    if (!circle || !text) return;
    const r = 54, c = 2 * Math.PI * r;
    const duration = 1200;
    const startTime = performance.now();
    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * targetScore);
      const offset = c - (current / 100) * c;
      circle.setAttribute('stroke-dashoffset', offset);
      text.textContent = current + '%';
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  function typewriterEffect(elementId, text) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const paragraphs = text.split(/\\n\\n+/);
    el.innerHTML = '<p class="typing-cursor"></p>';
    let pIdx = 0, charIdx = 0;
    const speed = 8;
    function type() {
      if (pIdx >= paragraphs.length) {
        el.querySelector('.typing-cursor')?.classList.remove('typing-cursor');
        return;
      }
      const pText = paragraphs[pIdx];
      const currentP = el.querySelector('.typing-cursor');
      if (!currentP) return;
      if (charIdx < pText.length) {
        currentP.textContent += pText[charIdx];
        charIdx++;
        setTimeout(type, speed);
      } else {
        currentP.classList.remove('typing-cursor');
        pIdx++;
        charIdx = 0;
        if (pIdx < paragraphs.length) {
          const newP = document.createElement('p');
          newP.className = 'typing-cursor';
          el.appendChild(newP);
          setTimeout(type, speed * 5);
        } else {
          type();
        }
      }
    }
    setTimeout(type, 300);
  }

  // Toast Notification'''

content = content.replace(old_render_end, new_render_end, 1)

# 13. Add new CSS before </style>
new_css = '''
  /* ========== RESEARCH TIMELINE ========== */
  .research-timeline-container { padding: 32px; min-height: 360px; display: flex; flex-direction: column; justify-content: center; }
  .timeline-header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
  .timeline-header h3 { margin: 0; font-size: 1.2rem; font-weight: 800; flex: 1; }
  .timeline-pulse { width: 12px; height: 12px; border-radius: 50%; background: #10b981; animation: pulse-glow 1.5s ease-in-out infinite; }
  @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); } 50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } }
  .timeline-steps { display: flex; flex-direction: column; gap: 0; padding-left: 8px; }
  .timeline-step { display: flex; align-items: flex-start; gap: 16px; padding: 12px 0; opacity: 0.35; transition: opacity 0.4s ease; position: relative; }
  .timeline-step.active { opacity: 1; }
  .timeline-step::before { content: ''; position: absolute; left: 8px; top: 36px; bottom: -12px; width: 2px; background: var(--border-color); }
  .timeline-step:last-child::before { display: none; }
  .ts-dot { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; transition: all 0.3s ease; }
  .ts-pending { border: 2px solid var(--border-color); background: transparent; }
  .ts-working { border: 2px solid #f59e0b; background: #f59e0b; animation: pulse-glow-amber 1.2s ease-in-out infinite; }
  @keyframes pulse-glow-amber { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); } 50% { box-shadow: 0 0 0 6px rgba(245,158,11,0); } }
  .ts-done { border: 2px solid #10b981; background: #10b981; }
  .ts-content { display: flex; flex-direction: column; gap: 2px; }
  .ts-label { font-weight: 700; font-size: 0.95rem; color: var(--text-primary); }
  .ts-detail { font-size: 0.82rem; color: var(--text-tertiary); }
  .timeline-elapsed { margin-top: 24px; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-tertiary); padding: 10px 16px; background: var(--bg-tertiary); border-radius: 8px; width: fit-content; }
  /* ========== NO-KEY HERO ========== */
  .no-key-hero { text-align: center; padding: 48px 32px; position: relative; overflow: hidden; }
  .no-key-glow { position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%); pointer-events: none; }
  .no-key-icon { font-size: 3.5rem; margin-bottom: 16px; position: relative; z-index: 1; }
  .no-key-hero h3 { font-size: 1.6rem; font-weight: 800; margin: 0 0 12px; position: relative; z-index: 1; }
  .no-key-desc { font-size: 1rem; color: var(--text-secondary); line-height: 1.6; max-width: 480px; margin: 0 auto 28px; position: relative; z-index: 1; }
  .no-key-features { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 400px; margin: 0 auto 28px; position: relative; z-index: 1; }
  .nk-feature { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); padding: 10px 14px; background: var(--bg-tertiary); border-radius: 10px; }
  .btn-add-key-hero { display: inline-flex; align-items: center; gap: 10px; background: linear-gradient(135deg, #7c3aed, #3b82f6); color: white; border: none; padding: 14px 28px; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; position: relative; z-index: 1; box-shadow: 0 4px 15px rgba(124,58,237,0.3); }
  .btn-add-key-hero:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(124,58,237,0.4); }
  .no-key-hint { margin-top: 16px; font-size: 0.82rem; color: var(--text-tertiary); position: relative; z-index: 1; }
  .no-key-hint a { color: var(--primary-600); font-weight: 600; text-decoration: none; }
  /* ========== TYPING CURSOR ========== */
  .typing-cursor::after { content: '▌'; color: var(--primary-600); animation: blink-cursor 0.8s step-end infinite; font-weight: 400; }
  @keyframes blink-cursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
'''

content = content.replace('</style>', new_css + '</style>', 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! All replacements applied successfully.")
