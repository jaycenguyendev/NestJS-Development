import React from 'react';
import Link from 'next/link';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { SignUpSchemaType } from '@/app/auth/sign-up/schemas/sign-up.schema';

interface TermsCheckboxProps {
  control: Control<SignUpSchemaType>;
}

export function TermsCheckbox({ control }: TermsCheckboxProps) {
  return (
    <Controller
      control={control}
      name="agreeToTerms"
      render={({ field, fieldState: { error } }) => (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              id="terms"
              type="checkbox"
              checked={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              className={`h-4 w-4 rounded border-gray-300 ${
                error ? 'border-red-500' : ''
              }`}
            />
            <label htmlFor="terms" className="text-sm">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {error && <p className="text-xs text-red-600">{error.message}</p>}
        </div>
      )}
    />
  );
}
