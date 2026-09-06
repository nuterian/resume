import { z } from 'astro/zod';

const bullets = z.array(z.string()).min(1);

// YAML parses a bare `2007` as a number, so accept either form.
const period = z.coerce.string();

export const resumeSchema = z.object({
  name: z.string(),
  title: z.string(),
  location: z.string(),
  summary: z.string(),
  pdfFilename: z.string(),
  website: z.object({ label: z.string(), href: z.string().url() }),
  contacts: z
    .array(
      z.object({
        label: z.string(),
        href: z
          .string()
          .url()
          .or(z.string().startsWith('mailto:'))
          .or(z.string().startsWith('tel:')),
      }),
    )
    .min(1),
  experience: z
    .array(
      z.object({
        company: z.string(),
        role: z.string(),
        period: period,
        blurb: z.string().optional(),
        bullets: bullets.optional(),
        teams: z
          .array(
            z.object({
              name: z.string(),
              period: period,
              blurb: z.string().optional(),
              bullets,
            }),
          )
          .min(1)
          .optional(),
      }),
    )
    .min(1),
  skills: z
    .array(
      z.object({
        group: z.string(),
        items: z.array(z.string()).min(1),
      }),
    )
    .min(1),
  education: z
    .array(
      z.object({
        degree: z.string(),
        school: z.string(),
        detail: z.string().optional(),
        period: period,
      }),
    )
    .min(1),
  honors: z
    .array(
      z.object({
        title: z.string(),
        subtitle: z.string(),
        period: period,
        description: z.string(),
      }),
    )
    .default([]),
});

export type Resume = z.infer<typeof resumeSchema>;
