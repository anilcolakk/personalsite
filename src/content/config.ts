import { defineCollection, z } from 'astro:content';

/**
 * Notes Collection Schema
 * Structure: Year → Course → Topic
 * Each note has metadata for filtering, preview, and paid content handling
 */
const notesCollection = defineCollection({
    type: 'content',
    schema: z.object({
        // Basic Info
        title: z.string(),
        description: z.string(),
        preview: z.string().optional().describe('Preview text shown for locked content'),

        // Content Location
        driveLink: z.string().url().describe('Google Drive link to the resource'),

        // Hierarchical Structure
        year: z.enum(['1', '2', '3', '4']).describe('Academic year (1st through 4th)'),
        courseCode: z.string().describe('Course code e.g., EE101, EE202'),
        courseName: z.string().describe('Full course name'),
        topic: z.string().describe('Topic or chapter name'),

        // Paid Resource Settings
        isPaid: z.boolean().default(false),
        // Removed monetization fields

        // Metadata
        createdAt: z.date(),
        updatedAt: z.date().optional(),
        featured: z.boolean().default(false),
        downloadCount: z.number().default(0).optional(),

        // SEO
        keywords: z.array(z.string()).optional(),
    }),
});

/**
 * Courses Collection Schema
 * For storing course metadata and descriptions
 */
const coursesCollection = defineCollection({
    type: 'content',
    schema: z.object({
        courseCode: z.string(),
        courseName: z.string(),
        year: z.enum(['1', '2', '3', '4']),
        semester: z.enum(['fall', 'spring', 'summer']).optional(),
        credits: z.number().optional(),
        description: z.string(),
        instructor: z.string().optional(),
        prerequisites: z.array(z.string()).optional(),
    }),
});

export const collections = {
    notes: notesCollection,
    courses: coursesCollection,
};
