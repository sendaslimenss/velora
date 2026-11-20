import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CATEGORIES, initialDishes } from "../data/initialData";
import DishCard from "../components/DishCard";

const PRESET_IMAGES = initialDishes.slice(0, 6).map((d) => ({
  label: d.nom,
  src: d.image,
}));

const readAndCompressImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(
        new Error("Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).")
      );
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
      img.onerror = () => reject(new Error("Impossible de charger cette image."));
      img.src = event.target.result;
    };
    reader.onerror = () =>
      reject(new Error("Erreur lors de la lecture du fichier."));
    reader.readAsDataURL(file);
  });

export default function Ajouter({ addDish }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nom: "",
    categorie: CATEGORIES[1],
    description: "",
    prix: "",
    stock: "",
    image: "",
  });

  const [selectedFileName, setSelectedFileName] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "image") {
      setSelectedFileName("");
    }

    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readAndCompressImage(file);
      setFormData((prev) => ({ ...prev, image: dataUrl }));
      setSelectedFileName(file.name);
      if (errors.image) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.image;
          return updated;
        });
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, image: err.message }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.nom.trim()) {
      nextErrors.nom = "Le nom du plat est obligatoire.";
    } else if (formData.nom.trim().length < 2) {
      nextErrors.nom = "Le nom doit contenir au moins 2 caractères.";
    }

    if (!formData.categorie || !CATEGORIES.includes(formData.categorie)) {
      nextErrors.categorie = "Veuillez sélectionner une catégorie valide.";
    }

    if (!formData.description.trim()) {
      nextErrors.description = "La description gastronomique est obligatoire.";
    } else if (formData.description.trim().length < 10) {
      nextErrors.description =
        "La description doit comporter au moins 10 caractères.";
    }

    const numericPrice = Number(formData.prix);
    if (formData.prix === "" || Number.isNaN(numericPrice)) {
      nextErrors.prix = "Veuillez saisir un prix valide.";
    } else if (numericPrice <= 0) {
      nextErrors.prix = "Le prix doit être strictement supérieur à 0 DT.";
    }

    const numericStock = Number(formData.stock);
    if (formData.stock === "" || Number.isNaN(numericStock)) {
      nextErrors.stock = "Veuillez saisir une quantité en stock.";
    } else if (!Number.isInteger(numericStock) || numericStock < 0) {
      nextErrors.stock =
        "Le stock doit être un nombre entier positif ou égal à 0.";
    }

    if (!formData.image.trim()) {
      nextErrors.image =
        "Importez un fichier image, collez une URL ou choisissez un visuel ci-dessous.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    addDish(formData);
    navigate("/menu");
  };

  const previewDish = {
    id: 0,
    nom: formData.nom.trim() || "Nouvelle Création VELORA",
    categorie: formData.categorie,
    description:
      formData.description.trim() ||
      "Aperçu en direct de la description de votre création culinaire.",
    prix: Number(formData.prix) > 0 ? Number(formData.prix) : 45,
    stock:
      formData.stock !== "" && Number(formData.stock) >= 0
        ? parseInt(formData.stock, 10)
        : 10,
    image: formData.image.trim() || PRESET_IMAGES[0].src,
    disponible:
      formData.stock === "" ? true : parseInt(formData.stock, 10) > 0,
  };

  return (
    <div className="velora-page velora-shell">
      <div className="velora-page-header">
        <div>
          <span className="velora-eyebrow velora-reveal-1">
            CRÉATION CULINAIRE
          </span>
          <h1 className="velora-page-title velora-reveal-2">Ajouter un Plat</h1>
          <p className="velora-page-subtitle velora-reveal-3">
            Enrichissez la carte VELORA avec une nouvelle signature
            gastronomique.
          </p>
        </div>

        <Link
          to="/menu"
          className="velora-btn velora-btn-outline velora-reveal-3"
        >
          ← Retour au Menu
        </Link>
      </div>

      <div className="velora-form-layout">
        {/* LIQUID GLASS FORM CARD */}
        <form
          className="velora-form-card"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="row g-3">
            <div className="col-md-7">
              <label htmlFor="dish-nom" className="velora-label">
                Nom du plat *
              </label>
              <input
                id="dish-nom"
                type="text"
                name="nom"
                className={`velora-input ${errors.nom ? "is-invalid" : ""}`}
                placeholder="Ex: Filet de Bar Sauvage au Safran"
                value={formData.nom}
                onChange={handleChange}
              />
              {errors.nom && (
                <div className="velora-error-msg">{errors.nom}</div>
              )}
            </div>

            <div className="col-md-5">
              <label htmlFor="dish-categorie" className="velora-label">
                Catégorie *
              </label>
              <select
                id="dish-categorie"
                name="categorie"
                className={`velora-input ${
                  errors.categorie ? "is-invalid" : ""
                }`}
                value={formData.categorie}
                onChange={handleChange}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.categorie && (
                <div className="velora-error-msg">{errors.categorie}</div>
              )}
            </div>

            <div className="col-12">
              <label htmlFor="dish-description" className="velora-label">
                Description *
              </label>
              <textarea
                id="dish-description"
                name="description"
                rows="3"
                className={`velora-input ${
                  errors.description ? "is-invalid" : ""
                }`}
                placeholder="Décrivez les ingrédients nobles, la cuisson et l'accompagnement..."
                value={formData.description}
                onChange={handleChange}
              />
              {errors.description && (
                <div className="velora-error-msg">{errors.description}</div>
              )}
            </div>

            <div className="col-md-6">
              <label htmlFor="dish-prix" className="velora-label">
                Prix (DT) *
              </label>
              <input
                id="dish-prix"
                type="number"
                name="prix"
                min="0.5"
                step="0.5"
                className={`velora-input ${errors.prix ? "is-invalid" : ""}`}
                placeholder="Ex: 65"
                value={formData.prix}
                onChange={handleChange}
              />
              {errors.prix && (
                <div className="velora-error-msg">{errors.prix}</div>
              )}
            </div>

            <div className="col-md-6">
              <label htmlFor="dish-stock" className="velora-label">
                Quantité disponible (Stock) *
              </label>
              <input
                id="dish-stock"
                type="number"
                name="stock"
                min="0"
                step="1"
                className={`velora-input ${errors.stock ? "is-invalid" : ""}`}
                placeholder="Ex: 12"
                value={formData.stock}
                onChange={handleChange}
              />
              {errors.stock && (
                <div className="velora-error-msg">{errors.stock}</div>
              )}
            </div>

            <div className="col-12">
              <label htmlFor="dish-image" className="velora-label">
                Visuel du plat (Fichier local ou URL) *
              </label>

              <div className="velora-upload-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleFileUpload}
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
                  id="dish-image"
                  type="text"
                  name="image"
                  className={`velora-input ${errors.image ? "is-invalid" : ""}`}
                  placeholder="Ou collez l'adresse URL d'une image (https://...)"
                  value={
                    formData.image.startsWith("data:image/")
                      ? ""
                      : formData.image
                  }
                  onChange={handleChange}
                />
              </div>

              {selectedFileName && (
                <div className="velora-upload-filename">
                  Fichier importé : <strong>{selectedFileName}</strong>
                </div>
              )}

              {errors.image && (
                <div className="velora-error-msg">{errors.image}</div>
              )}

              <div className="velora-preset-box">
                <span className="velora-preset-label">
                  Photographies de la collection VELORA :
                </span>
                <div className="velora-preset-grid">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`velora-preset-btn ${
                        formData.image === preset.src ? "active" : ""
                      }`}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, image: preset.src }));
                        setSelectedFileName("");
                        if (errors.image) {
                          setErrors((prev) => {
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

            <div className="col-12 pt-2 d-flex gap-3 flex-wrap">
              <button type="submit" className="velora-btn velora-btn-gold">
                Enregistrer le Plat
              </button>
              <Link to="/menu" className="velora-btn velora-btn-outline">
                Annuler
              </Link>
            </div>
          </div>
        </form>

        {/* LIVE PREVIEW */}
        <aside className="velora-preview-aside">
          <div className="velora-preview-tag">APERÇU EN DIRECT</div>
          <DishCard dish={previewDish} />
        </aside>
      </div>
    </div>
  );
}