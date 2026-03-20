import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

export interface CourseAttributes {
    id?: number;
    name: string;
    description: string;
    teacherId: number | null;
    totalHours: number;
}

export class Course
    extends Model<CourseAttributes>
    implements CourseAttributes {
    declare id: number;
    declare name: string;
    declare description: string;
    declare teacherId: number | null;
    declare totalHours: number;

    declare teacher?: User;
    declare scheduleSlots?: ScheduleSlot[];
    declare enrollments?: Enrollment[];
    declare enrolledStudents?: User[];
}

import { User } from './user.model';
import { ScheduleSlot } from './scheduleSlot.model';
import { Enrollment } from './enrollment.model';

Course.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        teacherId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        totalHours: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: "Course",
    }
);
