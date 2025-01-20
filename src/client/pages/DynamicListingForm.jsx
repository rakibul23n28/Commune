import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { getAuthHeaders } from "../utils/Helper";
import { useParams } from "react-router-dom";

import { useCommuneMembership } from "../context/CommuneMembershipContext";
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
  const [tags, setTags] = useState("");
  const [columnMessage, setColumnMessage] = useState("");

  const { getRole, fetchCommuneData, communeData } = useCommuneMembership();
  const [commune, setCommune] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCommuneData = async () => {
      if (!communeData) {
        try {
          await fetchCommuneData(communeid); // Fetch commune data from the context
        } catch (err) {
          setErrorMessage(
            err.response?.data?.message || "Failed to load commune data"
          );
        } finally {
          setLoading(false);
        }
      }
    };

    loadCommuneData();
  }, [communeid, fetchCommuneData, communeData]); // Add communeData to the dependency array

  useEffect(() => {
    if (communeData) {
      setCommune(communeData); // Update commune state after communeData has been fetched
    }
  }, [communeData]); // Watch for changes in communeData and update state accordingly

  const handleMetaDataChange = (field, value) => {
    setMetaData((prev) => ({ ...prev, [field]: value }));
  };

  const [count, setCount] = useState(0);

  const handleAddColumn = () => {
    // Ensure unique column names
    const newColumnName = count + " Column";
    setColumns([...columns, { name: newColumnName, type: "text" }]);
    setCount(count + 1);
  };

  const handleRemoveColumn = (index) => {
    setColumns(columns.filter((_, colIndex) => colIndex !== index));
    setRows(
      rows.map((row) => {
        const updatedRow = { ...row };
        delete updatedRow[columns[index].name];
        return updatedRow;
      })
    );
  };

  const handleColumnChange = (index, field, value) => {
    let flag = true;
    if (field === "name" && columns.some((column) => column.name === value)) {
      setColumnMessage(
        "Column name must be unique. OtherWise it cause errors."
      );
      flag = false;
    }
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
    if (flag) setColumnMessage("");
  };

  const handleAddRow = () => {
    const newRow = columns.reduce((acc, column) => {
      acc[column.name] = "";
      return acc;
    }, {});
    setRows([...rows, newRow]);
  };

  const handleRowChange = (rowIndex, columnName, value) => {
    setRows((prevRows) => {
      const updatedRows = [...prevRows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [columnName]: value,
      };
      return updatedRows;
    });
  };

  const handleRowSubmit = async (e) => {
    e.preventDefault();

    const isValid = columns.every((column) => {
      return rows.every((row) => row[column.name] !== undefined);
    });

    if (!isValid) {
      alert("Error: All columns must have valid data.");
      return;
    }

    const formattedData = columns.map((column) => {
      return {
        attribute_name: column.name,
        attribute_type: column.type,
        attribute_value: rows.map((row) => row[column.name]),
      };
    });

    try {
      await axios.post(
        `/api/commune/create/${communeid}/listings`,
        {
          metaData,
          columns,
          data: formattedData,
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={`${commune?.name}`} />
      <div className="w-10/12 mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Create a Dynamic Listing
        </h1>

        <div className="bg-white p-8 rounded-lg shadow-md mb-8 border border-blue-100">
          <h2 className="text-3xl font-semibold mb-6 text-gray-800">
            Listing Details
          </h2>
          <form className="space-y-6">
            <div className="flex flex-col">
              <label className="text-base font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                placeholder="Enter a title for the listing"
                value={metaData.title}
                onChange={(e) => handleMetaDataChange("title", e.target.value)}
                className="p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 transition"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-base font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="Enter a description"
                value={metaData.description}
                onChange={(e) =>
                  handleMetaDataChange("description", e.target.value)
                }
                className="p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 transition"
                rows="4"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-base font-medium text-gray-700 mb-2">
                Link
              </label>
              <input
                type="url"
                placeholder="Enter link"
                value={metaData.links}
                onChange={(e) => handleMetaDataChange("links", e.target.value)}
                className="p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 transition"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-base font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                value={metaData.tags}
                onChange={(e) => {
                  handleMetaDataChange("tags", e.target.value);
                  setTags(e.target.value);
                }}
                className="p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 transition"
                placeholder="Add tags, separated by commas"
              />
              {tags && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700">Tags:</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.split(",").map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold py-1 px-3 rounded-full shadow-sm"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Define Table Structure rewrite Column Names
          </h2>
          {columnMessage && <p className="text-red-500">{columnMessage}</p>}
          <form>
            {columns.map((column, index) => (
              <div key={index} className="flex space-x-4 mb-3">
                <input
                  type="text"
                  placeholder="Column Name"
                  value={column.name}
                  onChange={(e) =>
                    handleColumnChange(index, "name", e.target.value)
                  }
                  className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
                  required
                />
                <select
                  value={column.type}
                  onChange={(e) =>
                    handleColumnChange(index, "type", e.target.value)
                  }
                  className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
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
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-500 transition"
            >
              Add Column
            </button>
          </form>
        </div>

        {/* Step 3: Row Data */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Enter Table Data
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.name}
                      className="border px-4 py-2 text-left bg-gray-100 text-gray-600"
                    >
                      {column.name}
                    </th>
                  ))}
                  <th className="border px-4 py-2 bg-gray-100 text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column) => (
                      <td key={column.name} className="border px-4 py-2">
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
                          className="w-full p-2 border rounded shadow-sm"
                          required
                        />
                      </td>
                    ))}
                    <td className="border px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setRows(rows.filter((_, idx) => idx !== rowIndex))
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
          <div className="mt-4 flex space-x-4">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-500 transition"
            >
              Add Row
            </button>
            <button
              type="submit"
              onClick={handleRowSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-500 transition"
            >
              Submit Data
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DynamicListingForm;
