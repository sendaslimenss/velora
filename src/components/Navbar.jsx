import { useState } from "react";
import { NavLink, Link } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Accueil" },
  { to: "/menu", label: "Menu" },
  { to: "/ajouter", label: "Ajouter" },
  { to: "/commandes", label: "Commandes" },
  { to: "/statistiques", label: "Statistiques" },
];

export function VeloraLogo({ className = "velora-logo-svg" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="VELORA"
    >
      <defs>
        {/* Translucent Champagne-Ivory Glass Fill (--ivory, --gold-light, --gold, --gold-soft) */}
        <linearGradient id="veloraSiteGold" x1="0%" y1="0%" x2="100%" y2="25%">
          <stop offset="0%" stopColor="#F6F1E7" stopOpacity="0.92" />
          <stop offset="24%" stopColor="#D4B26A" stopOpacity="0.78" />
          <stop offset="50%" stopColor="#F2DFB3" stopOpacity="0.95" />
          <stop offset="76%" stopColor="#BFA062" stopOpacity="0.76" />
          <stop offset="100%" stopColor="#E5CFA3" stopOpacity="0.90" />
        </linearGradient>

        {/* Crisp Beveled Glass Rim Stroke */}
        <linearGradient id="veloraGlassEdge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF8" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#F2DFB3" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#BFA062" stopOpacity="0.30" />
        </linearGradient>

        {/* Specular Liquid Glass Sheen Overlay */}
        <linearGradient id="veloraLetterSheen" x1="0%" y1="0%" x2="15%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="46%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="52%" stopColor="#D4B26A" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#F2DFB3" stopOpacity="0.22" />
        </linearGradient>

        {/* Left & Right Tapered Rule Gradients */}
        <linearGradient id="veloraTaperLeft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#BFA062" stopOpacity="0" />
          <stop offset="65%" stopColor="#D4B26A" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#F2DFB3" stopOpacity="0.98" />
        </linearGradient>
        <linearGradient id="veloraTaperRight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F2DFB3" stopOpacity="0.98" />
          <stop offset="35%" stopColor="#D4B26A" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#BFA062" stopOpacity="0" />
        </linearGradient>

        {/* Subtle Champagne Glass Halo */}
        <filter id="veloraChampagneGlow" x="-12%" y="-20%" width="124%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.9" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0.83  0 1 0 0 0.70  0 0 1 0 0.42  0 0 0 0.36 0"
            result="goldBlur"
          />
          <feMerge>
            <feMergeNode in="goldBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Clean Overlap Cutout Where Knife Crosses Over Fork */}
        <mask id="veloraForkCutout">
          <rect x="-40" y="-40" width="80" height="80" fill="white" />
          <g transform="rotate(42)">
            <rect x="-3.4" y="-22" width="6.8" height="44" rx="2.5" fill="black" />
          </g>
        </mask>
      </defs>

      {/* ==================== GLASSY VELORA WORDMARK ==================== */}
      <g filter="url(#veloraChampagneGlow)">
        <text
          x="180"
          y="53"
          textAnchor="middle"
          fill="url(#veloraSiteGold)"
          stroke="url(#veloraGlassEdge)"
          strokeWidth="0.65"
          fontFamily="'Cormorant Garamond', Georgia, 'Times New Roman', serif"
          fontSize="48"
          fontWeight="600"
          letterSpacing="12.5"
        >
          VELORΛ
        </text>
        {/* Top Specular Glass Reflection on Letters */}
        <text
          x="180"
          y="53"
          textAnchor="middle"
          fill="url(#veloraLetterSheen)"
          fontFamily="'Cormorant Garamond', Georgia, 'Times New Roman', serif"
          fontSize="48"
          fontWeight="600"
          letterSpacing="12.5"
        >
          VELORΛ
        </text>
      </g>

      {/* ==================== TAPERED NEEDLE RULES ==================== */}
      <polygon points="24,81 148,79.8 148,82.2" fill="url(#veloraTaperLeft)" />
      <polygon points="212,79.8 336,81 212,82.2" fill="url(#veloraTaperRight)" />

      {/* ==================== GLASSY CROSSED FORK & KNIFE CREST ==================== */}
      <g transform="translate(180, 81)" filter="url(#veloraChampagneGlow)">
        {/* Fork (Top-Left to Bottom-Right, Masked Under Knife) */}
        <g
          transform="rotate(-42)"
          mask="url(#veloraForkCutout)"
          fill="url(#veloraSiteGold)"
          stroke="url(#veloraGlassEdge)"
          strokeWidth="0.35"
        >
          <path d="M-1.2 1.5 L1.2 1.5 L1.9 18.5 C1.9 20.2 -1.9 20.2 -1.9 18.5 Z" />
          <rect x="-2.1" y="-0.5" width="4.2" height="1.6" rx="0.8" />
          <path d="M-1.4 -0.5 C-1.4 -4.5 -4.4 -6 -4.4 -9.5 L4.4 -9.5 C4.4 -6 1.4 -4.5 1.4 -0.5 Z" />
          <rect x="-4.4" y="-21" width="1.25" height="12" rx="0.6" />
          <rect x="-1.9" y="-21" width="1.25" height="12" rx="0.6" />
          <rect x="0.65" y="-21" width="1.25" height="12" rx="0.6" />
          <rect x="3.15" y="-21" width="1.25" height="12" rx="0.6" />
        </g>

        {/* Knife (Top-Right to Bottom-Left) */}
        <g
          transform="rotate(42)"
          fill="url(#veloraSiteGold)"
          stroke="url(#veloraGlassEdge)"
          strokeWidth="0.35"
        >
          <path d="M-1.3 1.5 L1.3 1.5 L2.0 18.5 C2.0 20.2 -2.0 20.2 -2.0 18.5 Z" />
          <rect x="-2.2" y="-0.5" width="4.4" height="1.6" rx="0.8" />
          <path d="M-2.0 -0.5 L2.2 -0.5 L2.2 -14.5 C2.2 -18.5 0.3 -21.2 -2.0 -21.5 Z" />
        </g>
      </g>
    </svg>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="velora-navbar">
      <div className="velora-shell velora-navbar-inner">
        <Link to="/" className="velora-brand" onClick={closeMenu}>
          <VeloraLogo />
        </Link>

        <button
          type="button"
          className="velora-nav-toggle"
          aria-label="Ouvrir le menu de navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span className={`velora-hamburger ${mobileOpen ? "is-open" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <nav className={`velora-nav-links ${mobileOpen ? "is-open" : ""}`}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={closeMenu}
              className={({ isActive }) =>
                `velora-nav-link ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}