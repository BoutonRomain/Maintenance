import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AuthResponseDTO, LoginDTO, RegisterDTO, ChangePasswordDTO, UpdateProfileDTO } from '../dto/auth.dto';
import { CustomError } from '../middlewares/errorHandler';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private readonly JWT_EXPIRES_IN = '24h';
  private readonly SALT_ROUNDS = 10;

  public async register(registerData: RegisterDTO): Promise<AuthResponseDTO> {
    const { login, firstName, lastName, role, password, isPrivate = false } = registerData;

    const existingUser = await User.findOne({ where: { login } });
    if (existingUser) {
      const error: CustomError = new Error('Utilisateur déjà existant');
      error.status = 409;
      throw error;
    }

    if (!['student', 'teacher'].includes(role)) {
      const error: CustomError = new Error('Rôle invalide. Doit être student ou teacher');
      error.status = 400;
      throw error;
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
      user: {
        id: user.id,
        login: user.login,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isPrivate: user.isPrivate === 1
      }
    };
  }

  public async login(loginData: LoginDTO): Promise<AuthResponseDTO> {
    const { login, password } = loginData;

    const user = await User.findOne({ where: { login } });
    if (!user) {
      const error: CustomError = new Error('Identifiants invalides');
      error.status = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error: CustomError = new Error('Identifiants invalides');
      error.status = 401;
      throw error;
    }

    const token = this.generateToken(user.id, user.login, user.role);

    return {
      token,
      user: {
        id: user.id,
        login: user.login,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isPrivate: user.isPrivate === 1
      }
    };
  }

  public async changePassword(userId: number, changePasswordData: ChangePasswordDTO): Promise<void> {
    const { currentPassword, newPassword } = changePasswordData;

    const user = await User.findByPk(userId);
    if (!user) {
      const error: CustomError = new Error('Utilisateur non trouvé');
      error.status = 404;
      throw error;
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      const error: CustomError = new Error('Mot de passe actuel incorrect');
      error.status = 400;
      throw error;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    user.password = hashedNewPassword;
    await user.save();
  }

  public async updateProfile(userId: number, updateData: UpdateProfileDTO): Promise<AuthResponseDTO['user']> {
    const user = await User.findByPk(userId);
    if (!user) {
      const error: CustomError = new Error('Utilisateur non trouvé');
      error.status = 404;
      throw error;
    }

    if (updateData.firstName !== undefined) user.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) user.lastName = updateData.lastName;
    if (updateData.isPrivate !== undefined) user.isPrivate = updateData.isPrivate ? 1 : 0;

    await user.save();

    return {
      id: user.id,
      login: user.login,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isPrivate: user.isPrivate === 1
    };
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
      const customError: CustomError = new Error('Token invalide');
      customError.status = 401;
      throw customError;
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