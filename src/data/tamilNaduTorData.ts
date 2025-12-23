import { TrackedIP, TorNode } from '@/types';

// Tamil Nadu districts with coordinates
export const tamilNaduDistricts = [
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, region: 'Tamil Nadu' },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, region: 'Tamil Nadu' },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198, region: 'Tamil Nadu' },
  { name: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047, region: 'Tamil Nadu' },
  { name: 'Salem', lat: 11.6643, lng: 78.1460, region: 'Tamil Nadu' },
  { name: 'Tirunelveli', lat: 8.7139, lng: 77.7567, region: 'Tamil Nadu' },
  { name: 'Vellore', lat: 12.9165, lng: 79.1325, region: 'Tamil Nadu' },
  { name: 'Erode', lat: 11.3410, lng: 77.7172, region: 'Tamil Nadu' },
  { name: 'Thanjavur', lat: 10.7870, lng: 79.1378, region: 'Tamil Nadu' },
  { name: 'Dindigul', lat: 10.3624, lng: 77.9695, region: 'Tamil Nadu' },
  { name: 'Tiruppur', lat: 11.1085, lng: 77.3411, region: 'Tamil Nadu' },
  { name: 'Kanchipuram', lat: 12.8342, lng: 79.7036, region: 'Tamil Nadu' },
];

// India cities (outside Tamil Nadu)
export const indiaLocations = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, region: 'Maharashtra', country: 'India', countryCode: 'IN' },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025, region: 'Delhi', country: 'India', countryCode: 'IN' },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, region: 'Karnataka', country: 'India', countryCode: 'IN' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, region: 'Telangana', country: 'India', countryCode: 'IN' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, region: 'West Bengal', country: 'India', countryCode: 'IN' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, region: 'Maharashtra', country: 'India', countryCode: 'IN' },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, region: 'Gujarat', country: 'India', countryCode: 'IN' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, region: 'Rajasthan', country: 'India', countryCode: 'IN' },
];

// Worldwide locations
export const worldwideLocations = [
  { name: 'Moscow', lat: 55.7558, lng: 37.6173, country: 'Russia', countryCode: 'RU' },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074, country: 'China', countryCode: 'CN' },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, country: 'China', countryCode: 'CN' },
  { name: 'Tehran', lat: 35.6892, lng: 51.3890, country: 'Iran', countryCode: 'IR' },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792, country: 'Nigeria', countryCode: 'NG' },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, country: 'Brazil', countryCode: 'BR' },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, country: 'Indonesia', countryCode: 'ID' },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784, country: 'Turkey', countryCode: 'TR' },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, country: 'Germany', countryCode: 'DE' },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, country: 'Netherlands', countryCode: 'NL' },
  { name: 'New York', lat: 40.7128, lng: -74.0060, country: 'United States', countryCode: 'US' },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, country: 'United States', countryCode: 'US' },
  { name: 'London', lat: 51.5074, lng: -0.1278, country: 'United Kingdom', countryCode: 'GB' },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: 'Singapore', countryCode: 'SG' },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, country: 'Hong Kong', countryCode: 'HK' },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, country: 'UAE', countryCode: 'AE' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan', countryCode: 'JP' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia', countryCode: 'AU' },
  { name: 'Pyongyang', lat: 39.0392, lng: 125.7625, country: 'North Korea', countryCode: 'KP' },
  { name: 'Bucharest', lat: 44.4268, lng: 26.1025, country: 'Romania', countryCode: 'RO' },
];

// Tamil Nadu focused Tor nodes
export const tamilNaduTorNodes: TorNode[] = [
  { id: 'node-chennai', name: 'Chennai Exit', type: 'exit', lat: 13.0827, lng: 80.2707, bandwidth: 150, connections: ['node-coimbatore', 'node-madurai'] },
  { id: 'node-coimbatore', name: 'Coimbatore Relay', type: 'relay', lat: 11.0168, lng: 76.9558, bandwidth: 100, connections: ['node-chennai', 'node-salem'] },
  { id: 'node-madurai', name: 'Madurai Entry', type: 'entry', lat: 9.9252, lng: 78.1198, bandwidth: 80, connections: ['node-chennai', 'node-trichy'] },
  { id: 'node-trichy', name: 'Trichy Relay', type: 'relay', lat: 10.7905, lng: 78.7047, bandwidth: 90, connections: ['node-madurai', 'node-salem'] },
  { id: 'node-salem', name: 'Salem Exit', type: 'exit', lat: 11.6643, lng: 78.1460, bandwidth: 70, connections: ['node-coimbatore', 'node-trichy'] },
  { id: 'node-vellore', name: 'Vellore Relay', type: 'relay', lat: 12.9165, lng: 79.1325, bandwidth: 60, connections: ['node-chennai', 'node-salem'] },
];

// Worldwide Tor nodes
export const worldwideTorNodes: TorNode[] = [
  ...tamilNaduTorNodes,
  { id: 'node-mumbai', name: 'Mumbai Exit', type: 'exit', lat: 19.0760, lng: 72.8777, bandwidth: 200, connections: ['node-chennai', 'node-delhi'] },
  { id: 'node-delhi', name: 'Delhi Relay', type: 'relay', lat: 28.7041, lng: 77.1025, bandwidth: 180, connections: ['node-mumbai', 'node-singapore'] },
  { id: 'node-singapore', name: 'Singapore Exit', type: 'exit', lat: 1.3521, lng: 103.8198, bandwidth: 250, connections: ['node-delhi', 'node-amsterdam'] },
  { id: 'node-amsterdam', name: 'Amsterdam Relay', type: 'relay', lat: 52.3676, lng: 4.9041, bandwidth: 300, connections: ['node-singapore', 'node-newyork'] },
  { id: 'node-newyork', name: 'New York Exit', type: 'exit', lat: 40.7128, lng: -74.0060, bandwidth: 280, connections: ['node-amsterdam', 'node-moscow'] },
  { id: 'node-moscow', name: 'Moscow Relay', type: 'relay', lat: 55.7558, lng: 37.6173, bandwidth: 220, connections: ['node-newyork', 'node-beijing'] },
  { id: 'node-beijing', name: 'Beijing Entry', type: 'entry', lat: 39.9042, lng: 116.4074, bandwidth: 190, connections: ['node-moscow', 'node-tokyo'] },
  { id: 'node-tokyo', name: 'Tokyo Exit', type: 'exit', lat: 35.6762, lng: 139.6503, bandwidth: 260, connections: ['node-beijing', 'node-sydney'] },
  { id: 'node-sydney', name: 'Sydney Relay', type: 'relay', lat: -33.8688, lng: 151.2093, bandwidth: 170, connections: ['node-tokyo', 'node-singapore'] },
];

// Threat level progression phases
export const threatProgressionPhases = [
  {
    level: 'low',
    behaviors: ['Anonymous Browsing', 'VPN Connection', 'Encrypted Traffic'],
    cooldown: 3600000, // 1 hour in ms
  },
  {
    level: 'medium',
    behaviors: ['Suspicious Downloads', 'Proxy Chain Detected', 'Multiple Exit Nodes'],
    cooldown: 7200000, // 2 hours in ms
  },
  {
    level: 'high',
    behaviors: ['Dark Web Access', 'Data Exfiltration Attempt', 'Credential Harvesting'],
    cooldown: 14400000, // 4 hours in ms
  },
  {
    level: 'critical',
    behaviors: ['Black Market Activity', 'Malware Distribution', 'Illegal Content Access', 'C2 Communication'],
    cooldown: 28800000, // 8 hours in ms
  },
];

// High traffic threshold for alerts (in bytes)
export const HIGH_TRAFFIC_THRESHOLD = 600;

// Generate realistic worldwide IP data with focus on Tamil Nadu and India
export function generateWorldwideTrackedIPs(count: number = 40): TrackedIP[] {
  const ips: TrackedIP[] = [];
  
  // Distribution: 50% Tamil Nadu, 25% India, 25% Worldwide
  const tamilNaduCount = Math.floor(count * 0.5);
  const indiaCount = Math.floor(count * 0.25);
  const worldwideCount = count - tamilNaduCount - indiaCount;
  
  // Tamil Nadu IPs
  for (let i = 0; i < tamilNaduCount; i++) {
    const district = tamilNaduDistricts[Math.floor(Math.random() * tamilNaduDistricts.length)];
    ips.push(generateIP(`tn-ip-${i}`, district.name, 'Tamil Nadu', 'India', 'IN', district.lat, district.lng));
  }
  
  // India IPs
  for (let i = 0; i < indiaCount; i++) {
    const city = indiaLocations[Math.floor(Math.random() * indiaLocations.length)];
    ips.push(generateIP(`in-ip-${i}`, city.name, city.region, city.country, city.countryCode, city.lat, city.lng));
  }
  
  // Worldwide IPs
  for (let i = 0; i < worldwideCount; i++) {
    const city = worldwideLocations[Math.floor(Math.random() * worldwideLocations.length)];
    ips.push(generateIP(`ww-ip-${i}`, city.name, city.name, city.country, city.countryCode, city.lat, city.lng));
  }
  
  // Sort by threat level (critical first)
  const threatOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return ips.sort((a, b) => threatOrder[a.threatLevel] - threatOrder[b.threatLevel]);
}

function generateIP(id: string, city: string, region: string, country: string, countryCode: string, lat: number, lng: number): TrackedIP {
  const hoursSinceFirstSeen = Math.floor(Math.random() * 168);
  const firstSeen = new Date(Date.now() - hoursSinceFirstSeen * 3600000);
  
  // Calculate threat progression based on time active (with cooldown)
  let threatPhaseIndex = 0;
  let accumulatedTime = 0;
  
  for (let j = 0; j < threatProgressionPhases.length; j++) {
    accumulatedTime += threatProgressionPhases[j].cooldown;
    if (hoursSinceFirstSeen * 3600000 >= accumulatedTime) {
      threatPhaseIndex = j + 1;
    }
  }
  
  threatPhaseIndex = Math.min(threatPhaseIndex, threatProgressionPhases.length - 1);
  
  const isLegitUser = Math.random() < 0.3;
  if (isLegitUser) {
    threatPhaseIndex = 0;
  }
  
  const phase = threatProgressionPhases[threatPhaseIndex];
  const riskScores = { low: 25, medium: 50, high: 75, critical: 95 };
  
  const latVariation = (Math.random() - 0.5) * 0.1;
  const lngVariation = (Math.random() - 0.5) * 0.1;
  
  // Generate bytes transferred - higher threat = more traffic
  const baseBytes = 100 + Math.floor(Math.random() * 400);
  const threatMultiplier = threatPhaseIndex + 1;
  const bytesTransferred = baseBytes * threatMultiplier + Math.floor(Math.random() * 300);
  
  // Generate IP prefix based on country
  const ipPrefixes: Record<string, string> = {
    'IN': '103', 'RU': '95', 'CN': '223', 'US': '72', 'GB': '81', 'DE': '178',
    'NL': '185', 'JP': '203', 'AU': '203', 'SG': '175', 'BR': '186', 'KP': '175',
    'IR': '5', 'NG': '197', 'ID': '36', 'TR': '88', 'AE': '94', 'HK': '202', 'RO': '86'
  };
  const ipPrefix = ipPrefixes[countryCode] || '10';
  
  return {
    id,
    ip: `${ipPrefix}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    country,
    countryCode,
    city,
    region,
    lat: lat + latVariation,
    lng: lng + lngVariation,
    riskScore: riskScores[phase.level as keyof typeof riskScores] + Math.floor(Math.random() * 10) - 5,
    threatLevel: phase.level as 'low' | 'medium' | 'high' | 'critical',
    firstSeen,
    lastSeen: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
    requestCount: Math.floor(100 + Math.random() * 900 * (threatPhaseIndex + 1)),
    bytesTransferred,
    exitNode: worldwideTorNodes[Math.floor(Math.random() * worldwideTorNodes.length)].name,
    fingerprint: `${countryCode}-FP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    behaviors: phase.behaviors.slice(0, Math.floor(Math.random() * phase.behaviors.length) + 1),
  };
}

// Check if IP exceeds high traffic threshold
export function isHighTrafficIP(ip: TrackedIP): boolean {
  return (ip.bytesTransferred || 0) > HIGH_TRAFFIC_THRESHOLD;
}

// Get IPs that exceed traffic threshold
export function getHighTrafficAlerts(ips: TrackedIP[]): TrackedIP[] {
  return ips.filter(ip => isHighTrafficIP(ip));
}

// Legacy function for backward compatibility
export function generateTamilNaduTrackedIPs(count: number = 15): TrackedIP[] {
  return generateWorldwideTrackedIPs(count);
}

// Get threat progression info for an IP
export function getThreatProgressionInfo(ip: TrackedIP): {
  currentPhase: string;
  nextPhase: string | null;
  timeToNextPhase: number | null;
  coolingDown: boolean;
} {
  const phases = threatProgressionPhases;
  const currentIndex = phases.findIndex(p => p.level === ip.threatLevel);
  const timeSinceFirstSeen = Date.now() - ip.firstSeen.getTime();
  
  let accumulatedTime = 0;
  for (let i = 0; i <= currentIndex; i++) {
    accumulatedTime += phases[i].cooldown;
  }
  
  const coolingDown = timeSinceFirstSeen < accumulatedTime;
  const nextPhase = currentIndex < phases.length - 1 ? phases[currentIndex + 1].level : null;
  const timeToNextPhase = nextPhase && currentIndex < phases.length - 1 
    ? accumulatedTime + phases[currentIndex + 1].cooldown - timeSinceFirstSeen 
    : null;
  
  return {
    currentPhase: phases[currentIndex].level,
    nextPhase,
    timeToNextPhase: timeToNextPhase && timeToNextPhase > 0 ? timeToNextPhase : null,
    coolingDown,
  };
}
