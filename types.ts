
export type MediaType = 'image' | 'video';

export interface PortfolioWork {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  coverUrl?: string; // 新增：视频封面图
  mediaType: MediaType;
  prompt: string;
  tools: string[];
  createdAt: number;
}

export interface UserProfile {
  name: string;
  role: string;
  bio: string;
  avatar: string;
}
