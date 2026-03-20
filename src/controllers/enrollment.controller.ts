import { Controller, Get, Post, Delete, Route, Path, Body, Tags, Patch, Security, Request } from "tsoa";
import { EnrollmentDTO } from "../dto/enrollment.dto";
import { CustomError } from "../middlewares/errorHandler";
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
      let error: CustomError = new Error("Enrollment not found");
      error.status = 404;
      throw error;
    } else {
      return enrollment;
    }
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
      const error: CustomError = new Error("Cours non trouvé");
      error.status = 404;
      throw error;
    }

    if (!course.teacherId) {
      const error: CustomError = new Error("Impossible de s'inscrire à un cours sans enseignant");
      error.status = 400;
      throw error;
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
        let customError: CustomError = new Error(
          "Impossible de supprimer l'inscription car elle est liée à d'autres enregistrements"
        );
        customError.status = 409;
        throw customError;
      }
      throw error;
    }
  }

  @Delete("/course/{courseId}")
  @Security("jwt", ["enrollment:delete"])
  public async unenrollFromCourse(@Path() courseId: number, @Request() request: any): Promise<void> {
    const studentId = request.user?.userId;

    if (!studentId) {
      let error: CustomError = new Error("Non autorisé");
      error.status = 401;
      throw error;
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
      let error: CustomError = new Error("Inscription non trouvée");
      error.status = 404;
      throw error;
    } else {
      return updatedEnrollment;
    }
  }
}
