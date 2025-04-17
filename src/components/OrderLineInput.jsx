import React from "react";

const OrderLineInput = ({ index, data, onChange, onRemove }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(index, { ...data, [name]: value });
  };

  return (
    <div className="grid grid-cols-3 gap-4 items-center mb-2">
      <input
        type="text"
        name="sku"
        value={data.sku}
        onChange={handleChange}
        placeholder="SKU"
        className="border p-2 rounded w-full"
      />
      <input
        type="number"
        name="quantity"
        value={data.quantity}
        onChange={handleChange}
        placeholder="Quantity"
        className="border p-2 rounded w-full"
      />
      <div className="flex gap-2 items-center">
        <input
          type="number"
          name="unitsPerBox"
          value={data.unitsPerBox}
          onChange={handleChange}
          placeholder="Units/Box"
          className="border p-2 rounded w-full"
        />
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 text-sm"
        >
          ❌
        </button>
      </div>
    </div>
  );
};

export default OrderLineInput;
