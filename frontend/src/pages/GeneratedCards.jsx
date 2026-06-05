import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cardAPI } from "../services/api";
import CardPreview from "../components/CardPreview";
import ExportButtons from "../components/ExportButtons";

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

  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchCards = async () => {
    try {
      const response = await cardAPI.getAll();

      setCards(response.data);
      setSelectedCard(response.data[0] || null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load saved cards");
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const filteredCards = useMemo(() => {
    let result = cards;

    if (templateFilterId) {
      result = result.filter(card => getTemplateId(card) === templateFilterId);
    }

    if (activeFilter === "digival") {
      result = result.filter(card => isDigiValCard(card));
    }

    return result;
  }, [cards, activeFilter, templateFilterId]);

  useEffect(() => {
    if (
      selectedCard &&
      filteredCards.some(card => card._id === selectedCard._id)
    ) {
      return;
    }

    setSelectedCard(filteredCards[0] || null);
  }, [filteredCards, selectedCard]);

  const handleDelete = async card => {
    const confirmDelete = window.confirm("Delete this generated card?");

    if (!confirmDelete) return;

    try {
      await cardAPI.delete(card._id);
      await fetchCards();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete card");
    }
  };

  const getEditLink = card => {
    const templateId = getTemplateId(card);

    return `/generate/${templateId}?cardId=${card._id}`;
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Generated Cards</span>
          <h1>View saved ID cards</h1>
          <p>Every card shown here is saved in the project database.</p>
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
          All ({cards.length})
        </button>

        <button
          className={activeFilter === "digival" ? "chip active" : "chip"}
          onClick={() => setActiveFilter("digival")}
        >
          DigiVal Cards ({cards.filter(isDigiValCard).length})
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
                  <div className="mini-badge success">Saved</div>
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
