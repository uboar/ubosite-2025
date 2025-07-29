import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }).optional(),
  })
});

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['completed', 'in-progress', 'archived']).default('completed'),
    projectUrl: z.string().url().optional(),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }).optional(),
  })
});

const links = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/links' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    url: z.string().url(),
    category: z.string().default('other'),
    priority: z.number().default(0),
    isActive: z.boolean().default(true),
    icon: z.string().optional(),
    iconImage: z.string().optional(),
    iconSize: z.number().default(24),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
  })
});

export const collections = { blog, works, links };