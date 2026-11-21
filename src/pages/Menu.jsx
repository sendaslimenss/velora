import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { CATEGORIES, initialDishes } from "../data/initialData";
import {
  validateDishForm,
  validateImageFile,
  getSafeImageSrc,
} from "../utils/validation";
import SearchBar from "../components/SearchBar";
import DishCard from "../components/DishCard";
import ConfirmModal from "../components/ConfirmModal";

const PRESET_IMAGES = initialDishes.slice(0, 6).map((d) => ({
  label: d.nom,
  src: d.image,
}));

const readAndCompressImage = (file) =>
  new Promise((resolve, reject) => {
    const fileCheck = validateImageFile(file);
    if (!fileCheck.valid) {
      reject(new Error(fileCheck.error));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 900;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () =>
        reject(new Error("Impossible de décoder ce fichier image."));
      img.src = event.target.result;
    };
    reader.onerror = () =>
      reject(new Error("Erreur lors de la lecture du fichier."));
    reader.readAsDataURL(file);
  });

export default function Menu({ dishes, updateDish, deleteDish }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("categorie");
  const fileInputRef = useRef(null);
  const editLockRef = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    CATEGORIES.includes(initialCategory) ? initialCategory : "Toutes"
  );
  const [feedback, setFeedback] = useState(null);
  const [dishToDelete, setDishToDelete] = useState(null);

  const [editingDish, setEditingDish] = useState(null);
  const [editForm, setEditForm] = useState({
    nom: "",
    categorie: CATEGORIES[1],
    description: "",
    prix: "",
    stock: "",
    image: "",
  });
  const [editFileName, setEditFileName] = useState("");
  const [editErrors, setEditErrors] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const paramCat = searchParams.get("categorie");
    if (paramCat && CATEGORIES.includes(paramCat)) {
      setSelectedCategory(paramCat);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!editingDish) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setEditingDish(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingDish]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category === "Toutes") {
      setSearchParams({});
    } else {
      setSearchParams({ categorie: category });
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Toutes");
    setSearchParams({});
  };

  const requestDeleteDish = (dishId) => {
    const target = dishes.find((d) => d.id === dishId);
    if (!target) return;
    setDishToDelete(target);
  };

  const confirmDeleteDish = () => {
    if (!dishToDelete) return;
    deleteDish(dishToDelete.id);
    setFeedback({
      type: "success",
      text: `Le plat « ${dishToDelete.nom} » a été supprimé du menu.`,
    });
    setDishToDelete(null);
  };

  const handleOpenEdit = (dish) => {
    editLockRef.current = false;
    setIsSavingEdit(false);
    setEditingDish(dish);
    setEditForm({
      nom: dish.nom,
      categorie: dish.categorie,
      description: dish.description,
      prix: String(dish.prix),
      stock: String(dish.stock),
      image: dish.image,
    });
    setEditFileName("");
    setEditErrors({});
  };

  const handleCloseEdit = () => {
    editLockRef.current = false;
    setIsSavingEdit(false);
    setEditingDish(null);
    setEditFileName("");
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));

    if (name === "image") {
      setEditFileName("");
    }

    if (editErrors[name]) {
      setEditErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleEditFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readAndCompressImage(file);
      setEditForm((prev) => ({ ...prev, image: dataUrl }));
      setEditFileName(file.name);
      if (editErrors.image) {
        setEditErrors((prev) => {
          const updated = { ...prev };
          delete updated.image;
          return updated;
        });
      }
    } catch (err) {
      setEditErrors((prev) => ({ ...prev, image: err.message }));
    } finally {
      e.target.value = "";
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingDish || editLockRef.current || isSavingEdit) return;

    const validation = validateDishForm(editForm);
    if (!validation.isValid) {
      setEditErrors(validation.errors);
      return;
    }

    editLockRef.current = true;
    setIsSavingEdit(true);

    const result = updateDish({
      id: editingDish.id,
      ...validation.sanitized,
    });

    if (result && result.ok === false) {
      setEditErrors(result.errors || {});
      editLockRef.current = false;
      setIsSavingEdit(false);
      return;
    }

    setFeedback({
      type: "success",
      text:
        result?.message ||
        `Le plat « ${validation.sanitized.nom} » a été mis à jour.`,
    });
    handleCloseEdit();
  };

  const filteredDishes = dishes.filter((dish) => {
    const matchesCategory =
      selectedCategory === "Toutes" || dish.categorie === selectedCategory;
    const matchesSearch = dish.nom
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const outOfStockCount = dishes.filter(
    (d) => !d.disponible || Number(d.stock) <= 0
  ).length;

  return (
    <div className="velora-page velora-shell">
      <div className="velora-page-header">
        <div>
          <span className="velora-eyebrow velora-reveal-1">
            GESTION DE LA CARTE
          </span>
          <h1 className="velora-page-title velora-reveal-2">
            Menu Gastronomique
          </h1>
          <p className="velora-page-subtitle velora-reveal-3">
            {dishes.length} plat{dishes.length > 1 ? "s" : ""} référencé
            {dishes.length > 1 ? "s" : ""} • {outOfStockCount} en rupture de
            stock
          </p>
        </div>

        <Link
          to="/ajouter"
          className="velora-btn velora-btn-gold velora-reveal-3"
        >
          + Nouveau Plat
        </Link>
      </div>

      {feedback && (
        <div
          className={`velora-feedback-banner ${
            feedback.type === "error" ? "is-error" : "is-success"
          }`}
          role="status"
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            className="velora-feedback-close"
            onClick={() => setFeedback(null)}
            aria-label="Fermer la notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="velora-toolbar">
        <div className="velora-toolbar-search">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher un plat par nom (ex: Lobster, Truffle...)"
          />
        </div>

        <div
          className="velora-filter-pills"
          role="tablist"
          aria-label="Filtrer par catégorie"
        >
          {["Toutes", ...CATEGORIES].map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                className={`velora-pill ${isActive ? "active" : ""}`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {filteredDishes.length > 0 ? (
        <div className="velora-dishes-grid">
          {filteredDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              onEdit={handleOpenEdit}
              onDelete={requestDeleteDish}
            />
          ))}
        </div>
      ) : (
        <div className="velora-empty-state">
          <div className="velora-empty-icon" aria-hidden="true">
            ✦
          </div>
          <h3>Aucun plat trouvé</h3>
          <p>
            Aucune création ne correspond à votre recherche
            {searchTerm ? ` « ${searchTerm} »` : ""}
            {selectedCategory !== "Toutes"
              ? ` dans la catégorie « ${selectedCategory} »`
              : ""}
            .
          </p>
          <button
            type="button"
            className="velora-btn velora-btn-outline"
            onClick={handleResetFilters}
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(dishToDelete)}
        eyebrow="SUPPRESSION DU MENU"
        title="Confirmer la suppression"
        message={
          dishToDelete
            ? `Voulez-vous vraiment retirer « ${dishToDelete.nom} » de la carte VELORA ? Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer le plat"
        onConfirm={confirmDeleteDish}
        onCancel={() => setDishToDelete(null)}
      />

      {editingDish &&
        createPortal(
          <div
            className="velora-modal-backdrop"
            onClick={handleCloseEdit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="velora-edit-modal-title"
          >
            <div
              className="velora-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="velora-modal-header">
                <div>
                  <span className="velora-eyebrow mb-1">ÉDITION DU PLAT</span>
                  <h2
                    id="velora-edit-modal-title"
                    className="velora-modal-title"
                  >
                    Modifier « {editingDish.nom} »
                  </h2>
                </div>
                <button
                  type="button"
                  className="velora-modal-close"
                  onClick={handleCloseEdit}
                  aria-label="Fermer la fenêtre de modification"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleEditSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-7">
                    <label htmlFor="edit-nom" className="velora-label">
                      Nom du plat *
                    </label>
                    <input
                      id="edit-nom"
                      type="text"
                      name="nom"
                      maxLength={80}
                      aria-invalid={Boolean(editErrors.nom)}
                      className={`velora-input ${
                        editErrors.nom ? "is-invalid" : ""
                      }`}
                      value={editForm.nom}
                      onChange={handleEditChange}
                    />
                    {editErrors.nom && (
                      <div className="velora-error-msg">{editErrors.nom}</div>
                    )}
                  </div>

                  <div className="col-md-5">
                    <label htmlFor="edit-categorie" className="velora-label">
                      Catégorie *
                    </label>
                    <select
                      id="edit-categorie"
                      name="categorie"
                      aria-invalid={Boolean(editErrors.categorie)}
                      className={`velora-input ${
                        editErrors.categorie ? "is-invalid" : ""
                      }`}
                      value={editForm.categorie}
                      onChange={handleEditChange}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {editErrors.categorie && (
                      <div className="velora-error-msg">
                        {editErrors.categorie}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label htmlFor="edit-description" className="velora-label">
                      Description *
                    </label>
                    <textarea
                      id="edit-description"
                      name="description"
                      rows="3"
                      maxLength={500}
                      aria-invalid={Boolean(editErrors.description)}
                      className={`velora-input ${
                        editErrors.description ? "is-invalid" : ""
                      }`}
                      value={editForm.description}
                      onChange={handleEditChange}
                    />
                    {editErrors.description && (
                      <div className="velora-error-msg">
                        {editErrors.description}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="edit-prix" className="velora-label">
                      Prix (DT) *
                    </label>
                    <input
                      id="edit-prix"
                      type="number"
                      name="prix"
                      min="0.5"
                      max="10000"
                      step="0.5"
                      aria-invalid={Boolean(editErrors.prix)}
                      className={`velora-input ${
                        editErrors.prix ? "is-invalid" : ""
                      }`}
                      value={editForm.prix}
                      onChange={handleEditChange}
                    />
                    {editErrors.prix && (
                      <div className="velora-error-msg">{editErrors.prix}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="edit-stock" className="velora-label">
                      Stock disponible *
                    </label>
                    <input
                      id="edit-stock"
                      type="number"
                      name="stock"
                      min="0"
                      max="9999"
                      step="1"
                      aria-invalid={Boolean(editErrors.stock)}
                      className={`velora-input ${
                        editErrors.stock ? "is-invalid" : ""
                      }`}
                      value={editForm.stock}
                      onChange={handleEditChange}
                    />
                    {editErrors.stock && (
                      <div className="velora-error-msg">{editErrors.stock}</div>
                    )}
                  </div>

                  <div className="col-12">
                    <label htmlFor="edit-image" className="velora-label">
                      Visuel du plat (Fichier local ou URL) *
                    </label>

                    <div className="velora-upload-row">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        className="d-none"
                        onChange={handleEditFileUpload}
                      />
                      <button
                        type="button"
                        className="velora-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Parcourir les fichiers
                      </button>

                      <input
                        id="edit-image"
                        type="text"
                        name="image"
                        aria-invalid={Boolean(editErrors.image)}
                        className={`velora-input ${
                          editErrors.image ? "is-invalid" : ""
                        }`}
                        placeholder="Ou collez l'adresse URL d'une image..."
                        value={
                          editForm.image.startsWith("data:image/")
                            ? ""
                            : editForm.image
                        }
                        onChange={handleEditChange}
                      />
                    </div>

                    {editFileName && (
                      <div className="velora-upload-filename">
                        Fichier importé : <strong>{editFileName}</strong>
                      </div>
                    )}

                    {editForm.image && (
                      <div className="velora-modal-img-preview">
                        <img
                          src={getSafeImageSrc(
                            editForm.image,
                            PRESET_IMAGES[0].src
                          )}
                          alt="Aperçu du plat"
                        />
                      </div>
                    )}

                    {editErrors.image && (
                      <div className="velora-error-msg">{editErrors.image}</div>
                    )}

                    <div className="velora-preset-box">
                      <span className="velora-preset-label">
                        Ou sélectionnez une photographie de la collection VELORA :
                      </span>
                      <div className="velora-preset-grid">
                        {PRESET_IMAGES.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            className={`velora-preset-btn ${
                              editForm.image === preset.src ? "active" : ""
                            }`}
                            onClick={() => {
                              setEditForm((prev) => ({
                                ...prev,
                                image: preset.src,
                              }));
                              setEditFileName("");
                              if (editErrors.image) {
                                setEditErrors((prev) => {
                                  const updated = { ...prev };
                                  delete updated.image;
                                  return updated;
                                });
                              }
                            }}
                          >
                            <img src={preset.src} alt={preset.label} />
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 pt-2 d-flex justify-content-end gap-2 flex-wrap">
                    <button
                      type="button"
                      className="velora-btn velora-btn-outline"
                      onClick={handleCloseEdit}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="velora-btn velora-btn-gold"
                      disabled={isSavingEdit}
                    >
                      {isSavingEdit
                        ? "Enregistrement..."
                        : "Enregistrer les modifications"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}