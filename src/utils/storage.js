import {
  sanitizeText,
  sanitizeMultilineText,
  getSafeImageSrc,
} from "./validation";
import { CATEGORIES, ORDER_STATUSES } from "../data/initialData";

export const STORAGE_KEYS = {
  DISHES: "velora_dishes_v1",
  ORDERS: "velora_orders_v1",
  CUSTOMERS: "velora_customers_v1",
  META: "velora_meta_v1",
};

export const COMMITTED_ORDER_STATUSES = [
  "En préparation",
  "Prête",
  "Livrée",
];

export const isCommittedStatus = (status) =>
  COMMITTED_ORDER_STATUSES.includes(status);

export const getOrderTotal = (order) => {
  if (!order || typeof order !== "object") return 0;
  if (Array.isArray(order.plats) && order.plats.length > 0) {
    const sum = order.plats.reduce(
      (acc, item) =>
        acc +
        Math.max(0, Number(item?.prix) || 0) *
          Math.max(0, Math.floor(Number(item?.quantite) || 0)),
      0
    );
    return Math.round(sum * 100) / 100;
  }
  return Math.max(0, Number(order.total) || 0);
};

/**
 * Strips prototype-pollution keys (__proto__, constructor, prototype) from parsed JSON.
 */
const stripUnsafeKeys = (obj) => {
  if (!obj || typeof obj !== "object") return {};
  const clean = {};
  Object.keys(obj).forEach((key) => {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return;
    }
    clean[key] = obj[key];
  });
  return clean;
};

export const normalizeDish = (rawDish, index = 0) => {
  const dish = stripUnsafeKeys(rawDish);
  const parsedStock = Math.max(0, Math.floor(Number(dish.stock) || 0));
  const rawPrice = Number(dish.prix);
  const parsedPrice =
    Number.isFinite(rawPrice) && rawPrice > 0
      ? Math.round(rawPrice * 100) / 100
      : 1;
  const isAvailable = dish.disponible === false ? false : parsedStock > 0;

  return {
    id: dish.id ?? Date.now() + index,
    nom: sanitizeText(dish.nom, 80) || "Plat VELORA",
    categorie: CATEGORIES.includes(dish.categorie)
      ? dish.categorie
      : CATEGORIES[1],
    description: sanitizeMultilineText(dish.description, 500),
    prix: parsedPrice,
    stock: parsedStock,
    image: getSafeImageSrc(dish.image),
    disponible: isAvailable,
  };
};

export const normalizeOrder = (rawOrder, index = 0) => {
  const order = stripUnsafeKeys(rawOrder);
  const statut = ORDER_STATUSES.includes(order.statut)
    ? order.statut
    : "En attente";

  const stockDeducted =
    typeof order.stockDeducted === "boolean"
      ? order.stockDeducted
      : isCommittedStatus(statut);

  const plats = Array.isArray(order.plats)
    ? order.plats
        .filter((item) => item && typeof item === "object")
        .map((rawItem) => {
          const item = stripUnsafeKeys(rawItem);
          return {
            dishId: item.dishId,
            nom: sanitizeText(item.nom, 80) || "Article",
            quantite: Math.max(1, Math.floor(Number(item.quantite) || 1)),
            prix: Math.max(0, Number(item.prix) || 0),
          };
        })
    : [];

  const rawDate = sanitizeText(order.date, 20);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : new Date().toISOString().slice(0, 10);

  const normalized = {
    id: order.id ?? 1000 + index + 1,
    client: sanitizeText(order.client, 80) || "Client",
    telephone: sanitizeText(order.telephone, 30),
    email: sanitizeText(order.email, 120).toLowerCase(),
    date: validDate,
    statut,
    plats,
    stockDeducted,
  };

  normalized.total = getOrderTotal(normalized);
  return normalized;
};

export const normalizeCustomer = (rawCustomer, index = 0) => {
  const customer = stripUnsafeKeys(rawCustomer);
  return {
    id: customer.id ?? `cust-${index + 1}`,
    nom: sanitizeText(customer.nom, 80) || "Client",
    telephone: sanitizeText(customer.telephone, 30),
    email: sanitizeText(customer.email, 120).toLowerCase(),
  };
};

const isStorageAvailable = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const loadCollectionFromStorage = (
  key,
  fallbackData = [],
  normalizer = (item) => item
) => {
  const safeFallback = Array.isArray(fallbackData)
    ? fallbackData.map((item, idx) => normalizer(item, idx))
    : [];

  if (!isStorageAvailable()) {
    return {
      data: safeFallback,
      rawSnapshot: null,
      seededFromDefault: true,
      recoveredFromCorruption: false,
    };
  }

  let raw = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch (err) {
    console.warn(`Lecture localStorage impossible pour "${key}":`, err);
    return {
      data: safeFallback,
      rawSnapshot: null,
      seededFromDefault: true,
      recoveredFromCorruption: false,
    };
  }

  if (raw === null) {
    return {
      data: safeFallback,
      rawSnapshot: null,
      seededFromDefault: true,
      recoveredFromCorruption: false,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`Le contenu de "${key}" n'est pas un tableau valide.`);
    }

    const normalized = parsed
      .filter((item) => item !== null && typeof item === "object")
      .map((item, idx) => normalizer(item, idx));

    return {
      data: normalized,
      rawSnapshot: raw,
      seededFromDefault: false,
      recoveredFromCorruption: false,
    };
  } catch (err) {
    console.warn(
      `Données corrompues détectées pour "${key}", restauration sécurisée:`,
      err
    );
    try {
      window.localStorage.setItem(`${key}_corrupted_backup`, String(raw));
    } catch {
      // Ignore secondary quota errors
    }

    return {
      data: safeFallback,
      rawSnapshot: null,
      seededFromDefault: true,
      recoveredFromCorruption: true,
    };
  }
};

/**
 * Validates and persists a collection to localStorage only when its serialized
 * JSON differs from the last saved snapshot.
 */
export const saveCollectionToStorage = (
  key,
  data,
  snapshotsRef,
  normalizer = null
) => {
  if (!isStorageAvailable()) return false;
  if (!Array.isArray(data)) {
    console.error(`Refus de sauvegarde: "${key}" doit être un tableau.`);
    return false;
  }

  try {
    const validatedData =
      typeof normalizer === "function"
        ? data
            .filter((item) => item && typeof item === "object")
            .map((item, idx) => normalizer(item, idx))
        : data;

    const serialized = JSON.stringify(validatedData);
    if (snapshotsRef?.current && snapshotsRef.current[key] === serialized) {
      return false;
    }

    window.localStorage.setItem(key, serialized);
    if (snapshotsRef?.current) {
      snapshotsRef.current[key] = serialized;
    }

    window.localStorage.setItem(
      STORAGE_KEYS.META,
      JSON.stringify({
        version: 1,
        updatedAt: new Date().toISOString(),
      })
    );
    return true;
  } catch (err) {
    console.error(`Erreur lors de la sauvegarde localStorage ("${key}"):`, err);
    return false;
  }
};

export const clearVeloraStorage = () => {
  if (!isStorageAvailable()) return;
  try {
    Object.values(STORAGE_KEYS).forEach((storageKey) => {
      window.localStorage.removeItem(storageKey);
    });
  } catch (err) {
    console.error("Erreur réinitialisation localStorage:", err);
  }
};