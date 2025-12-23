export type UserRole = 'admin' | 'dispatcher' | 'officer' | 'support';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  badgeNumber?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  encrypted: boolean;
  read: boolean;
  channelId: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'broadcast';
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface Alert {
  id: string;
  type: 'emergency' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  priority: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

export interface PrivacyAssessment {
  id: string;
  timestamp: Date;
  riskScore: number;
  websiteFingerprint: string[];
  behaviorPatterns: string[];
  recommendations: string[];
  defenseStatus: {
    packetPadding: boolean;
    trafficShaping: boolean;
    randomizedDelays: boolean;
  };
}
