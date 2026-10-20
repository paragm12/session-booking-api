import { Router } from 'express';
import * as sessionController from '../controllers/session.controller';
import { validate } from '../middlewares/validate';
import {
  availableSessionsQuerySchema,
  bookSessionSchema,
  createSessionSchema,
  idParamSchema,
} from '../validators';

const router = Router();

router.post('/', validate({ body: createSessionSchema }), sessionController.createSession);
router.get(
  '/available',
  validate({ query: availableSessionsQuerySchema }),
  sessionController.getAvailableSessions,
);
router.post(
  '/:id/book',
  validate({ params: idParamSchema, body: bookSessionSchema }),
  sessionController.bookSession,
);
router.patch(
  '/:id/complete',
  validate({ params: idParamSchema }),
  sessionController.completeSession,
);

export default router;
