import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTES_DIR = path.join(__dirname, '../src/content/notes');
const SUMMARIES_PATH = path.join(__dirname, '../src/data/note_summaries.json');

const API_KEY = process.env.GEMINI_API_KEY;

// Gemini Free Tier Limits (15 RPM)
const DELAY_BETWEEN_CALLS_MS = 4500;

if (!API_KEY) {
    console.error("❌ ERROR: Missing GEMINI_API_KEY environment variable. Create a free key at https://aistudio.google.com");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function getAllNotes(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllNotes(filePath, fileList);
        } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function parseFrontmatterAndContent(filePath) {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const parts = rawContent.split('---');
    if (parts.length < 3) return { frontmatter: {}, content: rawContent };

    const frontmatterStr = parts[1];
    const content = parts.slice(2).join('---').trim();

    const frontmatter = {};
    frontmatterStr.split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > -1) {
            const key = line.substring(0, colonIdx).trim();
            const val = line.substring(colonIdx + 1).replace(/['"]/g, '').trim();
            frontmatter[key] = val;
        }
    });

    // We only need the first 2000 chars of content for a good summary to save tokens
    return { frontmatter, content: content.substring(0, 2000) };
}

async function callSummaryAI(frontmatter, noteContent) {
    const systemPrompt = `You are a highly intelligent, precise, and helpful academic assistant specializing in Engineering and Sciences.
Your task is to provide an exceptionally high-quality, comprehensive but concise summary of a lecture note.

Guidelines for your summary:
1. **Core Concept Overviews**: What are the 2-3 main ideas discussed? Explain them briefly.
2. **Key Takeaways**: Identify the most important formulas, theories, or principles.
3. **Study Advice**: Give one highly specific, actionable study tip for mastering this topic (e.g., "Pay special attention to boundary conditions when applying Gauss's Law here...").
4. **Tone**: Academic, encouraging, and clear. 
5. **Length**: Maximum 4-5 sentences total. Be dense with information, not fluffy.

Output ONLY a JSON object exactly adhering to this format:
{
  "summary": "Deep, comprehensive 4-sentence summary here.",
  "key_topics": ["Topic 1", "Topic 2", "Topic 3"],
  "study_tip": "Specific, highly actionable study tip."
}`;

    const userPrompt = `Course: ${frontmatter.courseCode || 'Unknown'} - ${frontmatter.courseName || 'Unnamed Course'}
Topic: ${frontmatter.topic || 'General Lecture'}
Excerpt of Notes Content:
"""
${noteContent}
"""`;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            systemInstruction: systemPrompt,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        });

        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch (err) {
        console.error("AI API Error:", err.message);
        return null;
    }
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function main() {
    console.log("📝 Generating high-quality static note summaries via Gemini...");

    // Read existing summaries to skip re-generation
    let existingSummaries = {};
    if (fs.existsSync(SUMMARIES_PATH)) {
        existingSummaries = JSON.parse(fs.readFileSync(SUMMARIES_PATH, 'utf-8'));
        console.log(`Loaded ${Object.keys(existingSummaries).length} existing summaries.`);
    }

    const allNotePaths = getAllNotes(NOTES_DIR);
    console.log(`Found ${allNotePaths.length} notes in total.`);

    let newGeneratedCount = 0;

    for (const notePath of allNotePaths) {
        const slug = path.basename(notePath).replace(/\.mdx?$/, '');

        if (existingSummaries[slug] && existingSummaries[slug].summary) {
            console.log(`Skipping [${slug}] - Valid summary already exists.`);
            continue;
        }

        console.log(`\nGenerating summary for [${slug}]...`);
        const { frontmatter, content } = parseFrontmatterAndContent(notePath);

        if (!content || content.length < 50) {
            console.log(`Skipping [${slug}] - Content too short.`);
            continue;
        }

        const summaryData = await callSummaryAI(frontmatter, content);

        if (summaryData && summaryData.summary) {
            existingSummaries[slug] = summaryData;
            newGeneratedCount++;

            // Save incrementally
            fs.writeFileSync(SUMMARIES_PATH, JSON.stringify(existingSummaries, null, 2));
            console.log(`✅ Success for [${slug}]`);
        } else {
            console.log(`❌ Failed for [${slug}]`);
        }

        console.log(`Waiting ${DELAY_BETWEEN_CALLS_MS}ms to respect API limits...`);
        await sleep(DELAY_BETWEEN_CALLS_MS);
    }

    console.log(`\n🎉 Process Complete! Generated ${newGeneratedCount} new summaries.`);
}

main().catch(console.error);
