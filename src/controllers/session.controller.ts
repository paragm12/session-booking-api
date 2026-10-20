import { Request, Response } from 'express';
import * as sessionService from '../services/session.service';

export const createSession = async (_req: Request, res: Response) => {
  const session = await sessionService.createSession(res.locals.body);
  res.status(201).json({ success: true, message: 'Session created', data: session });
};

export const getAvailableSessions = async (_req: Request, res: Response) => {
  const data = await sessionService.getAvailableSessions(res.locals.query.dateTimestamp);
  res.status(200).json({ success: true, data });
};

export const bookSession = async (_req: Request, res: Response) => {
  const session = await sessionService.bookSession(res.locals.params.id, res.locals.body.userId);
  res.status(200).json({ success: true, message: 'Session booked', data: session });
};

export const completeSession = async (_req: Request, res: Response) => {
  const session = await sessionService.completeSession(res.locals.params.id);
  res.status(200).json({ success: true, message: 'Session marked as completed', data: session });
};
