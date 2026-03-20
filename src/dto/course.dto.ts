export interface CourseInputDTO {
  name: string;
  description: string;
  totalHours: number;
  teacherId: number | null;
}

export interface CourseInputPatchDTO {
  name?: string;
  description?: string;
  totalHours?: number;
  teacherId?: number | null;
}

export interface CourseOutputDTO {
  id: number;
  name: string;
  description: string;
  totalHours: number;
  teacherId: number | null;
  teacher?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}