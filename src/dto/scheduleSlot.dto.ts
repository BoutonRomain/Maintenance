export interface ScheduleSlotDTO {
  id?: number;
  courseId: number;
  dayOfWeek: string;
  startTime: string; 
  endTime: string;  
}

export interface CreateScheduleSlotDTO {
  courseId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleConflictCheckDTO {
  userId: number;
  courseId: number;
}