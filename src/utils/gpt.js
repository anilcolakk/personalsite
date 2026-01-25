/**
 * GPT Integration for Enhanced Course Matching
 * Uses OpenAI API for nuanced equivalency matching and explanations
 */

export class GPTMatcher {
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
        const matchesInfo = keywordMatches.slice(0, 3).map(m =>
            `- ${m.code} "${m.name}" (${m.similarityPercent}% keyword match, topics: ${m.topics.slice(0, 5).join(', ')})`
        ).join('\n');

        return `You are a friendly academic advisor for electrical engineering students in Turkey. 
A student from ${sourceCourse.university} is asking about the course "${sourceCourse.code} - ${sourceCourse.name}" (Topics: ${(sourceCourse.topics || []).join(', ')}).

Here are the closest matches found in the METU (ODTÜ) curriculum based on keywords:
${matchesInfo}

Please provide a helpful response that:
1. Identifies the best matching METU course.
2. Explains *why* they are similar (or different) in a conversational, easy-to-understand way.
3. Suggests which specific topics the student should focus on reviewing.
4. If the match isn't perfect, suggest what extra material they might need to study.

Keep the tone encouraging and helpful. Respond in valid JSON format:
{
  "bestMatch": "course_code",
  "explanation": "Your conversational explanation here...",
  "studySuggestions": "Specific advice on what to study...",
  "confidence": "High|Medium|Low"
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
                            content: 'You are a helpful, encouraging academic advisor assistant.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 600
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
}
