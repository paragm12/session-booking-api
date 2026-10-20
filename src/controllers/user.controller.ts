import { Request, Response } from 'express';
import * as userService from '../services/user.service';

export const createUser = async (_req: Request, res: Response) => {
  const user = await userService.createUser(res.locals.body);
  res.status(201).json({ success: true, message: 'User created', data: user });
};

export const getUserSessions = async (_req: Request, res: Response) => {
  const data = await userService.getUserSessions(res.locals.params.id);
  res.status(200).json({ success: true, data });
};
