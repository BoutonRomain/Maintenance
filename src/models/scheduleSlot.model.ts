import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

export interface ScheduleSlotAttributes {
    id?: number;
    courseId: number;
    dayOfWeek: string;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    modifiedAt: Date;
}

export class ScheduleSlot
    extends Model<ScheduleSlotAttributes>
    implements ScheduleSlotAttributes {
    declare id: number;
    declare courseId: number;
    declare dayOfWeek: string;
    declare startTime: Date;
    declare endTime: Date;
    declare createdAt: Date;
    declare modifiedAt: Date;

    declare course?: Course;
}

import { Course } from './course.model';

ScheduleSlot.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        courseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        dayOfWeek: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        modifiedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        }

    },
    {
        sequelize,
        tableName: "ScheduleSlot",
    }
);
