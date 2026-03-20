import { User } from './user.model';
import { Course } from './course.model';
import { Enrollment } from './enrollment.model';
import { ScheduleSlot } from './scheduleSlot.model';

User.hasMany(Course, {
  foreignKey: 'teacherId',
  as: 'taughtCourses'
});

Course.belongsTo(User, {
  foreignKey: 'teacherId',
  as: 'teacher'
});

User.hasMany(Enrollment, {
  foreignKey: 'studentId',
  as: 'enrollments'
});

Enrollment.belongsTo(User, {
  foreignKey: 'studentId',
  as: 'student'
});

Course.hasMany(Enrollment, {
  foreignKey: 'courseId',
  as: 'enrollments'
});

Enrollment.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'course'
});

Course.hasMany(ScheduleSlot, {
  foreignKey: 'courseId',
  as: 'scheduleSlots'
});

ScheduleSlot.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'course'
});

User.belongsToMany(Course, {
  through: Enrollment,
  foreignKey: 'studentId',
  otherKey: 'courseId',
  as: 'enrolledCourses'
});

Course.belongsToMany(User, {
  through: Enrollment,
  foreignKey: 'courseId',
  otherKey: 'studentId',
  as: 'enrolledStudents'
});

export { User, Course, Enrollment, ScheduleSlot };