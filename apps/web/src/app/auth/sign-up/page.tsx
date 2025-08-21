'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useSignUpForm, usePasswordValidation } from './hooks';
import {
  FormField,
  PasswordField,
  PasswordRequirements,
  PasswordMatchIndicator,
  TermsCheckbox,
  SocialAuthButtons,
} from './components';

export default function SignUpPage() {
  const { form, isLoading, onSubmit } = useSignUpForm();
  const {
    password,
    validation,
    isValid: isPasswordValid,
  } = usePasswordValidation({
    control: form.control,
  });

  const confirmPassword = form.watch('confirmPassword');
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';
  const agreeToTerms = form.watch('agreeToTerms');

  return (
    <div className="from-background to-muted/50 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>
              Get started with your free account today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  label="First Name"
                  placeholder="John"
                  required
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  label="Last Name"
                  placeholder="Doe"
                  required
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                placeholder="john.doe@example.com"
                required
              />

              <div className="space-y-2">
                <PasswordField
                  control={form.control}
                  name="password"
                  label="Password"
                  placeholder="Create a strong password"
                  required
                />
                <PasswordRequirements
                  validation={validation}
                  showRequirements={!!password}
                />
              </div>

              <div className="space-y-2">
                <PasswordField
                  control={form.control}
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  required
                />
                <PasswordMatchIndicator
                  password={password}
                  confirmPassword={confirmPassword}
                  showIndicator={true}
                />
              </div>

              <TermsCheckbox control={form.control} />

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={!isPasswordValid || !passwordsMatch || !agreeToTerms}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <SocialAuthButtons />

            <div className="mt-6 text-center text-sm">
              Already have an account?{' '}
              <Link
                href="/auth/sign-in"
                className="text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
