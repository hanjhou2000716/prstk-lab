export type ResearchDecision = '觀望' | '買入' | '賣出';
export type ResearchConfidence = '尚未評估' | '低' | '中' | '高';
export type ResearchStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface ResearchProject {
  id: string;
  title: string;
  target: string;
  question: string;
  hypothesis: string;
  evidence: string;
  sources: string;
  methodology: string;
  assumptions: string;
  risks: string;
  invalidationConditions: string;
  decision: ResearchDecision;
  confidence: ResearchConfidence;
  status: ResearchStatus;
  nextReviewDate: string;
  reviewOutcome: string;
  createdAt: string;
  updatedAt: string;
}

export type ResearchProjectDraft = Omit<ResearchProject, 'id' | 'createdAt' | 'updatedAt'>;
