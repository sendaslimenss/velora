export const STORAGE_KEYS = {
  DISHES: "velora_dishes_v1",
  ORDERS: "velora_orders_v1",
  CUSTOMERS: "velora_customers_v1",
  META: "velora_meta_v1",
};

export const COMMITTED_ORDER_STATUSES = [
  "Confirmée",
  "En préparation",
  "Prête",
  "Livrée",
];

export const isCommittedStatus = (status) =>
  COMMITTED_ORDER_STATUSES.includes(status);

export const VALID_STATUS_TRANSITIONS = {
  "En attente": ["Confirmée", "En préparation", "Prête", "Livrée", "Annulée"],
  Confirmée: ["En préparation", "Prête", "Livrée", "Annulée"],
  "En préparation": ["Prête", "Livrée", "Annulée"],
  Prête: ["Livrée", "Annulée"],
  Livrée: [],
  Annulée: [],
};

export const getOrderTotal = (order) => {
  if (!order || typeof order !== "object") return 0;
  if (Array.isArray(order.plats) && order.plats.length > 0) {
    return order.plats.reduce(
      (sum, item) =>
        sum + (Number(item?.prix) || 0) * (Number(item?.quantite) || 0),
      0
    );
  }
  return Number(order.total) || 0;
};

export const normalizeDish = (dish) => {
  const parsedStock = Math.max(0, Math.floor(Number(dish?.stock) || 0));
  const parsedPrice = Math.max(0, Number(dish?.prix) || 0);
  const isAvailable = dish?.disponible === false ? false : parsedStock > 0;

  return {
    ...dish,
    nom: typeof dish?.nom === "string" ? dish.nom.trim() : "Plat sans nom",
    categorie:
      typeof dish?.categorie === "string" && dish.categorie.trim()
        ? dish.categorie.trim()
        : "Plats principaux",
    description:
      typeof dish?.description === "string" ? dish.description.trim() : "",
    prix: parsedPrice,
    stock: parsedStock,
    image: typeof dish?.image === "string" ? dish.image.trim() : "",
    disponible: isAvailable,
  };
};

export const normalizeOrder = (order) => {
  const statut =
    typeof order?.statut === "string" && order.statut.trim()
      ? order.statut.trim()
      : "En attente";

  const stockDeducted =
    typeof order?.stockDeducted === "boolean"
      ? order.stockDeducted
      : isCommittedStatus(statut);

  const plats = Array.isArray(order?.plats)
    ? order.plats
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          dishId: item.dishId,
          nom: typeof item.nom === "string" ? item.nom.trim() : "Article",
          quantite: Math.max(1, Math.floor(Number(item.quantite) || 1)),
          prix: Math.max(0, Number(item.prix) || 0),
        }))
    : [];

  const normalized = {
    ...order,
    client:
      typeof order?.client === "string" && order.client.trim()
        ? order.client.trim()
        : "Client",
    telephone:
      typeof order?.telephone === "string" ? order.telephone.trim() : "",
    email: typeof order?.email === "string" ? order.email.trim() : "",
    date:
      typeof order?.date === "string" && order.date.trim()
        ? order.date.trim()
        : new Date().toISOString().slice(0, 10),
    statut,
    plats,
    stockDeducted,
  };

  normalized.total = getOrderTotal(normalized);
  return normalized;
};

export const normalizeCustomer = (customer, index = 0) => ({
  ...customer,
  id: customer?.id ?? `cust-${index + 1}`,
  nom:
    typeof customer?.nom === "string" && customer.nom.trim()
      ? customer.nom.trim()
      : "Client",
  telephone:
    typeof customer?.telephone === "string" ? customer.telephone.trim() : "",
  email: typeof customer?.email === "string" ? customer.email.trim() : "",
});

const isStorageAvailable = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

/**
 * Loads a collection from localStorage.
 * - Uses fallbackData ONLY when no saved entry exists (null) or data is corrupted.
 * - Preserves intentional empty arrays ("[]") without overwriting with demo data.
 * - Backs up corrupted payloads before recovering cleanly.
 */
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

  let raw;
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

  // First visit: key does not exist yet
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
      // Ignore secondary storage errors if quota is full
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
 * Persists a collection to localStorage only when its serialized JSON differs
 * from the last persisted snapshot, preventing duplicate writes on mount/StrictMode.
 */
export const saveCollectionToStorage = (
  key,
  data,
  snapshotsRef,
  normalizer
) => {
  if (!isStorageAvailable()) return false;

  try {
    const payload = Array.isArray(data)
      ? typeof normalizer === "function"
        ? data.map((item, idx) => normalizer(item, idx))
        : data
      : [];
    const serialized = JSON.stringify(payload);
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

export const loadFromStorage = (key, fallbackData, normalizer) =>
  loadCollectionFromStorage(key, fallbackData, normalizer).data;

export const saveToStorage = (key, value) => {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Erreur sauvegarde localStorage ("${key}"):`, err);
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