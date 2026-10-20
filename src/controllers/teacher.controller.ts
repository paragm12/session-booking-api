import { Request, Response } from 'express';
import * as teacherService from '../services/teacher.service';

export const createTeacher = async (_req: Request, res: Response) => {
  const teacher = await teacherService.createTeacher(res.locals.body);
  res.status(201).json({ success: true, message: 'Teacher created', data: teacher });
};
