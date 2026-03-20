import { Controller, Post, Get, Patch, Route, Body, Tags, Request, Security } from "tsoa";
import { authService } from "../services/auth.service";
import { AuthResponseDTO, LoginDTO, RegisterDTO, ChangePasswordDTO, UpdateProfileDTO } from "../dto/auth.dto";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {

  @Post("register")
  public async register(@Body() requestBody: RegisterDTO): Promise<AuthResponseDTO> {
    return authService.register(requestBody);
  }

  @Post("login")
  public async login(@Body() requestBody: LoginDTO): Promise<AuthResponseDTO> {
    return authService.login(requestBody);
  }

  @Patch("change-password")
  @Security("jwt")
  public async changePassword(
    @Body() requestBody: ChangePasswordDTO,
    @Request() request: AuthenticatedRequest
  ): Promise<{ message: string }> {
    if (!request.user) {
      this.setStatus(401);
      throw new Error('Authentification requise');
    }

    await authService.changePassword(request.user.userId, requestBody);
    return { message: 'Mot de passe modifié avec succès' };
  }

  @Patch("profile")
  @Security("jwt")
  public async updateProfile(
    @Body() requestBody: UpdateProfileDTO,
    @Request() request: AuthenticatedRequest
  ): Promise<AuthResponseDTO['user']> {
    if (!request.user) {
      this.setStatus(401);
      throw new Error('Authentification requise');
    }

    return authService.updateProfile(request.user.userId, requestBody);
  }

  @Get("me")
  @Security("jwt")
  public async getCurrentUser(@Request() request: AuthenticatedRequest): Promise<AuthResponseDTO['user']> {
    if (!request.user) {
      this.setStatus(401);
      throw new Error('Authentification requise');
    }

    const userService = await import('../services/user.service');
    const user = await userService.userService.getUserById(request.user.userId);

    if (!user) {
      this.setStatus(404);
      throw new Error('Utilisateur non trouvé');
    }

    return {
      id: user.id!,
      login: user.login,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isPrivate: user.isPrivate === 1
    };
  }
}