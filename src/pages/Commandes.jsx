import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { ORDER_STATUSES } from "../data/initialData";
import { validateOrderForm } from "../utils/validation";
import { getOrderTotal } from "../utils/storage";
import SearchBar from "../components/SearchBar";
import OrderCard from "../components/OrderCard";
import ConfirmModal from "../components/ConfirmModal";

const createEmptyOrderForm = () => ({
  client: "",
  telephone: "",
  email: "",
  date: new Date().toISOString().slice(0, 10),
  statut: "En préparation",
  plats: [],
});

export default function Commandes({
  dishes = [],
  orders = [],
  customers = [],
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldAutoOpenNew = searchParams.get("new") === "1";
  const submitLockRef = useRef(false);

  const [searchClient, setSearchClient] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Toutes");
  const [feedback, setFeedback] = useState(null);

  // Order creation / edition modal state
  const [isModalOpen, setIsModalOpen] = useState(shouldAutoOpenNew);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState(createEmptyOrderForm);
  const [selectedDishId, setSelectedDishId] = useState(() => {
    const firstAvailable = dishes.find((d) => d.disponible && d.stock > 0);
    return firstAvailable ? String(firstAvailable.id) : "";
  });
  const [selectedQty, setSelectedQty] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Confirmation dialog state for destructive operations
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    eyebrow: "",
    title: "",
    message: "",
    confirmLabel: "",
    onConfirm: null,
  });

  const closeConfirm = () =>
    setConfirmState((prev) => ({ ...prev, isOpen: false, onConfirm: null }));

  const openCreateModal = () => {
    submitLockRef.current = false;
    setIsSubmitting(false);
    setEditingOrder(null);
    setOrderForm(createEmptyOrderForm());
    const firstAvailable = dishes.find((d) => d.disponible && d.stock > 0);
    setSelectedDishId(firstAvailable ? String(firstAvailable.id) : "");
    setSelectedQty(1);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (order) => {
    submitLockRef.current = false;
    setIsSubmitting(false);
    setEditingOrder(order);
    setOrderForm({
      client: order.client || "",
      telephone: order.telephone || "",
      email: order.email || "",
      date: order.date || new Date().toISOString().slice(0, 10),
      statut: order.statut || "En attente",
      plats: (order.plats || []).map((item) => ({ ...item })),
    });
    const firstAvailable = dishes.find((d) => d.disponible && d.stock > 0);
    setSelectedDishId(firstAvailable ? String(firstAvailable.id) : "");
    setSelectedQty(1);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    submitLockRef.current = false;
    setIsSubmitting(false);
    setIsModalOpen(false);
    setEditingOrder(null);
    setFormErrors({});
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setOrderForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "client") {
        const matched = customers.find(
          (c) => c.nom.toLowerCase() === value.trim().toLowerCase()
        );
        if (matched) {
          if (!prev.telephone && matched.telephone) {
            updated.telephone = matched.telephone;
          }
          if (!prev.email && matched.email) {
            updated.email = matched.email;
          }
        }
      }
      return updated;
    });

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleAddDishToOrder = () => {
    const dish = dishes.find((d) => String(d.id) === String(selectedDishId));
    if (!dish) {
      setFormErrors((prev) => ({
        ...prev,
        plats: "Veuillez sélectionner un plat valide.",
      }));
      return;
    }

    const qtyToAdd = Math.floor(Number(selectedQty));
    if (!Number.isInteger(qtyToAdd) || qtyToAdd < 1) {
      setFormErrors((prev) => ({
        ...prev,
        plats: "La quantité doit être un entier supérieur ou égal à 1.",
      }));
      return;
    }

    const alreadyReserved =
      editingOrder && editingOrder.stockDeducted
        ? (editingOrder.plats || [])
            .filter((p) => p.dishId === dish.id)
            .reduce((sum, p) => sum + Number(p.quantite), 0)
        : 0;
    const maxStock = Math.max(0, Number(dish.stock) || 0) + alreadyReserved;

    const existingIndex = orderForm.plats.findIndex(
      (p) => p.dishId === dish.id
    );
    const currentLineQty =
      existingIndex !== -1 ? orderForm.plats[existingIndex].quantite : 0;

    if (currentLineQty + qtyToAdd > maxStock) {
      setFormErrors((prev) => ({
        ...prev,
        plats: `Stock insuffisant pour « ${dish.nom} » (${maxStock} portion(s) disponible(s)).`,
      }));
      return;
    }

    setOrderForm((prev) => {
      const nextPlats = [...prev.plats];
      if (existingIndex !== -1) {
        nextPlats[existingIndex] = {
          ...nextPlats[existingIndex],
          quantite: nextPlats[existingIndex].quantite + qtyToAdd,
        };
      } else {
        nextPlats.push({
          dishId: dish.id,
          nom: dish.nom,
          quantite: qtyToAdd,
          prix: Number(dish.prix),
        });
      }
      return { ...prev, plats: nextPlats };
    });

    setSelectedQty(1);
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.plats;
      return next;
    });
  };

  const handleItemQtyChange = (dishId, nextQtyRaw) => {
    const nextQty = Math.floor(Number(nextQtyRaw));
    if (!Number.isInteger(nextQty) || nextQty < 1) {
      setFormErrors((prev) => ({
        ...prev,
        plats: "La quantité d'un article doit être au moins égale à 1.",
      }));
      return;
    }

    const dish = dishes.find((d) => d.id === dishId);
    const alreadyReserved =
      editingOrder && editingOrder.stockDeducted
        ? (editingOrder.plats || [])
            .filter((p) => p.dishId === dishId)
            .reduce((sum, p) => sum + Number(p.quantite), 0)
        : 0;
    const maxStock =
      (dish ? Math.max(0, Number(dish.stock) || 0) : 0) + alreadyReserved;

    if (nextQty > maxStock) {
      setFormErrors((prev) => ({
        ...prev,
        plats: `Stock insuffisant pour « ${
          dish ? dish.nom : "ce plat"
        } » (${maxStock} max).`,
      }));
      return;
    }

    setOrderForm((prev) => ({
      ...prev,
      plats: prev.plats.map((item) =>
        item.dishId === dishId ? { ...item, quantite: nextQty } : item
      ),
    }));

    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.plats;
      return next;
    });
  };

  const handleRemoveOrderItem = (dishId) => {
    setOrderForm((prev) => ({
      ...prev,
      plats: prev.plats.filter((item) => item.dishId !== dishId),
    }));
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;

    const validation = validateOrderForm(orderForm, dishes, editingOrder);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    const result = editingOrder
      ? updateOrder(editingOrder.id, validation.sanitized)
      : createOrder(validation.sanitized);

    if (!result || !result.ok) {
      setFormErrors(result?.errors || { plats: result?.error });
      submitLockRef.current = false;
      setIsSubmitting(false);
      return;
    }

    setFeedback({ type: "success", text: result.message });
    closeModal();
  };

  const handleStatusChangeRequest = (orderId, nextStatus) => {
    if (nextStatus === "Annulée") {
      setConfirmState({
        isOpen: true,
        eyebrow: "ANNULATION DE COMMANDE",
        title: `Annuler la commande #${orderId} ?`,
        message:
          "L'annulation est définitive et restaurera automatiquement les portions réservées en stock.",
        confirmLabel: "Confirmer l'annulation",
        onConfirm: () => {
          const res = updateOrderStatus(orderId, "Annulée");
          setFeedback({
            type: res.ok ? "success" : "error",
            text: res.ok ? res.message : res.error,
          });
          closeConfirm();
        },
      });
      return;
    }

    const res = updateOrderStatus(orderId, nextStatus);
    setFeedback({
      type: res.ok ? "success" : "error",
      text: res.ok ? res.message : res.error,
    });
  };

  const handleDeleteOrderRequest = (orderOrId) => {
    const targetId =
      typeof orderOrId === "object" && orderOrId !== null
        ? orderOrId.id
        : orderOrId;

    setConfirmState({
      isOpen: true,
      eyebrow: "SUPPRESSION DE COMMANDE",
      title: `Supprimer la commande #${targetId} ?`,
      message:
        "Voulez-vous vraiment supprimer cette commande de l'historique ? Si elle n'était pas livrée, son stock sera restauré.",
      confirmLabel: "Supprimer la commande",
      onConfirm: () => {
        deleteOrder(targetId);
        setFeedback({
          type: "success",
          text: `La commande #${targetId} a été supprimée.`,
        });
        closeConfirm();
      },
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedStatus === "Toutes" || order.statut === selectedStatus;
    const matchesClient = order.client
      .toLowerCase()
      .includes(searchClient.trim().toLowerCase());
    return matchesStatus && matchesClient;
  });

  const filteredAmount = filteredOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const liveFormTotal = orderForm.plats.reduce(
    (sum, item) => sum + Number(item.prix) * Number(item.quantite),
    0
  );

  return (
    <div className="velora-page velora-shell">
      <div className="velora-page-header">
        <div>
          <span className="velora-eyebrow">SERVICE & SALLE</span>
          <h1 className="velora-page-title">Gestion des Commandes</h1>
          <p className="velora-page-subtitle">
            {filteredOrders.length} commande
            {filteredOrders.length > 1 ? "s" : ""} affichée
            {filteredOrders.length > 1 ? "s" : ""} • Montant cumulé :{" "}
            <strong className="text-gold">{filteredAmount} DT</strong>
          </p>
        </div>

        {typeof createOrder === "function" && (
          <button
            type="button"
            className="velora-btn velora-btn-gold"
            onClick={openCreateModal}
          >
            + Nouvelle Commande
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`velora-feedback-banner ${
            feedback.type === "error" ? "is-error" : "is-success"
          }`}
          role="alert"
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            className="velora-feedback-close"
            onClick={() => setFeedback(null)}
            aria-label="Fermer la notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="velora-toolbar">
        <div className="velora-toolbar-search">
          <SearchBar
            value={searchClient}
            onChange={setSearchClient}
            placeholder="Rechercher par nom de client..."
          />
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

      {filteredOrders.length > 0 ? (
        <div className="velora-orders-grid">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onEdit={
                typeof updateOrder === "function" &&
                order.statut !== "Annulée" &&
                order.statut !== "Livrée"
                  ? () => openEditModal(order)
                  : undefined
              }
              onStatusChange={handleStatusChangeRequest}
              onDelete={handleDeleteOrderRequest}
            />
          ))}
        </div>
      ) : (
        <div className="velora-empty-state">
          <div className="velora-empty-icon" aria-hidden="true">
            ✦
          </div>
          <h3>Aucune commande trouvée</h3>
          <p>Aucune commande ne correspond à vos critères actuels.</p>
          <button
            type="button"
            className="velora-btn velora-btn-outline"
            onClick={() => {
              setSearchClient("");
              setSelectedStatus("Toutes");
            }}
          >
            Afficher toutes les commandes
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        eyebrow={confirmState.eyebrow}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={() => confirmState.onConfirm && confirmState.onConfirm()}
        onCancel={closeConfirm}
      />

      {isModalOpen &&
        createPortal(
          <div
            className="velora-modal-backdrop"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="velora-order-modal-title"
          >
            <div
              className="velora-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="velora-modal-header">
                <div>
                  <span className="velora-eyebrow mb-1">
                    {editingOrder ? "MODIFICATION" : "NOUVELLE COMMANDE"}
                  </span>
                  <h2
                    id="velora-order-modal-title"
                    className="velora-modal-title"
                  >
                    {editingOrder
                      ? `Modifier la commande #${editingOrder.id}`
                      : "Enregistrer une Commande"}
                  </h2>
                </div>
                <button
                  type="button"
                  className="velora-modal-close"
                  onClick={closeModal}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleOrderSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="order-client" className="velora-label">
                      Nom du client *
                    </label>
                    <input
                      id="order-client"
                      type="text"
                      name="client"
                      list="velora-customers-list"
                      maxLength={80}
                      aria-invalid={Boolean(formErrors.client)}
                      className={`velora-input ${
                        formErrors.client ? "is-invalid" : ""
                      }`}
                      placeholder="Ex: Amine Ben Ali"
                      value={orderForm.client}
                      onChange={handleFieldChange}
                    />
                    <datalist id="velora-customers-list">
                      {customers.map((c) => (
                        <option key={c.id} value={c.nom} />
                      ))}
                    </datalist>
                    {formErrors.client && (
                      <div className="velora-error-msg">{formErrors.client}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="order-telephone" className="velora-label">
                      Téléphone *
                    </label>
                    <input
                      id="order-telephone"
                      type="tel"
                      name="telephone"
                      maxLength={30}
                      aria-invalid={Boolean(formErrors.telephone)}
                      className={`velora-input ${
                        formErrors.telephone ? "is-invalid" : ""
                      }`}
                      placeholder="Ex: +216 22 345 678"
                      value={orderForm.telephone}
                      onChange={handleFieldChange}
                    />
                    {formErrors.telephone && (
                      <div className="velora-error-msg">
                        {formErrors.telephone}
                      </div>
                    )}
                  </div>

                  <div className="col-md-5">
                    <label htmlFor="order-email" className="velora-label">
                      E-mail (Optionnel)
                    </label>
                    <input
                      id="order-email"
                      type="email"
                      name="email"
                      maxLength={120}
                      aria-invalid={Boolean(formErrors.email)}
                      className={`velora-input ${
                        formErrors.email ? "is-invalid" : ""
                      }`}
                      placeholder="client@velora.tn"
                      value={orderForm.email}
                      onChange={handleFieldChange}
                    />
                    {formErrors.email && (
                      <div className="velora-error-msg">{formErrors.email}</div>
                    )}
                  </div>

                  <div className="col-md-3">
                    <label htmlFor="order-date" className="velora-label">
                      Date *
                    </label>
                    <input
                      id="order-date"
                      type="date"
                      name="date"
                      aria-invalid={Boolean(formErrors.date)}
                      className={`velora-input ${
                        formErrors.date ? "is-invalid" : ""
                      }`}
                      value={orderForm.date}
                      onChange={handleFieldChange}
                    />
                    {formErrors.date && (
                      <div className="velora-error-msg">{formErrors.date}</div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="order-statut" className="velora-label">
                      Statut *
                    </label>
                    <select
                      id="order-statut"
                      name="statut"
                      className="velora-input"
                      value={orderForm.statut}
                      onChange={handleFieldChange}
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label htmlFor="order-dish-select" className="velora-label">
                      Sélection des plats *
                    </label>
                    <div className="velora-upload-row">
                      <select
                        id="order-dish-select"
                        className="velora-input"
                        value={selectedDishId}
                        onChange={(e) => setSelectedDishId(e.target.value)}
                      >
                        <option value="">-- Choisir un plat --</option>
                        {dishes.map((dish) => {
                          const reserved =
                            editingOrder && editingOrder.stockDeducted
                              ? (editingOrder.plats || [])
                                  .filter((p) => p.dishId === dish.id)
                                  .reduce(
                                    (sum, p) => sum + Number(p.quantite),
                                    0
                                  )
                              : 0;
                          const effectiveStock =
                            Math.max(0, Number(dish.stock) || 0) + reserved;

                          return (
                            <option
                              key={dish.id}
                              value={dish.id}
                              disabled={effectiveStock <= 0}
                            >
                              {dish.nom} — {dish.prix} DT (
                              {effectiveStock > 0
                                ? `Stock : ${effectiveStock}`
                                : "Épuisé"}
                              )
                            </option>
                          );
                        })}
                      </select>

                      <input
                        type="number"
                        min="1"
                        max="99"
                        step="1"
                        aria-label="Quantité"
                        className="velora-input"
                        style={{ maxWidth: "96px" }}
                        value={selectedQty}
                        onChange={(e) => setSelectedQty(e.target.value)}
                      />

                      <button
                        type="button"
                        className="velora-upload-btn"
                        onClick={handleAddDishToOrder}
                      >
                        + Ajouter
                      </button>
                    </div>

                    {formErrors.plats && (
                      <div className="velora-error-msg">{formErrors.plats}</div>
                    )}

                    {orderForm.plats.length > 0 && (
                      <div className="velora-preset-box mt-3">
                        <ul className="velora-order-list">
                          {orderForm.plats.map((item) => (
                            <li
                              key={item.dishId}
                              className="velora-order-item py-1"
                            >
                              <div className="velora-order-item-info">
                                <span className="velora-order-dish-name">
                                  {item.nom}
                                </span>
                                <span className="text-gold">
                                  ({item.prix} DT)
                                </span>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  step="1"
                                  aria-label={`Quantité pour ${item.nom}`}
                                  className="velora-select-sm"
                                  style={{ width: "68px" }}
                                  value={item.quantite}
                                  onChange={(e) =>
                                    handleItemQtyChange(
                                      item.dishId,
                                      e.target.value
                                    )
                                  }
                                />
                                <span className="velora-order-item-price">
                                  {item.prix * item.quantite} DT
                                </span>
                                <button
                                  type="button"
                                  className="velora-btn-icon-danger"
                                  onClick={() =>
                                    handleRemoveOrderItem(item.dishId)
                                  }
                                  aria-label={`Retirer ${item.nom}`}
                                >
                                  ×
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top border-secondary">
                          <span className="velora-order-total-label">
                            Total calculé
                          </span>
                          <span className="velora-order-total-value">
                            {liveFormTotal} DT
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-12 pt-2 d-flex justify-content-end gap-2 flex-wrap">
                    <button
                      type="button"
                      className="velora-btn velora-btn-outline"
                      onClick={closeModal}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="velora-btn velora-btn-gold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? "Enregistrement..."
                        : editingOrder
                        ? "Enregistrer les modifications"
                        : "Valider la Commande"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}