import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, SignUpSchemaType } from '../schemas/sign-up.schema';
import { useRegister, AuthService } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import type { ApiError, SignUpFormToApiRequest } from '@/lib/api';

const DEFAULT_VALUES = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
};

export const useSignUpForm = () => {
  const { toast } = useToast();

  const form = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema as any),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  const registerMutation = useRegister({
    onSuccess: (user) => {
      toast({
        title: 'Account created successfully!',
        description: `Welcome ${user.name || user.email}! Please check your email to verify your account.`,
      });
      form.reset();
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Registration failed',
        description:
          error.message ||
          'An error occurred during registration. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SignUpSchemaType) => {
    // Transform form data to API request format
    const formToApiData: SignUpFormToApiRequest = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    };

    const apiRequest = AuthService.transformSignUpData(formToApiData);
    registerMutation.mutate(apiRequest);
  };

  return {
    form,
    isLoading: registerMutation.isPending,
    onSubmit: form.handleSubmit(onSubmit),
    error: registerMutation.error,
    isSuccess: registerMutation.isSuccess,
  };
};
