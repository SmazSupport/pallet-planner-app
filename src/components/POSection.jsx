import React from "react";
import OrderLineInput from "./OrderLineInput";

const POSection = ({
  poIndex,
  poData,
  onPOChange,
  onAddSKU,
  onRemoveSKU,
  onRemovePO,
  showPOField,
}) => {
  const handlePOFieldChange = (e) => {
    const { value } = e.target;
    onPOChange(poIndex, { ...poData, po: value });
  };

  const handleSKUChange = (skuIndex, updatedSKU) => {
    const newSKUs = [...poData.skus];
    newSKUs[skuIndex] = updatedSKU;
    onPOChange(poIndex, { ...poData, skus: newSKUs });
  };

  const handleRemoveSKU = (skuIndex) => {
    const newSKUs = [...poData.skus];
    newSKUs.splice(skuIndex, 1);
    onPOChange(poIndex, { ...poData, skus: newSKUs });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 border">
      <div className="flex justify-between items-center mb-4">
        {showPOField && (
          <input
            type="text"
            value={poData.po}
            onChange={handlePOFieldChange}
            placeholder="PO Number"
            className="border p-2 rounded w-full max-w-sm"
          />
        )}
        <button
          onClick={() => onRemovePO(poIndex)}
          className="ml-4 text-red-600 text-sm"
        >
          ❌ Remove PO
        </button>
      </div>

      <div>
        {poData.skus.map((skuLine, skuIndex) => (
          <OrderLineInput
            key={skuIndex}
            index={skuIndex}
            data={skuLine}
            onChange={handleSKUChange}
            onRemove={handleRemoveSKU}
          />
        ))}

        <button
          type="button"
          onClick={() => onAddSKU(poIndex)}
          className="mt-2 text-blue-600 text-sm"
        >
          ➕ Add SKU
        </button>
      </div>
    </div>
  );
};

export default POSection;
