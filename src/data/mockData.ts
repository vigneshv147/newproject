import { Message, Channel, Alert, PrivacyAssessment } from '@/types';

export const mockChannels: Channel[] = [
  {
    id: 'channel-1',
    name: 'Cyber Crime Unit',
    type: 'group',
    participants: ['user-1', 'user-2', 'user-3'],
    unreadCount: 3,
  },
  {
    id: 'channel-2',
    name: 'Emergency Broadcast',
    type: 'broadcast',
    participants: ['user-1'],
    unreadCount: 0,
  },
  {
    id: 'channel-3',
    name: 'Investigation Team Alpha',
    type: 'group',
    participants: ['user-1', 'user-4', 'user-5'],
    unreadCount: 7,
  },
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'user-2',
    senderName: 'Officer Singh',
    content: 'New security alert detected. Please review.',
    timestamp: new Date(Date.now() - 3600000),
    encrypted: true,
    read: true,
    channelId: 'channel-1',
  },
  {
    id: 'msg-2',
    senderId: 'user-3',
    senderName: 'Analyst Kumar',
    content: 'Running analysis on the captured traffic. Results in 10 minutes.',
    timestamp: new Date(Date.now() - 1800000),
    encrypted: true,
    read: true,
    channelId: 'channel-1',
  },
  {
    id: 'msg-3',
    senderId: 'user-1',
    senderName: 'Admin',
    content: 'Confirmed. Priority level elevated to HIGH.',
    timestamp: new Date(Date.now() - 900000),
    encrypted: true,
    read: false,
    channelId: 'channel-1',
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    type: 'emergency',
    title: 'Critical Threat Detected',
    message: 'Multiple security attack vectors identified.',
    timestamp: new Date(Date.now() - 1800000),
    priority: 1,
    acknowledged: false,
  },
  {
    id: 'alert-2',
    type: 'warning',
    title: 'Unusual Traffic Pattern',
    message: 'Spike in encrypted traffic detected.',
    timestamp: new Date(Date.now() - 3600000),
    priority: 2,
    acknowledged: true,
    acknowledgedBy: 'user-2',
  },
  {
    id: 'alert-3',
    type: 'info',
    title: 'System Update Complete',
    message: 'Privacy assessment module updated to v2.3.1.',
    timestamp: new Date(Date.now() - 7200000),
    priority: 3,
    acknowledged: true,
    acknowledgedBy: 'user-1',
  },
];

export const mockPrivacyAssessment: PrivacyAssessment = {
  id: 'assessment-1',
  timestamp: new Date(),
  riskScore: 67,
  websiteFingerprint: ['Social Media', 'News Portal', 'E-commerce'],
  behaviorPatterns: ['Regular browsing intervals', 'Session duration: 45min avg', 'Multi-tab behavior'],
  recommendations: [
    'Enable packet padding for enhanced anonymity',
    'Implement traffic shaping to normalize patterns',
    'Use randomized delays between requests',
    'Consider VPN for additional security',
  ],
  defenseStatus: {
    packetPadding: false,
    trafficShaping: true,
    randomizedDelays: false,
  },
};

export const teamMembers = [
  { name: 'Sri Desiyan V', role: 'Team Lead & Backend Development' },
  { name: 'Vignesh V', role: 'Machine Learning & Data Analysis' },
  { name: 'Sheik Dharwish', role: 'Frontend & Visualization Design' },
  { name: 'Sreyas Badrinath', role: 'Testbed Infrastructure & DevOps' },
];
