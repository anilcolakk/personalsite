import re

def process_file(filepath, import_path):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add import aiMatchesData
    if "import aiMatchesData" not in content:
        content = content.replace(import_path, f"{import_path}\nimport aiMatchesData from '{import_path.replace('curricula.json', 'ai_matches.json')}';")

    # 2. Add script tag to inject JSON before closing </BaseLayout>
    json_script = "<script id=\"ai-matches-data\" type=\"application/json\" set:html={JSON.stringify(aiMatchesData.matches || {})}></script>"
    if json_script not in content:
        content = content.replace('<div class="finder-layout">', f'<div class="finder-layout">\n    {json_script}')

    # 3. Remove Settings Button (including SVG)
    content = re.sub(r'<button id="settings-btn".*?</button>', '', content, flags=re.DOTALL)

    # 4. Remove Modals (Settings modal)
    content = re.sub(r'<!-- Settings Modal -->.*?</div>\s*</div>', '', content, flags=re.DOTALL)

    # 5. Remove API Key Logic (getApiKey, clearApiKey, openSettingsModal, closeSettingsModal)
    content = re.sub(r'function getApiKey\(\).*?\}', '', content, flags=re.DOTALL)
    content = re.sub(r'function clearApiKey\(\).*?\}', '', content, flags=re.DOTALL)
    content = re.sub(r'window\.openSettingsModal\s*=\s*\(\)\s*=>\s*\{.*?\}', '', content, flags=re.DOTALL)
    content = re.sub(r'window\.closeSettingsModal\s*=\s*\(\)\s*=>\s*\{.*?\}', '', content, flags=re.DOTALL)
    content = re.sub(r'document\.getElementById\(\'settings-modal\'\)\?\.remove\(\);', '', content)

    # 6. Remove Research Timeline functions
    content = re.sub(r'let timelineInterval = null;', '', content)
    content = re.sub(r'function showResearchTimeline\(.*?\}\s*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'function stopTimeline\(\)\s*\{.*?\}', '', content, flags=re.DOTALL)

    # 7. Remove callGrokRAG
    content = re.sub(r'async function callGrokRAG\(.*?\}\s*\}', '', content, flags=re.DOTALL)

    # 8. Remove renderNoKeyPrompt
    content = re.sub(r'function renderNoKeyPrompt\(.*?\}\s*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'function renderError\(.*?\}\s*\}', '', content, flags=re.DOTALL)

    # 9. Rewrite selectCourse
    new_select_course = r"""
  // === PRE-COMPUTED AI MATCHING ===
  const AI_MATCHES = JSON.parse(document.getElementById('ai-matches-data').textContent);

  window.selectCourse = (code, name) => {
    state.selectedCourse = code || name;
    state.step = 3;
    state.isLoading = true;
    updateStepper(3);
    
    document.querySelectorAll('.course-card').forEach(el => el.classList.remove('active'));
    const safeId = `course-${((code || '') + '-' + name).replace(/[\s\W]+/g, '-')}`;
    const el = document.getElementById(safeId);
    if(el) el.classList.add('active');
    
    const course = state.courses.find(c => (c.code || '') === (code || '') && c.name === name);
    if (!course) return;

    const courseKey = `${state.uniId}_${course.code || course.name}`;
    const precomputedMatch = AI_MATCHES[courseKey];

    if (precomputedMatch) {
       state.isLoading = false;
       // Attach dynamic DB resources
       const normalizedCode = precomputedMatch.course.code.replace(/\s+/g, '').toUpperCase();
       precomputedMatch.resources = window.NOTES_DB[normalizedCode] || [];
       renderAnalysis(course, precomputedMatch, true);
    } else {
       // Fallback
       const metuCourses = window.CURRICULA_DATA.universities.odtu ? window.CURRICULA_DATA.universities.odtu.courses : [];
       const match = findBestMatch(course, metuCourses);
       state.isLoading = false;
       renderAnalysis(course, match, false);
       showFallbackNotice();
    }
    
    if (!course.notes_available) {
        setTimeout(() => showContributionToast(course.code), 1500);
    }
  };
"""

    content = re.sub(r'window\.selectCourse\s*=\s*async\s*\(code,\s*name\)\s*=>\s*\{.*?(function\s+showFallbackNotice|function\s+findBestMatch|// Upgraded matching)', r'' + new_select_course.replace('\\', '\\\\') + r'\n\n  \1', content, flags=re.DOTALL)

    # 10. Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file(r'c:\\Users\\Anıl\\OneDrive\\Masaüstü\\personalsite\\src\\pages\\equivalency.astro', "import curriculaData from '../data/curricula.json';")
process_file(r'c:\\Users\\Anıl\\OneDrive\\Masaüstü\\personalsite\\src\\pages\\tr\\equivalency.astro', "import curriculaData from '../../data/curricula.json';")

print("Conversion to pre-computed static AI system complete.")
