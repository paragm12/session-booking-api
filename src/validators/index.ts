import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

const objectId = z
  .string()
  .refine((value) => isValidObjectId(value), { message: 'Invalid ObjectId' });

export const idParamSchema = z.object({ id: objectId });

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required'),
  email: z.email('Invalid email').trim().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, 'phone must be 7-15 digits, optionally prefixed with +'),
});

export const createTeacherSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required'),
  email: z.email('Invalid email').trim().toLowerCase(),
  specialization: z.string().trim().min(1, 'specialization is required'),
  experience: z.number().int().min(0, 'experience must be >= 0'),
});

export const createSessionSchema = z
  .object({
    teacherId: objectId,
    startTime: z.coerce.date({ message: 'startTime must be a valid date' }),
    endTime: z.coerce.date({ message: 'endTime must be a valid date' }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'endTime must be greater than startTime',
    path: ['endTime'],
  });

export const availableSessionsQuerySchema = z.object({
  // Unix timestamp in milliseconds (seconds are also accepted and converted)
  dateTimestamp: z.coerce
    .number({ message: 'dateTimestamp must be a number' })
    .int()
    .positive()
    .transform((ts) => (ts < 1e12 ? ts * 1000 : ts)),
});

export const bookSessionSchema = z.object({
  userId: objectId,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
