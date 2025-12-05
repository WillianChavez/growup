import { hashPassword, comparePassword } from '@/lib/password';
import { signToken } from '@/lib/jwt';
import { excludePassword } from '@/lib/utils';
import { UserService } from './user.service';
import type { LoginCredentials, RegisterData, AuthResponse, JWTPayload } from '@/types/auth.types';

export class AuthService {
  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await UserService.findByEmail(data.email);

      if (existingUser) {
        return {
          success: false,
          message: 'El email ya está registrado',
        };
      }

      // Hashear la contraseña
      const hashedPassword = await hashPassword(data.password);

      // Crear el usuario
      const user = await UserService.create({
        email: data.email,
        name: data.name,
        password: hashedPassword,
      });

      // Generar token
      const tokenPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        name: user.name,
      };

      const token = await signToken(tokenPayload);

      return {
        success: true,
        user: excludePassword(user),
        token,
        message: 'Usuario registrado exitosamente',
      };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        message: 'Error al registrar el usuario',
      };
    }
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Buscar el usuario
      const user = await UserService.findByEmail(credentials.email);

      if (!user) {
        return {
          success: false,
          message: 'Email o contraseña incorrectos',
        };
      }

      // Verificar la contraseña
      const isPasswordValid = await comparePassword(credentials.password, user.password);

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Email o contraseña incorrectos',
        };
      }

      // Generar token
      const tokenPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        name: user.name,
      };

      const token = await signToken(tokenPayload);

      return {
        success: true,
        user: excludePassword(user),
        token,
        message: 'Inicio de sesión exitoso',
      };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: 'Error al iniciar sesión',
      };
    }
  }
}
