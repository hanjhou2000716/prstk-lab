export type ToolCategory = 'explore' | 'research' | 'strategy' | 'risk' | 'allocation';

export interface Tool {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  summary: string;
  description?: string;
  categories: ToolCategory[];
  features: string[];
  useCases: string[];
  targetUsers: string[];
  tags: string[];
  aliases: string[];
  status: string;
  lastVerifiedAt?: string;
  verifiedBy?: string;
  featured: boolean;
  url: string;
  pricing?: string;
  requiresLogin?: string;
  mobileSupport?: string;
}
