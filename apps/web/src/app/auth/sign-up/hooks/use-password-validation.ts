import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import {
  validatePassword,
  isPasswordValid,
} from '../utils/password-validation';
import type { SignUpSchemaType } from '../schemas/sign-up.schema';

interface UsePasswordValidationProps {
  control: Control<SignUpSchemaType>;
}

export const usePasswordValidation = ({
  control,
}: UsePasswordValidationProps) => {
  const password = useWatch({
    control,
    name: 'password',
    defaultValue: '',
  });

  const validation = useMemo(() => validatePassword(password), [password]);
  const isValid = useMemo(() => isPasswordValid(validation), [validation]);

  return {
    password,
    validation,
    isValid,
  };
};
