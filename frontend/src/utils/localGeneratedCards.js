const STORAGE_KEY = "id_card_unsaved_generated_cards";

function createLocalId() {
  return (
    window.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function getLocalGeneratedCards() {
  try {
    const cards = localStorage.getItem(STORAGE_KEY);
    return cards ? JSON.parse(cards) : [];
  } catch {
    return [];
  }
}

export function getLocalGeneratedCardById(localId) {
  return getLocalGeneratedCards().find(card => card.localId === localId);
}

export function saveLocalGeneratedCards(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function upsertLocalGeneratedCard(cardData) {
  const cards = getLocalGeneratedCards();
  const now = new Date().toISOString();

  const localId = cardData.localId || createLocalId();

  const newCard = {
    ...cardData,
    _id: localId,
    localId,
    isLocal: true,
    isSaved: false,
    createdAt: cardData.createdAt || now,
    updatedAt: now
  };

  const existingIndex = cards.findIndex(card => card.localId === localId);

  if (existingIndex >= 0) {
    cards[existingIndex] = {
      ...cards[existingIndex],
      ...newCard
    };
  } else {
    cards.unshift(newCard);
  }

  saveLocalGeneratedCards(cards);

  return newCard;
}

export function deleteLocalGeneratedCard(localId) {
  const cards = getLocalGeneratedCards().filter(card => card.localId !== localId);
  saveLocalGeneratedCards(cards);
  return cards;
}