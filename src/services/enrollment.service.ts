import { Enrollment } from "../models/enrollment.model";
import { User } from "../models/user.model";
import { Course } from "../models/course.model";
import { scheduleSlotService } from "./scheduleSlot.service";
import { CustomError } from "../middlewares/errorHandler";

export class EnrollmentService {
  public async getAllEnrollements(): Promise<Enrollment[]> {
    return Enrollment.findAll();
  }

  public async getEnrollmentById(id: number): Promise<Enrollment | null> {
    return Enrollment.findByPk(id);
  }

  public async createEnrollment(
    studentId: number,
    courseId: number,
    enrollmentAt: Date,
    createAt: Date,
    updateAt: Date
  ): Promise<Enrollment> {
    const student = await User.findByPk(studentId);
    if (!student) {
      const error: CustomError = new Error('Étudiant non trouvé');
      error.status = 404;
      throw error;
    }

    if (student.role !== 'student') {
      const error: CustomError = new Error('L\'utilisateur doit être un étudiant pour s\'inscrire');
      error.status = 400;
      throw error;
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      const error: CustomError = new Error('Cours non trouvé');
      error.status = 404;
      throw error;
    }

    const existingEnrollment = await Enrollment.findOne({
      where: { studentId, courseId }
    });
    if (existingEnrollment) {
      const error: CustomError = new Error('L\'étudiant est déjà inscrit à ce cours');
      error.status = 409;
      throw error;
    }

    const { canEnroll, conflicts } = await scheduleSlotService.canStudentEnrollInCourse(studentId, courseId);
    if (!canEnroll) {
      const conflictNames = conflicts.map(c => c.conflictingCourse.name).join(', ');
      const error: CustomError = new Error(`Impossible de s'inscrire : conflit d'horaire avec ${conflictNames}`);
      error.status = 409;
      throw error;
    }

    return Enrollment.create({ studentId: studentId, courseId: courseId, enrollmentAt: enrollmentAt, createAt: createAt, updateAt: updateAt });
  }


  public async deleteEnrollment(id: number): Promise<void> {
    const enrollment = await Enrollment.findByPk(id);
    if (enrollment) {
      await enrollment.destroy();
    }
  }

  public async deleteEnrollmentByStudentAndCourse(studentId: number, courseId: number): Promise<void> {
    const enrollment = await Enrollment.findOne({ where: { studentId, courseId } });
    if (!enrollment) {
      const error: CustomError = new Error('Inscription non trouvée');
      error.status = 404;
      throw error;
    }
    await enrollment.destroy();
  }

  public async updateEnrollment(
    id: number,
    studentId?: number,
    courseId?: number,
    enrollmentAt?: Date,
    createAt?: Date,
    updateAt?: Date
  ): Promise<Enrollment | null> {
    const enrollment = await Enrollment.findByPk(id);
    if (!enrollment) {
      return null;
    }
    if (studentId !== undefined) enrollment.studentId = studentId;
    if (courseId !== undefined) enrollment.courseId = courseId;
    if (enrollmentAt !== undefined) enrollment.enrollmentAt = enrollmentAt;
    if (createAt !== undefined) enrollment.createAt = createAt;
    if (updateAt !== undefined) enrollment.updateAt = updateAt;
    await enrollment.save();
    return enrollment;
  }
}

export const enrollmentService = new EnrollmentService();
