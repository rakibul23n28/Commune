import React, { useState } from "react";
import axios from "axios";

import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { getAuthHeaders } from "../utils/Helper";
import { useParams } from "react-router-dom";

const DynamicListingForm = () => {
  const { communeid } = useParams();
  const [metaData, setMetaData] = useState({
    title: "",
    description: "",
    links: "",
    tags: "",
  });
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [step, setStep] = useState(1);
  const [tags, setTags] = useState("");
  const info = 1;

  // Handlers for metadata
  const handleMetaDataChange = (field, value) => {
    setMetaData((prev) => ({ ...prev, [field]: value }));
  };

  // Handlers for column definition
  const handleAddColumn = () => {
    setColumns([...columns, { name: "", type: "text" }]);
  };

  const handleColumnChange = (index, field, value) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const handleColumnSubmit = (e) => {
    e.preventDefault();
    setRows([
      columns.reduce((acc, column) => {
        acc[column.name] = "";
        return acc;
      }, {}),
    ]);
    setStep(3); // Move to row input
  };

  // Handlers for row data
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

  const handleRowSubmit = async (e) => {
    e.preventDefault();

    // Check if all attribute_value arrays have the same length
    const rowCount = rows.length;
    const isValid = columns.every((column) => {
      // Check if each column's attribute_value array has the same length as the number of rows
      return rows.every((row) => row[column.name] !== undefined);
    });

    if (!isValid) {
      alert("Error: All columns must have the same number of values.");
      return; // Prevent submission if validation fails
    }

    // Transform data into the required format
    const formattedData = columns.map((column) => {
      return {
        attribute_name: column.name,
        attribute_type: column.type,
        attribute_value: rows.map((row) => row[column.name]),
      };
    });

    console.log(columns);

    try {
      const response = await axios.post(
        `/api/commune/${communeid}/listings`,
        {
          metaData,
          columns,
          data: formattedData, // Send the formatted data
        },
        {
          headers: getAuthHeaders(),
        }
      );
      alert("Data successfully saved!");
      location.href = `/commune/${communeid}`;
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data");
    }
  };

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={`Commune ${communeid}`} />
      <div className="mx-32 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">
          Dynamic Listing Form
        </h1>

        {/* Step 1: Metadata */}

        <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Listing Details</h2>
          <form className="space-y-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                placeholder="Enter a title for the listing"
                value={metaData.title}
                onChange={(e) => handleMetaDataChange("title", e.target.value)}
                className="p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Description</label>
              <textarea
                placeholder="Enter a description for the listing"
                value={metaData.description}
                onChange={(e) =>
                  handleMetaDataChange("description", e.target.value)
                }
                className="p-2 border border-gray-300 rounded"
                rows="3"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Link</label>
              <input
                type="url"
                placeholder="Enter link"
                value={metaData.links}
                onChange={(e) => handleMetaDataChange("links", e.target.value)}
                className="p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700"
              >
                Tags (optional)
              </label>
              <input
                id="tags"
                type="text"
                value={metaData.tags}
                onChange={(e) => {
                  handleMetaDataChange("tags", e.target.value);
                  setTags(e.target.value);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add tags, separated by commas"
              />
              {tags && (
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-gray-700">Tags:</h3>
                  <div className="flex space-x-2 mt-1">
                    {tags.split(",").map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold py-1 px-2 rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Next: Define Table Structure
            </button>
          </form>
        </div>

        {/* Step 2: Column Definition */}
        {step === 2 && (
          <form onSubmit={handleColumnSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Define Table Structure
            </h2>
            {columns.map((column, index) => (
              <div key={index} className="flex space-x-4 mb-2">
                <input
                  type="text"
                  placeholder="Column Name"
                  value={column.name}
                  onChange={(e) =>
                    handleColumnChange(index, "name", e.target.value)
                  }
                  className="w-1/2 p-2 border border-gray-300 rounded"
                  required
                />
                <select
                  value={column.type}
                  onChange={(e) =>
                    handleColumnChange(index, "type", e.target.value)
                  }
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
                Next: Enter Data
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Row Data */}
        {step === 3 && (
          <form onSubmit={handleRowSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Enter Data for Table</h2>
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
                              handleRowChange(
                                rowIndex,
                                column.name,
                                e.target.value
                              )
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
                Submit All Data
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default DynamicListingForm;
