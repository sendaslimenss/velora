import { CATEGORIES } from "../data/initialData";
import { getOrderTotal } from "./storage";

const COST_FIELD_KEYS = ["coutAchat", "prixAchat", "costPrice", "cout"];

const toSafeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toNonNegativeInt = (value) =>
  Math.max(0, Math.floor(toSafeNumber(value, 0)));

const extractExplicitUnitCost = (dish) => {
  if (!dish || typeof dish !== "object") return null;

  for (const key of COST_FIELD_KEYS) {
    const raw = dish[key];
    if (raw === null || raw === undefined || raw === "") continue;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return null;
};

export const computeSafeOrderTotal = (order) => {
  if (!order || typeof order !== "object") return 0;
  const raw = getOrderTotal(order);
  return Math.max(0, toSafeNumber(raw, 0));
};

export const computeDashboardAnalytics = (
  dishesInput,
  ordersInput,
  categories = CATEGORIES
) => {
  const safeDishes = Array.isArray(dishesInput)
    ? dishesInput.filter((d) => d && typeof d === "object")
    : [];
  const safeOrders = Array.isArray(ordersInput)
    ? ordersInput.filter((o) => o && typeof o === "object")
    : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  // 1. Dish & Stock Metrics
  const totalDishes = safeDishes.length;

  const availableDishes = safeDishes.filter(
    (dish) => dish.disponible !== false && toNonNegativeInt(dish.stock) > 0
  );
  const unavailableDishes = safeDishes.filter(
    (dish) => dish.disponible === false || toNonNegativeInt(dish.stock) <= 0
  );

  const availableDishesCount = availableDishes.length;
  const unavailableDishesCount = unavailableDishes.length;

  const totalStockUnits = safeDishes.reduce(
    (sum, dish) => sum + toNonNegativeInt(dish.stock),
    0
  );

  // 2. Inventory Valuation (Strictly Purchase Cost — Never Selling Price)
  const dishInventoryRows = safeDishes.map((dish) => {
    const stock = toNonNegativeInt(dish.stock);
    const sellingPrice = Math.max(0, toSafeNumber(dish.prix, 0));
    const unitCost = extractExplicitUnitCost(dish);
    const costStockValue = unitCost !== null ? unitCost * stock : null;
    const isAvailable = dish.disponible !== false && stock > 0;

    return {
      id: dish.id,
      nom: dish.nom || "Plat sans nom",
      categorie: dish.categorie || "Non classé",
      sellingPrice,
      stock,
      unitCost,
      costStockValue,
      isAvailable,
    };
  });

  const rowsWithCost = dishInventoryRows.filter((row) => row.unitCost !== null);
  const dishesWithCostCount = rowsWithCost.length;
  const hasCostData = dishesWithCostCount > 0;
  const isCompleteCostCoverage =
    totalDishes > 0 && dishesWithCostCount === totalDishes;

  const totalCostValue = hasCostData
    ? rowsWithCost.reduce((sum, row) => sum + row.costStockValue, 0)
    : null;

  const inventoryLimitationNote = !hasCostData
    ? "Limitation des données : aucun coût d'achat matière (coutAchat / prixAchat) n'est renseigné dans le catalogue des plats. Conformément aux règles comptables, le prix de vente carte n'est pas utilisé comme substitut afin d'éviter toute surévaluation de l'inventaire."
    : !isCompleteCostCoverage
    ? `Couverture partielle : coût d'achat renseigné pour ${dishesWithCostCount} plat(s) sur ${totalDishes}. Les plats sans coût d'achat sont exclus du total.`
    : null;

  // 3. Order Counts by Status
  const totalOrders = safeOrders.length;
  const pendingOrdersCount = safeOrders.filter(
    (order) => order.statut === "En attente"
  ).length;
  const confirmedOrdersCount = safeOrders.filter(
    (order) => order.statut === "Confirmée"
  ).length;
  const inProgressOrdersCount = safeOrders.filter(
    (order) => order.statut === "En préparation" || order.statut === "Prête"
  ).length;
  const deliveredOrders = safeOrders.filter(
    (order) => order.statut === "Livrée"
  );
  const deliveredOrdersCount = deliveredOrders.length;
  const cancelledOrdersCount = safeOrders.filter(
    (order) => order.statut === "Annulée"
  ).length;

  const deliveryRate =
    totalOrders > 0
      ? Math.round((deliveredOrdersCount / totalOrders) * 100)
      : 0;
  const cancellationRate =
    totalOrders > 0
      ? Math.round((cancelledOrdersCount / totalOrders) * 100)
      : 0;

  // 4. Realized Revenue (Delivered Orders ONLY)
  const totalRevenue = deliveredOrders.reduce(
    (sum, order) => sum + computeSafeOrderTotal(order),
    0
  );

  const averageBasket =
    deliveredOrdersCount > 0
      ? Math.round(totalRevenue / deliveredOrdersCount)
      : 0;

  // Category Lookup Maps
  const dishCategoryById = new Map(
    safeDishes.map((dish) => [dish.id, dish.categorie])
  );
  const dishCategoryByName = new Map(
    safeDishes
      .filter((dish) => typeof dish.nom === "string" && dish.nom.trim() !== "")
      .map((dish) => [dish.nom.trim().toLowerCase(), dish.categorie])
  );

  const resolveLineCategory = (item) => {
    if (!item || typeof item !== "object") return "Non classé";
    if (item.dishId !== undefined && dishCategoryById.has(item.dishId)) {
      return dishCategoryById.get(item.dishId);
    }
    const normalizedName =
      typeof item.nom === "string" ? item.nom.trim().toLowerCase() : "";
    if (normalizedName && dishCategoryByName.has(normalizedName)) {
      return dishCategoryByName.get(normalizedName);
    }
    if (typeof item.categorie === "string" && item.categorie.trim() !== "") {
      return item.categorie.trim();
    }
    return "Non classé";
  };

  // Flatten Delivered Order Lines Once
  const deliveredLines = deliveredOrders.reduce((acc, order) => {
    const lines = Array.isArray(order.plats) ? order.plats : [];
    const normalizedLines = lines
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const quantity = toNonNegativeInt(item.quantite);
        const unitPrice = Math.max(0, toSafeNumber(item.prix, 0));
        return {
          dishId: item.dishId,
          nom: (item.nom || "Article").trim(),
          categorie: resolveLineCategory(item),
          quantity,
          lineRevenue: unitPrice * quantity,
        };
      })
      .filter((line) => line.quantity > 0);

    return acc.concat(normalizedLines);
  }, []);

  const totalDeliveredUnits = deliveredLines.reduce(
    (sum, line) => sum + line.quantity,
    0
  );

  // 5. Revenue by Category (Delivered Orders ONLY)
  const discoveredExtraCategories = deliveredLines
    .map((line) => line.categorie)
    .filter((cat) => !safeCategories.includes(cat))
    .reduce(
      (unique, cat) => (unique.includes(cat) ? unique : unique.concat(cat)),
      []
    );

  const allCategoryNames = [...safeCategories, ...discoveredExtraCategories];

  const revenueByCategory = allCategoryNames.map((category) => {
    const categoryLines = deliveredLines.filter(
      (line) => line.categorie === category
    );
    const revenue = categoryLines.reduce(
      (sum, line) => sum + line.lineRevenue,
      0
    );
    const unitsSold = categoryLines.reduce(
      (sum, line) => sum + line.quantity,
      0
    );
    const share =
      totalRevenue > 0
        ? Math.min(100, Math.round((revenue / totalRevenue) * 100))
        : 0;

    return {
      category,
      revenue,
      unitsSold,
      share,
    };
  });

  // 6. Best-Selling Dishes Ranked by Quantities Sold (Delivered Orders ONLY)
  const dishSalesRecord = deliveredLines.reduce((acc, line) => {
    const groupKey =
      line.dishId !== undefined && line.dishId !== null
        ? `id:${line.dishId}`
        : `name:${line.nom.toLowerCase()}`;

    const existing = acc[groupKey] || {
      key: groupKey,
      dishId: line.dishId,
      nom: line.nom,
      categorie: line.categorie,
      unitsSold: 0,
      revenue: 0,
    };

    acc[groupKey] = {
      ...existing,
      unitsSold: existing.unitsSold + line.quantity,
      revenue: existing.revenue + line.lineRevenue,
    };
    return acc;
  }, {});

  const sortedBestSellers = Object.values(dishSalesRecord).sort(
    (a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue
  );

  const topUnitsSold =
    sortedBestSellers.length > 0 ? sortedBestSellers[0].unitsSold : 0;

  const bestSellingDishes = sortedBestSellers.map((dish, index) => ({
    ...dish,
    rank: index + 1,
    unitsShare:
      totalDeliveredUnits > 0
        ? Math.round((dish.unitsSold / totalDeliveredUnits) * 100)
        : 0,
    barWidth:
      topUnitsSold > 0
        ? Math.min(100, Math.round((dish.unitsSold / topUnitsSold) * 100))
        : 0,
  }));

  // 7. Daily Sales Performance (Delivered Orders ONLY)
  const dailyRecord = deliveredOrders.reduce((acc, order) => {
    const dateKey =
      typeof order.date === "string" && order.date.trim() !== ""
        ? order.date.trim()
        : "Non datée";
    const existing = acc[dateKey] || {
      date: dateKey,
      ordersCount: 0,
      revenue: 0,
    };

    acc[dateKey] = {
      ...existing,
      ordersCount: existing.ordersCount + 1,
      revenue: existing.revenue + computeSafeOrderTotal(order),
    };
    return acc;
  }, {});

  const sortedDaily = Object.values(dailyRecord).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const maxDailyRevenue = sortedDaily.reduce(
    (max, day) => (day.revenue > max ? day.revenue : max),
    0
  );

  const dailySalesPerformance = sortedDaily.map((day) => ({
    ...day,
    barWidth:
      maxDailyRevenue > 0
        ? Math.min(100, Math.round((day.revenue / maxDailyRevenue) * 100))
        : 0,
  }));

  // 8. Order Summary Rows
  const orderSummaryRows = safeOrders.map((order) => {
    const lines = Array.isArray(order.plats) ? order.plats : [];
    const itemsCount = lines.reduce(
      (sum, item) => sum + toNonNegativeInt(item?.quantite),
      0
    );
    return {
      id: order.id ?? "—",
      client: order.client || "Client non renseigné",
      date: order.date || "—",
      itemsCount,
      total: computeSafeOrderTotal(order),
      statut: order.statut || "En attente",
    };
  });

  return {
    totalDishes,
    availableDishesCount,
    unavailableDishesCount,
    totalStockUnits,
    inventoryValuation: {
      hasCostData,
      isCompleteCostCoverage,
      dishesWithCostCount,
      totalDishesCount: totalDishes,
      totalCostValue,
      limitationNote: inventoryLimitationNote,
    },
    totalOrders,
    pendingOrdersCount,
    confirmedOrdersCount,
    inProgressOrdersCount,
    deliveredOrdersCount,
    cancelledOrdersCount,
    deliveryRate,
    cancellationRate,
    totalRevenue,
    totalDeliveredUnits,
    averageBasket,
    revenueByCategory,
    bestSellingDishes,
    dailySalesPerformance,
    dishInventoryRows,
    orderSummaryRows,
  };
};