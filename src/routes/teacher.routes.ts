import { Router } from 'express';
import * as teacherController from '../controllers/teacher.controller';
import { validate } from '../middlewares/validate';
import { createTeacherSchema } from '../validators';

const router = Router();

router.post('/', validate({ body: createTeacherSchema }), teacherController.createTeacher);

export default router;
