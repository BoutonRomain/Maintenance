import { Controller, Get, Post, Delete, Route, Path, Body, Tags, Patch, Security, Request } from "tsoa";
import { EnrollmentDTO } from "../dto/enrollment.dto";
import { createHttpError } from "../middlewares/errorHandler";
import { Enrollment } from "../models/enrollment.model";
import { enrollmentService } from "../services/enrollment.service";
import { ForeignKeyConstraintError } from "sequelize";

@Route("enrollments")
@Tags("Enrollments")
export class EnrollmentController extends Controller {
  @Get("/")
  @Security("jwt", ["enrollment:read"])
  public async getAllEnrollements(): Promise<EnrollmentDTO[]> {
    return enrollmentService.getAllEnrollements();
  }

  @Get("{id}")
  @Security("jwt", ["enrollment:read"])
  public async getEnrollmentById(@Path() id: number): Promise<EnrollmentDTO | null> {
    let enrollment: Enrollment | null = await enrollmentService.getEnrollmentById(id);
    if (enrollment === null) {
      createHttpError(404, "Enrollment not found");
    }
    return enrollment;
  }


  @Post("/")
  @Security("jwt", ["enrollment:create"])
  public async createEnrollment(
    @Body() requestBody: EnrollmentDTO
  ): Promise<EnrollmentDTO> {
    const { studentId, courseId, enrollmentAt, createAt, updateAt } = requestBody;

    // Check if course has a teacher
    const courseService = await import('../services/course.service');
    const course = await courseService.courseService.getCourseById(courseId);

    if (!course) {
      createHttpError(404, "Cours non trouvé");
    }

    if (!course.teacherId) {
      createHttpError(400, "Impossible de s'inscrire à un cours sans enseignant");
    }

    return enrollmentService.createEnrollment(studentId, courseId, enrollmentAt, createAt, updateAt);
  }


  @Delete("{id}")
  @Security("jwt", ["enrollment:delete"])
  public async deleteEnrollment(@Path() id: number): Promise<void> {
    try {
      await enrollmentService.deleteEnrollment(id);
    } catch (error) {
      if (error instanceof ForeignKeyConstraintError) {
        createHttpError(409, "Impossible de supprimer l'inscription car elle est liée à d'autres enregistrements");
      }
      throw error;
    }
  }

  @Delete("/course/{courseId}")
  @Security("jwt", ["enrollment:delete"])
  public async unenrollFromCourse(@Path() courseId: number, @Request() request: any): Promise<void> {
    const studentId = request.user?.userId;

    if (!studentId) {
      createHttpError(401, "Non autorisé");
    }

    await enrollmentService.deleteEnrollmentByStudentAndCourse(studentId, courseId);
  }

  @Patch("{id}")
  @Security("jwt", ["enrollment:update"])
  public async updateEnrollment(
    @Path() id: number,
    @Body() requestBody: Partial<EnrollmentDTO>
  ): Promise<EnrollmentDTO | null> {
    const { studentId, courseId, enrollmentAt, createAt, updateAt } = requestBody;
    let updatedEnrollment = await enrollmentService.updateEnrollment(
      id,
      studentId,
      courseId,
      enrollmentAt,
      createAt,
      updateAt
    );
    if (updatedEnrollment === null) {
      createHttpError(404, "Inscription non trouvée");
    }
    return updatedEnrollment;
  }
}
