import { EnrollmentDTO } from "../dto/enrollment.dto";
import { Enrollment } from "../models/enrollment.model";

export class EnrollmentMapper {
  public static toDto(enrollment: Enrollment): EnrollmentDTO {
    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      enrollmentAt: enrollment.enrollmentAt,
      createAt: enrollment.createAt,
      updateAt: enrollment.updateAt
    };
  }

  public static toDtoList(enrollmentList: Enrollment[]): EnrollmentDTO[] {
    return enrollmentList.map((enrollment) => EnrollmentMapper.toDto(enrollment));
  }
}