import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/initialData";
import DishCard from "../components/DishCard";

const CATEGORY_DESCRIPTIONS = {
  Entrées:
    "Mises en bouche raffinées, produits nobles de la mer et créations de saison.",
  "Plats principaux":
    "Pièces d'exception, cuissons maîtrisées et sauces réduites à la perfection.",
  Desserts:
    "Haute pâtisserie contemporaine mêlant chocolat grand cru, pistache et feuille d'or.",
  Boissons:
    "Élixirs botaniques sans alcool, infusions au safran et créations signatures.",
};

export default function Home({ dishes, orders }) {
  const availableDishes = dishes.filter(
    (dish) => dish.disponible && Number(dish.stock) > 0
  );

  const tastingPreviewDishes = availableDishes.slice(0, 4);
  const featuredDishes = availableDishes.slice(0, 4);
  const showcasePhoto =
    availableDishes[2]?.image ||
    availableDishes[0]?.image ||
    "/dishes/Noir Lobster.jpg";

  const activeOrdersCount = orders.filter(
    (order) => order.statut !== "Livrée" && order.statut !== "Annulée"
  ).length;

  return (
    <div className="velora-page velora-home">
      {/* HERO SECTION */}
      <section className="velora-hero">
        <div className="velora-shell velora-hero-content">
          <span className="velora-eyebrow velora-reveal-1">
            TUNIS • HAUTE GASTRONOMIE
          </span>
          <h1 className="velora-hero-title velora-reveal-2">
            L’Art Culinaire dans sa Plus Pure Expression
          </h1>
          <div className="velora-rule velora-reveal-3" />
          <p className="velora-hero-subtitle velora-reveal-3">
            Bienvenue chez <strong>VELORA</strong>. Une expérience
            gastronomique nocturne où chaque assiette célèbre la précision du
            geste, la noblesse des produits et l’élégance intemporelle.
          </p>

          <div className="velora-hero-actions velora-reveal-4">
            <Link to="/menu" className="velora-btn velora-btn-gold">
              Explorer la Carte
            </Link>
            <Link to="/commandes" className="velora-btn velora-btn-outline">
              Gérer les Commandes ({activeOrdersCount})
            </Link>
            <Link to="/commandes?new=1" className="velora-btn velora-btn-outline">
              + Nouvelle Commande
            </Link>
          </div>

          <div className="velora-hero-metrics velora-glass-panel velora-reveal-5">
            <div className="velora-hero-metric">
              <span className="velora-hero-metric-num">{dishes.length}</span>
              <span className="velora-hero-metric-label">Créations à la Carte</span>
            </div>
            <div className="velora-hero-divider" />
            <div className="velora-hero-metric">
              <span className="velora-hero-metric-num">{CATEGORIES.length}</span>
              <span className="velora-hero-metric-label">Univers Culinaires</span>
            </div>
            <div className="velora-hero-divider" />
            <div className="velora-hero-metric">
              <span className="velora-hero-metric-num">{orders.length}</span>
              <span className="velora-hero-metric-label">Commandes Enregistrées</span>
            </div>
          </div>
        </div>
      </section>

      {/* EDITORIAL SPLIT MENU PREVIEW */}
      <section className="velora-section velora-shell">
        <div className="velora-editorial-split velora-glass-panel">
          <div className="velora-editorial-media">
            <img
              src={showcasePhoto}
              alt="Assiette signature de saison VELORA"
            />
            <span className="velora-editorial-caption">
              Création du Chef • Service du Soir
            </span>
          </div>

          <div>
            <span className="velora-eyebrow">LA CARTE DU SOIR</span>
            <h2 className="velora-section-title">Menu Dégustation</h2>
            <div className="velora-rule" />
            <p className="velora-section-desc">
              Une sélection de saison qui célèbre des ingrédients d’exception à
              leur apogée, orchestrée entre salle et cuisine avec une précision
              absolue.
            </p>

            <div className="velora-tasting-list">
              {tastingPreviewDishes.map((dish) => (
                <div key={dish.id} className="velora-tasting-item">
                  <div>
                    <h3 className="velora-tasting-name">{dish.nom}</h3>
                    <p className="velora-tasting-desc">{dish.description}</p>
                  </div>
                  <span className="velora-tasting-price">{dish.prix} DT</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Link to="/menu" className="velora-btn velora-btn-outline">
                Consulter toute la carte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="velora-section velora-shell">
        <div className="velora-section-head">
          <div>
            <span className="velora-eyebrow">UNIVERS CULINAIRES</span>
            <h2 className="velora-section-title">Nos Catégories</h2>
          </div>
          <Link to="/menu" className="velora-link-gold">
            Voir tout le menu →
          </Link>
        </div>

        <div className="velora-category-grid">
          {CATEGORIES.map((category, idx) => {
            const count = dishes.filter(
              (d) => d.categorie === category
            ).length;

            return (
              <Link
                key={category}
                to={`/menu?categorie=${encodeURIComponent(category)}`}
                className="velora-category-card"
              >
                <div className="velora-category-top">
                  <span className="velora-category-index">0{idx + 1}</span>
                  <span className="velora-category-count">
                    {count} plat{count > 1 ? "s" : ""}
                  </span>
                </div>
                <h3 className="velora-category-name">{category}</h3>
                <p className="velora-category-desc">
                  {CATEGORY_DESCRIPTIONS[category]}
                </p>
                <span className="velora-category-cta">Découvrir →</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED DISHES */}
      <section className="velora-section velora-shell">
        <div className="velora-section-head">
          <div>
            <span className="velora-eyebrow">SÉLECTION DU CHEF</span>
            <h2 className="velora-section-title">Créations Signatures</h2>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Link to="/ajouter" className="velora-btn velora-btn-outline-sm">
              + Ajouter un plat
            </Link>
            <Link to="/menu" className="velora-btn velora-btn-gold-sm">
              Menu complet
            </Link>
          </div>
        </div>

        <div className="velora-dishes-grid">
          {featuredDishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="velora-footer">
        <div className="velora-shell velora-footer-grid">
          <div className="velora-footer-col">
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.8rem",
                letterSpacing: "0.24em",
                color: "var(--gold-light)",
              }}
            >
              VELORA
            </div>
            <p className="velora-footer-tagline">
              Maison de Haute Gastronomie & Pilotage Culinaire.
            </p>
          </div>

          <div className="velora-footer-col">
            <div className="velora-footer-heading">Navigation</div>
            <div className="velora-footer-links">
              <Link to="/">Accueil</Link>
              <Link to="/menu">Menu</Link>
              <Link to="/ajouter">Ajouter</Link>
              <Link to="/commandes">Commandes</Link>
              <Link to="/statistiques">Statistiques</Link>
            </div>
          </div>

          <div className="velora-footer-col">
            <div className="velora-footer-heading">Horaires & Service</div>
            <div className="velora-footer-meta">
              <span>Mardi – Dimanche • 12h00 – 00h30</span>
              <span>© {new Date().getFullYear()} VELORA. Tous droits réservés.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}