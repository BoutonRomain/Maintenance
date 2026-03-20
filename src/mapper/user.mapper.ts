import { UserDTO } from "../dto/user.dto";
import { User } from "../models/user.model";

export class UserMapper {
  public static toDto(user: User): UserDTO {
    return {
      id: user.id!,
      login: user.login,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isPrivate: user.isPrivate === 1
    };
  }

  public static toDtoList(userList: User[]): UserDTO[] {
    return userList.map((user) => UserMapper.toDto(user));
  }
}