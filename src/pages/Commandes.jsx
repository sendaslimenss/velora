import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { ORDER_STATUSES } from "../data/initialData";
import { getOrderTotal, isCommittedStatus } from "../utils/storage";
import SearchBar from "../components/SearchBar";
import OrderCard from "../components/OrderCard";
import OrderFormModal from "../components/OrderFormModal";

export default function Commandes({
  dishes,
  orders,
  customers,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchOrderQuery, setSearchOrderQuery] = useState("");
  const [searchClient, setSearchClient] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Toutes");
  const [selectedDate, setSelectedDate] = useState("");

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingOrder(null);
      setIsOrderModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleOpenCreateModal = () => {
    setEditingOrder(null);
    setIsOrderModalOpen(true);
  };

  const handleOpenEditModal = (order) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setEditingOrder(null);
  };

  const handleSaveOrder = (payload) => {
    const result = editingOrder
      ? updateOrder(editingOrder.id, payload)
      : createOrder(payload);

    if (result.ok) {
      setFeedback({ type: "success", text: result.message });
    }
    return result;
  };

  const handleStatusChange = (orderId, nextStatus) => {
    const result = updateOrderStatus(orderId, nextStatus);
    if (result.ok) {
      setFeedback({ type: "success", text: result.message });
      if (detailOrder && detailOrder.id === orderId) {
        setDetailOrder((prev) =>
          prev
            ? {
                ...prev,
                statut: nextStatus,
                stockDeducted: isCommittedStatus(nextStatus),
              }
            : null
        );
      }
    } else {
      setFeedback({ type: "error", text: result.error });
    }
  };

  const handleCancelOrder = (orderId) => {
    handleStatusChange(orderId, "Annulée");
  };

  const handleConfirmDeleteOrder = () => {
    if (!orderToDelete) return;
    const deletedId = orderToDelete.id;
    const hadReservedStock =
      orderToDelete.stockDeducted && orderToDelete.statut !== "Livrée";
    deleteOrder(deletedId);
    if (detailOrder && detailOrder.id === deletedId) {
      setDetailOrder(null);
    }
    setOrderToDelete(null);
    setFeedback({
      type: "success",
      text: hadReservedStock
        ? `Commande #${deletedId} supprimée et stock réservé restauré.`
        : `Commande #${deletedId} supprimée.`,
    });
  };

  const handleResetFilters = () => {
    setSearchOrderQuery("");
    setSearchClient("");
    setSelectedStatus("Toutes");
    setSelectedDate("");
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedStatus === "Toutes" || order.statut === selectedStatus;

    const clientTerm = searchClient.trim().toLowerCase();
    const matchesClient =
      !clientTerm ||
      order.client.toLowerCase().includes(clientTerm) ||
      (order.telephone || "").toLowerCase().includes(clientTerm);

    const orderTerm = searchOrderQuery.trim().toLowerCase().replace(/^#/, "");
    const matchesOrder =
      !orderTerm ||
      String(order.id).toLowerCase().includes(orderTerm) ||
      (order.plats || []).some((p) =>
        p.nom.toLowerCase().includes(orderTerm)
      );

    const matchesDate = !selectedDate || order.date === selectedDate;

    return matchesStatus && matchesClient && matchesOrder && matchesDate;
  });

  const filteredAmount = filteredOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const hasActiveFilters =
    Boolean(searchOrderQuery) ||
    Boolean(searchClient) ||
    selectedStatus !== "Toutes" ||
    Boolean(selectedDate);

  return (
    <div className="velora-page velora-shell">
      <div className="velora-page-header">
        <div>
          <span className="velora-eyebrow velora-reveal-1">
            SERVICE & SALLE
          </span>
          <h1 className="velora-page-title velora-reveal-2">
            Gestion des Commandes
          </h1>
          <p className="velora-page-subtitle velora-reveal-3">
            {filteredOrders.length} commande
            {filteredOrders.length > 1 ? "s" : ""} affichée
            {filteredOrders.length > 1 ? "s" : ""} • Montant cumulé :{" "}
            <strong className="text-gold">{filteredAmount} DT</strong>
          </p>
        </div>

        <button
          type="button"
          className="velora-btn velora-btn-gold velora-reveal-3"
          onClick={handleOpenCreateModal}
        >
          + Nouvelle Commande
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`velora-alert-banner ${
            feedback.type === "error" ? "is-error" : "is-success"
          } mb-4`}
          role="status"
        >
          <span>
            {feedback.type === "error" ? "⚠ " : "✦ "}
            {feedback.text}
          </span>
          <button
            type="button"
            className="velora-alert-close"
            onClick={() => setFeedback(null)}
            aria-label="Fermer la notification"
          >
            ×
          </button>
        </div>
      )}

      {/* SEARCH & MULTI-CRITERIA FILTERS */}
      <div className="velora-orders-filters-panel mb-4">
        <div className="row g-3 align-items-center mb-3">
          <div className="col-md-4">
            <SearchBar
              value={searchOrderQuery}
              onChange={setSearchOrderQuery}
              placeholder="Rechercher N° commande (#1001) ou plat..."
            />
          </div>

          <div className="col-md-4">
            <SearchBar
              value={searchClient}
              onChange={setSearchClient}
              placeholder="Rechercher par nom de client..."
            />
          </div>

          <div className="col-md-4 d-flex gap-2 align-items-center">
            <label htmlFor="filter-order-date" className="visually-hidden">
              Filtrer par date
            </label>
            <input
              id="filter-order-date"
              type="date"
              className="velora-input velora-date-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Filtrer par date"
            />
            {hasActiveFilters && (
              <button
                type="button"
                className="velora-btn velora-btn-outline-sm"
                onClick={handleResetFilters}
                style={{ whiteSpace: "nowrap" }}
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        <div
          className="velora-filter-pills"
          role="tablist"
          aria-label="Filtrer par statut de commande"
        >
          {["Toutes", ...ORDER_STATUSES].map((status) => {
            const count =
              status === "Toutes"
                ? orders.length
                : orders.filter((o) => o.statut === status).length;

            return (
              <button
                key={status}
                type="button"
                className={`velora-pill ${
                  selectedStatus === status ? "active" : ""
                }`}
                onClick={() => setSelectedStatus(status)}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ORDERS GRID */}
      {filteredOrders.length > 0 ? (
        <div className="velora-orders-grid">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              onEdit={handleOpenEditModal}
              onViewDetails={setDetailOrder}
              onCancel={handleCancelOrder}
              onDelete={setOrderToDelete}
            />
          ))}
        </div>
      ) : (
        <div className="velora-empty-state">
          <div className="velora-empty-icon" aria-hidden="true">
            ✦
          </div>
          <h3>Aucune commande trouvée</h3>
          <p>
            Aucune commande ne correspond à vos critères de recherche actuels.
          </p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            {hasActiveFilters && (
              <button
                type="button"
                className="velora-btn velora-btn-outline"
                onClick={handleResetFilters}
              >
                Afficher toutes les commandes
              </button>
            )}
            <button
              type="button"
              className="velora-btn velora-btn-gold"
              onClick={handleOpenCreateModal}
            >
              + Créer une commande
            </button>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ORDER MODAL */}
      <OrderFormModal
        isOpen={isOrderModalOpen}
        editingOrder={editingOrder}
        dishes={dishes}
        customers={customers}
        onClose={handleCloseOrderModal}
        onSubmitOrder={handleSaveOrder}
      />

      {/* ORDER DETAILS MODAL */}
      {detailOrder &&
        createPortal(
          <div
            className="velora-modal-backdrop"
            onClick={() => setDetailOrder(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="velora-detail-modal-title"
          >
            <div
              className="velora-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="velora-modal-header">
                <div>
                  <span className="velora-eyebrow mb-1">
                    DÉTAILS DE LA COMMANDE
                  </span>
                  <h2
                    id="velora-detail-modal-title"
                    className="velora-modal-title"
                  >
                    Commande #{detailOrder.id} — {detailOrder.client}
                  </h2>
                </div>
                <button
                  type="button"
                  className="velora-modal-close"
                  onClick={() => setDetailOrder(null)}
                  aria-label="Fermer les détails"
                >
                  ×
                </button>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-sm-4">
                  <div className="velora-order-total-label">Date</div>
                  <div className="text-ivory">{detailOrder.date}</div>
                </div>
                <div className="col-sm-4">
                  <div className="velora-order-total-label">Statut</div>
                  <div className="text-gold fw-semibold">
                    {detailOrder.statut}
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="velora-order-total-label">Contact / Table</div>
                  <div className="text-ivory">
                    {detailOrder.telephone || "Non renseigné"}
                  </div>
                </div>
              </div>

              <div className="table-responsive mb-3">
                <table className="velora-table">
                  <thead>
                    <tr>
                      <th>Plat</th>
                      <th>Prix Unitaire</th>
                      <th>Quantité</th>
                      <th>Sous-total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailOrder.plats || []).map((item, idx) => (
                      <tr key={`${detailOrder.id}-det-${idx}`}>
                        <td className="text-ivory fw-semibold">{item.nom}</td>
                        <td className="text-gold">{item.prix} DT</td>
                        <td>{item.quantite}</td>
                        <td className="text-ivory fw-semibold">
                          {Number(item.prix) * Number(item.quantite)} DT
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="velora-order-summary-bar">
                <div>
                  <div className="velora-order-total-label">
                    Gestion du Stock
                  </div>
                  <div className="text-ivory" style={{ fontSize: "0.86rem" }}>
                    {detailOrder.stockDeducted
                      ? "Stock déduit et synchronisé"
                      : detailOrder.statut === "Annulée"
                      ? "Stock restauré suite à l'annulation"
                      : "En attente de confirmation"}
                  </div>
                </div>
                <div
                  className="velora-order-total-value"
                  style={{ fontSize: "1.6rem" }}
                >
                  Total : {getOrderTotal(detailOrder)} DT
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* DELETE CONFIRMATION MODAL */}
      {orderToDelete &&
        createPortal(
          <div
            className="velora-modal-backdrop"
            onClick={() => setOrderToDelete(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="velora-delete-modal-title"
          >
            <div
              className="velora-modal-card"
              style={{ maxWidth: "500px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="velora-modal-header">
                <div>
                  <span className="velora-eyebrow mb-1">CONFIRMATION</span>
                  <h2
                    id="velora-delete-modal-title"
                    className="velora-modal-title"
                  >
                    Supprimer la Commande #{orderToDelete.id} ?
                  </h2>
                </div>
                <button
                  type="button"
                  className="velora-modal-close"
                  onClick={() => setOrderToDelete(null)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>

              <p className="text-ivory mb-2">
                Client : <strong>{orderToDelete.client}</strong> • Total :{" "}
                <strong className="text-gold">
                  {getOrderTotal(orderToDelete)} DT
                </strong>
              </p>
              <p className="velora-page-subtitle mb-4">
                {orderToDelete.stockDeducted &&
                orderToDelete.statut !== "Livrée"
                  ? "Cette commande est active : sa suppression restaurera automatiquement les quantités réservées en stock."
                  : "Cette action est définitive."}
              </p>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="velora-btn velora-btn-outline"
                  onClick={() => setOrderToDelete(null)}
                >
                  Conserver
                </button>
                <button
                  type="button"
                  className="velora-btn velora-btn-gold"
                  onClick={handleConfirmDeleteOrder}
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}