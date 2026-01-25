/**
 * Course Matching Engine
 * Uses keyword-based similarity and Jaccard index for course equivalency matching
 */

export class CourseMatcher {
    constructor(curricula) {
        this.curricula = curricula;
        this.odtuCourses = curricula.universities.ODTU.courses;
    }

    /**
     * Normalize text for comparison
     */
    normalize(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    /**
     * Calculate Jaccard similarity between two sets
     */
    jaccardSimilarity(set1, set2) {
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return union.size > 0 ? intersection.size / union.size : 0;
    }

    /**
     * Extract keywords from a course
     */
    extractKeywords(course) {
        const keywords = new Set();

        // Add normalized course name words
        this.normalize(course.name).forEach(w => keywords.add(w));
        if (course.nameTR) {
            this.normalize(course.nameTR).forEach(w => keywords.add(w));
        }

        // Add topics (these are already keywords)
        if (course.topics) {
            course.topics.forEach(topic => {
                this.normalize(topic).forEach(w => keywords.add(w));
            });
        }

        // Add description words
        if (course.description) {
            this.normalize(course.description).forEach(w => keywords.add(w));
        }

        return keywords;
    }

    /**
     * Calculate weighted similarity between two courses
     */
    calculateSimilarity(sourceCourse, targetCourse) {
        // Name similarity (40% weight)
        const sourceNameWords = new Set(this.normalize(sourceCourse.name));
        const targetNameWords = new Set(this.normalize(targetCourse.name));
        const nameSimilarity = this.jaccardSimilarity(sourceNameWords, targetNameWords);

        // Topic similarity (60% weight)
        const sourceTopics = new Set(sourceCourse.topics || []);
        const targetTopics = new Set(targetCourse.topics || []);
        const topicSimilarity = this.jaccardSimilarity(sourceTopics, targetTopics);

        // Weighted combination
        const weightedScore = (nameSimilarity * 0.4) + (topicSimilarity * 0.6);

        // Bonus for exact topic matches
        const exactMatches = [...sourceTopics].filter(t => targetTopics.has(t)).length;
        const exactMatchBonus = Math.min(exactMatches * 0.05, 0.2);

        return Math.min(weightedScore + exactMatchBonus, 1.0);
    }

    /**
     * Find matching ODTU courses for a given source course
     */
    findMatches(universityId, courseCode, topN = 3) {
        const university = this.curricula.universities[universityId];
        if (!university) {
            return { error: `University "${universityId}" not found` };
        }

        const sourceCourse = university.courses.find(c => c.code === courseCode);
        if (!sourceCourse) {
            return { error: `Course "${courseCode}" not found in ${university.name}` };
        }

        // Calculate similarity with all ODTU courses
        const matches = this.odtuCourses.map(odtuCourse => {
            const similarity = this.calculateSimilarity(sourceCourse, odtuCourse);
            return {
                code: odtuCourse.code,
                name: odtuCourse.name,
                nameTR: odtuCourse.nameTR,
                similarity: similarity,
                similarityPercent: Math.round(similarity * 100),
                topics: odtuCourse.topics,
                year: odtuCourse.year,
                notes_available: odtuCourse.notes_available,
                notes_sections: odtuCourse.notes_sections,
                matchingTopics: this.getMatchingTopics(sourceCourse, odtuCourse)
            };
        });

        // Sort by similarity and return top N
        matches.sort((a, b) => b.similarity - a.similarity);

        return {
            sourceCourse: {
                code: sourceCourse.code,
                name: sourceCourse.name,
                nameTR: sourceCourse.nameTR,
                topics: sourceCourse.topics,
                university: university.name
            },
            matches: matches.slice(0, topN),
            allMatches: matches.filter(m => m.similarityPercent >= 20)
        };
    }

    /**
     * Get common topics between two courses
     */
    getMatchingTopics(sourceCourse, targetCourse) {
        const sourceTopics = new Set(sourceCourse.topics || []);
        const targetTopics = new Set(targetCourse.topics || []);
        return [...sourceTopics].filter(t => targetTopics.has(t));
    }

    /**
     * Get all universities (excluding ODTU as it's the reference)
     */
    getSourceUniversities() {
        return Object.entries(this.curricula.universities)
            .filter(([id]) => id !== 'ODTU')
            .map(([id, uni]) => ({
                id: id,
                name: uni.name,
                shortName: uni.shortName
            }));
    }

    /**
     * Get courses for a specific university
     */
    getCourses(universityId) {
        const university = this.curricula.universities[universityId];
        if (!university) return [];

        return university.courses.map(c => ({
            code: c.code,
            name: c.name,
            nameTR: c.nameTR,
            year: c.year
        }));
    }
}
