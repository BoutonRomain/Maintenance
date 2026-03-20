import { CourseOutputDTO } from "../dto/course.dto";
import { Course } from "../models/course.model";

export class CourseMapper {
  public static toOutputDto(course: Course): CourseOutputDTO {
    return {
      id: course.id,
      name: course.name,
      description: course.description,
      totalHours: course.totalHours,
      teacherId: course.teacherId,
      teacher: course.teacher ? {
        id: course.teacher.id,
        firstName: course.teacher.firstName,
        lastName: course.teacher.lastName
      } : undefined
    };
  }

  public static toOutputDtoList(courseList: Course[]): CourseOutputDTO[] {
    return courseList.map((course) => CourseMapper.toOutputDto(course));
  }
}