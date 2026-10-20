import { SessionModel, SessionStatus } from '../models/session.model';
import { TeacherModel } from '../models/teacher.model';
import { UserModel } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { CreateSessionInput } from '../validators';

const DAY_MS = 24 * 60 * 60 * 1000;

export const createSession = async ({ teacherId, startTime, endTime }: CreateSessionInput) => {
  const teacherExists = await TeacherModel.exists({ _id: teacherId });
  if (!teacherExists) {
    throw ApiError.notFound('Teacher not found');
  }

  // A teacher cannot hold two sessions that overlap in time.
  const overlapping = await SessionModel.exists({
    teacherId,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });
  if (overlapping) {
    throw ApiError.conflict('Teacher already has a session that overlaps this time slot');
  }

  return SessionModel.create({ teacherId, startTime, endTime });
};

/**
 * Returns AVAILABLE sessions starting on the (UTC) calendar day that
 * contains `timestamp`, with teacher details, using the aggregation pipeline.
 */
export const getAvailableSessions = async (timestamp: number) => {
  const dayStart = new Date(Math.floor(timestamp / DAY_MS) * DAY_MS);
  const dayEnd = new Date(dayStart.getTime() + DAY_MS);

  const sessions = await SessionModel.aggregate([
    {
      $match: {
        status: SessionStatus.AVAILABLE,
        startTime: { $gte: dayStart, $lt: dayEnd },
      },
    },
    { $sort: { startTime: 1 } },
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
        _id: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        durationMinutes: {
          $dateDiff: { startDate: '$startTime', endDate: '$endTime', unit: 'minute' },
        },
        teacher: 1,
      },
    },
  ]);

  return { date: dayStart.toISOString().slice(0, 10), count: sessions.length, sessions };
};

export const bookSession = async (sessionId: string, userId: string) => {
  const userExists = await UserModel.exists({ _id: userId });
  if (!userExists) {
    throw ApiError.notFound('User not found');
  }

  // Atomic conditional update: only succeeds if the session is still AVAILABLE,
  // so two concurrent requests can never both book the same session.
  const booked = await SessionModel.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.AVAILABLE },
    { $set: { status: SessionStatus.BOOKED, userId } },
    { new: true },
  );
  if (booked) {
    return booked;
  }

  const session = await SessionModel.findById(sessionId).select('status').lean();
  if (!session) {
    throw ApiError.notFound('Session not found');
  }
  throw ApiError.conflict(
    session.status === SessionStatus.BOOKED
      ? 'Session is already booked'
      : `Only AVAILABLE sessions can be booked (current status: ${session.status})`,
  );
};

export const completeSession = async (sessionId: string) => {
  const completed = await SessionModel.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.BOOKED },
    { $set: { status: SessionStatus.COMPLETED, completedAt: new Date() } },
    { new: true },
  );
  if (completed) {
    return completed;
  }

  const session = await SessionModel.findById(sessionId).select('status').lean();
  if (!session) {
    throw ApiError.notFound('Session not found');
  }
  throw ApiError.conflict(
    `Only BOOKED sessions can be marked as completed (current status: ${session.status})`,
  );
};
