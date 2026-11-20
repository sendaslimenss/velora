import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { initialDishes, ORDER_STATUSES } from "./data/initialData";
import {
  loadDishesFromStorage,
  saveDishesToStorage,
  loadOrdersFromStorage,
  saveOrdersToStorage,
  loadCustomersFromStorage,
  saveCustomersToStorage,
  generateUniqueOrderId,
  isCommittedStatus,
  canTransitionStatus,
  validateStockForOrder,
  validateStockForOrderUpdate,
  applyStockDeduction,
  applyStockRestoration,
  applyStockDelta,
} from "./utils/storage";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Ajouter from "./pages/Ajouter";
import Commandes from "./pages/Commandes";
import Statistiques from "./pages/Statistiques";

export default function App() {
  const [dishes, setDishes] = useState(() => loadDishesFromStorage());
  const [orders, setOrders] = useState(() => loadOrdersFromStorage());
  const [customers, setCustomers] = useState(() =>
    loadCustomersFromStorage(loadOrdersFromStorage())
  );

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    saveDishesToStorage(dishes);
  }, [dishes]);

  useEffect(() => {
    saveOrdersToStorage(orders);
  }, [orders]);

  useEffect(() => {
    saveCustomersToStorage(customers);
  }, [customers]);

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

  const upsertCustomer = (clientName, telephone = "") => {
    const cleanName = (clientName || "").trim();
    const cleanPhone = (telephone || "").trim();
    if (!cleanName) return;

    setCustomers((prev) => {
      const existingIndex = prev.findIndex(
        (c) => c.nom.toLowerCase() === cleanName.toLowerCase()
      );
      if (existingIndex !== -1) {
        if (!cleanPhone || prev[existingIndex].telephone === cleanPhone) {
          return prev;
        }
        return prev.map((c, idx) =>
          idx === existingIndex ? { ...c, telephone: cleanPhone } : c
        );
      }
      return [
        {
          id: Date.now(),
          nom: cleanName,
          telephone: cleanPhone,
        },
        ...prev,
      ];
    });
  };

  const addDish = (newDish) => {
    const parsedStock = Math.max(0, parseInt(newDish.stock, 10) || 0);
    const created = {
      id: Date.now(),
      nom: newDish.nom.trim(),
      categorie: newDish.categorie,
      description: newDish.description.trim(),
      prix: Number(newDish.prix),
      stock: parsedStock,
      image: newDish.image.trim(),
      disponible: parsedStock > 0,
    };
    setDishes((prev) => [created, ...prev]);
  };

  const updateDish = (updatedDish) => {
    const parsedStock = Math.max(0, parseInt(updatedDish.stock, 10) || 0);
    setDishes((prev) =>
      prev.map((dish) =>
        dish.id === updatedDish.id
          ? {
              ...dish,
              nom: updatedDish.nom.trim(),
              categorie: updatedDish.categorie,
              description: updatedDish.description.trim(),
              prix: Number(updatedDish.prix),
              stock: parsedStock,
              image: updatedDish.image.trim(),
              disponible: parsedStock > 0,
            }
          : dish
      )
    );
  };

  const deleteDish = (dishId) => {
    setDishes((prev) => prev.filter((dish) => dish.id !== dishId));
  };

  const createOrder = (orderPayload) => {
    const cleanClient = (orderPayload.client || "").trim();
    const cleanPhone = (orderPayload.telephone || "").trim();
    const orderDate =
      (orderPayload.date || "").trim() ||
      new Date().toISOString().slice(0, 10);
    const targetStatus = ORDER_STATUSES.includes(orderPayload.statut)
      ? orderPayload.statut
      : "Confirmée";

    if (cleanClient.length < 2) {
      return {
        ok: false,
        error: "Veuillez saisir ou sélectionner un client valide (min. 2 caractères).",
      };
    }

    const rawItems = Array.isArray(orderPayload.plats)
      ? orderPayload.plats
      : [];
    if (rawItems.length === 0) {
      return {
        ok: false,
        error: "Veuillez ajouter au moins un plat à la commande.",
      };
    }

    const normalizedPlats = [];
    for (const item of rawItems) {
      const dish = dishes.find((d) => d.id === item.dishId);
      if (!dish) {
        return {
          ok: false,
          error: "Un des plats sélectionnés n'existe plus dans le menu.",
        };
      }
      const qty = Number(item.quantite);
      if (!Number.isInteger(qty) || qty <= 0) {
        return {
          ok: false,
          error: `Quantité invalide pour « ${dish.nom} ».`,
        };
      }
      normalizedPlats.push({
        dishId: dish.id,
        nom: dish.nom,
        quantite: qty,
        prix: Number(dish.prix),
      });
    }

    const stockCheck = validateStockForOrder(dishes, normalizedPlats);
    if (!stockCheck.valid) {
      return { ok: false, error: stockCheck.error };
    }

    const shouldDeduct = isCommittedStatus(targetStatus);
    if (shouldDeduct) {
      setDishes((prev) => applyStockDeduction(prev, normalizedPlats));
    }

    const newOrderId = generateUniqueOrderId(orders);
    const total = normalizedPlats.reduce(
      (sum, item) => sum + item.prix * item.quantite,
      0
    );

    const newOrder = {
      id: newOrderId,
      client: cleanClient,
      telephone: cleanPhone,
      plats: normalizedPlats,
      total,
      date: orderDate,
      statut: targetStatus,
      stockDeducted: shouldDeduct,
    };

    setOrders((prev) => [newOrder, ...prev]);
    upsertCustomer(cleanClient, cleanPhone);

    return {
      ok: true,
      order: newOrder,
      message: shouldDeduct
        ? `Commande #${newOrderId} créée (${targetStatus}) et stocks mis à jour.`
        : `Commande #${newOrderId} enregistrée en attente de confirmation.`,
    };
  };

  const updateOrder = (orderId, updatedPayload) => {
    const existingOrder = orders.find((o) => o.id === orderId);
    if (!existingOrder) {
      return { ok: false, error: "Commande introuvable." };
    }

    if (
      existingOrder.statut === "Livrée" ||
      existingOrder.statut === "Annulée"
    ) {
      return {
        ok: false,
        error: `Impossible de modifier une commande au statut « ${existingOrder.statut} ».`,
      };
    }

    const cleanClient = (updatedPayload.client || "").trim();
    const cleanPhone = (updatedPayload.telephone || "").trim();
    const orderDate =
      (updatedPayload.date || "").trim() || existingOrder.date;

    if (cleanClient.length < 2) {
      return {
        ok: false,
        error: "Veuillez saisir un nom de client valide (min. 2 caractères).",
      };
    }

    const rawItems = Array.isArray(updatedPayload.plats)
      ? updatedPayload.plats
      : [];
    if (rawItems.length === 0) {
      return {
        ok: false,
        error: "La commande doit contenir au moins un plat.",
      };
    }

    const normalizedPlats = [];
    for (const item of rawItems) {
      const dish = dishes.find((d) => d.id === item.dishId);
      const oldLine = existingOrder.plats.find((p) => p.dishId === item.dishId);
      const unitPrice = dish
        ? Number(dish.prix)
        : oldLine
        ? Number(oldLine.prix)
        : Number(item.prix) || 0;
      const dishName = dish ? dish.nom : oldLine ? oldLine.nom : item.nom;
      const qty = Number(item.quantite);

      if (!Number.isInteger(qty) || qty <= 0) {
        return {
          ok: false,
          error: `Quantité invalide pour « ${dishName} ».`,
        };
      }

      normalizedPlats.push({
        dishId: item.dishId,
        nom: dishName,
        quantite: qty,
        prix: unitPrice,
      });
    }

    const stockCheck = validateStockForOrderUpdate(
      dishes,
      existingOrder,
      normalizedPlats
    );
    if (!stockCheck.valid) {
      return { ok: false, error: stockCheck.error };
    }

    if (existingOrder.stockDeducted) {
      setDishes((prev) =>
        applyStockDelta(prev, existingOrder.plats, normalizedPlats)
      );
    }

    const total = normalizedPlats.reduce(
      (sum, item) => sum + item.prix * item.quantite,
      0
    );

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              client: cleanClient,
              telephone: cleanPhone,
              date: orderDate,
              plats: normalizedPlats,
              total,
            }
          : order
      )
    );

    upsertCustomer(cleanClient, cleanPhone);

    return {
      ok: true,
      message: `Commande #${orderId} modifiée — stocks et totaux synchronisés.`,
    };
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { ok: false, error: "Commande introuvable." };
    }

    const transition = canTransitionStatus(targetOrder.statut, newStatus);
    if (!transition.valid) {
      return { ok: false, error: transition.reason };
    }

    if (isCommittedStatus(newStatus)) {
      if (!targetOrder.stockDeducted) {
        const stockCheck = validateStockForOrder(dishes, targetOrder.plats);
        if (!stockCheck.valid) {
          return { ok: false, error: stockCheck.error };
        }

        setDishes((prev) => applyStockDeduction(prev, targetOrder.plats));
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, statut: newStatus, stockDeducted: true }
              : order
          )
        );
        return {
          ok: true,
          message: `Commande #${orderId} passée à « ${newStatus} » — stock déduit.`,
        };
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, statut: newStatus, stockDeducted: true }
            : order
        )
      );
      return {
        ok: true,
        message: `Statut de la commande #${orderId} mis à jour : « ${newStatus} ».`,
      };
    }

    if (newStatus === "Annulée") {
      if (targetOrder.stockDeducted) {
        setDishes((prev) => applyStockRestoration(prev, targetOrder.plats));
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, statut: "Annulée", stockDeducted: false }
              : order
          )
        );
        return {
          ok: true,
          message: `Commande #${orderId} annulée — les quantités ont été restaurées en stock.`,
        };
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, statut: "Annulée", stockDeducted: false }
            : order
        )
      );
      return {
        ok: true,
        message: `Commande #${orderId} annulée.`,
      };
    }

    return { ok: false, error: "Transition de statut non prise en charge." };
  };

  const deleteOrder = (orderId) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (
      targetOrder &&
      targetOrder.stockDeducted &&
      targetOrder.statut !== "Livrée"
    ) {
      setDishes((prev) => applyStockRestoration(prev, targetOrder.plats));
    }
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  const safeDishes = Array.isArray(initialDishes) ? initialDishes : [];
  const lobsterDish = safeDishes.find(
    (d) =>
      d.image?.toLowerCase().includes("lobster") ||
      d.nom?.toLowerCase().includes("lobster") ||
      d.nom?.toLowerCase().includes("homard")
  );
  const backdropImage =
    lobsterDish?.image || safeDishes[0]?.image || "/dishes/Noir Lobster.jpg";

  const parallaxOffset = Math.min(scrollY * 0.16, 220);

  return (
    <div className="velora-app">
      {/* FOND PARALLAX HOMARD SUR TOUTES LES PAGES */}
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
          <Route
            path="/"
            element={<Home dishes={dishes} orders={orders} />}
          />
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
            element={<Statistiques dishes={dishes} orders={orders} />}
          />
        </Routes>
      </main>
    </div>
  );
}