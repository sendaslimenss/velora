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
        <linearGradient id="veloraGoldGrad" x1="0%" y1="0%" x2="100%" y2="15%">
          <stop offset="0%" stopColor="#F6E299" />
          <stop offset="24%" stopColor="#CFA649" />
          <stop offset="48%" stopColor="#F5DF96" />
          <stop offset="72%" stopColor="#B88E36" />
          <stop offset="100%" stopColor="#EDD382" />
        </linearGradient>
        <linearGradient id="veloraLineLeft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#CFA649" stopOpacity="0" />
          <stop offset="100%" stopColor="#F3D98B" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="veloraLineRight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F3D98B" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#CFA649" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* VELORA Luxury Serif Wordmark with Stylized Crossbar-less A */}
      <text
        x="180"
        y="52"
        textAnchor="middle"
        fill="url(#veloraGoldGrad)"
        fontFamily="'Cormorant Garamond', Georgia, 'Times New Roman', serif"
        fontSize="48"
        fontWeight="600"
        letterSpacing="13"
      >
        VELORΛ
      </text>

      {/* Left & Right Tapered Gold Rules */}
      <line
        x1="28"
        y1="80"
        x2="148"
        y2="80"
        stroke="url(#veloraLineLeft)"
        strokeWidth="1.6"
      />
      <line
        x1="212"
        y1="80"
        x2="332"
        y2="80"
        stroke="url(#veloraLineRight)"
        strokeWidth="1.6"
      />

      {/* Crossed Fork & Knife Crest */}
      <g transform="translate(180, 80)" fill="url(#veloraGoldGrad)">
        {/* Fork (top-left to bottom-right) */}
        <g transform="rotate(-42)">
          <rect x="-1.4" y="-3" width="2.8" height="21" rx="1.4" />
          <rect x="-4.5" y="-11" width="9" height="8.5" rx="2" />
          <rect x="-4.5" y="-21" width="1.4" height="11" rx="0.7" />
          <rect x="-1.9" y="-21" width="1.4" height="11" rx="0.7" />
          <rect x="0.6" y="-21" width="1.4" height="11" rx="0.7" />
          <rect x="3.1" y="-21" width="1.4" height="11" rx="0.7" />
        </g>

        {/* Knife (top-right to bottom-left) */}
        <g transform="rotate(42)">
          <rect x="-1.5" y="-1" width="3" height="19" rx="1.5" />
          <path d="M-2.2 -1 L2.2 -1 L2.2 -16 C2.2 -19.5 0.2 -21.5 -2.2 -21.5 Z" />
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