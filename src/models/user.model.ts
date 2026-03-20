import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database"; 

export interface UserAttributes {
  id?: number;
  login: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string;
  isPrivate: number;
}

export class User
  extends Model<UserAttributes>
  implements UserAttributes
{
  declare id: number;
  declare login: string;
  declare firstName: string;
  declare lastName: string;
  declare role: string;
  declare password: string;
  declare isPrivate: number;

  declare taughtCourses?: Course[];
  declare enrollments?: Enrollment[];
  declare enrolledCourses?: Course[];
}

import { Course } from './course.model';
import { Enrollment } from './enrollment.model';

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    login: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isPrivate: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "User",
  }
);