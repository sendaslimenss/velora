import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CATEGORIES, initialDishes } from "../data/initialData";
import {
  validateDishForm,
  validateImageFile,
  getSafeImageSrc,
} from "../utils/validation";
import DishCard from "../components/DishCard";

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

export default function Ajouter({ addDish }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const submitLockRef = useRef(false);

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
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFeedback(null);

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
      setFeedback(null);
      if (errors.image) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.image;
          return updated;
        });
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, image: err.message }));
    } finally {
      e.target.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;

    const validation = validateDishForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setFeedback({
        type: "error",
        text: "Veuillez corriger les champs signalés avant d'enregistrer le plat.",
      });
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    const result = addDish(validation.sanitized);
    if (result && result.ok === false) {
      setErrors(result.errors || {});
      setFeedback({ type: "error", text: result.error });
      submitLockRef.current = false;
      setIsSubmitting(false);
      return;
    }

    setFeedback({
      type: "success",
      text: result?.message || "Plat enregistré avec succès. Redirection...",
    });

    setTimeout(() => {
      navigate("/menu");
    }, 350);
  };

  const previewDish = {
    id: 0,
    nom: formData.nom.trim() || "Nouvelle Création VELORA",
    categorie: CATEGORIES.includes(formData.categorie)
      ? formData.categorie
      : CATEGORIES[1],
    description:
      formData.description.trim() ||
      "Aperçu en direct de la description de votre création culinaire.",
    prix: Number(formData.prix) > 0 ? Number(formData.prix) : 45,
    stock:
      formData.stock !== "" &&
      Number.isInteger(Number(formData.stock)) &&
      Number(formData.stock) >= 0
        ? parseInt(formData.stock, 10)
        : 10,
    image: getSafeImageSrc(formData.image, PRESET_IMAGES[0].src),
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

      {feedback && (
        <div
          className={`velora-feedback-banner ${
            feedback.type === "error" ? "is-error" : "is-success"
          }`}
          role="alert"
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

      <div className="velora-form-layout">
        <form className="velora-form-card" onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            <div className="col-md-7">
              <label htmlFor="dish-nom" className="velora-label">
                Nom du plat *
              </label>
              <input
                id="dish-nom"
                type="text"
                name="nom"
                maxLength={80}
                aria-invalid={Boolean(errors.nom)}
                aria-describedby={errors.nom ? "err-dish-nom" : undefined}
                className={`velora-input ${errors.nom ? "is-invalid" : ""}`}
                placeholder="Ex: Filet de Bar Sauvage au Safran"
                value={formData.nom}
                onChange={handleChange}
              />
              {errors.nom && (
                <div id="err-dish-nom" className="velora-error-msg">
                  {errors.nom}
                </div>
              )}
            </div>

            <div className="col-md-5">
              <label htmlFor="dish-categorie" className="velora-label">
                Catégorie *
              </label>
              <select
                id="dish-categorie"
                name="categorie"
                aria-invalid={Boolean(errors.categorie)}
                aria-describedby={
                  errors.categorie ? "err-dish-categorie" : undefined
                }
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
                <div id="err-dish-categorie" className="velora-error-msg">
                  {errors.categorie}
                </div>
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
                maxLength={500}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "err-dish-description" : undefined
                }
                className={`velora-input ${
                  errors.description ? "is-invalid" : ""
                }`}
                placeholder="Décrivez les ingrédients nobles, la cuisson et l'accompagnement..."
                value={formData.description}
                onChange={handleChange}
              />
              {errors.description && (
                <div id="err-dish-description" className="velora-error-msg">
                  {errors.description}
                </div>
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
                max="10000"
                step="0.5"
                aria-invalid={Boolean(errors.prix)}
                aria-describedby={errors.prix ? "err-dish-prix" : undefined}
                className={`velora-input ${errors.prix ? "is-invalid" : ""}`}
                placeholder="Ex: 65"
                value={formData.prix}
                onChange={handleChange}
              />
              {errors.prix && (
                <div id="err-dish-prix" className="velora-error-msg">
                  {errors.prix}
                </div>
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
                max="9999"
                step="1"
                aria-invalid={Boolean(errors.stock)}
                aria-describedby={errors.stock ? "err-dish-stock" : undefined}
                className={`velora-input ${errors.stock ? "is-invalid" : ""}`}
                placeholder="Ex: 12"
                value={formData.stock}
                onChange={handleChange}
              />
              {errors.stock && (
                <div id="err-dish-stock" className="velora-error-msg">
                  {errors.stock}
                </div>
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
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
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
                  aria-invalid={Boolean(errors.image)}
                  aria-describedby={errors.image ? "err-dish-image" : undefined}
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
                <div id="err-dish-image" className="velora-error-msg">
                  {errors.image}
                </div>
              )}
            </div>

            <div className="col-12 pt-2 d-flex gap-3 flex-wrap">
              <button
                type="submit"
                className="velora-btn velora-btn-gold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer le Plat"}
              </button>
              <Link to="/menu" className="velora-btn velora-btn-outline">
                Annuler
              </Link>
            </div>
          </div>
        </form>

        <aside className="velora-preview-aside">
          <div className="velora-preview-tag">APERÇU EN DIRECT</div>
          <DishCard dish={previewDish} />
        </aside>
      </div>
    </div>
  );
}