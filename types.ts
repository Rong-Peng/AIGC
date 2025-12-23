
export type MediaType = 'image' | 'video';

export interface PortfolioWork {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: MediaType;
  tools: string[];
  createdAt: number;
}

export interface UserProfile {
  name: string;
  role: string;
  bio: string;
  avatar: string;
}
