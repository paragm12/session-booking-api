import { TeacherModel } from '../models/teacher.model';
import { ApiError } from '../utils/ApiError';
import { CreateTeacherInput } from '../validators';

export const createTeacher = async (input: CreateTeacherInput) => {
  const exists = await TeacherModel.exists({ email: input.email });
  if (exists) {
    throw ApiError.conflict('A teacher with this email already exists');
  }
  return TeacherModel.create(input);
};
