import { Schema, model, InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: true, versionKey: false },
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model('User', userSchema);
