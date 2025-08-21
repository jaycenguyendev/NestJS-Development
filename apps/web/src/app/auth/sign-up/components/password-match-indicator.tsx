import React from 'react';

interface PasswordMatchIndicatorProps {
  password: string;
  confirmPassword: string;
  showIndicator: boolean;
}

export function PasswordMatchIndicator({
  password,
  confirmPassword,
  showIndicator,
}: PasswordMatchIndicatorProps) {
  if (!showIndicator || !confirmPassword) return null;

  const passwordsMatch = password === confirmPassword;

  return (
    <p
      className={`text-xs ${
        passwordsMatch ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {!passwordsMatch && 'Passwords do not match'}
    </p>
  );
}
