// Logo configuration for Cyber Crime Wing branding
// This file provides a centralized logo reference that can be used across all components

// Use the uploaded logo from the public folder
// If the logo isn't showing, make sure to copy the logo file to public/logo.jpg
export const LOGO_PATH = '/logo.jpg';

// Fallback SVG logo if the image doesn't load
export const LOGO_FALLBACK_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <circle cx="50" cy="50" r="48" stroke="#0891b2" stroke-width="2" fill="#1e293b"/>
  <circle cx="50" cy="50" r="35" stroke="#06b6d4" stroke-width="1.5" fill="none"/>
  <path d="M50 20 L65 40 L60 40 L60 60 L55 60 L55 45 L50 38 L45 45 L45 60 L40 60 L40 40 L35 40 Z" fill="#06b6d4"/>
  <text x="50" y="75" text-anchor="middle" fill="#06b6d4" font-size="8" font-family="sans-serif">CYBER CRIME</text>
  <text x="50" y="85" text-anchor="middle" fill="#06b6d4" font-size="6" font-family="sans-serif">TN POLICE</text>
</svg>
`)}`;

// Component to render the logo with fallback
export function getLogoSrc(): string {
    return LOGO_PATH;
}
