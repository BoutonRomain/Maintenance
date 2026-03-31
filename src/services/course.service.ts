import { CourseOutputDTO } from "../dto/course.dto";
import { CourseMapper } from "../mapper/course.mapper";
import { Course } from "../models/course.model";
import { User } from "../models/user.model";
import { createHttpError } from "../middlewares/errorHandler";

export class CourseService {

  public async getAllCourses(): Promise<CourseOutputDTO[]> {
    let courseList = await Course.findAll({
      include: [{ model: User, as: 'teacher' }]
    });
    return CourseMapper.toOutputDtoList(courseList);
  }

  public async getCourseById(id: number): Promise<CourseOutputDTO | undefined> {
    let course = await Course.findByPk(id, {
      include: [{ model: User, as: 'teacher' }]
    });
    if (course) {
      return CourseMapper.toOutputDto(course);
    }
    return undefined;
  }

  public async createCourse(
    name: string,
    description: string,
    totalHours: number,
    teacherId: number | null,
  ): Promise<CourseOutputDTO> {
    try {
      const course = await Course.create({ name, description, totalHours, teacherId });
      await course.reload({ include: [{ model: User, as: 'teacher' }] });
      return CourseMapper.toOutputDto(course);
    } catch (error: any) {
      console.error("Sequelize error:", error.message);
      console.error("Stack:", error.stack);
      throw error;
    }
  }


  public async deleteCourse(id: number): Promise<void> {
    const course = await Course.findByPk(id);
    if (course) {
      course.destroy();
    }
  }

  public async updateCourse(
    id: number,
    name?: string,
    description?: string,
    totalHours?: number,
    teacherId?: number | null,
  ): Promise<CourseOutputDTO | undefined> {
    const course = await Course.findByPk(id, {
      include: [{ model: User, as: 'teacher' }]
    });
    if (course) {
      if (name) course.name = name;
      if (description) course.description = description;
      if (totalHours !== undefined) course.totalHours = totalHours;

      if (teacherId !== undefined && teacherId !== null && teacherId !== course.teacherId) {
        const { scheduleSlotService } = await import('./scheduleSlot.service');
        const courseSlots = await scheduleSlotService.getCourseSlots(id);

        if (courseSlots.length > 0) {
          const conflicts: any[] = [];
          for (const slot of courseSlots) {
            const slotConflicts = await scheduleSlotService.checkUserScheduleConflicts(teacherId, {
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime
            }, id);
            conflicts.push(...slotConflicts);
          }

          if (conflicts.length > 0) {
            const conflictNames = conflicts.map(c => c.conflictingCourse.name).join(', ');
            createHttpError(409, `L'enseignant a des conflits d'horaire avec : ${conflictNames}`);
          }
        }
      }

      if (teacherId === null && course.teacherId !== null) {
        const { Enrollment } = await import('../models/enrollment.model');
        await Enrollment.destroy({ where: { courseId: id } });
      }

      if (teacherId !== undefined) course.teacherId = teacherId;
      await course.save();
      await course.reload({ include: [{ model: User, as: 'teacher' }] });
      return CourseMapper.toOutputDto(course);
    }
    return undefined;
  }
}

export const courseService = new CourseService();