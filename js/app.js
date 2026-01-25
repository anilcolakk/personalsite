/**
 * Main Application Logic
 * Coordinates UI, matching engine, and GPT integration
 */

// Global instances
let matcher = null;
let gptMatcher = null;
let curricula = null;

// DOM Elements
const universitySelect = document.getElementById('university-select');
const courseSelect = document.getElementById('course-select');
const searchBtn = document.getElementById('search-btn');
const resultsSection = document.getElementById('results-section');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const sourceCard = document.getElementById('source-card');
const matchesGrid = document.getElementById('matches-grid');
const resultsCount = document.getElementById('results-count');
const gptInsight = document.getElementById('gpt-insight');

// API Key elements
const apiToggle = document.getElementById('api-toggle');
const apiContent = document.getElementById('api-content');
const apiKeyInput = document.getElementById('api-key-input');
const apiSaveBtn = document.getElementById('api-save-btn');
const apiStatus = document.getElementById('api-status');

/**
 * Initialize the application
 */
async function init() {
    try {
        // Load curricula data
        const response = await fetch('data/curricula.json');
        curricula = await response.json();

        // Initialize matcher
        matcher = new CourseMatcher(curricula);
        gptMatcher = new GPTMatcher();

        // Load saved API key if exists
        const savedApiKey = localStorage.getItem('openai_api_key');
        if (savedApiKey) {
            gptMatcher.setApiKey(savedApiKey);
            updateApiStatus(true);
        }

        // Populate universities dropdown
        populateUniversities();

        // Set up event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Failed to initialize:', error);
        showError('Failed to load course data. Please refresh the page.');
    }
}

/**
 * Populate universities dropdown
 */
function populateUniversities() {
    const universities = matcher.getSourceUniversities();

    universities.forEach(uni => {
        const option = document.createElement('option');
        option.value = uni.id;
        option.textContent = `${uni.shortName} - ${uni.name}`;
        universitySelect.appendChild(option);
    });
}

/**
 * Populate courses dropdown based on selected university
 */
function populateCourses(universityId) {
    courseSelect.innerHTML = '<option value="">Select a course...</option>';

    if (!universityId) {
        courseSelect.disabled = true;
        searchBtn.disabled = true;
        return;
    }

    const courses = matcher.getCourses(universityId);
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.code;
        option.textContent = `${course.code} - ${course.name}`;
        if (course.nameTR) {
            option.textContent += ` (${course.nameTR})`;
        }
        courseSelect.appendChild(option);
    });

    courseSelect.disabled = false;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // University selection
    universitySelect.addEventListener('change', (e) => {
        populateCourses(e.target.value);
    });

    // Course selection
    courseSelect.addEventListener('change', (e) => {
        searchBtn.disabled = !e.target.value;
    });

    // Search button
    searchBtn.addEventListener('click', performSearch);

    // API toggle
    apiToggle.addEventListener('click', () => {
        apiContent.classList.toggle('visible');
    });

    // API key save
    apiSaveBtn.addEventListener('click', saveApiKey);

    // Enter key on API input
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveApiKey();
        }
    });
}

/**
 * Save API key
 */
function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();

    if (apiKey) {
        localStorage.setItem('openai_api_key', apiKey);
        gptMatcher.setApiKey(apiKey);
        updateApiStatus(true);
        apiKeyInput.value = '';
        apiContent.classList.remove('visible');
    }
}

/**
 * Update API status indicator
 */
function updateApiStatus(active) {
    apiStatus.textContent = active ? 'Active' : 'Inactive';
    apiStatus.className = 'api-status ' + (active ? 'active' : 'inactive');
}

/**
 * Perform course search
 */
async function performSearch() {
    const universityId = universitySelect.value;
    const courseCode = courseSelect.value;

    if (!universityId || !courseCode) return;

    // Show loading
    showLoading();

    try {
        // Get keyword-based matches
        const results = matcher.findMatches(universityId, courseCode);

        if (results.error) {
            showError(results.error);
            return;
        }

        // Display results
        displayResults(results);

        // Get GPT enhancement if API is configured
        if (gptMatcher.isConfigured() && results.matches.length > 0) {
            const gptResult = await gptMatcher.getEnhancedMatch(
                results.sourceCourse,
                results.matches
            );

            if (gptResult.success) {
                displayGptInsight(gptResult);
            }
        }

    } catch (error) {
        console.error('Search error:', error);
        showError('An error occurred while searching. Please try again.');
    }
}

/**
 * Display search results
 */
function displayResults(results) {
    hideLoading();
    emptyState.style.display = 'none';
    resultsSection.style.display = 'block';

    // Update results count
    resultsCount.textContent = `${results.matches.length} matching courses found`;

    // Render source course
    sourceCard.innerHTML = `
        <div class="university">${results.sourceCourse.university}</div>
        <h3>
            <span class="course-code">${results.sourceCourse.code}</span> - 
            ${results.sourceCourse.name}
            ${results.sourceCourse.nameTR ? `<span style="color: var(--text-muted);"> (${results.sourceCourse.nameTR})</span>` : ''}
        </h3>
        <div class="topics-list">
            ${(results.sourceCourse.topics || []).map(topic =>
        `<span class="topic-tag">${topic}</span>`
    ).join('')}
        </div>
    `;

    // Render matches
    matchesGrid.innerHTML = results.matches.map((match, index) => `
        <div class="match-card ${index === 0 ? 'primary' : ''} fade-in">
            <div class="match-header">
                <div class="match-info">
                    <h4>
                        <span class="course-code">${match.code}</span> - ${match.name}
                    </h4>
                    ${match.nameTR ? `<div class="course-name-tr">${match.nameTR}</div>` : ''}
                </div>
                <div class="similarity-badge">
                    <span class="percent">${match.similarityPercent}%</span>
                    <span class="label">Match</span>
                </div>
            </div>
            
            <div class="match-body">
                ${match.matchingTopics.length > 0 ? `
                    <div class="matching-topics">
                        <h5>Common Topics</h5>
                        <div class="topics-list">
                            ${match.matchingTopics.map(topic =>
        `<span class="topic-tag matching">${topic}</span>`
    ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${match.notes_available ? `
                    <div class="notes-section">
                        <h5>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Available Notes
                        </h5>
                        <div class="notes-list">
                            ${(match.notes_sections || []).map(section =>
        `<span class="note-item">${section}</span>`
    ).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Hide GPT insight initially
    gptInsight.style.display = 'none';
}

/**
 * Display GPT insight
 */
function displayGptInsight(result) {
    gptInsight.style.display = 'block';

    const confidenceClass = (result.confidence || 'medium').toLowerCase();

    gptInsight.innerHTML = `
        <h4>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                <path d="M8.5 8.5v.01"></path>
                <path d="M16 15.5v.01"></path>
                <path d="M12 12v.01"></path>
                <path d="M11 17v.01"></path>
                <path d="M7 14v.01"></path>
            </svg>
            AI-Powered Analysis
        </h4>
        <p>${result.explanation || 'Analysis completed.'}</p>
        ${result.differences ? `<p style="margin-top: var(--spacing-sm);"><strong>Note:</strong> ${result.differences}</p>` : ''}
        ${result.confidence ? `
            <span class="gpt-confidence ${confidenceClass}">
                Confidence: ${result.confidence}
            </span>
        ` : ''}
    `;
}

/**
 * Show loading state
 */
function showLoading() {
    loadingState.style.display = 'flex';
    resultsSection.style.display = 'none';
    emptyState.style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoading() {
    loadingState.style.display = 'none';
}

/**
 * Show error message
 */
function showError(message) {
    hideLoading();
    resultsSection.style.display = 'none';
    emptyState.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Error</h3>
        <p>${message}</p>
    `;
    emptyState.style.display = 'block';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
