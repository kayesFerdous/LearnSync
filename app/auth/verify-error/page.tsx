'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Mail, Loader2 } from 'lucide-react';
import { AuthApiError, resendVerification } from '@/lib/api/auth';

const PENDING_VERIFICATION_EMAIL_KEY = 'pending_verification_email';

const ERROR_MESSAGES: Record<string, string> = {
  expired_token: 'This verification link has expired. Request a new verification email.',
  invalid_token: 'This verification link is invalid or has already been used.',
  verification_failed: 'We couldn’t verify your email due to a server issue. Please try again.',
};

export default function VerifyErrorPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const errorCode = searchParams.get('error') || 'verification_failed';
  const verificationMessage =
    ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.verification_failed;

  useEffect(() => {
    const storedEmail = localStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleResend = async () => {
    if (!email.trim() || cooldownSeconds > 0) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsResending(true);

    try {
      localStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
      const response = await resendVerification({ email });
      setSuccessMessage(response.message || 'Verification email sent.');
      setCooldownSeconds(60);
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrorMessage(error.message);
        if (error.statusCode === 429) {
          setCooldownSeconds(60);
        }
      } else {
        setErrorMessage('Unable to resend verification email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0E] flex items-center justify-center p-4 font-sans text-zinc-300">
      <div className="w-full max-w-130 bg-[#121217] border border-zinc-800/50 rounded-3xl p-8">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Email verification failed</h1>
            <p className="text-zinc-400 text-sm">{verificationMessage}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 mb-3">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-3 mb-3 flex items-start gap-2">
            <Mail className="w-4 h-4 text-emerald-400 mt-0.5" />
            <p className="text-sm text-emerald-300">{successMessage}</p>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1A1A20] border border-zinc-800/50 text-zinc-300 text-sm rounded-xl focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 block p-3 placeholder-zinc-600 transition-all outline-none"
            placeholder="you@studio.dev"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || cooldownSeconds > 0 || !email.trim()}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-zinc-950 text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            {isResending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isResending
              ? 'Sending...'
              : cooldownSeconds > 0
                ? `Resend in ${cooldownSeconds}s`
                : 'Resend verification email'}
          </button>

          <Link href="/auth" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
