import { Controller, Get, Post, Delete, Route, Path, Body, Tags, Security, Request } from "tsoa";
import { scheduleSlotService, TimeSlot, ScheduleConflict } from "../services/scheduleSlot.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { createHttpError } from "../middlewares/errorHandler";
import { ScheduleSlotDTO, CreateScheduleSlotDTO, ScheduleConflictCheckDTO } from "../dto/scheduleSlot.dto";
import { ScheduleSlotMapper } from "../mapper/scheduleSlot.mapper";

@Route("schedule-slots")
@Tags("ScheduleSlots")
export class ScheduleSlotController extends Controller {

  @Get("my-schedule")
  @Security("jwt", ["scheduleSlot:read"])
  public async getMySchedule(@Request() request: AuthenticatedRequest): Promise<any> {
    if (!request.user) {
      createHttpError(401, 'Authentication required');
    }

    return scheduleSlotService.getUserSchedule(request.user.userId);
  }

  @Get("user/{userId}")
  @Security("jwt", ["scheduleSlot:read"])
  public async getUserSchedule(
    @Path() userId: number,
    @Request() request: AuthenticatedRequest
  ): Promise<any> {
    if (!request.user) {
      createHttpError(401, 'Authentication required');
    }

    const canAccess = await this.canAccessUserSchedule(request.user.userId, request.user.role, userId);
    if (!canAccess) {
      createHttpError(403, 'Access denied to this schedule');
    }

    return scheduleSlotService.getUserSchedule(userId);
  }

  @Post("slots")
  @Security("jwt", ["scheduleSlot:create"])
  public async createScheduleSlot(
    @Body() requestBody: CreateScheduleSlotDTO,
    @Request() request: AuthenticatedRequest
  ): Promise<ScheduleSlotDTO> {
    if (!request.user) {
      createHttpError(401, 'Authentication required');
    }

    if (request.user.role !== 'teacher') {
      createHttpError(403, 'Only teachers can create schedule slots');
    }

    const { courseId, dayOfWeek, startTime, endTime } = requestBody;

    const courseService = await import('../services/course.service');
    const course = await courseService.courseService.getCourseById(courseId);

    if (!course || course.teacherId !== request.user.userId) {
      createHttpError(403, 'You can only create schedule slots for your own courses');
    }

    const timeSlot: TimeSlot = {
      dayOfWeek,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    };

    const scheduleSlot = await scheduleSlotService.createScheduleSlot(courseId, timeSlot);

    return ScheduleSlotMapper.toDto(scheduleSlot);
  }

  @Post("check-conflicts")
  @Security("jwt", ["scheduleSlot:read"])
  public async checkScheduleConflicts(
    @Body() requestBody: ScheduleConflictCheckDTO,
    @Request() request: AuthenticatedRequest
  ): Promise<{ canEnroll: boolean; conflicts: ScheduleConflict[] }> {
    if (!request.user) {
      createHttpError(401, 'Authentication required');
    }

    const { userId, courseId } = requestBody;

    if (request.user.userId !== userId && request.user.role !== 'teacher') {
      createHttpError(403, 'Permission denied');
    }

    return scheduleSlotService.canStudentEnrollInCourse(userId, courseId);
  }

  @Get("available-courses")
  @Security("jwt", ["course:read", "scheduleSlot:read"])
  public async getAvailableCourses(@Request() request: AuthenticatedRequest): Promise<any> {
    if (!request.user) {
      createHttpError(401, 'Authentication required');
    }

    if (request.user.role !== 'student') {
      createHttpError(403, 'Only students can view available courses');
    }


    const courseService = await import('../services/course.service');
    const allCourses = await courseService.courseService.getAllCourses();

    const coursesWithConflictInfo = await Promise.all(
      allCourses.map(async (course) => {
        const { canEnroll, conflicts } = await scheduleSlotService.canStudentEnrollInCourse(request.user!.userId, course.id);
        return {
          ...course,
          canEnroll,
          conflicts: conflicts.map(c => c.conflictingCourse.name)
        };
      })
    );

    return coursesWithConflictInfo;
  }

  @Get("course/{courseId}")
  @Security("jwt", ["scheduleSlot:read"])
  public async getCourseScheduleSlots(
    @Path() courseId: number,
    @Request() request: AuthenticatedRequest
  ): Promise<ScheduleSlotDTO[]> {
    if (!request.user) {
      createHttpError(401, 'Authentication required');
    }
    const slots = await scheduleSlotService.getCourseSlots(courseId);
    return slots.map(slot => ScheduleSlotMapper.toDto(slot));
  }

  @Delete("{id}")
  @Security("jwt", ["scheduleSlot:delete"])
  public async deleteScheduleSlot(
    @Path() id: number,
    @Request() request: AuthenticatedRequest
  ): Promise<void> {
    if (!request.user) {
      createHttpError(401, 'Authentication required');
    }

    if (request.user.role !== 'teacher') {
      createHttpError(403, 'Only teachers can delete schedule slots');
    }

    await scheduleSlotService.deleteScheduleSlot(id, request.user.userId);
  }


  private async canAccessUserSchedule(currentUserId: number, currentUserRole: string, targetUserId: number): Promise<boolean> {
    if (currentUserId === targetUserId) {
      return true;
    }

    const { userService } = await import('../services/user.service');
    const { Enrollment } = await import('../models/enrollment.model');

    const targetUser = await userService.getUserById(targetUserId);
    if (!targetUser) {
      return false;
    }

    if (targetUser.isPrivate === 1) {
      if (currentUserRole === 'teacher') {
        if (targetUser.role === 'student') {
          console.log(`Checking access for Teacher ${currentUserId} to Student ${targetUserId}`);

          try {
            // Using dynamic import to ensure model is loaded
            const { Course } = await import('../models/course.model');

            const commonEnrollments = await Enrollment.findOne({
              where: { studentId: targetUserId },
              include: [{
                model: Course,
                as: 'course',
                where: { teacherId: currentUserId }
              }]
            });
            console.log('Common enrollment found:', commonEnrollments ? 'YES' : 'NO');
            return !!commonEnrollments;
          } catch (e) {
            console.error('Error checking common enrollments:', e);
            return false;
          }
        }
      }
      return false;
    }
    return true;
  }
}