import { v4 as uuidv4 } from "uuid";

// ────────────────────────────────────────────────────────────────────────────────
// CONSTANTS — tune these in one place
// ────────────────────────────────────────────────────────────────────────────────
const BOX_HEIGHT = 14; // inches
const PALLET_HEIGHT = 6; // pallet deck height (inches)
const MAX_BOXES_PER_LAYER = 6; // 2 × 3 footprint
const BOX_WEIGHT = 14.5; // lbs @ 50 units / box  ➜ scaled below
const DEFAULT_UNITS_PER_BOX = 50;

// Coordinate order for a *snake* layer (mirrors your build pattern)
const COORDS = ["a1", "a2", "a3", "b3", "b2", "b1"];

/**
 * calculatePallets(poList, settings)
 *
 * @param {Array} poList   – [{ po, skus:[{ sku, quantity, unitsPerBox }] }]
 * @param {Object} settings – { maxPalletHeight?: number, grouping?: "none"|"item"|"po-item" }
 * @returns {Array}        – Pallet array with an attached `.totals` summary so
 *                           legacy reduce() calls keep working _and_ you can
 *                           read `result.totals` directly.
 */
export function calculatePallets(poList, settings) {
  // 1) Capacity — how many cartons fit on *one* pallet
  const maxPalletHeight = parseInt(settings.maxPalletHeight || 93, 10);
  const grouping = settings.grouping || "po-item"; // "none" | "item" | "po-item"
  const usableHeight = maxPalletHeight - PALLET_HEIGHT;
  const maxLayers = Math.floor(usableHeight / BOX_HEIGHT);
  const capacity = maxLayers * MAX_BOXES_PER_LAYER;

  // 2) Flatten manifest into individual *cartons*
  const cartons = [];
  poList.forEach(({ po, skus }) => {
    skus.forEach(({ sku, quantity, unitsPerBox }) => {
      const boxesNeeded = Math.ceil(
        Number(quantity) / Number(unitsPerBox || DEFAULT_UNITS_PER_BOX)
      );
      for (let i = 0; i < boxesNeeded; i++) {
        cartons.push({
          id: uuidv4(),
          po,
          sku,
          unitsPerBox: Number(unitsPerBox || DEFAULT_UNITS_PER_BOX),
          groupKey:
            grouping === "none"
              ? "mixed"
              : grouping === "item"
              ? sku
              : `${po}-${sku}`,
        });
      }
    });
  });

  // 3) Minimum number of pallets
  const totalCartons = cartons.length;
  const palletCount = Math.ceil(totalCartons / capacity);

  // 4) Per‑pallet *targets* so we keep them reasonably even & multiples of 6
  let base =
    Math.floor(totalCartons / palletCount / MAX_BOXES_PER_LAYER) *
    MAX_BOXES_PER_LAYER;
  if (base < MAX_BOXES_PER_LAYER) base = MAX_BOXES_PER_LAYER; // never < one layer

  let leftover = totalCartons - base * palletCount;
  const palletTargets = Array(palletCount).fill(base);
  for (let i = palletCount - 1; i >= 0 && leftover > 0; i--) {
    const add = Math.min(leftover, MAX_BOXES_PER_LAYER);
    palletTargets[i] += add;
    leftover -= add;
  }

  // 5) Allocate empty pallets
  const pallets = palletTargets.map(() => ({ cartons: [] }));

  // 6) Group cartons by key so we keep them *together*
  const groups = Object.values(
    cartons.reduce((acc, carton) => {
      const key = carton.groupKey;
      (acc[key] = acc[key] || []).push(carton);
      return acc;
    }, {})
  ).sort((a, b) => b.length - a.length); // largest groups first

  // 7) Greedy assignment of groups ➜ pallets (split only when unavoidable)
  groups.forEach((grp) => {
    let remaining = [...grp];

    // 7A – whole group if it fits
    let placed = false;
    pallets.forEach((p, i) => {
      if (!placed && p.cartons.length + remaining.length <= palletTargets[i]) {
        p.cartons.push(...remaining);
        remaining = [];
        placed = true;
      }
    });

    // 7B – round‑robin split
    let palletIdx = 0;
    while (remaining.length) {
      const p = pallets[palletIdx % pallets.length];
      const cap = palletTargets[palletIdx % pallets.length] - p.cartons.length;
      if (cap > 0) {
        p.cartons.push(...remaining.splice(0, cap));
      }
      palletIdx++;
    }
  });

  // 8) Build *layered* layouts
  const detailedPallets = pallets.map((p, palletIndex) => {
    // A) frequency map — most common SKU first
    const freq = {};
    p.cartons.forEach(({ sku, po }) => {
      const label =
        grouping === "item" || grouping === "none" ? sku : `${po}-${sku}`;
      freq[label] = (freq[label] || 0) + 1;
    });
    const labelOrder = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);

    // B) Flatten labels in that order
    const flat = [];
    labelOrder.forEach((label) => {
      for (let i = 0; i < freq[label]; i++) flat.push(label.split("-").pop());
    });

    // C) Snake placement
    const layers = [];
    flat.forEach((skuLabel, idx) => {
      const layerIdx = Math.floor(idx / MAX_BOXES_PER_LAYER);
      const coordIdx = idx % MAX_BOXES_PER_LAYER;
      if (!layers[layerIdx]) layers[layerIdx] = { breakdown: {}, mapping: [] };

      layers[layerIdx].breakdown[skuLabel] =
        (layers[layerIdx].breakdown[skuLabel] || 0) + 1;

      layers[layerIdx].mapping.push({
        coordinate: COORDS[coordIdx],
        sku: skuLabel,
      });
    });

    // D) Metrics
    const estWeight =
      35 +
      p.cartons.reduce(
        (sum, c) => sum + (c.unitsPerBox / DEFAULT_UNITS_PER_BOX) * BOX_WEIGHT,
        0
      );
    const estHeight = PALLET_HEIGHT + layers.length * BOX_HEIGHT; // inches
    const dims = `40x48x${estHeight}`; // WxLxH

    return {
      palletNumber: palletIndex + 1,
      boxCount: p.cartons.length,
      layers: layers.length,
      dims, // "40x48x48" etc.
      estimatedHeight: estHeight, // ← ADDED back for UI
      estimatedWeight: Math.round(estWeight),
      layerBreakdown: layers.map((l) => l.breakdown),
      layerLayout: layers.map((l) => l.mapping),
    };
  });

  // 9) Attach overall summary & return **array** for backward‑compatibility
  const totals = {
    pallets: detailedPallets.length,
    cartons: detailedPallets.reduce((s, p) => s + p.boxCount, 0),
    weight: detailedPallets.reduce((s, p) => s + p.estimatedWeight, 0),
  };

  const resultArray = [...detailedPallets]; // shallow copy keeps array semantics
  resultArray.totals = totals; // magic property → easy access
  // expose pallets as a named field too so old `.pallets` code works
  resultArray.pallets = resultArray;

  // convenient per‑pallet summary objects for quick display
  resultArray.summaries = resultArray.map((p) => ({
    pallet: p.palletNumber,
    cartons: p.boxCount,
    dims: p.dims,
    weight: p.estimatedWeight,
  }));

  return resultArray;
}
