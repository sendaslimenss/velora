import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function OrderFormModal({
  isOpen,
  editingOrder = null,
  dishes = [],
  customers = [],
  onClose,
  onSubmitOrder,
}) {
  const isEditMode = Boolean(editingOrder);

  const [customerMode, setCustomerMode] = useState("new");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [clientName, setClientName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [orderDate, setOrderDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [initialStatus, setInitialStatus] = useState("Confirmée");

  const [pickerDishId, setPickerDishId] = useState("");
  const [pickerQty, setPickerQty] = useState(1);
  const [orderItems, setOrderItems] = useState([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setFormError("");
    const firstAvailable = dishes.find(
      (d) => d.disponible && Number(d.stock) > 0
    );
    setPickerDishId(firstAvailable ? String(firstAvailable.id) : "");
    setPickerQty(1);

    if (editingOrder) {
      setCustomerMode("new");
      setSelectedCustomerId("");
      setClientName(editingOrder.client || "");
      setTelephone(editingOrder.telephone || "");
      setOrderDate(
        editingOrder.date || new Date().toISOString().slice(0, 10)
      );
      setInitialStatus(editingOrder.statut || "Confirmée");
      setOrderItems(
        (editingOrder.plats || []).map((item) => ({
          dishId: item.dishId,
          nom: item.nom,
          prix: Number(item.prix) || 0,
          quantite: Number(item.quantite) || 1,
        }))
      );
    } else {
      setCustomerMode(customers.length > 0 ? "existing" : "new");
      if (customers.length > 0) {
        setSelectedCustomerId(String(customers[0].id));
        setClientName(customers[0].nom);
        setTelephone(customers[0].telephone || "");
      } else {
        setSelectedCustomerId("");
        setClientName("");
        setTelephone("");
      }
      setOrderDate(new Date().toISOString().slice(0, 10));
      setInitialStatus("Confirmée");
      setOrderItems([]);
    }
  }, [isOpen, editingOrder]);

  if (!isOpen) return null;

  const getMaxAllowedForDish = (dishId) => {
    const dish = dishes.find((d) => d.id === dishId);
    const currentMenuStock = dish ? Math.max(0, Number(dish.stock) || 0) : 0;

    if (isEditMode && editingOrder?.stockDeducted) {
      const previouslyReserved = (editingOrder.plats || [])
        .filter((p) => p.dishId === dishId)
        .reduce((sum, p) => sum + (Number(p.quantite) || 0), 0);
      return currentMenuStock + previouslyReserved;
    }

    return currentMenuStock;
  };

  const handleSelectExistingCustomer = (e) => {
    const idVal = e.target.value;
    setSelectedCustomerId(idVal);
    setFormError("");
    const found = customers.find((c) => String(c.id) === idVal);
    if (found) {
      setClientName(found.nom);
      setTelephone(found.telephone || "");
    }
  };

  const handleCustomerModeSwitch = (mode) => {
    setCustomerMode(mode);
    setFormError("");
    if (mode === "existing" && customers.length > 0) {
      const first = customers[0];
      setSelectedCustomerId(String(first.id));
      setClientName(first.nom);
      setTelephone(first.telephone || "");
    } else if (mode === "new") {
      setSelectedCustomerId("");
      setClientName("");
      setTelephone("");
    }
  };

  const handleAddDishToOrder = () => {
    setFormError("");
    const dishIdNum = Number(pickerDishId);
    const dish = dishes.find((d) => d.id === dishIdNum);

    if (!dish) {
      setFormError("Veuillez sélectionner un plat valide dans la liste.");
      return;
    }

    const qtyToAdd = Math.floor(Number(pickerQty));
    if (!Number.isInteger(qtyToAdd) || qtyToAdd <= 0) {
      setFormError("La quantité à ajouter doit être supérieure ou égale à 1.");
      return;
    }

    const maxAllowed = getMaxAllowedForDish(dish.id);
    const existingLine = orderItems.find((item) => item.dishId === dish.id);
    const currentLineQty = existingLine ? existingLine.quantite : 0;
    const nextTotalQty = currentLineQty + qtyToAdd;

    if (maxAllowed <= 0) {
      setFormError(
        `Stock insuffisant : « ${dish.nom} » est actuellement épuisé (0 disponible).`
      );
      return;
    }

    if (nextTotalQty > maxAllowed) {
      setFormError(
        `Stock insuffisant pour « ${dish.nom} » : quantité totale demandée (${nextTotalQty}) supérieure au stock disponible (${maxAllowed}).`
      );
      return;
    }

    if (existingLine) {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.dishId === dish.id
            ? { ...item, quantite: nextTotalQty, prix: Number(dish.prix) }
            : item
        )
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          dishId: dish.id,
          nom: dish.nom,
          prix: Number(dish.prix),
          quantite: qtyToAdd,
        },
      ]);
    }

    setPickerQty(1);
  };

  const handleQuantityChange = (dishId, rawValue) => {
    setFormError("");
    const parsed = parseInt(rawValue, 10);
    const nextQty = Number.isNaN(parsed) ? 0 : parsed;

    setOrderItems((prev) =>
      prev.map((item) =>
        item.dishId === dishId ? { ...item, quantite: nextQty } : item
      )
    );
  };

  const handleStepQuantity = (dishId, delta) => {
    setFormError("");
    setOrderItems((prev) =>
      prev
        .map((item) => {
          if (item.dishId !== dishId) return item;
          const next = (Number(item.quantite) || 0) + delta;
          return { ...item, quantite: next };
        })
        .filter((item) => item.quantite > 0)
    );
  };

  const handleRemoveLine = (dishId) => {
    setFormError("");
    setOrderItems((prev) => prev.filter((item) => item.dishId !== dishId));
  };

  const totalAmount = orderItems.reduce(
    (sum, item) =>
      sum + (Number(item.prix) || 0) * Math.max(0, Number(item.quantite) || 0),
    0
  );

  const totalUnits = orderItems.reduce(
    (sum, item) => sum + Math.max(0, Number(item.quantite) || 0),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!clientName.trim() || clientName.trim().length < 2) {
      setFormError(
        "Veuillez sélectionner un client ou saisir un nom complet (min. 2 caractères)."
      );
      return;
    }

    if (orderItems.length === 0) {
      setFormError("Veuillez ajouter au moins un plat à la commande.");
      return;
    }

    for (const item of orderItems) {
      if (!Number.isInteger(item.quantite) || item.quantite <= 0) {
        setFormError(
          `Veuillez saisir une quantité valide (≥ 1) pour « ${item.nom} ».`
        );
        return;
      }
      const maxAllowed = getMaxAllowedForDish(item.dishId);
      if (item.quantite > maxAllowed) {
        setFormError(
          `Stock insuffisant pour « ${item.nom} » : demandé ${item.quantite}, disponible ${maxAllowed}.`
        );
        return;
      }
    }

    const result = onSubmitOrder({
      client: clientName.trim(),
      telephone: telephone.trim(),
      date: orderDate,
      statut: initialStatus,
      plats: orderItems,
    });

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    onClose();
  };

  return createPortal(
    <div
      className="velora-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="velora-order-modal-title"
    >
      <div
        className="velora-modal-card velora-modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="velora-modal-header">
          <div>
            <span className="velora-eyebrow mb-1">
              {isEditMode ? "MODIFICATION DE COMMANDE" : "NOUVELLE COMMANDE"}
            </span>
            <h2 id="velora-order-modal-title" className="velora-modal-title">
              {isEditMode
                ? `Modifier la Commande #${editingOrder.id}`
                : "Créer une Commande VELORA"}
            </h2>
          </div>

          <button
            type="button"
            className="velora-modal-close"
            onClick={onClose}
            aria-label="Fermer le formulaire de commande"
          >
            ×
          </button>
        </div>

        {formError && (
          <div className="velora-alert-banner is-error mb-3" role="alert">
            <span>⚠ {formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* CUSTOMER & ORDER METADATA */}
          <div className="velora-order-section-box mb-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <span className="velora-label mb-0">
                1. Informations Client & Service
              </span>

              {!isEditMode && customers.length > 0 && (
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className={`velora-pill ${
                      customerMode === "existing" ? "active" : ""
                    }`}
                    onClick={() => handleCustomerModeSwitch("existing")}
                  >
                    Client enregistré
                  </button>
                  <button
                    type="button"
                    className={`velora-pill ${
                      customerMode === "new" ? "active" : ""
                    }`}
                    onClick={() => handleCustomerModeSwitch("new")}
                  >
                    Nouveau client
                  </button>
                </div>
              )}
            </div>

            <div className="row g-3">
              {!isEditMode && customerMode === "existing" && customers.length > 0 ? (
                <div className="col-md-6">
                  <label htmlFor="existing-customer" className="velora-label">
                    Sélectionner un client *
                  </label>
                  <select
                    id="existing-customer"
                    className="velora-input"
                    value={selectedCustomerId}
                    onChange={handleSelectExistingCustomer}
                  >
                    {customers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.nom}
                        {cust.telephone ? ` (${cust.telephone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="col-md-6">
                  <label htmlFor="order-client-name" className="velora-label">
                    Nom du client *
                  </label>
                  <input
                    id="order-client-name"
                    type="text"
                    className="velora-input"
                    placeholder="Ex: Sarra Khelifi"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      setFormError("");
                    }}
                  />
                </div>
              )}

              <div className="col-md-6">
                <label htmlFor="order-client-phone" className="velora-label">
                  Téléphone / Table (Optionnel)
                </label>
                <input
                  id="order-client-phone"
                  type="text"
                  className="velora-input"
                  placeholder="Ex: Table 04 • +216 22 410 890"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="order-date" className="velora-label">
                  Date de commande *
                </label>
                <input
                  id="order-date"
                  type="date"
                  className="velora-input velora-date-input"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="order-initial-status" className="velora-label">
                  {isEditMode ? "Statut actuel" : "Statut initial *"}
                </label>
                {isEditMode ? (
                  <input
                    id="order-initial-status"
                    type="text"
                    className="velora-input"
                    value={initialStatus}
                    disabled
                  />
                ) : (
                  <select
                    id="order-initial-status"
                    className="velora-input"
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value)}
                  >
                    <option value="Confirmée">
                      Confirmée (déduit le stock immédiatement)
                    </option>
                    <option value="En attente">
                      En attente (déduit le stock à la confirmation)
                    </option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* DISH PICKER */}
          <div className="velora-order-section-box mb-3">
            <span className="velora-label">
              2. Sélection des Plats & Quantités
            </span>

            <div className="row g-2 align-items-end">
              <div className="col-md-7">
                <label htmlFor="dish-picker-select" className="visually-hidden">
                  Choisir un plat
                </label>
                <select
                  id="dish-picker-select"
                  className="velora-input"
                  value={pickerDishId}
                  onChange={(e) => {
                    setPickerDishId(e.target.value);
                    setFormError("");
                  }}
                >
                  <option value="">-- Choisir un plat de la carte --</option>
                  {dishes.map((dish) => {
                    const maxAvail = getMaxAllowedForDish(dish.id);
                    const disabled = maxAvail <= 0;
                    return (
                      <option
                        key={dish.id}
                        value={dish.id}
                        disabled={disabled}
                      >
                        {dish.nom} — {dish.prix} DT (
                        {disabled ? "Épuisé" : `Stock : ${maxAvail}`})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="col-6 col-md-2">
                <label htmlFor="dish-picker-qty" className="visually-hidden">
                  Quantité
                </label>
                <input
                  id="dish-picker-qty"
                  type="number"
                  min="1"
                  step="1"
                  className="velora-input text-center"
                  value={pickerQty}
                  onChange={(e) => {
                    setPickerQty(e.target.value);
                    setFormError("");
                  }}
                />
              </div>

              <div className="col-6 col-md-3">
                <button
                  type="button"
                  className="velora-btn velora-btn-gold w-100"
                  style={{ padding: "11px 16px" }}
                  onClick={handleAddDishToOrder}
                >
                  + Ajouter
                </button>
              </div>
            </div>

            {/* SELECTED ITEMS TABLE */}
            {orderItems.length > 0 ? (
              <div className="table-responsive mt-3">
                <table className="velora-table">
                  <thead>
                    <tr>
                      <th>Plat</th>
                      <th>Prix Unitaire</th>
                      <th>Stock Dispo</th>
                      <th>Quantité</th>
                      <th>Sous-total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => {
                      const maxAllowed = getMaxAllowedForDish(item.dishId);
                      const exceedsStock = item.quantite > maxAllowed;
                      const subtotal =
                        (Number(item.prix) || 0) *
                        Math.max(0, Number(item.quantite) || 0);

                      return (
                        <tr key={item.dishId}>
                          <td className="text-ivory fw-semibold">{item.nom}</td>
                          <td className="text-gold">{item.prix} DT</td>
                          <td>
                            <span
                              className={`velora-table-pill ${
                                maxAllowed > 0 ? "pill-success" : "pill-danger"
                              }`}
                            >
                              {maxAllowed} portion{maxAllowed > 1 ? "s" : ""}
                            </span>
                          </td>
                          <td>
                            <div className="velora-qty-stepper">
                              <button
                                type="button"
                                className="velora-qty-btn"
                                onClick={() =>
                                  handleStepQuantity(item.dishId, -1)
                                }
                                aria-label={`Diminuer la quantité de ${item.nom}`}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                className={`velora-qty-input ${
                                  exceedsStock ? "is-invalid" : ""
                                }`}
                                value={item.quantite}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    item.dishId,
                                    e.target.value
                                  )
                                }
                                aria-label={`Quantité pour ${item.nom}`}
                              />
                              <button
                                type="button"
                                className="velora-qty-btn"
                                onClick={() =>
                                  handleStepQuantity(item.dishId, 1)
                                }
                                aria-label={`Augmenter la quantité de ${item.nom}`}
                              >
                                +
                              </button>
                            </div>
                            {exceedsStock && (
                              <div className="velora-error-msg">
                                Max disponible : {maxAllowed}
                              </div>
                            )}
                          </td>
                          <td className="text-ivory fw-semibold">
                            {subtotal} DT
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="velora-btn-icon-danger"
                              onClick={() => handleRemoveLine(item.dishId)}
                              title={`Retirer ${item.nom}`}
                              aria-label={`Retirer ${item.nom}`}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="velora-order-empty-hint mt-3">
                Aucun plat sélectionné pour le moment. Choisissez un ou
                plusieurs plats ci-dessus pour composer la commande.
              </div>
            )}
          </div>

          {/* SUMMARY & SUBMIT */}
          <div className="velora-order-summary-bar">
            <div>
              <div className="velora-order-total-label">
                Récapitulatif ({orderItems.length} plat
                {orderItems.length > 1 ? "s" : ""} • {totalUnits} portion
                {totalUnits > 1 ? "s" : ""})
              </div>
              <div className="velora-order-total-value" style={{ fontSize: "1.75rem" }}>
                Total : {totalAmount} DT
              </div>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="velora-btn velora-btn-outline"
                onClick={onClose}
              >
                Annuler
              </button>
              <button type="submit" className="velora-btn velora-btn-gold">
                {isEditMode
                  ? "Enregistrer les modifications"
                  : "Confirmer et créer la commande"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}