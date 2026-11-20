export default function SearchBar({
  value,
  onChange,
  placeholder = "Rechercher...",
}) {
  return (
    <div className="velora-search-wrap">
      <span className="velora-search-icon" aria-hidden="true">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>

      <input
        type="text"
        className="velora-search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />

      {value && (
        <button
          type="button"
          className="velora-search-clear"
          onClick={() => onChange("")}
          aria-label="Effacer la recherche"
        >
          ×
        </button>
      )}
    </div>
  );
}