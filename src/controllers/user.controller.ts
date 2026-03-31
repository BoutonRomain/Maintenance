import { Controller, Get, Post, Delete, Route, Path, Body, Tags, Patch, Security, Request } from "tsoa";
import { createHttpError } from "../middlewares/errorHandler";
import { userService } from "../services/user.service";
import { UserDTO, UpdateUserDTO } from "../dto/user.dto";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { UserMapper } from "../mapper/user.mapper";

@Route("users")
@Tags("Users")
export class UserController extends Controller {

  @Get("/")
  @Security("jwt", ["user:read"])
  public async getAllUsers(@Request() request: AuthenticatedRequest): Promise<UserDTO[]> {
    if (!request.user) {
      createHttpError(401, "Authentification requise");
    }

    const users = await userService.getAllUsers();
    return UserMapper.toDtoList(users);
  }

  @Get("/my-students")
  @Security("jwt", ["user:read"])
  public async getMyStudents(@Request() request: AuthenticatedRequest): Promise<UserDTO[]> {
    if (!request.user) {
      createHttpError(401, "Authentification requise");
    }

    if (request.user.role !== 'teacher') {
      createHttpError(403, "Réservé aux enseignants");
    }

    const students = await userService.getMyStudents(request.user.userId);
    return UserMapper.toDtoList(students);
  }

  @Get("{id}")
  @Security("jwt", ["user:read"])
  public async getUserById(
    @Path() id: number,
    @Request() request: AuthenticatedRequest
  ): Promise<UserDTO> {
    if (!request.user) {
      createHttpError(401, "Authentification requise");
    }

    const user = await userService.getUserById(id);
    if (!user) {
      createHttpError(404, "Utilisateur non trouvé");
    }
    return UserMapper.toDto(user);
  }

  @Patch("{id}")
  @Security("jwt", ["user:update"])
  public async updateUser(
    @Path() id: number,
    @Body() requestBody: Partial<UserDTO>,
    @Request() request: AuthenticatedRequest
  ): Promise<UserDTO> {
    if (!request.user) {
      createHttpError(401, "Authentification requise");
    }

    if (request.user.userId !== id && request.user.role !== 'teacher') {
      createHttpError(403, "Vous ne pouvez modifier que votre propre profil");
    }

    const user = await userService.getUserById(id);
    if (!user) {
      createHttpError(404, "Utilisateur non trouvé");
    }

    if (requestBody.firstName !== undefined) user.firstName = requestBody.firstName;
    if (requestBody.lastName !== undefined) user.lastName = requestBody.lastName;
    if (requestBody.isPrivate !== undefined) user.isPrivate = requestBody.isPrivate ? 1 : 0;

    await user.save();

    return UserMapper.toDto(user);
  }

  @Delete("{id}")
  @Security("jwt", ["user:delete"])
  public async deleteUser(
    @Path() id: number,
    @Request() request: AuthenticatedRequest
  ): Promise<void> {
    if (!request.user) {
      createHttpError(401, "Authentification requise");
    }

    createHttpError(403, "La suppression d'utilisateur n'est pas autorisée");
  }
}
