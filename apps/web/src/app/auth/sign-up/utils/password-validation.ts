import type { PasswordValidation, PasswordRequirement } from '../types';

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    key: 'minLength',
    label: 'At least 8 characters',
    test: (password: string) => password.length >= 8,
  },
  {
    key: 'hasUppercase',
    label: 'One uppercase letter',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    key: 'hasLowercase',
    label: 'One lowercase letter',
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    key: 'hasNumber',
    label: 'One number',
    test: (password: string) => /\d/.test(password),
  },
  {
    key: 'hasSpecialChar',
    label: 'One special character',
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export const validatePassword = (password: string): PasswordValidation => {
  return PASSWORD_REQUIREMENTS.reduce(
    (acc, requirement) => ({
      ...acc,
      [requirement.key]: requirement.test(password),
    }),
    {} as PasswordValidation,
  );
};

export const isPasswordValid = (validation: PasswordValidation): boolean => {
  return Object.values(validation).every(Boolean);
};
