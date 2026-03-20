import { ScheduleSlotDTO } from "../dto/scheduleSlot.dto";
import { ScheduleSlot } from "../models/scheduleSlot.model";

export class ScheduleSlotMapper {
  public static toDto(scheduleSlot: ScheduleSlot): ScheduleSlotDTO {
    return {
      id: scheduleSlot.id,
      courseId: scheduleSlot.courseId,
      dayOfWeek: scheduleSlot.dayOfWeek,
      startTime: scheduleSlot.startTime.toISOString(),
      endTime: scheduleSlot.endTime.toISOString()
    };
  }

  public static toDtoList(scheduleSlotList: ScheduleSlot[]): ScheduleSlotDTO[] {
    return scheduleSlotList.map((scheduleSlot) => ScheduleSlotMapper.toDto(scheduleSlot));
  }
}