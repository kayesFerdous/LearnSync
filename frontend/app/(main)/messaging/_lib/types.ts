export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface LastMessage {
  id: string;
  content: string;
  created_at: string;
}

export interface Contact {
  user_id: string;
  username: string;
  email: string;
  profile_picture: string | null;
  last_message: LastMessage | null;
  unread_count: number;
}

export interface ChatHistoryResponse {
  messages: Message[];
  total_count: number;
}

export interface WsNewMessageEvent {
  type: 'new_message';
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface SearchUser {
  user_id: string;
  username: string;
  email: string;
  picture: string | null;
}
