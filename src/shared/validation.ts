import { z } from 'zod';
import { ARTICLE_LIMITS } from './articles.ts';
import { isSafeImageUrl } from './urls.ts';
import { parseCircuitDSL } from '../lib/automation/dsl.ts';
import { BLOCK_CATALOG } from '../lib/automation/catalog.ts';

/**
 * Input validation for every API payload. Shared so forms can show the same errors
 * the server would return.
 */

const trimmed = (max: number) => z.string().trim().max(max);

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(32, 'Username must be at most 32 characters.')
  .regex(/^[A-Za-z0-9_.-]+$/, 'Username may only use letters, numbers, dots, dashes and underscores.');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(200, 'Password must be at most 200 characters.');

export const signUpSchema = z.object({
  name: usernameSchema,
  email: z.email('Enter a valid email address.').max(180),
  password: passwordSchema,
  role: trimmed(80).optional(),
});

export const signInSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your username or email.').max(200),
  password: z.string().min(1, 'Enter your password.').max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.').max(200),
  newPassword: passwordSchema,
});

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(ARTICLE_LIMITS.slug)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only use lowercase letters, numbers and single dashes.');

const labSectionSchema = z
  .object({
    type: z.literal('lab'),
    title: trimmed(ARTICLE_LIMITS.title).min(1),
    step: trimmed(64).optional(),
    height: z.number().int().min(240).max(1200).optional(),
    dsl: z.string().max(ARTICLE_LIMITS.dsl),
  })
  .superRefine((section, ctx) => {
    try {
      parseCircuitDSL(section.dsl, BLOCK_CATALOG);
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        message: `Lab "${section.title}" has an invalid circuit: ${error instanceof Error ? error.message : 'parse error'}`,
        path: ['dsl'],
      });
    }
  });

export const articleSectionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('markdown'), content: z.string().max(ARTICLE_LIMITS.markdown) }),
  z.object({
    type: z.literal('image'),
    src: z.string().max(ARTICLE_LIMITS.imageSrc).refine(isSafeImageUrl, 'Images must use an https URL or a site path.'),
    caption: trimmed(300).optional(),
    alt: trimmed(300).optional(),
  }),
  labSectionSchema,
  z.object({
    type: z.literal('callout'),
    variant: z.enum(['info', 'warning', 'success', 'error']).optional(),
    title: trimmed(200).optional(),
    text: z.string().max(ARTICLE_LIMITS.calloutText),
  }),
]);

export const articleInputSchema = z.object({
  slug: slugSchema,
  title: trimmed(ARTICLE_LIMITS.title).min(3, 'Title must be at least 3 characters.'),
  excerpt: trimmed(ARTICLE_LIMITS.excerpt).default(''),
  author: trimmed(ARTICLE_LIMITS.author).optional(),
  date: trimmed(ARTICLE_LIMITS.date).optional(),
  readingTime: trimmed(ARTICLE_LIMITS.readingTime).optional(),
  tag: trimmed(ARTICLE_LIMITS.tag).optional(),
  heroImage: z.string().max(ARTICLE_LIMITS.imageSrc).refine(isSafeImageUrl, 'Hero image must use an https URL or a site path.').optional(),
  sections: z.array(articleSectionSchema).min(1, 'An article needs at least one section.').max(ARTICLE_LIMITS.sections),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;

/** First readable validation message, for showing a single error to the user. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Invalid input.';
  const path = issue.path.length ? `${issue.path.join('.')}: ` : '';
  return `${path}${issue.message}`;
}
