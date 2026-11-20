import { CATEGORIES } from "../data/initialData";
import StatCard from "../components/StatCard";

const getOrderTotal = (order) => {
  if (order.plats && order.plats.length > 0) {
    return order.plats.reduce(
      (sum, item) => sum + Number(item.prix) * Number(item.quantite),
      0
    );
  }
  return Number(order.total || 0);
};

export default function Statistiques({ dishes, orders }) {
  const totalDishes = dishes.length;
  const totalOrders = orders.length;

  const deliveredOrders = orders.filter((order) => order.statut === "Livrée");
  const totalRevenue = deliveredOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const totalStock = dishes.reduce(
    (sum, dish) => sum + Math.max(0, Number(dish.stock) || 0),
    0
  );

  const unavailableDishesCount = dishes.filter(
    (dish) => !dish.disponible || Number(dish.stock) <= 0
  ).length;

  const pendingOrdersCount = orders.filter(
    (order) => order.statut === "En attente"
  ).length;

  const stockValue = dishes.reduce(
    (sum, dish) =>
      sum + Number(dish.prix || 0) * Math.max(0, Number(dish.stock) || 0),
    0
  );

  const dishCategoryMap = new Map(
    dishes.map((dish) => [dish.id, dish.categorie])
  );
  const dishNameCategoryMap = new Map(
    dishes.map((dish) => [dish.nom.toLowerCase(), dish.categorie])
  );

  const salesByCategory = CATEGORIES.map((category) => {
    let revenue = 0;
    let unitsSold = 0;

    deliveredOrders.forEach((order) => {
      (order.plats || []).forEach((item) => {
        const resolvedCategory =
          dishCategoryMap.get(item.dishId) ||
          dishNameCategoryMap.get((item.nom || "").toLowerCase()) ||
          "Plats principaux";

        if (resolvedCategory === category) {
          revenue += Number(item.prix) * Number(item.quantite);
          unitsSold += Number(item.quantite);
        }
      });
    });

    const share = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0;

    return {
      category,
      revenue,
      unitsSold,
      share,
    };
  });

  return (
    <div className="velora-page velora-shell">
      <div className="velora-page-header">
        <div>
          <span className="velora-eyebrow">ANALYSE & PERFORMANCE</span>
          <h1 className="velora-page-title">Tableau de Bord VELORA</h1>
          <p className="velora-page-subtitle">
            Indicateurs calculés en temps réel • Le chiffre d’affaires inclut
            exclusivement les commandes livrées ({deliveredOrders.length}).
          </p>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="velora-stats-grid">
        <StatCard
          title="Chiffre d'Affaires"
          value={totalRevenue}
          suffix="DT"
          subtitle={`${deliveredOrders.length} commande(s) livrée(s)`}
          accent="gold"
          icon="◈"
        />
        <StatCard
          title="Valeur du Stock"
          value={stockValue}
          suffix="DT"
          subtitle="Valorisation totale en cave & cuisine"
          accent="gold"
          icon="❖"
        />
        <StatCard
          title="Total des Plats"
          value={totalDishes}
          subtitle={`${totalDishes - unavailableDishesCount} disponible(s) à la carte`}
          icon="✦"
        />
        <StatCard
          title="Total des Commandes"
          value={totalOrders}
          subtitle="Toutes commandes enregistrées"
          icon="☰"
        />
        <StatCard
          title="Stock Disponible"
          value={totalStock}
          suffix="portions"
          subtitle="Unités prêtes au service"
          icon="▣"
        />
        <StatCard
          title="Commandes en Attente"
          value={pendingOrdersCount}
          subtitle="À valider en cuisine"
          accent={pendingOrdersCount > 0 ? "amber" : "gold"}
          icon="◷"
        />
        <StatCard
          title="Plats Indisponibles"
          value={unavailableDishesCount}
          subtitle="En rupture de stock"
          accent={unavailableDishesCount > 0 ? "danger" : "gold"}
          icon="✕"
        />
      </div>

      {/* SALES BY CATEGORY */}
      <section className="velora-dashboard-panel">
        <div className="velora-panel-head">
          <div>
            <span className="velora-eyebrow">RÉPARTITION DES VENTES</span>
            <h2 className="velora-panel-title">
              Chiffre d’Affaires par Catégorie (Commandes Livrées)
            </h2>
          </div>
          <span className="velora-panel-badge">Total : {totalRevenue} DT</span>
        </div>

        <div className="velora-category-sales-list">
          {salesByCategory.map((item) => (
            <div key={item.category} className="velora-sales-row">
              <div className="velora-sales-row-top">
                <div>
                  <span className="velora-sales-cat">{item.category}</span>
                  <span className="velora-sales-units">
                    {item.unitsSold} portion{item.unitsSold > 1 ? "s" : ""}{" "}
                    vendue{item.unitsSold > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="velora-sales-figures">
                  <strong>{item.revenue} DT</strong>
                  <span>({item.share}%)</span>
                </div>
              </div>
              <div className="velora-progress-track">
                <div
                  className="velora-progress-fill"
                  style={{ width: `${item.share}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUMMARY TABLES */}
      <div className="velora-tables-grid">
        <section className="velora-dashboard-panel">
          <div className="velora-panel-head">
            <div>
              <span className="velora-eyebrow">INVENTAIRE</span>
              <h2 className="velora-panel-title">Synthèse des Plats</h2>
            </div>
            <span className="velora-panel-badge">{totalDishes} plats</span>
          </div>

          <div className="table-responsive">
            <table className="velora-table">
              <thead>
                <tr>
                  <th>Plat</th>
                  <th>Catégorie</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Valeur</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((dish) => {
                  const isOut = !dish.disponible || Number(dish.stock) <= 0;
                  const dishStockVal =
                    Number(dish.prix || 0) * Math.max(0, Number(dish.stock) || 0);

                  return (
                    <tr key={dish.id} className={isOut ? "row-muted" : ""}>
                      <td className="fw-semibold text-ivory">{dish.nom}</td>
                      <td>{dish.categorie}</td>
                      <td className="text-gold">{dish.prix} DT</td>
                      <td>{dish.stock}</td>
                      <td>{dishStockVal} DT</td>
                      <td>
                        <span
                          className={`velora-table-pill ${
                            isOut ? "pill-danger" : "pill-success"
                          }`}
                        >
                          {isOut ? "Épuisé" : "Disponible"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="velora-dashboard-panel">
          <div className="velora-panel-head">
            <div>
              <span className="velora-eyebrow">HISTORIQUE SERVICE</span>
              <h2 className="velora-panel-title">Synthèse des Commandes</h2>
            </div>
            <span className="velora-panel-badge">{totalOrders} commandes</span>
          </div>

          <div className="table-responsive">
            <table className="velora-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Articles</th>
                  <th>Total</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const itemsCount = (order.plats || []).reduce(
                    (sum, item) => sum + Number(item.quantite),
                    0
                  );
                  const orderTotal = getOrderTotal(order);

                  return (
                    <tr key={order.id}>
                      <td className="text-gold fw-semibold">#{order.id}</td>
                      <td className="text-ivory">{order.client}</td>
                      <td>{order.date}</td>
                      <td>{itemsCount}</td>
                      <td className="fw-semibold text-ivory">
                        {orderTotal} DT
                      </td>
                      <td>
                        <span
                          className={`velora-table-pill ${
                            order.statut === "Livrée"
                              ? "pill-success"
                              : order.statut === "Annulée"
                              ? "pill-danger"
                              : "pill-warning"
                          }`}
                        >
                          {order.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}