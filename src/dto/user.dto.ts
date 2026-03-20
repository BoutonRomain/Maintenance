export interface UserDTO {
  id: number;
  login: string;
  firstName: string;
  lastName: string;
  role: string;
  isPrivate: boolean;
}

export interface CreateUserDTO {
  login: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string;
  isPrivate?: boolean;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  isPrivate?: boolean;
}