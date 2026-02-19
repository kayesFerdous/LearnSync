'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const REDIRECT_FALLBACK = '/dashboard';

export default function VerifiedPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectPath =
      process.env.NEXT_PUBLIC_VERIFICATION_SUCCESS_REDIRECT || REDIRECT_FALLBACK;

    const timer = window.setTimeout(() => {
      router.push(redirectPath);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-[#0A0A0E] flex items-center justify-center p-4 font-sans text-zinc-300">
      <div className="w-full max-w-130 bg-[#121217] border border-zinc-800/50 rounded-3xl p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Email verified!</h1>
        <p className="text-zinc-400 mb-6">You’re now logged in. Redirecting you to your dashboard…</p>
        <Link href={process.env.NEXT_PUBLIC_VERIFICATION_SUCCESS_REDIRECT || REDIRECT_FALLBACK} className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
          Continue now
        </Link>
      </div>
    </div>
  );
}
