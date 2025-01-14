import React, { useState } from "react";

const DynamicTableValuesForm = ({ columns, onSubmit }) => {
  const [rows, setRows] = useState([
    columns.reduce((acc, column) => {
      acc[column.name] = "";
      return acc;
    }, {}),
  ]);

  const handleRowChange = (rowIndex, columnName, value) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][columnName] = value;
    setRows(updatedRows);
  };

  const handleAddRow = () => {
    const newRow = columns.reduce((acc, column) => {
      acc[column.name] = "";
      return acc;
    }, {});
    setRows([...rows, newRow]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(rows); // Submit all rows
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Enter Data for Listing</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.name}
                  className="border border-gray-300 px-4 py-2 text-left bg-gray-100"
                >
                  {column.name}
                </th>
              ))}
              <th className="border border-gray-300 px-4 py-2 bg-gray-100">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td
                    key={column.name}
                    className="border border-gray-300 px-4 py-2"
                  >
                    <input
                      type={column.type === "number" ? "number" : "text"}
                      value={row[column.name]}
                      onChange={(e) =>
                        handleRowChange(rowIndex, column.name, e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                    />
                  </td>
                ))}
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRows(rows.filter((_, idx) => idx !== rowIndex));
                    }}
                    className="text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 space-x-4">
        <button
          type="button"
          onClick={handleAddRow}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Add Row
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Submit All Rows
        </button>
      </div>
    </form>
  );
};

export default DynamicTableValuesForm;
