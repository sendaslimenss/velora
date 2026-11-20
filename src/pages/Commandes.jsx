import { useState } from "react";
import { ORDER_STATUSES } from "../data/initialData";
import SearchBar from "../components/SearchBar";
import OrderCard from "../components/OrderCard";

export default function Commandes({
  orders,
  updateOrderStatus,
  deleteOrder,
}) {
  const [searchClient, setSearchClient] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Toutes");

  const handleDeleteOrder = (orderId) => {
    if (
      window.confirm(
        `Voulez-vous vraiment supprimer la commande #${orderId} ?`
      )
    ) {
      deleteOrder(orderId);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedStatus === "Toutes" || order.statut === selectedStatus;
    const matchesClient = order.client
      .toLowerCase()
      .includes(searchClient.trim().toLowerCase());
    return matchesStatus && matchesClient;
  });

  const filteredAmount = filteredOrders.reduce((sum, order) => {
    const orderTotal =
      order.plats && order.plats.length > 0
        ? order.plats.reduce(
            (acc, item) => acc + Number(item.prix) * Number(item.quantite),
            0
          )
        : Number(order.total || 0);
    return sum + orderTotal;
  }, 0);

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
      </div>

      {/* SEARCH & STATUS FILTERS */}
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

      {/* ORDERS GRID */}
      {filteredOrders.length > 0 ? (
        <div className="velora-orders-grid">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={updateOrderStatus}
              onDelete={handleDeleteOrder}
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
            Aucune commande ne correspond à vos critères actuels.
          </p>
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
    </div>
  );
}