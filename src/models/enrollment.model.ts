import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database"; 

export interface EnrollmentAttributes {
  id?: number;
  studentId: number;
  courseId: number;
  enrollmentAt: Date;
  createAt: Date;
  updateAt: Date;
}


export class Enrollment
  extends Model<EnrollmentAttributes>
  implements EnrollmentAttributes
{
  declare id: number;
  declare studentId: number;
  declare courseId: number;
  declare enrollmentAt: Date;
  declare createAt: Date;
  declare updateAt: Date;

  declare student?: User;
  declare course?: Course;
}

import { User } from './user.model';
import { Course } from './course.model';

Enrollment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    enrollmentAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updateAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Enrollment",
  }
);