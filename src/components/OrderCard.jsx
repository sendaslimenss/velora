import { ORDER_STATUSES } from "../data/initialData";

const STATUS_CLASS_MAP = {
  "En attente": "order-status-pending",
  "En préparation": "order-status-preparing",
  Prête: "order-status-ready",
  Livrée: "order-status-delivered",
  Annulée: "order-status-cancelled",
};

export default function OrderCard({ order, onStatusChange, onDelete }) {
  const computedTotal =
    order.plats && order.plats.length > 0
      ? order.plats.reduce(
          (sum, item) => sum + Number(item.prix) * Number(item.quantite),
          0
        )
      : Number(order.total || 0);

  const badgeClass = STATUS_CLASS_MAP[order.statut] || "order-status-pending";

  return (
    <article className="velora-order-card">
      <div className="velora-order-top">
        <div>
          <div className="velora-order-meta">
            <span className="velora-order-id">Commande #{order.id}</span>
            <span className="velora-order-date">{order.date}</span>
          </div>
          <h3 className="velora-order-client">{order.client}</h3>
        </div>

        <span className={`velora-order-badge ${badgeClass}`}>
          {order.statut}
        </span>
      </div>

      <div className="velora-order-items">
        <div className="velora-order-items-label">Plats commandés</div>
        <ul className="velora-order-list">
          {order.plats.map((item, index) => (
            <li
              key={`${order.id}-${item.dishId || index}`}
              className="velora-order-item"
            >
              <div className="velora-order-item-info">
                <span className="velora-order-qty">{item.quantite}×</span>
                <span className="velora-order-dish-name">{item.nom}</span>
              </div>
              <span className="velora-order-item-price">
                {Number(item.prix) * Number(item.quantite)} DT
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="velora-order-footer">
        <div className="velora-order-total-box">
          <span className="velora-order-total-label">Total</span>
          <span className="velora-order-total-value">{computedTotal} DT</span>
        </div>

        <div className="velora-order-actions">
          <label
            htmlFor={`status-${order.id}`}
            className="visually-hidden"
          >
            Statut de la commande #{order.id}
          </label>
          <select
            id={`status-${order.id}`}
            className="velora-select-sm"
            value={order.statut}
            onChange={(e) => onStatusChange(order.id, e.target.value)}
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="velora-btn-icon-danger"
            onClick={() => onDelete(order.id)}
            title={`Supprimer la commande #${order.id}`}
            aria-label={`Supprimer la commande #${order.id}`}
          >
            <svg
              width="16"
              height="16"
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
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}