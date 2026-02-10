'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  Crown, 
  Shield,
  Camera,
  Pencil,
  Check,
  X,
  Loader2,
  ExternalLink,
  Sparkles,
  Globe,
  Palette,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { updateProfile, UserApiError } from '@/lib/api/user';

export default function ProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  useEffect(() => {
    if (isEditingUsername && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingUsername]);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSaveUsername = async () => {
    if (!username.trim() || username === user?.username) {
      setIsEditingUsername(false);
      setUsername(user?.username || '');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateProfile({ username: username.trim() });
      await fetchUser();
      setSuccessMessage('Username updated successfully!');
      setIsEditingUsername(false);
    } catch (err) {
      if (err instanceof UserApiError) {
        setError(err.detail);
      } else {
        setError('Failed to update username');
      }
      setUsername(user?.username || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingUsername(false);
    setUsername(user?.username || '');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveUsername();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateRelative = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="space-y-6">
        
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 animate-in slide-in-from-top-2 duration-200">
            <Check className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}
        
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 animate-in slide-in-from-top-2 duration-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="relative bg-card rounded-2xl border border-border theme-shadow overflow-hidden">
          {/* Cover/Background */}
          <div className="h-32 md:h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--primary-rgb,59,130,246),0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(var(--primary-rgb,59,130,246),0.1),transparent_50%)]" />
            
            {/* Badges */}
            <div className="absolute top-4 right-4 flex gap-2">
              {user.is_admin && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-600 text-xs font-semibold backdrop-blur-sm border border-amber-500/30">
                  <Crown className="h-3.5 w-3.5" />
                  Admin
                </span>
              )}
              {user.subscribed ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-semibold backdrop-blur-sm border border-primary/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  Pro
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/80 text-muted-foreground text-xs font-semibold backdrop-blur-sm border border-border">
                  Free Plan
                </span>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 pb-6 -mt-16 md:-mt-20">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              <div className={cn(
                "h-28 w-28 md:h-36 md:w-36 rounded-2xl border-4 border-card overflow-hidden theme-shadow-lg",
                user.is_admin && "ring-2 ring-amber-500/50 ring-offset-2 ring-offset-card"
              )}>
                {user.picture && user.picture.trim() !== '' ? (
                  <img 
                    src={user.picture} 
                    alt={user.username}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.error('[Profile] Failed to load profile picture:', {
                        url: user.picture,
                        username: user.username,
                        email: user.email
                      });
                      // Hide the broken image and show fallback
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.fallback-avatar')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'fallback-avatar h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center';
                        fallback.innerHTML = `<span class="text-4xl md:text-5xl font-bold text-primary">${user.username.charAt(0).toUpperCase()}</span>`;
                        parent.appendChild(fallback);
                      }
                    }}
                    onLoad={() => {
                      console.log('[Profile] Profile picture loaded successfully:', user.picture);
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-4xl md:text-5xl font-bold text-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Camera Button (for future picture upload) */}
              <button 
                className="absolute bottom-1 right-1 p-2 rounded-xl bg-card border border-border theme-shadow hover:bg-accent transition-colors"
                title="Change profile picture"
              >
                <Camera className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Username & Email */}
            <div className="space-y-3">
              {/* Editable Username */}
              <div className="flex items-center gap-3">
                {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isSaving}
                      className="text-2xl md:text-3xl font-bold bg-transparent border-b-2 border-primary focus:outline-none text-foreground px-0 py-1 min-w-[200px]"
                      maxLength={50}
                    />
                    <button
                      onClick={handleSaveUsername}
                      disabled={isSaving}
                      className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="p-2 rounded-lg bg-muted hover:bg-accent transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{user.username}</h1>
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit username"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>

              {/* Member Since */}
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                <span>Member since {formatDate(user.created_at)}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-primary font-medium">{formatDateRelative(user.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border theme-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="font-semibold text-foreground">{user.is_admin ? 'Admin' : 'User'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border theme-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscription</p>
                <p className="font-semibold text-foreground">{user.subscribed ? 'Pro' : 'Free'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border theme-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timezone</p>
                <p className="font-semibold text-foreground truncate text-sm">{user.settings?.timezone || 'UTC'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border theme-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Theme</p>
                <p className="font-semibold text-foreground capitalize">{user.settings?.theme || 'Default'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade CTA (for non-subscribed users) */}
        {!user.subscribed && (
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Upgrade to Pro</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Unlock unlimited features, priority support, and advanced AI capabilities.
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shrink-0">
                <Sparkles className="h-4 w-4" />
                Upgrade Now
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* User ID (for debugging/support) */}
        <div className="flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            User ID: <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">{user.user_id}</code>
          </p>
        </div>

      </div>
    </div>
  );
}
