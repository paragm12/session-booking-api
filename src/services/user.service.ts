import { Types } from 'mongoose';
import { UserModel } from '../models/user.model';
import { SessionModel, SessionStatus } from '../models/session.model';
import { ApiError } from '../utils/ApiError';
import { CreateUserInput } from '../validators';

export const createUser = async (input: CreateUserInput) => {
  const exists = await UserModel.exists({ email: input.email });
  if (exists) {
    throw ApiError.conflict('A user with this email already exists');
  }
  // The unique index is still the source of truth for concurrent requests;
  // a duplicate-key error (11000) is mapped to 409 by the error handler.
  return UserModel.create(input);
};

/**
 * Returns the user's sessions split into upcoming (BOOKED) and completed
 * (COMPLETED) using a single aggregation with $facet.
 */
export const getUserSessions = async (userId: string) => {
  const userExists = await UserModel.exists({ _id: userId });
  if (!userExists) {
    throw ApiError.notFound('User not found');
  }

  const teacherLookup = [
    {
      $lookup: {
        from: 'teachers',
        localField: 'teacherId',
        foreignField: '_id',
        as: 'teacher',
        pipeline: [{ $project: { fullName: 1, email: 1, specialization: 1, experience: 1 } }],
      },
    },
    { $unwind: '$teacher' },
    {
      $project: {
        teacherId: 0,
        userId: 0,
      },
    },
  ];

  const [result] = await SessionModel.aggregate<{
    upcomingSessions: unknown[];
    completedSessions: unknown[];
  }>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: { $in: [SessionStatus.BOOKED, SessionStatus.COMPLETED] },
      },
    },
    {
      $facet: {
        upcomingSessions: [
          { $match: { status: SessionStatus.BOOKED } },
          { $sort: { startTime: 1 } },
          ...teacherLookup,
        ],
        completedSessions: [
          { $match: { status: SessionStatus.COMPLETED } },
          { $sort: { completedAt: -1 } },
          ...teacherLookup,
        ],
      },
    },
  ]);

  return {
    upcomingSessions: result.upcomingSessions,
    completedSessions: result.completedSessions,
    counts: {
      upcoming: result.upcomingSessions.length,
      completed: result.completedSessions.length,
    },
  };
};
