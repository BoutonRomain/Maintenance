import { Controller, Get, Post, Delete, Route, Path, Body, Tags, Patch, Security, Request } from "tsoa";
import { CustomError } from "../middlewares/errorHandler";
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
      let error: CustomError = new Error("Authentification requise");
      error.status = 401;
      throw error;
    }

    const users = await userService.getAllUsers();
    return UserMapper.toDtoList(users);
  }

  @Get("/my-students")
  @Security("jwt", ["user:read"])
  public async getMyStudents(@Request() request: AuthenticatedRequest): Promise<UserDTO[]> {
    if (!request.user) {
      const error: CustomError = new Error("Authentification requise");
      error.status = 401;
      throw error;
    }

    if (request.user.role !== 'teacher') {
      const error: CustomError = new Error("Réservé aux enseignants");
      error.status = 403;
      throw error;
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
      let error: CustomError = new Error("Authentification requise");
      error.status = 401;
      throw error;
    }

    const user = await userService.getUserById(id);
    if (!user) {
      let error: CustomError = new Error("Utilisateur non trouvé");
      error.status = 404;
      throw error;
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
      let error: CustomError = new Error("Authentification requise");
      error.status = 401;
      throw error;
    }

    if (request.user.userId !== id && request.user.role !== 'teacher') {
      let error: CustomError = new Error("Vous ne pouvez modifier que votre propre profil");
      error.status = 403;
      throw error;
    }

    const user = await userService.getUserById(id);
    if (!user) {
      let error: CustomError = new Error("Utilisateur non trouvé");
      error.status = 404;
      throw error;
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
      let error: CustomError = new Error("Authentification requise");
      error.status = 401;
      throw error;
    }

    let error: CustomError = new Error("La suppression d'utilisateur n'est pas autorisée");
    error.status = 403;
    throw error;
  }
}
