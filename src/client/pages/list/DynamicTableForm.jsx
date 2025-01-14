import React, { useState } from "react";

const DynamicTableForm = ({ onSubmit }) => {
  const [columns, setColumns] = useState([{ name: "", type: "text" }]);

  const handleAddColumn = () => {
    setColumns([...columns, { name: "", type: "text" }]);
  };

  const handleColumnChange = (index, field, value) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(columns); // Pass the column structure to the parent
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Create Dynamic Table</h2>
      {columns.map((column, index) => (
        <div key={index} className="flex space-x-4 mb-2">
          <input
            type="text"
            placeholder="Column Name"
            value={column.name}
            onChange={(e) => handleColumnChange(index, "name", e.target.value)}
            className="w-1/2 p-2 border border-gray-300 rounded"
            required
          />
          <select
            value={column.type}
            onChange={(e) => handleColumnChange(index, "type", e.target.value)}
            className="w-1/2 p-2 border border-gray-300 rounded"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="link">Link</option>
          </select>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddColumn}
        className="text-blue-500 hover:underline"
      >
        Add Column
      </button>
      <div className="mt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Create Table
        </button>
      </div>
    </form>
  );
};

export default DynamicTableForm;
