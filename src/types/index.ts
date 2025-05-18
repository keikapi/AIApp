export interface Document {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: Date;
  vectorId?: string;
  metadata: {
    title?: string;
    description?: string;
    tags?: string[];
    uploadedBy: string;  // CognitoユーザーID
  };
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    documentIds?: string[];
    confidence?: number;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  messages: ChatMessage[];
  metadata?: {
    context?: string;
    preferences?: {
      responseStyle?: 'formal' | 'casual';
      language?: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  preferences: {
    responseStyle: 'formal' | 'casual';
    language: string;
  };
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface PresignedUrlResponse {
  url: string;
  expiresIn: number;
}

export type DocumentType = 'pdf' | 'txt' | 'docx' | 'xlsx';
export type ResponseStyle = 'formal' | 'casual'; 