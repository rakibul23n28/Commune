import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { useParams, useNavigate } from "react-router-dom";
import { getAuthHeaders } from "../utils/Helper";

const EditListingForm = () => {
  const { communeid, listid } = useParams();
  const navigate = useNavigate();

  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [columnMessage, setColumnMessage] = useState("");

  // Helper to transform rows if necessary
  const transformRows = (columns, rawRows) => {
    if (!columns || !rawRows) return [];
    const keys = columns.map((col) => col.attribute_name);
    const rowValues = keys.map((key) =>
      (rawRows.find((row) => row[key]) || {})[key]
        ?.split(",")
        .map((val) => val.trim())
    );

    // Transpose rows
    return rowValues[0]?.map((_, index) =>
      keys.reduce((acc, key, colIdx) => {
        acc[key] = rowValues[colIdx][index] || "-";
        return acc;
      }, {})
    );
  };

  // const undoTransformRows = (columns, transformedRows) => {
  //   if (!columns || !transformedRows) return [];

  //   const keys = columns.map((col) => col.attribute_name);
  //   const rawRows = keys.map((key) => {
  //     return {
  //       [key]: transformedRows.map((row) => row[key] || "-").join(", "), // Combine values into a comma-separated string
  //     };
  //   });

  //   return rawRows;
  // };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await axios.get(`/api/commune/list/${listid}`, {
          headers: getAuthHeaders(),
        });

        const transformedList = {
          ...response.data,
          rows: transformRows(response.data.columns, response.data.rows),
        };
        setList(transformedList);
        console.log(response.data, "kasldjaksdj");
      } catch (err) {
        setError("Failed to fetch the listing data.");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [communeid, listid]);

  const handleMetaDataChange = (field, value) => {
    setList((prev) => ({
      ...prev,
      metaData: { ...prev.metaData, [field]: value },
    }));
  };

  const handleAddColumn = () => {
    const newColumnName = `Column ${list.columns.length + 1}`;
    setList((prev) => ({
      ...prev,
      columns: [
        ...prev.columns,
        { attribute_name: newColumnName, attribute_type: "text" },
      ],
    }));
  };

  const handleRemoveColumn = (index) => {
    const updatedColumns = list.columns.filter(
      (_, colIndex) => colIndex !== index
    );
    const updatedRows = list.rows.map((row) => {
      const updatedRow = { ...row };
      delete updatedRow[list.columns[index].attribute_name];
      return updatedRow;
    });

    setList((prev) => ({
      ...prev,
      columns: updatedColumns,
      rows: updatedRows,
    }));
  };

  const handleColumnChange = (index, field, value) => {
    let flag = true;
    if (
      field === "attribute_name" &&
      list.columns.some((col) => col.attribute_name === value)
    ) {
      setColumnMessage("Column name must be unique.");

      flag = false;
    }

    const updatedColumns = [...list.columns];
    updatedColumns[index][field] = value;
    setList((prev) => ({ ...prev, columns: updatedColumns }));

    if (flag) setColumnMessage("");
  };

  const handleRowChange = (rowIndex, columnName, value) => {
    const updatedRows = [...list.rows];
    updatedRows[rowIndex][columnName] = value;
    setList((prev) => ({ ...prev, rows: updatedRows }));
  };

  const handleAddRow = () => {
    const newRow = list.columns.reduce((acc, column) => {
      acc[column.attribute_name] = "";
      return acc;
    }, {});

    setList((prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = list.columns.map((column) => {
      return {
        attribute_name: column.attribute_name,
        attribute_type: column.attribute_type,
        attribute_value: list.rows.map((row) => row[column.attribute_name]),
      };
    });

    // console.log(data, "data");

    // const submitList = {
    //   ...list,
    //   rows: undoTransformRows(list.columns, list.rows),
    // };

    // console.log(submitList, "submitList"); // Verify the format before sending

    try {
      await axios.put(
        `/api/commune/list/${listid}`,
        {
          metaData: list.metaData,
          data: data,
        },
        {
          headers: getAuthHeaders(),
        }
      );
      alert("Listing updated successfully!");
      navigate(`/commune/${communeid}`);
    } catch (err) {
      console.error("Error updating listing:", err);
      alert("Failed to update the listing.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <CommuneFixedNav />
        <CommuneNavbar name={`Commune ${communeid}`} />
        <div className="w-full text-center py-20 text-gray-500">Loading...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <CommuneFixedNav />
        <CommuneNavbar name={`Commune ${communeid}`} />
        <div className="w-full text-center py-20 text-red-500">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={`Edit Listing`} />
      <div className="w-10/12 mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Edit Listing
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata Section */}
          <div className="flex flex-col mb-6">
            <label className="text-base font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={list.metaData.title}
              onChange={(e) => handleMetaDataChange("title", e.target.value)}
              className="p-4 border border-gray-300 rounded-lg shadow-sm"
              required
            />
          </div>
          <div className="flex flex-col mb-6">
            <label className="text-base font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={list.metaData.description}
              onChange={(e) =>
                handleMetaDataChange("description", e.target.value)
              }
              className="p-4 border border-gray-300 rounded-lg shadow-sm"
              required
            />
          </div>
          {/* Columns Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Columns
            </h2>
            {columnMessage && <p className="text-red-500">{columnMessage}</p>}
            {list.columns.map((column, index) => (
              <div key={index} className="flex items-center space-x-4 mb-3">
                <input
                  type="text"
                  placeholder="Column Name"
                  value={column.attribute_name}
                  onChange={(e) =>
                    handleColumnChange(index, "attribute_name", e.target.value)
                  }
                  className="p-3 border rounded-lg shadow-sm"
                  required
                />
                <select
                  value={column.attribute_type}
                  onChange={(e) =>
                    handleColumnChange(index, "attribute_type", e.target.value)
                  }
                  className="p-3 border rounded-lg shadow-sm"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="link">Link</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveColumn(index)}
                  className="text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddColumn}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow"
            >
              Add Column
            </button>
          </div>
          {/* Rows Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Rows</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    {list.columns.map((column, idx) => (
                      <th
                        key={idx}
                        className="border px-4 py-2 bg-gray-100 text-gray-600"
                      >
                        {column.attribute_name}
                      </th>
                    ))}
                    <th className="border px-4 py-2 bg-gray-100 text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {list.columns.map((column, colIndex) => (
                        <td key={colIndex} className="border px-4 py-2">
                          <input
                            type={
                              column.attribute_type === "number"
                                ? "number"
                                : "text"
                            }
                            value={row[column.attribute_name] || ""}
                            onChange={(e) =>
                              handleRowChange(
                                rowIndex,
                                column.attribute_name,
                                e.target.value
                              )
                            }
                            className="w-full p-2 border rounded shadow-sm"
                          />
                        </td>
                      ))}
                      <td className="border px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setList((prev) => ({
                              ...prev,
                              rows: prev.rows.filter(
                                (_, idx) => idx !== rowIndex
                              ),
                            }))
                          }
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
            <button
              type="button"
              onClick={handleAddRow}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow"
            >
              Add Row
            </button>
          </div>
          <button
            type="submit"
            className="mt-8 px-4 py-2 bg-blue-600 text-white rounded-lg shadow"
          >
            Update Listing
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default EditListingForm;
