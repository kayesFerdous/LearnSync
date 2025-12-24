import type { ChatTag } from './types';

export const CHAT_TAGS: ChatTag[] = [
  { id: 'schedular', label: 'Scheduler' },
  { id: 'routine_generator', label: 'Routine Generator' },
];

export const INITIAL_MESSAGE = {
  id: '1',
  role: 'ai' as const,
  content: 'Hello! I am your personal assistant. How can I help you organize your day?',
};

export const IMAGE_ONLY_TAGS = ['routine_generator'];

export const isImageOnlyTag = (tagId: string | null): boolean => {
  return tagId !== null && IMAGE_ONLY_TAGS.includes(tagId);
};
