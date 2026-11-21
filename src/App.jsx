import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import {
  initialDishes,
  initialOrders,
  initialCustomers,
} from "./data/initialData";
import {
  STORAGE_KEYS,
  isCommittedStatus,
  getOrderTotal,
  normalizeDish,
  normalizeOrder,
  normalizeCustomer,
  loadCollectionFromStorage,
  saveCollectionToStorage,
  clearVeloraStorage,
} from "./utils/storage";
import {
  validateDishForm,
  validateCustomerForm,
  validateOrderForm,
  validateStatusTransition,
  getSafeImageSrc,
} from "./utils/validation";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Ajouter from "./pages/Ajouter";
import Commandes from "./pages/Commandes";
import Statistiques from "./pages/Statistiques";

const mergeCustomersWithOrders = (customersList, ordersList) => {
  const merged = [...customersList];
  const seen = new Set(merged.map((c) => c.nom.toLowerCase()));

  ordersList.forEach((order, idx) => {
    const clientName = (order?.client || "").trim();
    if (!clientName) return;
    const key = clientName.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(
        normalizeCustomer(
          {
            id: `cust-order-${order.id ?? idx}`,
            nom: clientName,
            telephone: order?.telephone || "",
            email: order?.email || "",
          },
          idx
        )
      );
    }
  });

  return merged;
};

export default function App() {
  const initialHydrationRef = useRef(null);

  if (initialHydrationRef.current === null) {
    const dishesHydration = loadCollectionFromStorage(
      STORAGE_KEYS.DISHES,
      initialDishes,
      normalizeDish
    );
    const ordersHydration = loadCollectionFromStorage(
      STORAGE_KEYS.ORDERS,
      initialOrders,
      normalizeOrder
    );
    const customersHydration = loadCollectionFromStorage(
      STORAGE_KEYS.CUSTOMERS,
      initialCustomers,
      normalizeCustomer
    );

    const hydratedCustomers = customersHydration.seededFromDefault
      ? mergeCustomersWithOrders(
          customersHydration.data,
          ordersHydration.data
        )
      : customersHydration.data;

    initialHydrationRef.current = {
      dishes: dishesHydration.data,
      orders: ordersHydration.data,
      customers: hydratedCustomers,
      snapshots: {
        [STORAGE_KEYS.DISHES]: dishesHydration.rawSnapshot,
        [STORAGE_KEYS.ORDERS]: ordersHydration.rawSnapshot,
        [STORAGE_KEYS.CUSTOMERS]: customersHydration.rawSnapshot,
      },
    };
  }

  const lastSavedSnapshotsRef = useRef(initialHydrationRef.current.snapshots);

  const [dishes, setDishes] = useState(
    () => initialHydrationRef.current.dishes
  );
  const [orders, setOrders] = useState(
    () => initialHydrationRef.current.orders
  );
  const [customers, setCustomers] = useState(
    () => initialHydrationRef.current.customers
  );
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    saveCollectionToStorage(
      STORAGE_KEYS.DISHES,
      dishes,
      lastSavedSnapshotsRef,
      normalizeDish
    );
  }, [dishes]);

  useEffect(() => {
    saveCollectionToStorage(
      STORAGE_KEYS.ORDERS,
      orders,
      lastSavedSnapshotsRef,
      normalizeOrder
    );
  }, [orders]);

  useEffect(() => {
    saveCollectionToStorage(
      STORAGE_KEYS.CUSTOMERS,
      customers,
      lastSavedSnapshotsRef,
      normalizeCustomer
    );
  }, [customers]);

  useEffect(() => {
    const handleStorageSync = (event) => {
      if (!event.key || !Object.values(STORAGE_KEYS).includes(event.key)) {
        return;
      }

      if (event.key === STORAGE_KEYS.DISHES) {
        const next = loadCollectionFromStorage(
          STORAGE_KEYS.DISHES,
          initialDishes,
          normalizeDish
        );
        lastSavedSnapshotsRef.current[STORAGE_KEYS.DISHES] = next.rawSnapshot;
        setDishes(next.data);
      } else if (event.key === STORAGE_KEYS.ORDERS) {
        const next = loadCollectionFromStorage(
          STORAGE_KEYS.ORDERS,
          initialOrders,
          normalizeOrder
        );
        lastSavedSnapshotsRef.current[STORAGE_KEYS.ORDERS] = next.rawSnapshot;
        setOrders(next.data);
      } else if (event.key === STORAGE_KEYS.CUSTOMERS) {
        const next = loadCollectionFromStorage(
          STORAGE_KEYS.CUSTOMERS,
          initialCustomers,
          normalizeCustomer
        );
        lastSavedSnapshotsRef.current[STORAGE_KEYS.CUSTOMERS] =
          next.rawSnapshot;
        setCustomers(next.data);
      }
    };

    window.addEventListener("storage", handleStorageSync);
    return () => window.removeEventListener("storage", handleStorageSync);
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY || window.pageYOffset || 0);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const upsertCustomer = useCallback(
    (clientName, telephone = "", email = "") => {
      const check = validateCustomerForm(
        { client: clientName, telephone, email },
        { requirePhone: false, requireEmail: false }
      );
      if (!check.isValid) return;

      const { nom, telephone: cleanPhone, email: cleanEmail } = check.sanitized;

      setCustomers((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.nom.toLowerCase() === nom.toLowerCase()
        );
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = normalizeCustomer({
            ...updated[existingIndex],
            nom,
            telephone: cleanPhone || updated[existingIndex].telephone || "",
            email: cleanEmail || updated[existingIndex].email || "",
          });
          return updated;
        }
        return [
          normalizeCustomer({
            id: `cust-${Date.now()}`,
            nom,
            telephone: cleanPhone,
            email: cleanEmail,
          }),
          ...prev,
        ];
      });
    },
    []
  );

  const addDish = (newDish) => {
    const check = validateDishForm(newDish);
    if (!check.isValid) {
      const firstError = Object.values(check.errors)[0];
      return { ok: false, error: firstError, errors: check.errors };
    }

    const created = normalizeDish({
      id: Date.now(),
      ...check.sanitized,
      disponible: check.sanitized.stock > 0,
    });

    setDishes((prev) => [created, ...prev]);
    return {
      ok: true,
      dish: created,
      message: `Le plat « ${created.nom} » a été ajouté au menu.`,
    };
  };

  const updateDish = (updatedDish) => {
    if (!updatedDish || updatedDish.id === undefined || updatedDish.id === null) {
      return { ok: false, error: "Identifiant du plat manquant." };
    }

    const check = validateDishForm(updatedDish);
    if (!check.isValid) {
      const firstError = Object.values(check.errors)[0];
      return { ok: false, error: firstError, errors: check.errors };
    }

    setDishes((prev) =>
      prev.map((dish) =>
        dish.id === updatedDish.id
          ? normalizeDish({
              ...dish,
              ...check.sanitized,
              disponible: check.sanitized.stock > 0,
            })
          : dish
      )
    );

    return {
      ok: true,
      message: `Le plat « ${check.sanitized.nom} » a été mis à jour.`,
    };
  };

  const deleteDish = (dishId) => {
    if (dishId === undefined || dishId === null) return;
    setDishes((prev) => prev.filter((dish) => dish.id !== dishId));
  };

  const createOrder = (orderPayload) => {
    const validation = validateOrderForm(orderPayload, dishes, null);
    if (!validation.isValid) {
      const firstError =
        validation.errors.client ||
        validation.errors.telephone ||
        validation.errors.email ||
        validation.errors.plats ||
        validation.errors.statut ||
        "Veuillez corriger les erreurs du formulaire de commande.";
      return { ok: false, error: firstError, errors: validation.errors };
    }

    const { client, telephone, email, date, statut, plats } =
      validation.sanitized;
    const shouldDeduct = isCommittedStatus(statut);

    if (shouldDeduct) {
      const deductionMap = new Map();
      plats.forEach((item) => {
        deductionMap.set(
          item.dishId,
          (deductionMap.get(item.dishId) || 0) + item.quantite
        );
      });

      setDishes((prev) =>
        prev.map((dish) => {
          if (!deductionMap.has(dish.id)) return dish;
          const nextStock = Math.max(
            0,
            Number(dish.stock) - deductionMap.get(dish.id)
          );
          return {
            ...dish,
            stock: nextStock,
            disponible: nextStock > 0,
          };
        })
      );
    }

    const nextId =
      orders.reduce((maxId, o) => Math.max(maxId, Number(o.id) || 1000), 1000) +
      1;

    const createdOrder = normalizeOrder({
      id: nextId,
      client,
      telephone,
      email,
      plats,
      total: getOrderTotal({ plats }),
      date,
      statut,
      stockDeducted: shouldDeduct,
    });

    setOrders((prev) => [createdOrder, ...prev]);
    upsertCustomer(client, telephone, email);

    return {
      ok: true,
      order: createdOrder,
      message: shouldDeduct
        ? `Commande #${nextId} enregistrée (${statut}) et stock déduit.`
        : `Commande #${nextId} enregistrée en attente.`,
    };
  };

  const updateOrder = (orderId, orderPayload) => {
    const existingOrder = orders.find((o) => o.id === orderId);
    if (!existingOrder) {
      return { ok: false, error: "Commande introuvable." };
    }

    if (
      existingOrder.statut === "Annulée" ||
      existingOrder.statut === "Livrée"
    ) {
      return {
        ok: false,
        error: `Une commande « ${existingOrder.statut} » ne peut plus être modifiée.`,
      };
    }

    const validation = validateOrderForm(orderPayload, dishes, existingOrder);
    if (!validation.isValid) {
      const firstError =
        validation.errors.client ||
        validation.errors.telephone ||
        validation.errors.email ||
        validation.errors.plats ||
        "Veuillez corriger les erreurs avant d'enregistrer.";
      return { ok: false, error: firstError, errors: validation.errors };
    }

    const { client, telephone, email, date, statut, plats } =
      validation.sanitized;

    const wasDeducted = Boolean(existingOrder.stockDeducted);
    const willBeDeducted = isCommittedStatus(statut);

    const prevQtyMap = new Map();
    if (wasDeducted) {
      (existingOrder.plats || []).forEach((item) => {
        prevQtyMap.set(
          item.dishId,
          (prevQtyMap.get(item.dishId) || 0) + Number(item.quantite)
        );
      });
    }

    const nextQtyMap = new Map();
    if (willBeDeducted) {
      plats.forEach((item) => {
        nextQtyMap.set(
          item.dishId,
          (nextQtyMap.get(item.dishId) || 0) + Number(item.quantite)
        );
      });
    }

    const allDishIds = new Set([...prevQtyMap.keys(), ...nextQtyMap.keys()]);
    const deltaMap = new Map();
    allDishIds.forEach((dishId) => {
      deltaMap.set(
        dishId,
        (nextQtyMap.get(dishId) || 0) - (prevQtyMap.get(dishId) || 0)
      );
    });

    setDishes((prev) =>
      prev.map((dish) => {
        if (!deltaMap.has(dish.id)) return dish;
        const delta = deltaMap.get(dish.id);
        if (delta === 0) return dish;
        const nextStock = Math.max(0, Number(dish.stock) - delta);
        return {
          ...dish,
          stock: nextStock,
          disponible: nextStock > 0,
        };
      })
    );

    const updatedOrder = normalizeOrder({
      ...existingOrder,
      client,
      telephone,
      email,
      plats,
      total: getOrderTotal({ plats }),
      date,
      statut,
      stockDeducted: willBeDeducted,
    });

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? updatedOrder : o))
    );
    upsertCustomer(client, telephone, email);

    return {
      ok: true,
      order: updatedOrder,
      message: `Commande #${orderId} mise à jour avec succès.`,
    };
  };

  const updateOrderStatus = (orderId, nextStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { ok: false, error: "Commande introuvable." };
    }

    const transitionCheck = validateStatusTransition(
      targetOrder.statut,
      nextStatus
    );
    if (!transitionCheck.valid) {
      return { ok: false, error: transitionCheck.error };
    }

    if (targetOrder.statut === nextStatus) {
      return { ok: true, message: "Statut inchangé." };
    }

    const wasDeducted = Boolean(targetOrder.stockDeducted);
    const willBeDeducted = isCommittedStatus(nextStatus);

    if (!wasDeducted && willBeDeducted) {
      const neededMap = new Map();
      (targetOrder.plats || []).forEach((item) => {
        neededMap.set(
          item.dishId,
          (neededMap.get(item.dishId) || 0) + Number(item.quantite)
        );
      });

      for (const [dishId, qtyNeeded] of neededMap.entries()) {
        const dish = dishes.find((d) => d.id === dishId);
        if (!dish || Number(dish.stock) < qtyNeeded) {
          return {
            ok: false,
            error: `Impossible de valider : stock insuffisant pour « ${
              dish ? dish.nom : "un plat"
            } ».`,
          };
        }
      }

      setDishes((prev) =>
        prev.map((dish) => {
          if (!neededMap.has(dish.id)) return dish;
          const nextStock = Math.max(
            0,
            Number(dish.stock) - neededMap.get(dish.id)
          );
          return {
            ...dish,
            stock: nextStock,
            disponible: nextStock > 0,
          };
        })
      );
    }

    if (wasDeducted && nextStatus === "Annulée") {
      const restoreMap = new Map();
      (targetOrder.plats || []).forEach((item) => {
        restoreMap.set(
          item.dishId,
          (restoreMap.get(item.dishId) || 0) + Number(item.quantite)
        );
      });

      setDishes((prev) =>
        prev.map((dish) => {
          if (!restoreMap.has(dish.id)) return dish;
          const nextStock = Number(dish.stock) + restoreMap.get(dish.id);
          return {
            ...dish,
            stock: nextStock,
            disponible: nextStock > 0,
          };
        })
      );
    }

    const nextStockDeducted =
      nextStatus === "Annulée" ? false : wasDeducted || willBeDeducted;

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              statut: nextStatus,
              stockDeducted: nextStockDeducted,
            }
          : order
      )
    );

    return {
      ok: true,
      message:
        nextStatus === "Annulée" && wasDeducted
          ? `Commande #${orderId} annulée et stock restauré.`
          : `Statut de la commande #${orderId} passé à « ${nextStatus} ».`,
    };
  };

  const deleteOrder = (orderId) => {
    const target = orders.find((o) => o.id === orderId);
    if (target && target.stockDeducted && target.statut !== "Livrée") {
      const restoreMap = new Map();
      (target.plats || []).forEach((item) => {
        restoreMap.set(
          item.dishId,
          (restoreMap.get(item.dishId) || 0) + Number(item.quantite)
        );
      });
      setDishes((prev) =>
        prev.map((dish) => {
          if (!restoreMap.has(dish.id)) return dish;
          const nextStock = Number(dish.stock) + restoreMap.get(dish.id);
          return {
            ...dish,
            stock: nextStock,
            disponible: nextStock > 0,
          };
        })
      );
    }
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  const resetDemoData = () => {
    clearVeloraStorage();
    lastSavedSnapshotsRef.current = {
      [STORAGE_KEYS.DISHES]: null,
      [STORAGE_KEYS.ORDERS]: null,
      [STORAGE_KEYS.CUSTOMERS]: null,
    };
    const resetDishes = initialDishes.map(normalizeDish);
    const resetOrders = initialOrders.map(normalizeOrder);
    const resetCustomers = mergeCustomersWithOrders(
      initialCustomers.map(normalizeCustomer),
      resetOrders
    );
    setDishes(resetDishes);
    setOrders(resetOrders);
    setCustomers(resetCustomers);
  };

  const safeDishes = Array.isArray(dishes) ? dishes : [];
  const lobsterDish = safeDishes.find(
    (d) =>
      d.image?.toLowerCase().includes("lobster") ||
      d.nom?.toLowerCase().includes("lobster") ||
      d.nom?.toLowerCase().includes("homard")
  );
  const backdropImage = getSafeImageSrc(
    lobsterDish?.image || safeDishes[0]?.image || initialDishes[0]?.image
  );

  const parallaxOffset = Math.min(scrollY * 0.16, 220);

  return (
    <div className="velora-app">
      <div className="velora-global-backdrop" aria-hidden="true">
        <img
          src={backdropImage}
          alt=""
          className="velora-global-backdrop-img"
          style={{
            transform: `translate3d(0, -${parallaxOffset}px, 0) scale(1.16)`,
          }}
        />
        <div className="velora-global-backdrop-veil" />
      </div>

      <Navbar />

      <main className="velora-main">
        <Routes>
          <Route path="/" element={<Home dishes={dishes} orders={orders} />} />
          <Route
            path="/menu"
            element={
              <Menu
                dishes={dishes}
                updateDish={updateDish}
                deleteDish={deleteDish}
              />
            }
          />
          <Route path="/ajouter" element={<Ajouter addDish={addDish} />} />
          <Route
            path="/commandes"
            element={
              <Commandes
                dishes={dishes}
                orders={orders}
                customers={customers}
                createOrder={createOrder}
                updateOrder={updateOrder}
                updateOrderStatus={updateOrderStatus}
                deleteOrder={deleteOrder}
              />
            }
          />
          <Route
            path="/statistiques"
            element={
              <Statistiques
                dishes={dishes}
                orders={orders}
                onResetDemoData={resetDemoData}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}