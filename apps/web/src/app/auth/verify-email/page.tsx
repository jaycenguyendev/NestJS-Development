'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  useVerifyEmail,
  useResendVerificationEmail,
} from '@/lib/api/hooks/use-auth-mutations';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [verificationCode, setVerificationCode] = useState('');
  const [email, setEmail] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const pendingVerificationEmail = localStorage.getItem(
      'pendingVerificationEmail',
    );
    if (emailParam && pendingVerificationEmail) {
      setEmail(pendingVerificationEmail);
    } else {
      router.push('/auth/sign-up');
    }
  }, [searchParams, router]);

  // Countdown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const verifyEmailMutation = useVerifyEmail({
    onSuccess: () => {
      toast({
        title: 'Xác thực thành công!',
        description: 'Email của bạn đã được xác thực. Đang chuyển hướng...',
      });
      localStorage.removeItem('pendingVerificationEmail');
      setTimeout(() => {
        router.push('/auth/sign-in');
      }, 2000);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Xác thực thất bại',
        description:
          error.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn',
      });
    },
  });

  const resendEmailMutation = useResendVerificationEmail({
    onSuccess: () => {
      toast({
        title: 'Đã gửi lại email!',
        description: 'Vui lòng kiểm tra hộp thư của bạn.',
      });
      setCountdown(60); // 60 seconds countdown
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gửi lại thất bại',
        description: error.message || 'Không thể gửi lại email xác thực',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng nhập mã xác thực',
      });
      return;
    }

    verifyEmailMutation.mutate({
      email,
      otp: verificationCode.trim(),
    });
  };

  const handleResendEmail = () => {
    if (countdown > 0) return;

    resendEmailMutation.mutate({ email });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
          <div className="space-y-8 p-8">
            {/* Header */}
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <svg
                  className="h-10 w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Verify your email
                </h1>
                <p className="leading-relaxed text-slate-600">
                  We need to verify your email address{' '}
                  <span className="break-all font-semibold text-blue-600">
                    {email}
                  </span>{' '}
                  before you can access your account. Enter the code below in
                  your open browser window.
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-sm text-blue-800">
                📧 Check your email for a{' '}
                <span className="font-semibold">6-digit verification code</span>
              </p>
              <p className="mt-1 text-xs text-blue-600">
                Code expires in <span className="font-medium">10 minutes</span>
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Enter the 6-digit code
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                  }}
                  className="h-14 border-2 border-slate-200 text-center font-mono text-2xl tracking-[0.3em] transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  maxLength={6}
                  disabled={verifyEmailMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  verifyEmailMutation.isPending || verificationCode.length !== 6
                }
              >
                {verifyEmailMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verifying...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </Button>
            </form>

            {/* Resend Section */}
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className="space-y-3 text-center">
                <p className="text-sm text-slate-600">
                  Didn't receive the code?
                </p>

                <Button
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={countdown > 0 || resendEmailMutation.isPending}
                  className="h-10 border-slate-200 text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  {resendEmailMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                      Sending...
                    </div>
                  ) : countdown > 0 ? (
                    `Resend in ${formatTime(countdown)}`
                  ) : (
                    'Resend code'
                  )}
                </Button>
              </div>

              <div className="text-center">
                <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-500">
                  If you didn't sign up for this account, you can safely ignore
                  this. Someone else might have typed your email address by
                  mistake.
                </p>
              </div>
            </div>

            {/* Back to Sign Up */}
            <div className="pt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/auth/sign-up')}
                className="text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800"
              >
                ← Back to sign up
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
          <div className="space-y-8 p-8">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Loading...
                </h1>
                <p className="leading-relaxed text-slate-600">
                  Please wait while we prepare your verification page.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
