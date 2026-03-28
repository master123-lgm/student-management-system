export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type AuthSession = {
  token: string;
  username: string;
  role: UserRole;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  password: string;
  role: Exclude<UserRole, 'ADMIN'>;
};
