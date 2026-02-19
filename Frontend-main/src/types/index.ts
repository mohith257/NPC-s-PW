export interface MuleNode {
  id: string;
  name: string;
  riskScore: number;
  type: 'mule' | 'shell' | 'normal';
  flaggedPatterns: string[];
  accountAge?: string;
  totalVolume?: number;
  linkedAccounts?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value?: number;
}

export interface GraphData {
  nodes: MuleNode[];
  links: GraphLink[];
}

export interface DetectionResult {
  mules: MuleNode[];
  graph: GraphData;
  summary: {
    totalTransactions: number;
    flaggedAccounts: number;
    averageRiskScore: number;
    detectedCycles: number;
  };
}

export interface DossierData {
  id: string;
  name: string;
  riskScore: number;
  type: string;
  flaggedPatterns: string[];
  accountAge?: string;
  totalVolume?: number;
  linkedAccounts?: number;
}
