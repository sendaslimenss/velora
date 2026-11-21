import { CATEGORIES, ORDER_STATUSES } from "../data/initialData";

export const VALIDATION_LIMITS = {
  DISH_NAME_MIN: 2,
  DISH_NAME_MAX: 80,
  DISH_DESC_MIN: 10,
  DISH_DESC_MAX: 500,
  DISH_PRICE_MAX: 10000,
  DISH_STOCK_MAX: 9999,
  CLIENT_NAME_MIN: 2,
  CLIENT_NAME_MAX: 80,
  EMAIL_MAX: 120,
  PHONE_MIN_DIGITS: 8,
  PHONE_MAX_DIGITS: 15,
  ORDER_ITEM_QTY_MAX: 99,
  MAX_IMAGE_FILE_BYTES: 5 * 1024 * 1024, // 5 MB
};

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const SUPPORTED_IMAGE_EXT_REGEX =
  /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i;
const stripControlChars = (str) =>
  Array.from(str)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return !(
        (code >= 0 && code <= 8) ||
        code === 11 ||
        code === 12 ||
        (code >= 14 && code <= 31) ||
        code === 127
      );
    })
    .join("");

/**
 * Safely converts any user-supplied value into a sanitized single-line string,
 * stripping control characters, HTML tags, and dangerous script protocols.
 */
export const sanitizeText = (value, maxLength = 200) => {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string" && typeof value !== "number") return "";

  return stripControlChars(String(value))
    .replace(/<[^>]*>/g, "")
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
};

/**
 * Sanitizes multi-line text while preserving intentional line breaks.
 */
export const sanitizeMultilineText = (value, maxLength = 500) => {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string" && typeof value !== "number") return "";

  return stripControlChars(String(value))
    .replace(/<[^>]*>/g, "")
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, "")
    .replace(/[ \t]+/g, " ")
    .trim()
    .slice(0, maxLength);
};

/**
 * Validates an uploaded image File object before FileReader decoding.
 */
export const validateImageFile = (file) => {
  if (!file || typeof file !== "object") {
    return { valid: false, error: "Aucun fichier sélectionné." };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        "Format d'image non supporté. Utilisez JPG, PNG, WEBP, GIF ou AVIF.",
    };
  }

  if (file.size > VALIDATION_LIMITS.MAX_IMAGE_FILE_BYTES) {
    return {
      valid: false,
      error: "L'image dépasse la taille maximale autorisée (5 Mo).",
    };
  }

  return { valid: true, error: "" };
};

/**
 * Validates image URLs, relative asset paths, and encoded data:image URIs.
 * Blocks javascript:, file:, data:text/html, and SVG script injections.
 */
export const validateImageSource = (src) => {
  if (typeof src !== "string" || !src.trim()) {
    return {
      valid: false,
      error:
        "Importez un fichier image, collez une URL valide ou choisissez un visuel VELORA.",
    };
  }

  const trimmed = src.trim();

  if (trimmed.startsWith("data:image/")) {
    const validDataPrefix =
      /^data:image\/(jpeg|jpg|png|webp|gif|svg\+xml|avif)(;charset=[^;,]+)?;(base64|utf8),/i;
    if (!validDataPrefix.test(trimmed)) {
      return {
        valid: false,
        error: "Format d'image encodée non supporté.",
      };
    }
    if (/<script|onload=|onerror=|javascript:/i.test(trimmed)) {
      return {
        valid: false,
        error: "Contenu non sécurisé détecté dans le visuel.",
      };
    }
    return { valid: true, error: "" };
  }

  if (/^(javascript|vbscript|file|data):/i.test(trimmed)) {
    return {
      valid: false,
      error: "Protocole d'URL non autorisé pour des raisons de sécurité.",
    };
  }

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../")
  ) {
    if (!SUPPORTED_IMAGE_EXT_REGEX.test(trimmed)) {
      return {
        valid: false,
        error:
          "Extension d'image locale non supportée (JPG, PNG, WEBP, SVG, AVIF).",
      };
    }
    return { valid: true, error: "" };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        valid: false,
        error: "L'URL de l'image doit commencer par http:// ou https://.",
      };
    }
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return {
        valid: false,
        error: "Veuillez saisir une adresse URL complète et valide.",
      };
    }
    return { valid: true, error: "" };
  } catch {
    return {
      valid: false,
      error: "Adresse URL d'image invalide (ex: https://exemple.com/plat.jpg).",
    };
  }
};

/**
 * Returns a safe image src for <img> tags, falling back if stored data was tampered with.
 */
export const getSafeImageSrc = (src, fallbackSrc = "/dishes/Noir Lobster.jpg") =>
  validateImageSource(src).valid ? src.trim() : fallbackSrc;

/**
 * Validates dish creation and edit forms.
 */
export const validateDishForm = (formData) => {
  const safeInput = formData && typeof formData === "object" ? formData : {};
  const errors = {};

  const cleanName = sanitizeText(
    safeInput.nom,
    VALIDATION_LIMITS.DISH_NAME_MAX
  );
  if (!cleanName) {
    errors.nom = "Le nom du plat est obligatoire.";
  } else if (cleanName.length < VALIDATION_LIMITS.DISH_NAME_MIN) {
    errors.nom = `Le nom doit contenir au moins ${VALIDATION_LIMITS.DISH_NAME_MIN} caractères.`;
  } else if (!/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(cleanName)) {
    errors.nom = "Le nom du plat doit contenir des caractères valides.";
  }

  if (!safeInput.categorie || !CATEGORIES.includes(safeInput.categorie)) {
    errors.categorie = "Veuillez sélectionner une catégorie valide.";
  }

  const cleanDescription = sanitizeMultilineText(
    safeInput.description,
    VALIDATION_LIMITS.DISH_DESC_MAX
  );
  if (!cleanDescription) {
    errors.description = "La description gastronomique est obligatoire.";
  } else if (cleanDescription.length < VALIDATION_LIMITS.DISH_DESC_MIN) {
    errors.description = `La description doit comporter au moins ${VALIDATION_LIMITS.DISH_DESC_MIN} caractères.`;
  }

  const rawPrice = String(safeInput.prix ?? "").trim();
  const numericPrice = Number(rawPrice);
  if (rawPrice === "" || !Number.isFinite(numericPrice)) {
    errors.prix = "Veuillez saisir un prix numérique valide.";
  } else if (numericPrice <= 0) {
    errors.prix = "Le prix doit être strictement supérieur à 0 DT.";
  } else if (numericPrice > VALIDATION_LIMITS.DISH_PRICE_MAX) {
    errors.prix = `Le prix ne peut pas dépasser ${VALIDATION_LIMITS.DISH_PRICE_MAX} DT.`;
  }

  const rawStock = String(safeInput.stock ?? "").trim();
  const numericStock = Number(rawStock);
  if (rawStock === "" || !Number.isFinite(numericStock)) {
    errors.stock = "Veuillez saisir une quantité en stock valide.";
  } else if (!Number.isInteger(numericStock) || numericStock < 0) {
    errors.stock =
      "Le stock doit être un nombre entier positif ou égal à 0.";
  } else if (numericStock > VALIDATION_LIMITS.DISH_STOCK_MAX) {
    errors.stock = `Le stock ne peut pas dépasser ${VALIDATION_LIMITS.DISH_STOCK_MAX} portions.`;
  }

  const imageCheck = validateImageSource(safeInput.image);
  if (!imageCheck.valid) {
    errors.image = imageCheck.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      nom: cleanName,
      categorie: CATEGORIES.includes(safeInput.categorie)
        ? safeInput.categorie
        : CATEGORIES[1],
      description: cleanDescription,
      prix: Number.isFinite(numericPrice)
        ? Math.round(numericPrice * 100) / 100
        : 0,
      stock: Number.isInteger(numericStock) ? Math.max(0, numericStock) : 0,
      image: typeof safeInput.image === "string" ? safeInput.image.trim() : "",
    },
  };
};

/**
 * Validates customer fields (name, phone number, and email).
 */
export const validateCustomerForm = (
  customerData,
  { requirePhone = true, requireEmail = false } = {}
) => {
  const safeInput =
    customerData && typeof customerData === "object" ? customerData : {};
  const errors = {};

  const rawName = safeInput.client ?? safeInput.nom ?? "";
  const cleanName = sanitizeText(rawName, VALIDATION_LIMITS.CLIENT_NAME_MAX);
  if (!cleanName) {
    errors.client = "Le nom du client est obligatoire.";
  } else if (
    cleanName.length < VALIDATION_LIMITS.CLIENT_NAME_MIN ||
    !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(cleanName)
  ) {
    errors.client =
      "Veuillez saisir un nom de client valide (au moins 2 lettres).";
  }

  const cleanPhone = sanitizeText(safeInput.telephone, 30);
  const compactPhone = cleanPhone.replace(/[\s().-]/g, "");
  if (!compactPhone) {
    if (requirePhone) {
      errors.telephone = "Le numéro de téléphone du client est obligatoire.";
    }
  } else if (!/^\+?[0-9]{8,15}$/.test(compactPhone)) {
    errors.telephone =
      "Numéro de téléphone invalide (8 à 15 chiffres requis, ex: +216 22 345 678).";
  }

  const cleanEmail = sanitizeText(
    safeInput.email,
    VALIDATION_LIMITS.EMAIL_MAX
  ).toLowerCase();
  if (!cleanEmail) {
    if (requireEmail) {
      errors.email = "L'adresse e-mail du client est obligatoire.";
    }
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
    errors.email =
      "Format d'adresse e-mail invalide (ex: client@domaine.com).";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      client: cleanName,
      nom: cleanName,
      telephone: cleanPhone,
      email: cleanEmail,
    },
  };
};

/**
 * Validates order status transitions to prevent illegal reversions or duplicate stock operations.
 */
export const validateStatusTransition = (currentStatus, nextStatus) => {
  if (!ORDER_STATUSES.includes(nextStatus)) {
    return { valid: false, error: "Statut de commande non reconnu." };
  }
  if (currentStatus === nextStatus) {
    return { valid: true, error: "" };
  }
  if (currentStatus === "Annulée") {
    return {
      valid: false,
      error: "Une commande annulée est définitive et ne peut plus être modifiée.",
    };
  }
  if (currentStatus === "Livrée") {
    return {
      valid: false,
      error: "Une commande déjà livrée ne peut plus changer de statut.",
    };
  }
  return { valid: true, error: "" };
};

/**
 * Validates order creation and edition payloads against live dish inventory.
 */
export const validateOrderForm = (
  orderPayload,
  dishes = [],
  existingOrder = null
) => {
  const safeOrder =
    orderPayload && typeof orderPayload === "object" ? orderPayload : {};
  const customerCheck = validateCustomerForm(safeOrder, {
    requirePhone: true,
    requireEmail: false,
  });

  const errors = { ...customerCheck.errors };
  const itemErrors = {};

  const statut = safeOrder.statut || "En attente";
  if (!ORDER_STATUSES.includes(statut)) {
    errors.statut = "Statut de commande invalide.";
  }

  const dateStr = sanitizeText(safeOrder.date, 20);
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    errors.date = "Veuillez sélectionner une date de commande valide.";
  }

  const rawItems = Array.isArray(safeOrder.plats) ? safeOrder.plats : [];
  if (rawItems.length === 0) {
    errors.plats = "Veuillez ajouter au moins un plat à la commande.";
  }

  const dishMap = new Map(dishes.map((d) => [d.id, d]));
  const previouslyDeductedMap = new Map();
  if (existingOrder && existingOrder.stockDeducted) {
    (existingOrder.plats || []).forEach((item) => {
      previouslyDeductedMap.set(
        item.dishId,
        (previouslyDeductedMap.get(item.dishId) || 0) +
          (Number(item.quantite) || 0)
      );
    });
  }

  const aggregatedQuantities = new Map();
  const normalizedItems = [];

  rawItems.forEach((item, idx) => {
    const dish = dishMap.get(item?.dishId);
    if (!dish) {
      itemErrors[idx] = "Ce plat n'existe plus dans le menu.";
      return;
    }

    const qty = Number(item?.quantite);
    if (
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > VALIDATION_LIMITS.ORDER_ITEM_QTY_MAX
    ) {
      itemErrors[idx] = `La quantité pour « ${dish.nom} » doit être un entier entre 1 et ${VALIDATION_LIMITS.ORDER_ITEM_QTY_MAX}.`;
      return;
    }

    const unitPrice = Number(dish.prix);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      itemErrors[idx] = `Prix invalide pour « ${dish.nom} ».`;
      return;
    }

    aggregatedQuantities.set(
      dish.id,
      (aggregatedQuantities.get(dish.id) || 0) + qty
    );

    normalizedItems.push({
      dishId: dish.id,
      nom: dish.nom,
      quantite: qty,
      prix: unitPrice,
    });
  });

  if (Object.keys(itemErrors).length > 0) {
    errors.itemErrors = itemErrors;
    if (!errors.plats) {
      errors.plats = "Certaines lignes de commande contiennent des erreurs.";
    }
  }

  // Verify stock availability across aggregated quantities
  if (statut !== "Annulée") {
    for (const [dishId, requestedQty] of aggregatedQuantities.entries()) {
      const dish = dishMap.get(dishId);
      if (!dish) continue;
      const alreadyReserved = previouslyDeductedMap.get(dishId) || 0;
      const maxAllowed = Math.max(0, Number(dish.stock) || 0) + alreadyReserved;

      if (requestedQty > maxAllowed) {
        errors.plats = `Stock insuffisant pour « ${dish.nom} » (${maxAllowed} portion(s) disponible(s), ${requestedQty} demandée(s)).`;
        break;
      }
    }
  }

  const computedTotal = normalizedItems.reduce(
    (sum, item) => sum + item.prix * item.quantite,
    0
  );

  if (
    normalizedItems.length > 0 &&
    (!Number.isFinite(computedTotal) || computedTotal <= 0)
  ) {
    errors.total = "Le montant total de la commande est invalide.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      client: customerCheck.sanitized.client,
      telephone: customerCheck.sanitized.telephone,
      email: customerCheck.sanitized.email,
      date: dateStr || new Date().toISOString().slice(0, 10),
      statut,
      plats: normalizedItems,
      total: Math.round(computedTotal * 100) / 100,
    },
  };
};