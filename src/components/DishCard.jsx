export default function DishCard({ dish, onEdit, onDelete }) {
  const isOutOfStock = !dish.disponible || Number(dish.stock) <= 0;

  return (
    <article
      className={`velora-dish-card ${isOutOfStock ? "is-out-of-stock" : ""}`}
    >
      <div className="velora-dish-media">
        <img
          src={dish.image}
          alt={dish.nom}
          className="velora-dish-img"
          loading="lazy"
        />
        <div className="velora-dish-overlay" />

        <span className="velora-dish-category">{dish.categorie}</span>

        <span
          className={`velora-status-pill ${
            isOutOfStock ? "status-unavailable" : "status-available"
          }`}
        >
          {isOutOfStock ? "Épuisé" : "Disponible"}
        </span>
      </div>

      <div className="velora-dish-body">
        <div className="velora-dish-header">
          <h3 className="velora-dish-title">{dish.nom}</h3>
          <span className="velora-dish-price">{dish.prix} DT</span>
        </div>

        <p className="velora-dish-desc">{dish.description}</p>

        <div className="velora-dish-footer">
          <div className="velora-dish-stock">
            <span
              className={`velora-stock-dot ${
                isOutOfStock ? "dot-empty" : "dot-ok"
              }`}
            />
            <span>
              {isOutOfStock
                ? "Rupture de stock (0)"
                : `Stock : ${dish.stock} portion${dish.stock > 1 ? "s" : ""}`}
            </span>
          </div>

          {(onEdit || onDelete) && (
            <div className="velora-dish-actions">
              {onEdit && (
                <button
                  type="button"
                  className="velora-btn-icon-edit"
                  onClick={() => onEdit(dish)}
                  title={`Modifier ${dish.nom}`}
                  aria-label={`Modifier ${dish.nom}`}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Modifier</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  className="velora-btn-icon-danger"
                  onClick={() => onDelete(dish.id)}
                  title={`Supprimer ${dish.nom}`}
                  aria-label={`Supprimer ${dish.nom}`}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  <span>Supprimer</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}