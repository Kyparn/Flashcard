import inventoryProducts from './inventering-produkter.json';

// Kopplar flashkort till inköps-/inventeringsprodukter.
// Nyckeln är "categoryId:cardId" så att kort-id:n kan återanvändas säkert.
// Ett flashkort kan peka på flera lagerprodukter, t.ex. öl på både fat och burk.
const INVENTORY_IDS_BY_CARD = {
  // Champagne och mousserande
  '6:c2': ['skumpa-006'],
  '6:c3': ['skumpa-007'],
  '6:c4': ['skumpa-004'],
  '6:c5': ['skumpa-024'],
  '6:c6': ['skumpa-020'],
  '6:c7': ['skumpa-021'],
  '6:c8': ['skumpa-021'],
  '6:c9': ['skumpa-023'],
  '6:c10': ['skumpa-022'],
  '6:c13': ['skumpa-012'],
  '6:c14': ['skumpa-019'],
  '6:c15': ['skumpa-018'],
  '6:c16': ['skumpa-017'],
  '6:c17': ['skumpa-016'],
  '6:c18': ['skumpa-015'],
  '6:c19': ['skumpa-014'],
  '6:c20': ['skumpa-011'],
  '6:c21': ['skumpa-010'],

  // Rosé
  '7:r1': ['vin-rose-003'],
  '7:r2': ['vin-rose-005'],
  '7:r3': ['vin-rose-007'],
  '7:r4': ['vin-rose-001'],
  '7:r5': ['vin-rose-004'],
  '7:r7': ['vin-rose-008'],

  // Vitt
  '8:v1': ['vin-vitt-004'],
  '8:v2': ['vin-vitt-016'],
  '8:v3': ['vin-vitt-020'],
  '8:v4': ['vin-vitt-014'],
  '8:v5': ['vin-vitt-018'],
  '8:v6': ['vin-vitt-012'],
  '8:v7': ['vin-vitt-024'],
  '8:v8': ['vin-vitt-022'],
  '8:v10': ['vin-vitt-013'],
  '8:v11': ['vin-vitt-015'],
  '8:v12': ['vin-vitt-017'],
  '8:v13': ['vin-vitt-006'],
  '8:v14': ['vin-vitt-019'],
  '8:v15': ['vin-vitt-023'],
  '8:v16': ['vin-vitt-025'],
  '8:v17': ['vin-vitt-008'],
  '8:v18': ['vin-vitt-005'],
  '8:v19': ['vin-vitt-007'],
  '8:v20': ['vin-vitt-002'],
  '8:v21': ['vin-vitt-009'],
  '8:v22': ['vin-vitt-011'],
  '8:v23': ['vin-vitt-021'],

  // Rött
  '9:ro1': ['vin-rott-014'],
  '9:ro2': ['vin-rott-017'],
  '9:ro3': ['vin-rott-020'],
  '9:ro4': ['vin-rott-022'],
  '9:ro5': ['vin-rott-024'],
  '9:ro6': ['vin-rott-026'],
  '9:ro7': ['vin-rott-008'],
  '9:ro8': ['vin-rott-004'],
  '9:ro9': ['vin-rott-010'],
  '9:ro10': ['vin-rott-015'],
  '9:ro11': ['vin-rott-011'],
  '9:ro12': ['vin-rott-018'],
  '9:ro13': ['vin-rott-023'],
  '9:ro14': ['vin-rott-003'],
  '9:ro15': ['vin-rott-025'],
  '9:ro16': ['vin-rott-007'],
  '9:ro17': ['vin-rott-009'],
  '9:ro18': ['vin-rott-012'],
  '9:ro19': ['vin-rott-001'],
  '9:ro20': ['vin-rott-013'],
  '9:ro21': ['vin-rott-016'],
  '9:ro22': ['vin-rott-019'],
  '9:ro23': ['vin-rott-021'],

  // Sött och dessert
  '10:s1': ['vin-dessert-003'],
  '10:s2': ['vin-dessert-001'],
  '10:s3': ['vin-dessert-002'],
  '10:s4': ['vin-dessert-004'],

  // Öl. Suntrip finns både på fat och burk.
  '3:b1': ['olfat-005'],
  '3:b2': ['olfat-004'],
  '3:b3': ['olfat-001', 'olflaska-002'],
  '3:b4': ['olfat-003'],
  '3:b5': ['olflaska-003'],
  '3:b6': ['olflaska-011'],
  '3:b7': ['olflaska-001'],
};

const INVENTORY_BY_ID = Object.fromEntries(
  inventoryProducts.map((product) => [product.id, product]),
);

export function getInventoryProductsForCard(card) {
  const key = `${card.categoryId}:${card.id}`;
  const ids = INVENTORY_IDS_BY_CARD[key] || [];
  return ids.map((id) => INVENTORY_BY_ID[id]).filter(Boolean);
}

export function syncCardsWithInventory(cards) {
  return cards.map((card) => {
    const products = getInventoryProductsForCard(card);
    const ids = products.map((product) => product.id);

    return {
      ...card,
      inventoryId: ids[0] || null,
      inventoryIds: ids,
      inventory: products[0] || null,
      inventoryProducts: products,
    };
  });
}

export { inventoryProducts };
