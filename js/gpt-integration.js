/**
 * GPT Integration for Enhanced Course Matching
 * Uses OpenAI API for nuanced equivalency matching and explanations
 */

class GPTMatcher {
    constructor(apiKey = null) {
        this.apiKey = apiKey;
        this.endpoint = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-3.5-turbo';
    }

    /**
     * Set or update the API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Check if API key is configured
     */
    isConfigured() {
        return !!this.apiKey;
    }

    /**
     * Build the prompt for course matching
     */
    buildPrompt(sourceCourse, keywordMatches) {
        const matchesInfo = keywordMatches.slice(0, 5).map(m =>
            `- ${m.code} "${m.name}" (${m.similarityPercent}% keyword match, topics: ${m.topics.slice(0, 5).join(', ')})`
        ).join('\n');

        return `You are an expert in electrical and electronics engineering curriculum analysis. 
A student from ${sourceCourse.university} is looking for equivalent courses at ODTU (Middle East Technical University).

SOURCE COURSE:
- Code: ${sourceCourse.code}
- Name: ${sourceCourse.name}${sourceCourse.nameTR ? ` (${sourceCourse.nameTR})` : ''}
- Topics: ${(sourceCourse.topics || []).join(', ')}

POTENTIAL ODTU MATCHES (by keyword analysis):
${matchesInfo}

Please analyze and provide:
1. The BEST matching ODTU course (give the course code)
2. A brief explanation of why these courses are equivalent (2-3 sentences)
3. Any important differences the student should be aware of
4. Confidence level (High/Medium/Low)

Respond in JSON format:
{
  "bestMatch": "course_code",
  "explanation": "...",
  "differences": "...",
  "confidence": "High|Medium|Low",
  "recommendedSections": ["..."]
}`;
    }

    /**
     * Call OpenAI API for enhanced matching
     */
    async getEnhancedMatch(sourceCourse, keywordMatches) {
        if (!this.isConfigured()) {
            return {
                error: 'API key not configured',
                fallback: true
            };
        }

        const prompt = this.buildPrompt(sourceCourse, keywordMatches);

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant specializing in academic course equivalency analysis for electrical engineering programs in Turkey.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Parse JSON response
            try {
                const parsed = JSON.parse(content);
                return {
                    success: true,
                    ...parsed
                };
            } catch (parseError) {
                // If JSON parsing fails, return the raw content
                return {
                    success: true,
                    explanation: content,
                    bestMatch: keywordMatches[0]?.code,
                    confidence: 'Medium'
                };
            }
        } catch (error) {
            console.error('GPT API Error:', error);
            return {
                error: error.message,
                fallback: true
            };
        }
    }

    /**
     * Generate a detailed course comparison
     */
    async generateComparison(course1, course2) {
        if (!this.isConfigured()) {
            return this.generateFallbackComparison(course1, course2);
        }

        const prompt = `Compare these two electrical engineering courses:

Course 1: ${course1.code} - ${course1.name}
Topics: ${(course1.topics || []).join(', ')}

Course 2: ${course2.code} - ${course2.name}
Topics: ${(course2.topics || []).join(', ')}

Provide a brief comparison highlighting:
1. Similar content areas
2. Key differences
3. Overall equivalency percentage (0-100)

Respond concisely in 2-3 sentences.`;

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 200
                })
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            return {
                success: true,
                comparison: data.choices[0].message.content
            };
        } catch (error) {
            return this.generateFallbackComparison(course1, course2);
        }
    }

    /**
     * Generate fallback comparison without API
     */
    generateFallbackComparison(course1, course2) {
        const topics1 = new Set(course1.topics || []);
        const topics2 = new Set(course2.topics || []);
        const common = [...topics1].filter(t => topics2.has(t));
        const onlyIn1 = [...topics1].filter(t => !topics2.has(t));
        const onlyIn2 = [...topics2].filter(t => !topics1.has(t));

        let comparison = '';
        if (common.length > 0) {
            comparison += `Both courses cover: ${common.slice(0, 4).join(', ')}. `;
        }
        if (onlyIn1.length > 0 || onlyIn2.length > 0) {
            comparison += `Differences exist in topic coverage. `;
        }

        const similarity = topics2.size > 0
            ? Math.round((common.length / topics2.size) * 100)
            : 0;
        comparison += `Estimated equivalency: ${similarity}%.`;

        return {
            success: true,
            comparison: comparison,
            fallback: true
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GPTMatcher;
}
