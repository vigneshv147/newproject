import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface GlobeVisualizationProps {
    className?: string;
    isBackground?: boolean;
}

// Simplified continent outline points (lat, lng pairs for major landmasses)
const continentPoints: { [key: string]: [number, number][] } = {
    asia: [
        [35, 60], [40, 70], [45, 80], [50, 90], [55, 100], [60, 110], [55, 120], [50, 130], [45, 140], [40, 145],
        [35, 140], [30, 135], [25, 130], [20, 120], [15, 110], [10, 105], [5, 100], [0, 105], [-5, 110], [-8, 115],
        [8, 77], [13, 80], [18, 73], [23, 70], [28, 77], [33, 78], [30, 85], [25, 90], [20, 88], [15, 80],
    ],
    europe: [
        [35, -10], [40, -5], [45, 0], [50, 5], [55, 10], [60, 20], [65, 30], [70, 40], [65, 50], [55, 45],
        [50, 40], [45, 35], [40, 30], [38, 25], [36, 20], [38, 15], [40, 10], [38, 5], [36, 0],
    ],
    africa: [
        [35, -5], [30, 0], [25, 5], [20, 10], [15, 15], [10, 20], [5, 25], [0, 30], [-5, 35], [-10, 38],
        [-15, 35], [-20, 30], [-25, 28], [-30, 25], [-35, 20], [-33, 17], [-30, 15], [-25, 12], [-20, 10],
        [-15, 12], [-10, 15], [-5, 18], [0, 20], [5, 15], [10, 10], [15, 5], [20, 0], [25, -5], [30, -8], [35, -5],
    ],
    northAmerica: [
        [70, -170], [65, -160], [60, -150], [55, -135], [50, -125], [45, -125], [40, -120], [35, -118],
        [30, -115], [25, -110], [20, -105], [18, -100], [20, -95], [25, -90], [30, -85], [35, -80],
        [40, -75], [45, -70], [50, -65], [55, -60], [60, -70], [65, -80], [70, -100], [75, -120],
    ],
    southAmerica: [
        [10, -75], [5, -78], [0, -80], [-5, -81], [-10, -78], [-15, -75], [-20, -70], [-25, -65],
        [-30, -60], [-35, -58], [-40, -65], [-45, -70], [-50, -75], [-55, -68], [-50, -60], [-45, -55],
        [-40, -50], [-35, -45], [-30, -42], [-25, -45], [-20, -48], [-15, -50], [-10, -55], [-5, -60], [0, -65], [5, -70],
    ],
    australia: [
        [-12, 130], [-15, 135], [-18, 140], [-22, 145], [-25, 150], [-30, 152], [-35, 150], [-38, 145],
        [-37, 140], [-35, 135], [-32, 130], [-28, 125], [-24, 120], [-20, 118], [-16, 122], [-13, 128],
    ],
};

// City data
const cities = [
    { name: 'Chennai', lat: 13.08, lng: 80.27, size: 1.3 },
    { name: 'Bangalore', lat: 12.97, lng: 77.59, size: 1.1 },
    { name: 'Mumbai', lat: 19.08, lng: 72.88, size: 1.4 },
    { name: 'Delhi', lat: 28.61, lng: 77.21, size: 1.3 },
    { name: 'Kolkata', lat: 22.57, lng: 88.36, size: 1.0 },
    { name: 'Hyderabad', lat: 17.39, lng: 78.49, size: 1.1 },
    { name: 'London', lat: 51.51, lng: -0.13, size: 1.0 },
    { name: 'New York', lat: 40.71, lng: -74.01, size: 1.2 },
    { name: 'Tokyo', lat: 35.68, lng: 139.65, size: 1.1 },
    { name: 'Singapore', lat: 1.35, lng: 103.82, size: 0.9 },
    { name: 'Moscow', lat: 55.76, lng: 37.62, size: 0.9 },
    { name: 'Sydney', lat: -33.87, lng: 151.21, size: 0.8 },
    { name: 'Dubai', lat: 25.20, lng: 55.27, size: 0.9 },
    { name: 'Frankfurt', lat: 50.11, lng: 8.68, size: 0.8 },
    { name: 'Hong Kong', lat: 22.32, lng: 114.17, size: 1.0 },
];

const connections = [
    [0, 2], [0, 3], [1, 3], [2, 7], [3, 6], [4, 8], [5, 9], [6, 10], [7, 11],
    [8, 9], [9, 14], [12, 6], [0, 8], [2, 6], [3, 10], [1, 9], [5, 12], [13, 6],
];

export function GlobeVisualization({ className, isBackground = false }: GlobeVisualizationProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState(0);
    const [activeNodes, setActiveNodes] = useState<Set<number>>(new Set([0, 2, 7]));
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [glowIntensity, setGlowIntensity] = useState(0.5);
    const dragStartRef = useRef<{ x: number; rotation: number } | null>(null);
    const animationRef = useRef<number | null>(null);

    // Calculate container dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({
                    width: Math.max(rect.width, 400),
                    height: Math.max(rect.height, 400)
                });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Auto-rotation animation (slower when hovered, stops when dragging)
    useEffect(() => {
        const animate = () => {
            if (!isDragging) {
                const speed = isHovered ? 0.05 : 0.1;
                setRotation(prev => (prev + speed) % 360);
            }
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isDragging, isHovered]);

    // Random node activation
    useEffect(() => {
        const interval = setInterval(() => {
            const newActive = new Set<number>();
            for (let i = 0; i < 4; i++) {
                newActive.add(Math.floor(Math.random() * cities.length));
            }
            setActiveNodes(newActive);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    // Glow pulse effect
    useEffect(() => {
        const interval = setInterval(() => {
            setGlowIntensity(prev => 0.4 + Math.sin(Date.now() / 1000) * 0.2);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // Mouse handlers for interaction
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, rotation };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && dragStartRef.current) {
            const deltaX = e.clientX - dragStartRef.current.x;
            setRotation(dragStartRef.current.rotation + deltaX * 0.3);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        dragStartRef.current = null;
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
        setIsHovered(false);
        setIsDragging(false);
        dragStartRef.current = null;
    };

    const globeRadius = Math.min(dimensions.width, dimensions.height) * (isBackground ? 0.45 : 0.42);
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // Project lat/lng to 2D
    const project = useCallback((lat: number, lng: number) => {
        const adjustedLng = lng + rotation;
        const radLat = (lat * Math.PI) / 180;
        const radLng = (adjustedLng * Math.PI) / 180;
        const x = Math.cos(radLat) * Math.sin(radLng);
        const y = -Math.sin(radLat);
        const z = Math.cos(radLat) * Math.cos(radLng);
        return {
            x: centerX + x * globeRadius,
            y: centerY + y * globeRadius,
            z,
            visible: z > -0.1,
            opacity: z > 0 ? 1 : Math.max(0, (z + 0.1) * 8)
        };
    }, [rotation, centerX, centerY, globeRadius]);

    // Arc path generation
    const getArcPath = useCallback((from: typeof cities[0], to: typeof cities[0]) => {
        const p1 = project(from.lat, from.lng);
        const p2 = project(to.lat, to.lng);
        if (!p1.visible || !p2.visible) return null;
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        const curveHeight = Math.min(distance * 0.4, 60);
        const dx = centerX - midX;
        const dy = centerY - midY;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ctrlX = midX + (dx / len) * curveHeight;
        const ctrlY = midY + (dy / len) * curveHeight;
        return {
            path: `M ${p1.x} ${p1.y} Q ${ctrlX} ${ctrlY} ${p2.x} ${p2.y}`,
            opacity: Math.min(p1.opacity, p2.opacity) * 0.8,
        };
    }, [project, centerX, centerY]);

    // Continent dots
    const continentDots = useMemo(() => {
        const dots: { x: number; y: number; opacity: number }[] = [];
        for (let lat = -70; lat <= 70; lat += 5) {
            for (let lng = -180; lng <= 180; lng += 5) {
                let onLand = false;
                for (const [, points] of Object.entries(continentPoints)) {
                    for (const [pLat, pLng] of points) {
                        if (Math.abs(lat - pLat) < 10 && Math.abs(lng - pLng) < 12) {
                            onLand = true;
                            break;
                        }
                    }
                    if (onLand) break;
                }
                if (onLand) {
                    const pos = project(lat, lng);
                    if (pos.visible && pos.z > 0) {
                        dots.push({ x: pos.x, y: pos.y, opacity: pos.opacity * 0.7 });
                    }
                }
            }
        }
        return dots;
    }, [project]);

    const hoverGlow = isHovered ? 1.5 : 1;
    const baseOpacity = isBackground ? 0.85 : 1;

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full ${isBackground ? 'fixed inset-0 z-0' : ''} ${className || ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ opacity: baseOpacity }}
            >
                <defs>
                    {/* Enhanced glow gradients */}
                    <radialGradient id="globeBody" cx="35%" cy="30%" r="65%">
                        <stop offset="0%" stopColor="#0c4a6e" />
                        <stop offset="40%" stopColor="#082f49" />
                        <stop offset="100%" stopColor="#020617" />
                    </radialGradient>

                    <radialGradient id="atmosphereGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="60%" stopColor="#22d3ee" stopOpacity="0" />
                        <stop offset="80%" stopColor="#0891b2" stopOpacity={0.15 * glowIntensity * hoverGlow} />
                        <stop offset="90%" stopColor="#06b6d4" stopOpacity={0.3 * glowIntensity * hoverGlow} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.6 * glowIntensity * hoverGlow} />
                    </radialGradient>

                    <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3 * hoverGlow} />
                        <stop offset="50%" stopColor="#0891b2" stopOpacity={0.15 * hoverGlow} />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                    </radialGradient>

                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="20%" stopColor="#22d3ee" stopOpacity={0.4 * hoverGlow} />
                        <stop offset="50%" stopColor="#22d3ee" stopOpacity={0.8 * hoverGlow} />
                        <stop offset="80%" stopColor="#22d3ee" stopOpacity={0.4 * hoverGlow} />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>

                    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={2 * hoverGlow} result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation={4 * hoverGlow} result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <filter id="atmosphereBlur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={12 * hoverGlow} />
                    </filter>
                </defs>

                {/* Outer ambient glow */}
                <circle cx={centerX} cy={centerY} r={globeRadius * 1.8} fill="url(#outerGlow)" />

                {/* Atmosphere glow ring */}
                <circle
                    cx={centerX} cy={centerY} r={globeRadius * 1.15}
                    fill="none" stroke="#22d3ee" strokeWidth={20 * hoverGlow}
                    opacity={0.1 * glowIntensity} filter="url(#atmosphereBlur)"
                />

                {/* Orbital rings */}
                <ellipse
                    cx={centerX} cy={centerY} rx={globeRadius * 1.4} ry={globeRadius * 0.3}
                    fill="none" stroke="url(#ringGrad)" strokeWidth={1.5 * hoverGlow} opacity={0.5 * hoverGlow}
                    style={{ transform: `rotate(${rotation * 0.3 + 15}deg)`, transformOrigin: `${centerX}px ${centerY}px` }}
                />
                <ellipse
                    cx={centerX} cy={centerY} rx={globeRadius * 1.3} ry={globeRadius * 0.2}
                    fill="none" stroke="url(#ringGrad)" strokeWidth={1 * hoverGlow} opacity={0.3 * hoverGlow}
                    style={{ transform: `rotate(${-rotation * 0.2 + 60}deg)`, transformOrigin: `${centerX}px ${centerY}px` }}
                />

                {/* Globe atmosphere */}
                <circle cx={centerX} cy={centerY} r={globeRadius + 8} fill="url(#atmosphereGlow)" />

                {/* Globe body */}
                <circle
                    cx={centerX} cy={centerY} r={globeRadius}
                    fill="url(#globeBody)"
                    stroke="#22d3ee" strokeWidth={0.5 * hoverGlow}
                    opacity={0.95}
                    className="transition-all duration-300"
                />

                {/* Continent dots */}
                {continentDots.map((dot, i) => (
                    <circle
                        key={`dot-${i}`}
                        cx={dot.x} cy={dot.y} r={1.5 * hoverGlow}
                        fill="#22d3ee" opacity={dot.opacity * hoverGlow}
                    />
                ))}

                {/* Grid lines */}
                {[-45, 0, 45].map((lat) => {
                    const r = globeRadius * Math.cos((lat * Math.PI) / 180);
                    const y = centerY - globeRadius * Math.sin((lat * Math.PI) / 180);
                    return (
                        <ellipse
                            key={`lat-${lat}`}
                            cx={centerX} cy={y} rx={r} ry={r * 0.1}
                            fill="none" stroke="#22d3ee" strokeWidth="0.3"
                            opacity={0.15 * hoverGlow} strokeDasharray="3,5"
                        />
                    );
                })}

                {/* Connection arcs */}
                {connections.map(([fromIdx, toIdx], i) => {
                    const arc = getArcPath(cities[fromIdx], cities[toIdx]);
                    if (!arc) return null;
                    const isActive = activeNodes.has(fromIdx) || activeNodes.has(toIdx);
                    return (
                        <g key={`conn-${i}`}>
                            <path
                                d={arc.path} fill="none"
                                stroke={isActive ? '#fb923c' : '#22d3ee'}
                                strokeWidth={(isActive ? 1.5 : 0.6) * hoverGlow}
                                opacity={arc.opacity * (isActive ? 1 : 0.5) * hoverGlow}
                                filter={isActive ? 'url(#softGlow)' : undefined}
                            />
                            {isActive && (
                                <circle r={2.5 * hoverGlow} fill="#fbbf24" filter="url(#strongGlow)">
                                    <animateMotion dur={`${1.5 + (i % 4) * 0.5}s`} repeatCount="indefinite" path={arc.path} />
                                </circle>
                            )}
                        </g>
                    );
                })}

                {/* City nodes */}
                {cities.map((city, i) => {
                    const pos = project(city.lat, city.lng);
                    if (!pos.visible) return null;
                    const isActive = activeNodes.has(i);
                    const nodeSize = city.size * 3.5 * (isActive ? 1.4 : 1) * hoverGlow;
                    return (
                        <g key={`city-${i}`} opacity={pos.opacity}>
                            {isActive && (
                                <>
                                    <circle cx={pos.x} cy={pos.y} r={nodeSize * 4} fill="#fb923c" opacity="0.1">
                                        <animate attributeName="r" values={`${nodeSize * 2};${nodeSize * 5};${nodeSize * 2}`} dur="2s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx={pos.x} cy={pos.y} r={nodeSize * 2.5} fill="none" stroke="#fb923c" strokeWidth="0.8" opacity="0.4">
                                        <animate attributeName="r" values={`${nodeSize * 1.5};${nodeSize * 3};${nodeSize * 1.5}`} dur="1.5s" repeatCount="indefinite" />
                                    </circle>
                                </>
                            )}
                            <circle cx={pos.x} cy={pos.y} r={nodeSize * 2} fill={isActive ? '#fb923c' : '#22d3ee'} opacity={0.2} filter="url(#softGlow)" />
                            <circle cx={pos.x} cy={pos.y} r={nodeSize} fill={isActive ? '#fb923c' : '#22d3ee'} filter="url(#softGlow)" />
                            <circle cx={pos.x} cy={pos.y} r={nodeSize * 0.35} fill="#ffffff" opacity={isActive ? 1 : 0.7} />
                        </g>
                    );
                })}

                {/* Front orbital ring */}
                <ellipse
                    cx={centerX} cy={centerY} rx={globeRadius * 1.2} ry={globeRadius * 0.15}
                    fill="none" stroke="#22d3ee" strokeWidth={0.6 * hoverGlow}
                    opacity={0.4 * hoverGlow} strokeDasharray="4,4"
                    style={{ transform: `rotate(${rotation * 0.5}deg)`, transformOrigin: `${centerX}px ${centerY}px` }}
                />

                {/* Orbiting particles */}
                {[0, 1, 2].map((i) => {
                    const angle = ((rotation * 0.8 + i * 120) * Math.PI) / 180;
                    const px = centerX + Math.cos(angle) * globeRadius * 1.35;
                    const py = centerY + Math.sin(angle) * globeRadius * 0.28;
                    return (
                        <circle
                            key={`particle-${i}`}
                            cx={px} cy={py} r={2.5 * hoverGlow}
                            fill="#22d3ee" filter="url(#strongGlow)" opacity={0.8 * hoverGlow}
                        />
                    );
                })}
            </svg>

            {/* Interaction hint */}
            {isHovered && !isBackground && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-cyan-400/60 pointer-events-none">
                    Drag to rotate
                </div>
            )}

            {/* LIVE MONITORING Badge - only on non-background */}
            {!isBackground && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 text-xs font-medium tracking-wide">LIVE MONITORING ACTIVE</span>
                    </div>
                </div>
            )}
        </div>
    );
}
