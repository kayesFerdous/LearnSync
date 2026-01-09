'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, MousePointer2 } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8000/auth/login'
  }


  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email login/signup clicked", {
        isLogin, email, password, fullName, confirmPassword
    });
    // Connect to backend API here
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0E] flex items-center justify-center p-4 relative overflow-hidden font-sans text-zinc-300">
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
      </div>

      <div className="w-full max-w-[480px] z-10">
        <div className="bg-[#121217] border border-zinc-800/50 rounded-3xl shadow-2xl overflow-hidden p-8">
            
            {/* Top Icon */}
            <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 shadow-inner">
                    <MousePointer2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    {isLogin ? 'Sign in to LearnSync' : 'Create your account'}
                </h1>
                <p className="text-zinc-500 text-sm">
                    {isLogin ? 'New to the workspace? ' : 'Already have an account? '}
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                    >
                        {isLogin ? 'Create an account' : 'Sign in'}
                    </button>
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailLogin} className="space-y-5">
                {!isLogin && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Full Name</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-[#1A1A20] border border-zinc-800/50 text-zinc-300 text-sm rounded-xl focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 block w-full pl-10 p-3 placeholder-zinc-600 transition-all outline-none"
                                placeholder="John Doe"
                                required={!isLogin}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Work Email</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                            <Mail className="w-4 h-4" />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1A1A20] border border-zinc-800/50 text-zinc-300 text-sm rounded-xl focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 block w-full pl-10 p-3 placeholder-zinc-600 transition-all outline-none"
                            placeholder="you@studio.dev"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Password</label>
                        {isLogin && (
                            <Link href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                                Forgot?
                            </Link>
                        )}
                    </div>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                            <Lock className="w-4 h-4" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#1A1A20] border border-zinc-800/50 text-zinc-300 text-sm rounded-xl focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 block w-full pl-10 pr-14 p-3 placeholder-zinc-600 transition-all outline-none"
                            placeholder="Enter your password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors cursor-pointer"
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                {!isLogin && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Confirm Password</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-[#1A1A20] border border-zinc-800/50 text-zinc-300 text-sm rounded-xl focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 block w-full pl-10 p-3 placeholder-zinc-600 transition-all outline-none"
                                placeholder="Confirm your password"
                                required={!isLogin}
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all duration-200 mt-2 cursor-pointer"
                >
                    {isLogin ? 'Continue to dashboard' : 'Create account'}
                </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    {/* <div className="w-full border-t border-zinc-800"></div> */}
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-medium">
                    <span className="text-zinc-600">Or</span>
                </div>
            </div>

            {/* Social Login - Only Google */}
            <div className="grid grid-cols-1 gap-3">
                <button
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center w-full bg-[#1A1A20] hover:bg-[#202025] border border-zinc-800/50 rounded-xl py-3 transition-colors cursor-pointer group"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                </button>
            </div>

            {/* Footer Terms */}
            <div className="mt-8 text-center">
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                    By continuing, you agree to the NeonGrid <Link href="#" className="text-zinc-400 hover:text-zinc-300">Terms</Link> and <Link href="#" className="text-zinc-400 hover:text-zinc-300">Privacy Policy</Link>.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
