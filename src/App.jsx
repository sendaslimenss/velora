import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { initialDishes, initialOrders } from "./data/initialData";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Ajouter from "./pages/Ajouter";
import Commandes from "./pages/Commandes";
import Statistiques from "./pages/Statistiques";

const DISHES_STORAGE_KEY = "velora_dishes_v1";
const ORDERS_STORAGE_KEY = "velora_orders_v1";

export default function App() {
  const [dishes, setDishes] = useState(() => {
    try {
      const saved = localStorage.getItem(DISHES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialDishes;
    } catch {
      return initialDishes;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialOrders;
    } catch {
      return initialOrders;
    }
  });

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(DISHES_STORAGE_KEY, JSON.stringify(dishes));
    } catch (err) {
      console.error("Erreur sauvegarde plats:", err);
    }
  }, [dishes]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.error("Erreur sauvegarde commandes:", err);
    }
  }, [orders]);

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

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, statut: newStatus } : order
      )
    );
  };

  const deleteOrder = (orderId) => {
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
                orders={orders}
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