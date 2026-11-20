import { ORDER_STATUSES } from "../data/initialData";
import { VALID_STATUS_TRANSITIONS, getOrderTotal } from "../utils/storage";

const STATUS_CLASS_MAP = {
  "En attente": "order-status-pending",
  Confirmée: "order-status-confirmed",
  "En préparation": "order-status-preparing",
  Prête: "order-status-ready",
  Livrée: "order-status-delivered",
  Annulée: "order-status-cancelled",
};

export default function OrderCard({
  order,
  onStatusChange,
  onEdit,
  onViewDetails,
  onCancel,
  onDelete,
}) {
  const computedTotal = getOrderTotal(order);
  const badgeClass = STATUS_CLASS_MAP[order.statut] || "order-status-pending";
  const allowedNextStatuses = VALID_STATUS_TRANSITIONS[order.statut] || [];
  const isFinalized =
    order.statut === "Livrée" || order.statut === "Annulée";
  const canCancel = !isFinalized;

  return (
    <article className="velora-order-card">
      <div className="velora-order-top">
        <div>
          <div className="velora-order-meta">
            <span className="velora-order-id">Commande #{order.id}</span>
            <span className="velora-order-date">{order.date}</span>
          </div>
          <h3 className="velora-order-client">{order.client}</h3>
          {order.telephone && (
            <div className="velora-order-phone">{order.telephone}</div>
          )}
        </div>

        <span className={`velora-order-badge ${badgeClass}`}>
          {order.statut}
        </span>
      </div>

      <div className="velora-order-items">
        <div className="velora-order-items-label">
          Plats commandés ({order.plats.length})
        </div>
        <ul className="velora-order-list">
          {order.plats.map((item, index) => {
            const unitPrice = Number(item.prix) || 0;
            const qty = Number(item.quantite) || 0;
            const subtotal = unitPrice * qty;

            return (
              <li
                key={`${order.id}-${item.dishId || index}`}
                className="velora-order-item"
              >
                <div className="velora-order-item-info">
                  <span className="velora-order-qty">{qty}×</span>
                  <div>
                    <span className="velora-order-dish-name">{item.nom}</span>
                    <span className="velora-order-unit-price">
                      {" "}
                      ({unitPrice} DT / u)
                    </span>
                  </div>
                </div>
                <span className="velora-order-item-price">{subtotal} DT</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="velora-order-footer">
        <div className="velora-order-total-box">
          <span className="velora-order-total-label">Total</span>
          <span className="velora-order-total-value">{computedTotal} DT</span>
        </div>

        <div className="velora-order-actions flex-wrap">
          <label htmlFor={`status-${order.id}`} className="visually-hidden">
            Statut de la commande #{order.id}
          </label>
          <select
            id={`status-${order.id}`}
            className="velora-select-sm"
            value={order.statut}
            disabled={isFinalized}
            onChange={(e) => onStatusChange(order.id, e.target.value)}
            title={
              isFinalized
                ? `Commande clôturée (${order.statut})`
                : "Modifier le statut de la commande"
            }
          >
            {ORDER_STATUSES.map((status) => {
              const isCurrent = status === order.statut;
              const isAllowed = allowedNextStatuses.includes(status);
              return (
                <option
                  key={status}
                  value={status}
                  disabled={!isCurrent && !isAllowed}
                >
                  {status}
                </option>
              );
            })}
          </select>

          {onViewDetails && (
            <button
              type="button"
              className="velora-btn-icon-danger"
              onClick={() => onViewDetails(order)}
              title={`Détails de la commande #${order.id}`}
              aria-label={`Détails de la commande #${order.id}`}
            >
              Détails
            </button>
          )}

          {onEdit && !isFinalized && (
            <button
              type="button"
              className="velora-btn-icon-edit"
              onClick={() => onEdit(order)}
              title={`Modifier la commande #${order.id}`}
              aria-label={`Modifier la commande #${order.id}`}
            >
              Modifier
            </button>
          )}

          {onCancel && canCancel && (
            <button
              type="button"
              className="velora-btn-icon-danger"
              onClick={() => onCancel(order.id)}
              title={`Annuler la commande #${order.id} et restaurer le stock`}
              aria-label={`Annuler la commande #${order.id}`}
            >
              Annuler
            </button>
          )}

          <button
            type="button"
            className="velora-btn-icon-danger"
            onClick={() => onDelete(order)}
            title={`Supprimer la commande #${order.id}`}
            aria-label={`Supprimer la commande #${order.id}`}
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
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}