import React from 'react';
import { Check } from 'lucide-react';
import { PASSWORD_REQUIREMENTS } from '../utils/password-validation';
import type { PasswordValidation } from '../types';

interface PasswordRequirementsProps {
  validation: PasswordValidation;
  showRequirements: boolean;
}

export function PasswordRequirements({
  validation,
  showRequirements,
}: PasswordRequirementsProps) {
  if (!showRequirements) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="text-muted-foreground text-xs">
        Password must contain:
      </div>
      <div className="grid grid-cols-1 gap-1 text-xs">
        {PASSWORD_REQUIREMENTS.map((requirement) => {
          const isValid = validation[requirement.key];
          return (
            <div
              key={requirement.key}
              className={`flex items-center space-x-1 ${
                isValid ? 'text-green-600' : 'text-muted-foreground'
              }`}
            >
              <Check
                className={`h-3 w-3 ${
                  isValid ? 'text-green-600' : 'text-muted-foreground'
                }`}
              />
              <span>{requirement.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
