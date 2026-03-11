import { z } from "zod";

export const seasonSchema = z.object({
  name: z.string().min(2),
  win_points: z.coerce.number().int(),
  draw_points: z.coerce.number().int(),
  loss_points: z.coerce.number().int(),
  no_show_points: z.coerce.number().int()
});

export const matchdaySchema = z.object({
  title: z.string().min(2),
  scheduled_for: z.string().min(1),
  notes: z.string().optional()
});

export const resultSchema = z.object({
  home_score: z.coerce.number().int().min(0).max(99),
  away_score: z.coerce.number().int().min(0).max(99)
});

export type SeasonFormValues = z.output<typeof seasonSchema>;
export type SeasonFormInput = z.input<typeof seasonSchema>;
export type MatchdayFormValues = z.output<typeof matchdaySchema>;
export type MatchdayFormInput = z.input<typeof matchdaySchema>;
export type ResultFormValues = z.output<typeof resultSchema>;
export type ResultFormInput = z.input<typeof resultSchema>;
