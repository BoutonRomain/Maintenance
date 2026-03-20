import { ScheduleSlot } from "../models/scheduleSlot.model";
import { Course } from "../models/course.model";
import { User } from "../models/user.model";
import { Enrollment } from "../models/enrollment.model";
import { CustomError } from "../middlewares/errorHandler";
import { Op } from "sequelize";

export interface TimeSlot {
  dayOfWeek: string;
  startTime: Date;
  endTime: Date;
}

export interface ScheduleConflict {
  type: 'teacher' | 'student';
  conflictingCourse: {
    id: number;
    name: string;
  };
  timeSlot: TimeSlot;
}

export class ScheduleService {


  public async checkUserScheduleConflicts(userId: number, newTimeSlot: TimeSlot, excludeCourseId?: number): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    const user = await User.findByPk(userId);
    if (!user) {
      const error: CustomError = new Error('User not found');
      error.status = 404;
      throw error;
    }

    if (user.role === 'teacher') {
      const teacherConflicts = await this.checkTeacherConflicts(userId, newTimeSlot, excludeCourseId);
      conflicts.push(...teacherConflicts);
    } else if (user.role === 'student') {
      const studentConflicts = await this.checkStudentConflicts(userId, newTimeSlot, excludeCourseId);
      conflicts.push(...studentConflicts);
    }

    return conflicts;
  }

  private async checkTeacherConflicts(teacherId: number, newTimeSlot: TimeSlot, excludeCourseId?: number): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    const teacherCourses = await Course.findAll({
      where: {
        teacherId,
        ...(excludeCourseId && { id: { [Op.ne]: excludeCourseId } })
      },
      include: [{
        model: ScheduleSlot,
        as: 'scheduleSlots'
      }]
    });

    for (const course of teacherCourses) {
      if (course.scheduleSlots) {
        for (const slot of course.scheduleSlots) {
          if (this.isTimeConflict(newTimeSlot, {
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime
          })) {
            conflicts.push({
              type: 'teacher',
              conflictingCourse: {
                id: course.id!,
                name: course.name
              },
              timeSlot: {
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime
              }
            });
          }
        }
      }
    }

    return conflicts;
  }


  private async checkStudentConflicts(studentId: number, newTimeSlot: TimeSlot, excludeCourseId?: number): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    const enrollments = await Enrollment.findAll({
      where: { studentId },
      include: [{
        model: Course,
        as: 'course',
        where: excludeCourseId ? { id: { [Op.ne]: excludeCourseId } } : {},
        include: [{
          model: ScheduleSlot,
          as: 'scheduleSlots'
        }]
      }]
    });

    for (const enrollment of enrollments) {
      if (enrollment.course && enrollment.course.scheduleSlots) {
        for (const slot of enrollment.course.scheduleSlots) {
          if (this.isTimeConflict(newTimeSlot, {
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime
          })) {
            conflicts.push({
              type: 'student',
              conflictingCourse: {
                id: enrollment.course.id!,
                name: enrollment.course.name
              },
              timeSlot: {
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime
              }
            });
          }
        }
      }
    }

    return conflicts;
  }


  private isTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.dayOfWeek !== slot2.dayOfWeek) {
      return false;
    }

    const s1 = new Date(slot1.startTime);
    const e1 = new Date(slot1.endTime);
    const s2 = new Date(slot2.startTime);
    const e2 = new Date(slot2.endTime);

    const start1 = new Date(0, 0, 0, s1.getHours(), s1.getMinutes(), s1.getSeconds()).getTime();
    const end1 = new Date(0, 0, 0, e1.getHours(), e1.getMinutes(), e1.getSeconds()).getTime();
    const start2 = new Date(0, 0, 0, s2.getHours(), s2.getMinutes(), s2.getSeconds()).getTime();
    const end2 = new Date(0, 0, 0, e2.getHours(), e2.getMinutes(), e2.getSeconds()).getTime();

    return start1 < end2 && start2 < end1;
  }


  public async createScheduleSlot(courseId: number, timeSlot: TimeSlot): Promise<ScheduleSlot> {
    const course = await Course.findByPk(courseId, {
      include: [{
        model: User,
        as: 'teacher'
      }]
    });

    if (!course) {
      const error: CustomError = new Error('Cours non trouvé');
      error.status = 404;
      throw error;
    }

    if (course.teacherId) {
      const teacherConflicts = await this.checkUserScheduleConflicts(course.teacherId, timeSlot, courseId);
      if (teacherConflicts.length > 0) {
        const error: CustomError = new Error(`L'enseignant a des conflits d'horaire avec : ${teacherConflicts.map(c => c.conflictingCourse.name).join(', ')}`);
        error.status = 409;
        throw error;
      }
    }

    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [{
        model: User,
        as: 'student'
      }]
    });

    const studentConflicts: ScheduleConflict[] = [];
    for (const enrollment of enrollments) {
      const conflicts = await this.checkUserScheduleConflicts(enrollment.studentId, timeSlot, courseId);
      studentConflicts.push(...conflicts);
    }

    if (studentConflicts.length > 0) {
      const conflictingStudents = studentConflicts.map(c => c.conflictingCourse.name);
      const error: CustomError = new Error(`Certains étudiants ont des conflits d'horaire avec : ${conflictingStudents.join(', ')}`);
      error.status = 409;
      throw error;
    }

    return ScheduleSlot.create({
      courseId,
      dayOfWeek: timeSlot.dayOfWeek,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      createdAt: new Date(),
      modifiedAt: new Date()
    });
  }


  public async canStudentEnrollInCourse(studentId: number, courseId: number): Promise<{ canEnroll: boolean; conflicts: ScheduleConflict[] }> {
    const courseSlots = await ScheduleSlot.findAll({
      where: { courseId }
    });

    const allConflicts: ScheduleConflict[] = [];

    for (const slot of courseSlots) {
      const conflicts = await this.checkUserScheduleConflicts(studentId, {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime
      }, courseId);
      allConflicts.push(...conflicts);
    }

    return {
      canEnroll: allConflicts.length === 0,
      conflicts: allConflicts
    };
  }


  public async getUserSchedule(userId: number): Promise<any> {
    const user = await User.findByPk(userId);
    if (!user) {
      const error: CustomError = new Error('Utilisateur non trouvé');
      error.status = 404;
      throw error;
    }

    if (user.role === 'teacher') {
      return this.getTeacherSchedule(userId);
    } else {
      return this.getStudentSchedule(userId);
    }
  }

  private async getTeacherSchedule(teacherId: number) {
    const courses = await Course.findAll({
      where: { teacherId },
      include: [{
        model: ScheduleSlot,
        as: 'scheduleSlots'
      }]
    });

    return {
      type: 'teacher',
      courses: courses.map(course => ({
        id: course.id,
        name: course.name,
        description: course.description,
        totalHours: course.totalHours,
        scheduleSlots: course.scheduleSlots
      }))
    };
  }

  private async getStudentSchedule(studentId: number) {
    const enrollments = await Enrollment.findAll({
      where: { studentId },
      include: [{
        model: Course,
        as: 'course',
        include: [{
          model: ScheduleSlot,
          as: 'scheduleSlots'
        }, {
          model: User,
          as: 'teacher'
        }]
      }]
    });

    return {
      type: 'student',
      enrollments: enrollments.map(enrollment => ({
        id: enrollment.id,
        enrollmentAt: enrollment.enrollmentAt,
        course: {
          id: enrollment.course?.id,
          name: enrollment.course?.name,
          description: enrollment.course?.description,
          totalHours: enrollment.course?.totalHours,
          teacher: {
            id: enrollment.course?.teacher?.id,
            firstName: enrollment.course?.teacher?.firstName,
            lastName: enrollment.course?.teacher?.lastName
          },
          scheduleSlots: enrollment.course?.scheduleSlots
        }
      }))
    };
  }

  public async getCourseSlots(courseId: number): Promise<ScheduleSlot[]> {
    const course = await Course.findByPk(courseId, {
      include: [{
        model: ScheduleSlot,
        as: 'scheduleSlots'
      }]
    });

    if (!course) {
      const error: CustomError = new Error('Cours non trouvé');
      error.status = 404;
      throw error;
    }

    return course.scheduleSlots || [];
  }

  public async deleteScheduleSlot(slotId: number, teacherId: number): Promise<void> {
    const slot = await ScheduleSlot.findByPk(slotId, {
      include: [{
        model: Course,
        as: 'course'
      }]
    });

    if (!slot) {
      const error: CustomError = new Error('Créneau horaire non trouvé');
      error.status = 404;
      throw error;
    }

    if (!slot.course || slot.course.teacherId !== teacherId) {
      const error: CustomError = new Error('Permission refusée. Vous ne pouvez supprimer que les créneaux de vos propres cours.');
      error.status = 403;
      throw error;
    }

    await slot.destroy();
  }
}

export const scheduleSlotService = new ScheduleService();