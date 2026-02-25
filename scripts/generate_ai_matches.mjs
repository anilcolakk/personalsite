import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CURRICULA_PATH = path.join(__dirname, '../src/data/curricula.json');
const MATCHES_PATH = path.join(__dirname, '../src/data/ai_matches.json');
const API_KEY = process.env.GEMINI_API_KEY;

// Gemini Free Tier allows 15 Requests Per Minute (RPM)
// 60 / 15 = 4 seconds per request. We'll use 4.5s to be safe.
const MAX_COURSES_PER_RUN = 4; // 4 calls * 4 times a day (every 6h) = 16/day, safely under the 20 RPD free tier limit
const DELAY_BETWEEN_CALLS_MS = 4500;

if (!API_KEY) {
    console.error("❌ ERROR: Missing GEMINI_API_KEY environment variable. Create a free key at https://aistudio.google.com");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
// Use Gemini 2.5 Flash
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // Force JSON output
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
    }
});

const curriculaData = JSON.parse(fs.readFileSync(CURRICULA_PATH, 'utf8'));
let aiMatchesData = { matches: {} };
if (fs.existsSync(MATCHES_PATH)) {
    aiMatchesData = JSON.parse(fs.readFileSync(MATCHES_PATH, 'utf8'));
}

const odtuCourses = curriculaData.universities.odtu?.courses || [];
const baselineList = odtuCourses.map(c =>
    `${c.code}: ${c.name} — Topics: ${(c.topics || []).join(', ') || 'N/A'}${c.prerequisites ? ` | Prereqs: ${c.prerequisites.join(', ')}` : ''}`
).join('\n');

const systemPrompt = `You are the world's leading academic evaluator specializing in Turkish university Electrical-Electronics Engineering programs. Your role is to perform an exceptionally thorough, syllabus-level comparison between an external university course and the most similar ODTÜ EE course.

You think step-by-step:
1. First, recall or deduce the external course's full syllabus, textbooks, and content outline
2. Then, identify the best matching ODTÜ course from the catalog provided
3. Finally, compose a rich, detailed comparison that would genuinely help a transfer student

You must respond ONLY with valid JSON.`;

async function callRAG(course, universityName) {
    const courseName = course.name || '';
    const courseTopics = (course.topics || []).join(', ') || 'not specified';

    const userPrompt = `${systemPrompt}\n\nTASK: Perform an exhaustive academic comparison between an external university course and its best match at ODTÜ EE.

EXTERNAL COURSE:
- University: ${universityName}
- Course Name: "${courseName}"
- Course Code: ${course.code || 'N/A'}
- Known Topics: ${courseTopics}
- Description: ${course.description || 'Not available'}

INSTRUCTIONS:
1. Determine the standard syllabus for "${courseName}" at ${universityName}. Consider the actual course content, weekly schedule, standard textbooks used, and learning outcomes in Turkey.
2. Compare against this ODTÜ EE course catalog:
${baselineList}

RETURN a JSON object with this EXACT structure:
{
  "matched_course_code": "ODTÜ course code e.g. EE201",
  "matched_course_name": "Full ODTÜ course name in English",
  "match_confidence_score": 82,
  "source_syllabus_summary": "2-3 sentence summary of the external course's assumed syllabus, mentioning specific topics and standard textbooks",
  "target_syllabus_summary": "2-3 sentence summary of the matched ODTÜ course syllabus, mentioning specific topics and standard textbooks",
  "overlapping_topics": ["specific topic 1", "specific topic 2"],
  "missing_topics": ["topics in ODTÜ course but NOT in external course"],
  "extra_topics": ["topics in external course but NOT in ODTÜ course"],
  "comprehensive_analysis": "A 5+ paragraph expert academic evaluation. Paragraph 1: Overall comparison and match quality. Paragraph 2: Detailed topic-by-topic comparison including depth differences. Paragraph 3: Teaching methodology, lab work, and practical component differences. Paragraph 4: Textbook and resource comparison. Paragraph 5: Specific actionable study recommendations for a student transferring between these courses, including which topics need self-study and suggested resources.",
  "study_recommendations": [
    {"topic": "Topic Name", "priority": "high|medium|low", "reason": "Why this needs attention"}
  ],
  "difficulty_comparison": "A paragraph comparing the relative difficulty and academic rigor of both courses, discussing depth of mathematical treatment, prerequisites expected, and workload.",
  "textbook_comparison": "Specific textbook names used by each course, and how they differ in approach."
}

RULES:
- match_confidence_score: integer 0-100
- All topic arrays: specific, granular strings (not generic like "basics")
- comprehensive_analysis: minimum 5 detailed paragraphs, expert tone
- study_recommendations: at least 2-3 items with priority levels
- If no good match exists, set confidence to 0 and matched_course_code to "N/A"
- Be specific: cite actual topic names, theorem names, chapter numbers when possible`;

    const result = await model.generateContent(userPrompt);
    let content = result.response.text();

    if (!content) throw new Error('EMPTY_RESPONSE');

    // Clean up potential markdown formatting and sanitize control characters inside strings
    content = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    content = content.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, function (match) {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    });

    const parsed = JSON.parse(content);
    if (typeof parsed.matched_course_code !== 'string' || typeof parsed.match_confidence_score !== 'number') {
        throw new Error('INVALID_FORMAT');
    }

    return {
        course: { code: parsed.matched_course_code, name: parsed.matched_course_name || 'Unknown' },
        score: Math.max(0, Math.min(100, Math.round(parsed.match_confidence_score))),
        overlapping_topics: Array.isArray(parsed.overlapping_topics) ? parsed.overlapping_topics : [],
        missing_topics: Array.isArray(parsed.missing_topics) ? parsed.missing_topics : [],
        extra_topics: Array.isArray(parsed.extra_topics) ? parsed.extra_topics : [],
        analysis: parsed.comprehensive_analysis || '',
        sourceSyllabus: parsed.source_syllabus_summary || '',
        targetSyllabus: parsed.target_syllabus_summary || '',
        studyRecs: Array.isArray(parsed.study_recommendations) ? parsed.study_recommendations : [],
        difficultyComparison: parsed.difficulty_comparison || '',
        textbookComparison: parsed.textbook_comparison || '',
        generatedAt: new Date().toISOString()
    };
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log("🚀 Starting Free Gemini AI Matches Generation...");

    let processedCount = 0;
    let hasErrors = false;

    for (const [uniId, uniData] of Object.entries(curriculaData.universities)) {
        if (uniId === 'odtu' || uniId === 'ODTU') continue;
        if (processedCount >= MAX_COURSES_PER_RUN) break;

        const uniName = uniData.name || uniId;

        for (const course of uniData.courses) {
            if (processedCount >= MAX_COURSES_PER_RUN) break;

            const courseKey = `${uniId}_${course.code || course.name}`;

            // Skip if already processed
            if (aiMatchesData.matches[courseKey]) {
                continue;
            }

            console.log(`\n======================================================`);
            console.log(`Processing [${processedCount + 1}/${MAX_COURSES_PER_RUN}]: ${uniName} - ${course.code || ''} ${course.name}`);

            try {
                const matchData = await callRAG(course, uniName);
                console.log(`✅ Success! Matched with ${matchData.course.code} (Score: ${matchData.score})`);

                // Save to database
                aiMatchesData.matches[courseKey] = matchData;
                fs.writeFileSync(MATCHES_PATH, JSON.stringify(aiMatchesData, null, 2));

                processedCount++;

                // Sleep to avoid rate limits
                if (processedCount < MAX_COURSES_PER_RUN) {
                    console.log(`😴 Sleeping for ${DELAY_BETWEEN_CALLS_MS}ms to respect free tier rate limit...`);
                    await delay(DELAY_BETWEEN_CALLS_MS);
                }

            } catch (err) {
                console.error(`❌ Error processing ${courseKey}:`, err.message);
                hasErrors = true;
                if (err.message.includes('429')) {
                    console.error("⛔ Rate limited by Gemini. Halting to prevent further blocks.");
                    process.exit(1);
                }
            }
        }
    }

    console.log(`\n🎉 Finished processing ${processedCount} courses.`);
    if (hasErrors) {
        console.log("⚠️ Some courses failed to process. They will be retried on the next run.");
    }
}

main().catch(console.error);
