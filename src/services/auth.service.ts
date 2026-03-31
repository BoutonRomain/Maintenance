import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AuthResponseDTO, LoginDTO, RegisterDTO, ChangePasswordDTO, UpdateProfileDTO } from '../dto/auth.dto';
import { createHttpError } from '../middlewares/errorHandler';
import { UserMapper } from '../mapper/user.mapper';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private readonly JWT_EXPIRES_IN = '24h';
  private readonly SALT_ROUNDS = 10;

  public async register(registerData: RegisterDTO): Promise<AuthResponseDTO> {
    const { login, firstName, lastName, role, password, isPrivate = false } = registerData;

    const existingUser = await User.findOne({ where: { login } });
    if (existingUser) {
      createHttpError(409, 'Utilisateur déjà existant');
    }

    if (!['student', 'teacher'].includes(role)) {
      createHttpError(400, 'Rôle invalide. Doit être student ou teacher');
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const user = await User.create({
      login,
      firstName,
      lastName,
      role,
      password: hashedPassword,
      isPrivate: isPrivate ? 1 : 0
    });

    const token = this.generateToken(user.id, user.login, user.role);

    return {
      token,
      user: UserMapper.toDto(user)
    };
  }

  public async login(loginData: LoginDTO): Promise<AuthResponseDTO> {
    const { login, password } = loginData;

    const user = await User.findOne({ where: { login } });
    if (!user) {
      createHttpError(401, 'Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      createHttpError(401, 'Identifiants invalides');
    }

    const token = this.generateToken(user.id, user.login, user.role);

    return {
      token,
      user: UserMapper.toDto(user)
    };
  }

  public async changePassword(userId: number, changePasswordData: ChangePasswordDTO): Promise<void> {
    const { currentPassword, newPassword } = changePasswordData;

    const user = await User.findByPk(userId);
    if (!user) {
      createHttpError(404, 'Utilisateur non trouvé');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      createHttpError(400, 'Mot de passe actuel incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    user.password = hashedNewPassword;
    await user.save();
  }

  public async updateProfile(userId: number, updateData: UpdateProfileDTO): Promise<AuthResponseDTO['user']> {
    const user = await User.findByPk(userId);
    if (!user) {
      createHttpError(404, 'Utilisateur non trouvé');
    }

    if (updateData.firstName !== undefined) user.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) user.lastName = updateData.lastName;
    if (updateData.isPrivate !== undefined) user.isPrivate = updateData.isPrivate ? 1 : 0;

    await user.save();

    return UserMapper.toDto(user);
  }

  public verifyToken(token: string): { userId: number; login: string; role: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      return {
        userId: decoded.userId,
        login: decoded.login,
        role: decoded.role
      };
    } catch (error) {
      createHttpError(401, 'Token invalide');
    }
  }

  private generateToken(userId: number, login: string, role: string): string {
    return jwt.sign(
      { userId, login, role },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }
}

export const authService = new AuthService();