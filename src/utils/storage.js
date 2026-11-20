import {
  CATEGORIES,
  ORDER_STATUSES,
  initialDishes,
  initialOrders,
  initialCustomers,
} from "../data/initialData";

export const DISHES_STORAGE_KEY = "velora_dishes_v1";
export const ORDERS_STORAGE_KEY = "velora_orders_v1";
export const CUSTOMERS_STORAGE_KEY = "velora_customers_v1";

export const COMMITTED_STATUSES = [
  "Confirmée",
  "En préparation",
  "Prête",
  "Livrée",
];

export const VALID_STATUS_TRANSITIONS = {
  "En attente": ["Confirmée", "En préparation", "Prête", "Livrée", "Annulée"],
  Confirmée: ["En préparation", "Prête", "Livrée", "Annulée"],
  "En préparation": ["Prête", "Livrée", "Annulée"],
  Prête: ["Livrée", "Annulée"],
  Livrée: [],
  Annulée: [],
};

export const isCommittedStatus = (status) =>
  COMMITTED_STATUSES.includes(status);

export const getOrderTotal = (order) => {
  if (!order) return 0;
  if (Array.isArray(order.plats) && order.plats.length > 0) {
    return order.plats.reduce(
      (sum, item) =>
        sum + (Number(item.prix) || 0) * Math.max(0, Number(item.quantite) || 0),
      0
    );
  }
  return Math.max(0, Number(order.total) || 0);
};

export const sanitizeDish = (dish, index = 0) => {
  if (!dish || typeof dish !== "object") return null;
  const stock = Math.max(0, Math.floor(Number(dish.stock) || 0));
  const prix = Math.max(0, Number(dish.prix) || 0);
  const nom = typeof dish.nom === "string" ? dish.nom.trim() : "";
  if (!nom) return null;

  return {
    id: dish.id ?? Date.now() + index,
    nom,
    categorie: CATEGORIES.includes(dish.categorie)
      ? dish.categorie
      : CATEGORIES[1],
    description:
      typeof dish.description === "string" ? dish.description.trim() : "",
    prix,
    stock,
    image: typeof dish.image === "string" ? dish.image.trim() : "",
    disponible: stock > 0,
  };
};

export const sanitizeOrderItem = (item) => {
  if (!item || typeof item !== "object") return null;
  const quantite = Math.max(1, Math.floor(Number(item.quantite) || 1));
  const prix = Math.max(0, Number(item.prix) || 0);
  const nom = typeof item.nom === "string" ? item.nom.trim() : "Plat";

  return {
    dishId: item.dishId,
    nom,
    quantite,
    prix,
  };
};

export const sanitizeOrder = (order, index = 0) => {
  if (!order || typeof order !== "object") return null;
  const client = typeof order.client === "string" ? order.client.trim() : "";
  if (!client) return null;

  const plats = Array.isArray(order.plats)
    ? order.plats.map(sanitizeOrderItem).filter(Boolean)
    : [];

  const statut = ORDER_STATUSES.includes(order.statut)
    ? order.statut
    : "En attente";

  const stockDeducted =
    typeof order.stockDeducted === "boolean"
      ? order.stockDeducted
      : isCommittedStatus(statut);

  const total =
    plats.length > 0
      ? plats.reduce((sum, item) => sum + item.prix * item.quantite, 0)
      : Math.max(0, Number(order.total) || 0);

  return {
    id: order.id ?? 1001 + index,
    client,
    telephone:
      typeof order.telephone === "string" ? order.telephone.trim() : "",
    plats,
    total,
    date:
      typeof order.date === "string" && order.date.trim()
        ? order.date.trim()
        : new Date().toISOString().slice(0, 10),
    statut,
    stockDeducted,
  };
};

export const sanitizeCustomer = (customer, index = 0) => {
  if (!customer || typeof customer !== "object") return null;
  const nom = typeof customer.nom === "string" ? customer.nom.trim() : "";
  if (!nom) return null;
  return {
    id: customer.id ?? Date.now() + index,
    nom,
    telephone:
      typeof customer.telephone === "string" ? customer.telephone.trim() : "",
  };
};

export const loadDishesFromStorage = () => {
  try {
    const raw = localStorage.getItem(DISHES_STORAGE_KEY);
    if (raw === null) {
      return initialDishes.map(sanitizeDish).filter(Boolean);
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return initialDishes.map(sanitizeDish).filter(Boolean);
    }
    return parsed.map(sanitizeDish).filter(Boolean);
  } catch (err) {
    console.warn("Données plats corrompues dans localStorage, restauration:", err);
    return initialDishes.map(sanitizeDish).filter(Boolean);
  }
};

export const saveDishesToStorage = (dishes) => {
  try {
    localStorage.setItem(DISHES_STORAGE_KEY, JSON.stringify(dishes));
  } catch (err) {
    console.error("Erreur sauvegarde plats:", err);
  }
};

export const loadOrdersFromStorage = () => {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw === null) {
      return initialOrders.map(sanitizeOrder).filter(Boolean);
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return initialOrders.map(sanitizeOrder).filter(Boolean);
    }
    return parsed.map(sanitizeOrder).filter(Boolean);
  } catch (err) {
    console.warn(
      "Données commandes corrompues dans localStorage, restauration:",
      err
    );
    return initialOrders.map(sanitizeOrder).filter(Boolean);
  }
};

export const saveOrdersToStorage = (orders) => {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error("Erreur sauvegarde commandes:", err);
  }
};

export const loadCustomersFromStorage = (orders = []) => {
  try {
    const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (raw === null) {
      const seeded = [...initialCustomers];
      orders.forEach((ord) => {
        if (
          ord.client &&
          !seeded.some(
            (c) => c.nom.toLowerCase() === ord.client.trim().toLowerCase()
          )
        ) {
          seeded.push({
            id: Date.now() + seeded.length,
            nom: ord.client.trim(),
            telephone: ord.telephone || "",
          });
        }
      });
      return seeded.map(sanitizeCustomer).filter(Boolean);
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return initialCustomers.map(sanitizeCustomer).filter(Boolean);
    }
    return parsed.map(sanitizeCustomer).filter(Boolean);
  } catch (err) {
    console.warn(
      "Données clients corrompues dans localStorage, restauration:",
      err
    );
    return initialCustomers.map(sanitizeCustomer).filter(Boolean);
  }
};

export const saveCustomersToStorage = (customers) => {
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
  } catch (err) {
    console.error("Erreur sauvegarde clients:", err);
  }
};

export const generateUniqueOrderId = (orders) => {
  const maxId = orders.reduce((max, order) => {
    const num = Number(order.id);
    return Number.isFinite(num) && num > max ? num : max;
  }, 1000);
  return maxId + 1;
};

export const aggregateQuantitiesByDish = (plats = []) => {
  const map = new Map();
  plats.forEach((item) => {
    if (!item || item.dishId === undefined || item.dishId === null) return;
    const prev = map.get(item.dishId) || 0;
    map.set(item.dishId, prev + Math.max(0, Number(item.quantite) || 0));
  });
  return map;
};

export const canTransitionStatus = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) {
    return {
      valid: false,
      reason: `La commande est déjà au statut « ${currentStatus} ».`,
    };
  }
  if (currentStatus === "Annulée") {
    return {
      valid: false,
      reason:
        "Action bloquée : cette commande est déjà annulée et son stock a déjà été restauré.",
    };
  }
  if (currentStatus === "Livrée") {
    return {
      valid: false,
      reason:
        "Transition invalide : une commande livrée est finalisée et ne peut plus changer de statut.",
    };
  }
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    return {
      valid: false,
      reason: `Transition de statut invalide : impossible de passer de « ${currentStatus} » à « ${nextStatus} ».`,
    };
  }
  return { valid: true };
};

export const validateStockForOrder = (dishes, plats) => {
  if (!Array.isArray(plats) || plats.length === 0) {
    return {
      valid: false,
      error: "Veuillez sélectionner au moins un plat pour la commande.",
    };
  }

  const requestedMap = aggregateQuantitiesByDish(plats);
  for (const [dishId, requestedQty] of requestedMap.entries()) {
    if (!Number.isInteger(requestedQty) || requestedQty <= 0) {
      return {
        valid: false,
        error: "La quantité commandée pour chaque plat doit être au moins 1.",
      };
    }

    const dish = dishes.find((d) => d.id === dishId);
    if (!dish) {
      return {
        valid: false,
        error: "Un des plats sélectionnés est introuvable dans le menu.",
      };
    }

    const availableStock = Math.max(0, Number(dish.stock) || 0);
    if (!dish.disponible || availableStock <= 0) {
      return {
        valid: false,
        error: `Stock insuffisant : le plat « ${dish.nom} » est actuellement épuisé (0 disponible).`,
      };
    }

    if (requestedQty > availableStock) {
      return {
        valid: false,
        error: `Stock insuffisant pour « ${dish.nom} » : quantité demandée (${requestedQty}) supérieure au stock disponible (${availableStock}).`,
      };
    }
  }

  return { valid: true };
};

export const validateStockForOrderUpdate = (dishes, oldOrder, newPlats) => {
  if (!Array.isArray(newPlats) || newPlats.length === 0) {
    return {
      valid: false,
      error: "La commande doit contenir au moins un plat.",
    };
  }

  if (!oldOrder.stockDeducted) {
    return validateStockForOrder(dishes, newPlats);
  }

  const oldMap = aggregateQuantitiesByDish(oldOrder.plats);
  const newMap = aggregateQuantitiesByDish(newPlats);
  const allIds = new Set([...oldMap.keys(), ...newMap.keys()]);

  for (const dishId of allIds) {
    const oldQty = oldMap.get(dishId) || 0;
    const newQty = newMap.get(dishId) || 0;

    if (!Number.isInteger(newQty) || newQty <= 0) {
      return {
        valid: false,
        error: "La quantité de chaque plat doit être un entier positif.",
      };
    }

    const delta = newQty - oldQty;
    if (delta > 0) {
      const dish = dishes.find((d) => d.id === dishId);
      if (!dish) {
        return {
          valid: false,
          error: "Un des plats sélectionnés est introuvable dans le menu.",
        };
      }
      const availableStock = Math.max(0, Number(dish.stock) || 0);
      if (delta > availableStock) {
        return {
          valid: false,
          error: `Stock insuffisant pour « ${dish.nom} » : ajout de ${delta} portion(s) impossible (${availableStock} restante(s) en stock, max total ${oldQty + availableStock}).`,
        };
      }
    }
  }

  return { valid: true };
};

export const applyStockDeduction = (dishes, plats) => {
  const qtyMap = aggregateQuantitiesByDish(plats);
  return dishes.map((dish) => {
    const deduct = qtyMap.get(dish.id) || 0;
    if (deduct <= 0) return dish;
    const nextStock = Math.max(0, (Number(dish.stock) || 0) - deduct);
    return {
      ...dish,
      stock: nextStock,
      disponible: nextStock > 0,
    };
  });
};

export const applyStockRestoration = (dishes, plats) => {
  const qtyMap = aggregateQuantitiesByDish(plats);
  return dishes.map((dish) => {
    const restore = qtyMap.get(dish.id) || 0;
    if (restore <= 0) return dish;
    const nextStock = Math.max(0, (Number(dish.stock) || 0) + restore);
    return {
      ...dish,
      stock: nextStock,
      disponible: nextStock > 0,
    };
  });
};

export const applyStockDelta = (dishes, oldPlats, newPlats) => {
  const oldMap = aggregateQuantitiesByDish(oldPlats);
  const newMap = aggregateQuantitiesByDish(newPlats);

  return dishes.map((dish) => {
    const oldQty = oldMap.get(dish.id) || 0;
    const newQty = newMap.get(dish.id) || 0;
    const delta = newQty - oldQty;
    if (delta === 0) return dish;

    const nextStock = Math.max(0, (Number(dish.stock) || 0) - delta);
    return {
      ...dish,
      stock: nextStock,
      disponible: nextStock > 0,
    };
  });
};