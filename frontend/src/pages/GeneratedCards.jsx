import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cardAPI } from "../services/api";
import CardPreview from "../components/CardPreview";
import ExportButtons from "../components/ExportButtons";
import {
  deleteLocalGeneratedCard,
  getLocalGeneratedCards
} from "../utils/localGeneratedCards";

function getTemplateId(card) {
  return (
    card.templateId?._id ||
    card.templateSnapshot?._id ||
    card.templateId ||
    ""
  );
}

function isDigiValCard(card) {
  return (
    card.templateId?.layoutKey === "digival" ||
    card.templateSnapshot?.layoutKey === "digival"
  );
}

function GeneratedCards() {
  const [searchParams] = useSearchParams();
  const templateFilterId = searchParams.get("templateId");

  const [savedCards, setSavedCards] = useState([]);
  const [localCards, setLocalCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchCards = async () => {
    try {
      const response = await cardAPI.getAll();

      const databaseCards = response.data.map(card => ({
        ...card,
        isLocal: false,
        isSaved: true
      }));

      const unsavedCards = getLocalGeneratedCards();

      setSavedCards(databaseCards);
      setLocalCards(unsavedCards);

      const allCards = [...unsavedCards, ...databaseCards];
      setSelectedCard(allCards[0] || null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load saved cards");
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const allCards = useMemo(() => {
    return [...localCards, ...savedCards];
  }, [localCards, savedCards]);

  const filteredCards = useMemo(() => {
    let result = allCards;

    if (templateFilterId) {
      result = result.filter(card => getTemplateId(card) === templateFilterId);
    }

    if (activeFilter === "unsaved") {
      result = result.filter(card => card.isLocal);
    }

    if (activeFilter === "saved") {
      result = result.filter(card => card.isSaved);
    }

    if (activeFilter === "digival") {
      result = result.filter(card => isDigiValCard(card));
    }

    return result;
  }, [allCards, activeFilter, templateFilterId]);

  const handleDelete = async card => {
    const confirmDelete = window.confirm("Delete this generated card?");

    if (!confirmDelete) return;

    try {
      if (card.isLocal) {
        const updatedLocalCards = deleteLocalGeneratedCard(card.localId);
        setLocalCards(updatedLocalCards);

        const nextCards = [...updatedLocalCards, ...savedCards];
        setSelectedCard(nextCards[0] || null);
      } else {
        await cardAPI.delete(card._id);
        await fetchCards();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete card");
    }
  };

  const getEditLink = card => {
    const templateId = getTemplateId(card);

    if (card.isLocal) {
      return `/generate/${templateId}?draftId=${card.localId}`;
    }

    return `/generate/${templateId}?cardId=${card._id}`;
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Generated Cards</span>
          <h1>View all generated ID cards</h1>
          <p>
            This section shows both unsaved generated cards and saved MongoDB
            cards.
          </p>
        </div>

        <Link className="btn primary" to="/templates">
          Back to Templates
        </Link>
      </div>

      <div className="saved-filter-row">
        <button
          className={activeFilter === "all" ? "chip active" : "chip"}
          onClick={() => setActiveFilter("all")}
        >
          All ({allCards.length})
        </button>

        <button
          className={activeFilter === "unsaved" ? "chip active" : "chip"}
          onClick={() => setActiveFilter("unsaved")}
        >
          Unsaved Generated ({localCards.length})
        </button>

        <button
          className={activeFilter === "saved" ? "chip active" : "chip"}
          onClick={() => setActiveFilter("saved")}
        >
          Saved Database ({savedCards.length})
        </button>

        <button
          className={activeFilter === "digival" ? "chip active" : "chip"}
          onClick={() => setActiveFilter("digival")}
        >
          DigiVal Cards ({allCards.filter(isDigiValCard).length})
        </button>
      </div>

      {templateFilterId && (
        <div className="info-banner">
          Showing generated cards for selected template only.
          <Link to="/cards"> Show all cards</Link>
        </div>
      )}

      {filteredCards.length === 0 ? (
        <div className="empty-box">No generated cards found.</div>
      ) : (
        <div className="gallery-layout">
          <div className="template-grid">
            {filteredCards.map(card => (
              <div
                key={card._id}
                className={`template-card ${
                  selectedCard?._id === card._id ? "selected" : ""
                }`}
                onClick={() => setSelectedCard(card)}
              >
                <h3>{card.formData?.name || "Unnamed Card"}</h3>

                <p>
                  {card.templateId?.templateName ||
                    card.templateSnapshot?.templateName ||
                    "Template"}
                </p>

                <span>{new Date(card.createdAt).toLocaleDateString()}</span>

                <div className="card-status-row">
                  {card.isLocal ? (
                    <div className="mini-badge warning">Unsaved</div>
                  ) : (
                    <div className="mini-badge success">Saved</div>
                  )}

                  {isDigiValCard(card) && (
                    <div className="mini-badge">DigiVal</div>
                  )}
                </div>

                <div className="button-row">
                  <Link
                    className="btn secondary small"
                    to={getEditLink(card)}
                    onClick={event => event.stopPropagation()}
                  >
                    Edit
                  </Link>

                  <button
                    className="btn danger small"
                    onClick={event => {
                      event.stopPropagation();
                      handleDelete(card);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="sticky-preview">
            <CardPreview
              template={selectedCard?.templateSnapshot}
              formData={selectedCard?.formData}
              qrData={selectedCard?.qrData}
            />

            {selectedCard && <ExportButtons />}
          </div>
        </div>
      )}
    </section>
  );
}

export default GeneratedCards;