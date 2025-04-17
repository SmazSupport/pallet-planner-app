import React, { useState } from "react";
import POSection from "./POSection";
import { calculatePallets } from "../utils/palletCalculator";
import ThreeDPalletView from "./ThreeDPalletView";

const defaultSKU = { sku: "", quantity: "", unitsPerBox: "50" };
const defaultPO = { po: "", skus: [{ ...defaultSKU }] };

const OrderForm = () => {
  const [poList, setPOList] = useState([{ ...defaultPO }]);
  const [maxPalletHeight, setMaxPalletHeight] = useState("93");
  const [grouping, setGrouping] = useState("po-item");
  const [palletResults, setPalletResults] = useState([]);

  const updatePO = (index, updatedPO) => {
    const newPOList = [...poList];
    newPOList[index] = updatedPO;
    setPOList(newPOList);
  };

  const addPO = () => {
    setPOList([...poList, { ...defaultPO }]);
  };

  const removePO = (index) => {
    const newPOList = [...poList];
    newPOList.splice(index, 1);
    setPOList(newPOList);
  };

  const addSKUToPO = (poIndex) => {
    const newPOList = [...poList];
    newPOList[poIndex].skus.push({ ...defaultSKU });
    setPOList(newPOList);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const pallets = calculatePallets(poList, {
      maxPalletHeight,
      grouping,
    });

    setPalletResults(pallets);
    console.log("📦 Calculated Pallets:", pallets);
  };

  const totalCartons = palletResults.reduce((sum, p) => sum + p.boxCount, 0);
  const totalWeight = palletResults.reduce(
    (sum, p) => sum + p.estimatedWeight,
    0
  );

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">📦 Pallet Planner</h1>

      <form onSubmit={handleSubmit}>
        {poList.map((po, index) => (
          <POSection
            key={index}
            poIndex={index}
            poData={po}
            onPOChange={updatePO}
            onAddSKU={addSKUToPO}
            onRemovePO={removePO}
            showPOField={poList.length > 1}
          />
        ))}

        <div className="mb-6">
          <button
            type="button"
            onClick={addPO}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ➕ Add PO
          </button>
        </div>

        <div className="bg-white border rounded p-4 shadow mb-6">
          <div className="mb-4">
            <label className="block font-medium mb-1">
              Max Pallet Height (inches)
            </label>
            <input
              type="number"
              value={maxPalletHeight}
              onChange={(e) => setMaxPalletHeight(e.target.value)}
              className="border p-2 rounded w-full max-w-xs"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Pallet Grouping</label>
            <select
              value={grouping}
              onChange={(e) => setGrouping(e.target.value)}
              className="border p-2 rounded w-full max-w-xs"
            >
              <option value="item">Keep by Item</option>
              <option value="po-item">Keep by PO + Item</option>
              <option value="none">No Grouping</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
        >
          🧮 Calculate Pallets
        </button>
      </form>

      {/* 📊 Pallet Results Display */}
      {palletResults.length > 0 && (
        <div className="bg-white border rounded p-4 mt-8 shadow">
          <h2 className="text-2xl font-bold mb-4">🧾 Pallet Summary</h2>
          <p className="mb-4 font-medium">
            Total Pallets: {palletResults.length} | Total Cartons:{" "}
            {totalCartons} | Total Weight: {totalWeight} lbs
          </p>
          {/* ▼ NEW: per‑pallet lines */}
          <ul className="mb-6 space-y-1 font-mono">
            {palletResults.map((p) => (
              <li key={p.palletNumber}>
                Pallet {p.palletNumber} | Cartons: {p.boxCount} | Dims: {p.dims}{" "}
                | Weight: {p.estimatedWeight} lbs
              </li>
            ))}
          </ul>
          <ThreeDPalletView pallets={palletResults} />
        </div>
      )}
    </div>
  );
};

export default OrderForm;
