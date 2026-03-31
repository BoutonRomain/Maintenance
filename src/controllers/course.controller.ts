import { Controller, Get, Post, Delete, Route, Path, Body, Tags, Patch, Security } from "tsoa";
import { createHttpError } from "../middlewares/errorHandler";
import { courseService } from "../services/course.service";
import {
  CourseInputDTO,
  CourseInputPatchDTO,
  CourseOutputDTO,
} from "../dto/course.dto";

@Route("courses")
@Tags("Courses")
export class CourseController extends Controller {

  @Get("/")
  @Security("jwt", ["course:read"])
  public async getAllCourses(): Promise<CourseOutputDTO[]> {
    return courseService.getAllCourses();
  }

  @Get("{id}")
  @Security("jwt", ["course:read"])
  public async getCourseById(@Path() id: number): Promise<CourseOutputDTO> {
    const course = await courseService.getCourseById(id);
    if (!course) {
      createHttpError(404, "Course not found");
    }
    return course;
  }

  @Post("/")
  @Security("jwt", ["course:create"])
  public async createCourse(@Body() requestBody: CourseInputDTO): Promise<CourseOutputDTO> {
    const { name, description, totalHours, teacherId } = requestBody;
    return courseService.createCourse(name, description, totalHours, teacherId);
  }

  @Delete("{id}")
  @Security("jwt", ["course:delete"])
  public async deleteCourse(@Path() id: number): Promise<void> {
    await courseService.deleteCourse(id);
  }

  @Patch("{id}")
  @Security("jwt", ["course:update"])
  public async updateCourse(
    @Path() id: number,
    @Body() requestBody: CourseInputPatchDTO,
  ): Promise<CourseOutputDTO> {
    const { name, description, totalHours, teacherId } = requestBody;
    const updatedCourse = await courseService.updateCourse(id, name, description, totalHours, teacherId);
    if (!updatedCourse) {
      createHttpError(404, "Course not found");
    }
    return updatedCourse;
  }
}
