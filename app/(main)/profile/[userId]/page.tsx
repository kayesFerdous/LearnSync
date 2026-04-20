'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, Crown, Loader2, MessageCircle, User } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import {
  getPublicProfile,
  type PublicUserProfile,
  UserApiError,
} from '@/lib/api/user';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const userId = useMemo(() => {
    const value = params?.userId;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    if (user?.user_id === userId) {
      router.replace('/profile');
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublicProfile(userId);
        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof UserApiError) {
          setError(err.detail || 'Unable to load profile');
        } else {
          setError('Unable to load profile');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [router, user?.user_id, userId]);

  if (loading) {
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

  if (!profile) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{error || 'Profile not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="space-y-6">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="relative bg-card rounded-2xl border border-border theme-shadow overflow-hidden">
          <div className="h-32 md:h-40 bg-linear-to-br from-primary/20 via-primary/10 to-transparent" />

          <div className="px-6 pb-6 -mt-16 md:-mt-20">
            <div className="relative inline-block mb-4">
              <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-2xl border-4 border-card overflow-hidden theme-shadow-lg bg-muted">
                {profile.picture ? (
                  <Image
                    src={profile.picture}
                    alt={profile.username}
                    fill
                    sizes="(max-width: 768px) 112px, 144px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{profile.username}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {profile.is_admin && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30 font-medium">
                      <Crown className="h-3.5 w-3.5" />
                      Admin
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() =>
                  router.push(
                    `/messaging?userId=${profile.user_id}&username=${encodeURIComponent(profile.username)}`,
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold mb-3">Public Info</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined {formatDate(profile.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
