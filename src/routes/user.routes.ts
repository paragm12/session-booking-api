import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { validate } from '../middlewares/validate';
import { createUserSchema, idParamSchema } from '../validators';

const router = Router();

router.post('/', validate({ body: createUserSchema }), userController.createUser);
router.get('/:id/sessions', validate({ params: idParamSchema }), userController.getUserSessions);

export default router;
