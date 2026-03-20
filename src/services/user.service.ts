import { User } from "../models/user.model";

export class UserService {
  public async getAllUsers(): Promise<User[]> {
    return User.findAll();
  }

  public async getUserById(id: number): Promise<User | null> {
    return User.findByPk(id);
  }

  public async createUser(
    login: string,
    firstName: string,
    lastName: string,
    role: string,
    password: string,
    isPrivate: number
  ): Promise<User> {
    return User.create({ login: login, firstName: firstName, lastName: lastName, role: role, password: password, isPrivate: isPrivate });
  }


  public async deleteUser(id: number): Promise<void> {
    const user = await User.findByPk(id);
    if (user) {
      await user.destroy();
    }
  }

  public async updateUser(
    id: number,
    firstName: string,
    lastName: string
  ): Promise<User | null> {
    const user = await User.findByPk(id);
    if (user) {
      user.firstName = firstName;
      user.lastName = lastName;
      await user.save();
      return user;
    }
    return null;
  }

  public async getMyStudents(teacherId: number): Promise<User[]> {
    // Dynamic import to avoid circular dependencies if models are importing each other
    const { Course } = await import('../models/course.model');
    const { Enrollment } = await import('../models/enrollment.model');

    // Find all users who are students in enrollments where the course's teacher is teacherId
    // We use a distinct query logic handled by Sequelize
    const students = await User.findAll({
      include: [{
        model: Enrollment,
        as: 'enrollments',
        required: true, // Inner join
        include: [{
          model: Course,
          as: 'course',
          where: { teacherId },
          required: true
        }]
      }]
    });

    return students;
  }
}

export const userService = new UserService();
