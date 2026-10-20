import { Schema, model, InferSchemaType } from 'mongoose';

const teacherSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    experience: { type: Number, required: true, min: 0 }, // in years
  },
  { timestamps: true, versionKey: false },
);

export type Teacher = InferSchemaType<typeof teacherSchema>;
export const TeacherModel = model('Teacher', teacherSchema);
