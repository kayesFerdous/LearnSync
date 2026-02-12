import { cookies } from 'next/headers';
import { CourseDashboard } from './_components/CourseDashboard';
import { CourseFolder } from './_components/course-dashboard';
import { Folder, ConversationListResponse } from '@/app/(main)/chat/_lib/types';

// Temporarily hardcoded until available via env var or config
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getFoldersWithCookies(): Promise<Folder[]> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  try {
    const response = await fetch(`${API_BASE_URL}/conversation/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader || ''
      },
      cache: 'no-store' // Ensure we get fresh data
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Handle auth error - simpler for now to return empty
        console.error('Unauthorized request to fetch folders');
        return [];
      }
      throw new Error(`Failed to fetch folders (${response.status})`);
    }

    const data: ConversationListResponse = await response.json();
    return data.folders;
  } catch (error) {
    console.error('Error fetching folders:', error);
    return [];
  }
}

async function getFolder(folderId: string): Promise<CourseFolder | null> {
  const folders = await getFoldersWithCookies();
  const folder = folders.find(f => f.id === folderId);

  if (!folder) return null;

  return {
    ...folder,
  };
}

export default async function Page({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await params;
  const folder = await getFolder(folderId);

  if (!folder) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Course not found
      </div>
    );
  }

  return <CourseDashboard folder={folder} />;
}

