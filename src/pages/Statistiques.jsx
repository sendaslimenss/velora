import { CATEGORIES } from "../data/initialData";
import { getOrderTotal } from "../utils/storage";
import StatCard from "../components/StatCard";

export default function Statistiques({ dishes, orders }) {
  const totalDishes = dishes.length;
  const availableDishesCount = dishes.filter(
    (dish) => dish.disponible && Number(dish.stock) > 0
  ).length;
  const unavailableDishesCount = dishes.filter(
    (dish) => !dish.disponible || Number(dish.stock) <= 0
  ).length;

  const totalOrders = orders.length;
  const pendingOrdersCount = orders.filter(
    (order) => order.statut === "En attente"
  ).length;
  const confirmedOrdersCount = orders.filter(
    (order) => order.statut === "Confirmée"
  ).length;
  const inProgressOrdersCount = orders.filter(
    (order) => order.statut === "En préparation" || order.statut === "Prête"
  ).length;
  const deliveredOrders = orders.filter((order) => order.statut === "Livrée");
  const deliveredOrdersCount = deliveredOrders.length;
  const cancelledOrdersCount = orders.filter(
    (order) => order.statut === "Annulée"
  ).length;

  // Realized revenue: strictly derived from Delivered ("Livrée") orders
  const totalRevenue = deliveredOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const averageBasket =
    deliveredOrdersCount > 0
      ? Math.round(totalRevenue / deliveredOrdersCount)
      : 0;

  const deliveryRate =
    totalOrders > 0
      ? Math.round((deliveredOrdersCount / totalOrders) * 100)
      : 0;

  const cancellationRate =
    totalOrders > 0
      ? Math.round((cancelledOrdersCount / totalOrders) * 100)
      : 0;

  const totalStock = dishes.reduce(
    (sum, dish) => sum + Math.max(0, Number(dish.stock) || 0),
    0
  );

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

  // Revenue by Category (Delivered orders only)
  const salesByCategory = CATEGORIES.map((category) => {
    const matchingLines = deliveredOrders
      .flatMap((order) => order.plats || [])
      .filter((item) => {
        const resolvedCategory =
          dishCategoryMap.get(item.dishId) ||
          dishNameCategoryMap.get((item.nom || "").toLowerCase()) ||
          "Plats principaux";
        return resolvedCategory === category;
      });

    const revenue = matchingLines.reduce(
      (sum, item) => sum + Number(item.prix) * Number(item.quantite),
      0
    );
    const unitsSold = matchingLines.reduce(
      (sum, item) => sum + Number(item.quantite),
      0
    );
    const share =
      totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0;

    return {
      category,
      revenue,
      unitsSold,
      share,
    };
  });

  // Best-Selling Dishes (Delivered orders only)
  const bestSellingMap = deliveredOrders
    .flatMap((order) => order.plats || [])
    .reduce((acc, item) => {
      const key = item.dishId ?? item.nom;
      const existing = acc.get(key) || {
        key,
        dishId: item.dishId,
        nom: item.nom,
        categorie:
          dishCategoryMap.get(item.dishId) ||
          dishNameCategoryMap.get((item.nom || "").toLowerCase()) ||
          "Plats principaux",
        unitsSold: 0,
        revenue: 0,
      };
      existing.unitsSold += Number(item.quantite) || 0;
      existing.revenue +=
        (Number(item.prix) || 0) * (Number(item.quantite) || 0);
      acc.set(key, existing);
      return acc;
    }, new Map());

  const bestSellingDishes = Array.from(bestSellingMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
    .slice(0, 6);

  const maxUnitsSold =
    bestSellingDishes.length > 0 ? bestSellingDishes[0].unitsSold : 0;

  // Daily Sales Performance (Delivered orders grouped by date)
  const dailySalesMap = deliveredOrders.reduce((acc, order) => {
    const dateKey = order.date || "Non datée";
    const existing = acc.get(dateKey) || {
      date: dateKey,
      ordersCount: 0,
      revenue: 0,
    };
    existing.ordersCount += 1;
    existing.revenue += getOrderTotal(order);
    acc.set(dateKey, existing);
    return acc;
  }, new Map());

  const dailySalesPerformance = Array.from(dailySalesMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const maxDailyRevenue = dailySalesPerformance.reduce(
    (max, day) => (day.revenue > max ? day.revenue : max),
    0
  );

  return (
    <div className="velora-page velora-shell">
      <div className="velora-page-header">
        <div>
          <span className="velora-eyebrow velora-reveal-1">
            ANALYSE & PERFORMANCE
          </span>
          <h1 className="velora-page-title velora-reveal-2">
            Tableau de Bord VELORA
          </h1>
          <p className="velora-page-subtitle velora-reveal-3">
            Indicateurs synchronisés en temps réel • Le chiffre d’affaires
            comptabilise uniquement les commandes livrées ({deliveredOrdersCount}
            ).
          </p>
        </div>
      </div>

      {/* PRIMARY & ORDER STATUS KPI CARDS */}
      <div className="velora-stats-grid">
        <StatCard
          title="Chiffre d'Affaires"
          value={totalRevenue}
          suffix="DT"
          subtitle={`${deliveredOrdersCount} commande(s) livrée(s)`}
          accent="gold"
          icon="◈"
        />
        <StatCard
          title="Total des Commandes"
          value={totalOrders}
          subtitle={`${inProgressOrdersCount} en cuisine / prête(s)`}
          icon="☰"
        />
        <StatCard
          title="Commandes en Attente"
          value={pendingOrdersCount}
          subtitle="À confirmer"
          accent={pendingOrdersCount > 0 ? "amber" : "gold"}
          icon="◷"
        />
        <StatCard
          title="Commandes Confirmées"
          value={confirmedOrdersCount}
          subtitle="Stock réservé"
          accent="gold"
          icon="✓"
        />
        <StatCard
          title="Commandes Livrées"
          value={deliveredOrdersCount}
          subtitle={`Taux de livraison : ${deliveryRate}%`}
          accent="gold"
          icon="★"
        />
        <StatCard
          title="Commandes Annulées"
          value={cancelledOrdersCount}
          subtitle={`0 DT comptabilisé • ${cancellationRate}%`}
          accent={cancelledOrdersCount > 0 ? "danger" : "gold"}
          icon="⊘"
        />
        <StatCard
          title="Total des Plats"
          value={totalDishes}
          subtitle={`${totalStock} portions en stock`}
          icon="✦"
        />
        <StatCard
          title="Plats Disponibles"
          value={availableDishesCount}
          subtitle="En stock à la carte"
          accent="gold"
          icon="◉"
        />
        <StatCard
          title="Plats Indisponibles"
          value={unavailableDishesCount}
          subtitle="En rupture de stock (0)"
          accent={unavailableDishesCount > 0 ? "danger" : "gold"}
          icon="✕"
        />
        <StatCard
          title="Valeur du Stock"
          value={stockValue}
          suffix="DT"
          subtitle="Valorisation totale inventaire"
          accent="gold"
          icon="❖"
        />
      </div>

      {/* BEST-SELLING DISHES & SALES PERFORMANCE */}
      <div className="velora-tables-grid mb-4">
        <section className="velora-dashboard-panel mb-0">
          <div className="velora-panel-head">
            <div>
              <span className="velora-eyebrow">PALMARÈS CULINAIRE</span>
              <h2 className="velora-panel-title">Plats les Plus Vendus</h2>
            </div>
            <span className="velora-panel-badge">Commandes Livrées</span>
          </div>

          {bestSellingDishes.length > 0 ? (
            <div className="velora-category-sales-list">
              {bestSellingDishes.map((dish, index) => {
                const barWidth =
                  maxUnitsSold > 0
                    ? Math.round((dish.unitsSold / maxUnitsSold) * 100)
                    : 0;

                return (
                  <div key={dish.key} className="velora-sales-row">
                    <div className="velora-sales-row-top">
                      <div>
                        <span className="text-gold fw-semibold me-2">
                          #{index + 1}
                        </span>
                        <span className="velora-sales-cat">{dish.nom}</span>
                        <span className="velora-sales-units">
                          {dish.categorie}
                        </span>
                      </div>
                      <div className="velora-sales-figures">
                        <strong>
                          {dish.unitsSold} portion
                          {dish.unitsSold > 1 ? "s" : ""}
                        </strong>
                        <span>({dish.revenue} DT)</span>
                      </div>
                    </div>
                    <div className="velora-progress-track">
                      <div
                        className="velora-progress-fill"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="velora-page-subtitle">
              Aucune vente livrée enregistrée pour le moment.
            </p>
          )}
        </section>

        <section className="velora-dashboard-panel mb-0">
          <div className="velora-panel-head">
            <div>
              <span className="velora-eyebrow">INDICATEURS CLÉS</span>
              <h2 className="velora-panel-title">Performance des Ventes</h2>
            </div>
            <span className="velora-panel-badge">
              Panier moyen : {averageBasket} DT
            </span>
          </div>

          <div className="velora-perf-metrics-row mb-4">
            <div className="velora-perf-mini-card">
              <span className="velora-order-total-label">Panier Moyen</span>
              <strong className="velora-perf-mini-val">
                {averageBasket} DT
              </strong>
            </div>
            <div className="velora-perf-mini-card">
              <span className="velora-order-total-label">Taux Livraison</span>
              <strong className="velora-perf-mini-val">{deliveryRate}%</strong>
            </div>
            <div className="velora-perf-mini-card">
              <span className="velora-order-total-label">Taux Annulation</span>
              <strong className="velora-perf-mini-val">
                {cancellationRate}%
              </strong>
            </div>
          </div>

          {dailySalesPerformance.length > 0 ? (
            <div className="velora-category-sales-list">
              {dailySalesPerformance.map((day) => {
                const widthPct =
                  maxDailyRevenue > 0
                    ? Math.round((day.revenue / maxDailyRevenue) * 100)
                    : 0;
                return (
                  <div key={day.date} className="velora-sales-row">
                    <div className="velora-sales-row-top">
                      <div>
                        <span className="velora-sales-cat">{day.date}</span>
                        <span className="velora-sales-units">
                          {day.ordersCount} commande
                          {day.ordersCount > 1 ? "s" : ""} livrée
                          {day.ordersCount > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="velora-sales-figures">
                        <strong>{day.revenue} DT</strong>
                      </div>
                    </div>
                    <div className="velora-progress-track">
                      <div
                        className="velora-progress-fill"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="velora-page-subtitle">
              Les performances journalières apparaîtront dès qu’une commande sera
              livrée.
            </p>
          )}
        </section>
      </div>

      {/* REVENUE BY CATEGORY */}
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