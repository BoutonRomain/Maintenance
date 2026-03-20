export interface LoginDTO {
  login: string;
  password: string;
}

export interface RegisterDTO {
  login: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher';
  password: string;
  isPrivate?: boolean;
}

export interface AuthResponseDTO {
  token: string;
  user: {
    id: number;
    login: string;
    firstName: string;
    lastName: string;
    role: string;
    isPrivate: boolean;
  };
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  isPrivate?: boolean;
}