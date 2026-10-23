import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api/axios.jsx";

function VendorsSection() {
  const [vendors, setVendor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await api.get("/admin/vendor");
        console.log(response.data);
        setVendor(response.data.data || []);
      } catch (err) {
        console.log(err);
        toast.error("Failed to load Vendors");
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, []);

  const query = search.trim().toLowerCase();

  const filteredVendors = query
    ? vendors.filter(
        (vendor) =>
          (vendor.name || "").toLowerCase().includes(query) ||
          (vendor.email || "").toLowerCase().includes(query) ||
          String(vendor.phone || "").toLowerCase().includes(query)
      )
    : vendors;

  const handleStatusChange = async (userId, newStatus) => {
    try {
      if (!userId || !newStatus) {
        toast.info("User id and status is required");
        return;
      }

      await api.patch("/admin", { userId, newStatus });

      setVendor((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, status: newStatus } : user
        )
      );

      toast.success("Vendor status updated successfully");
    } catch (err) {
      console.log(err);
      toast.error("Unable to update the status");
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";

    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const viewOrders = (vendor) =>
    navigate(`/admin/orders/vendor/${vendor._id}`, {
      state: { name: vendor.name },
    });

  if (loading) {
    return <p>Loading Vendor...</p>;
  }

  const emptyMessage = query
    ? `No vendors match "${search}"`
    : "No vendors found";

  return (
    <>
      <h1 className="mb-5 text-xl font-bold text-gray-900 sm:text-2xl">
        Vendors Records
      </h1>

      <div className="mb-5 flex flex-col items-stretch justify-between gap-4 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-center sm:p-5">
        <p className="m-0 text-gray-700">Manage the Vendor</p>

        <button
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 sm:whitespace-nowrap"
          onClick={() => navigate("/register")}
        >
          + Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:max-w-md"
        />

        {search && (
          <button
            onClick={() => setSearch("")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filteredVendors.length > 0 ? (
          filteredVendors.map((vendor) => (
            <article
              key={vendor._id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-900">
                    {vendor.name}
                  </h2>
                  <p className="mt-1 break-all text-sm text-slate-600">
                    {vendor.email}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {vendor.phone || "No phone number"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    vendor.status === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {vendor.status}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
                <span className="text-xs text-slate-500">
                  Joined {formatDate(vendor.createdAt)}
                </span>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  Update status
                  <select
                    value={vendor.status}
                    onChange={(event) =>
                      handleStatusChange(vendor._id, event.target.value)
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                      vendor.status === "active"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </label>
              </div>

              <button
                onClick={() => viewOrders(vendor)}
                className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                View Orders
              </button>
            </article>
          ))
        ) : (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
            {emptyMessage}
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg shadow ring-1 ring-black ring-opacity-5 md:block">
        <table className="min-w-full divide-y divide-gray-300 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                Email
              </th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                Phone
              </th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                Created At
              </th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                Orders
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => (
                <tr
                  key={vendor._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {vendor.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {vendor.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {vendor.phone}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <select
                      value={vendor.status}
                      onChange={(e) =>
                        handleStatusChange(vendor._id, e.target.value)
                      }
                      className={`block w-32 rounded-md border-0 py-1.5 pl-3 pr-8 text-xs font-semibold ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 cursor-pointer ${
                        vendor.status === "active"
                          ? "bg-green-50 text-green-700 ring-green-600/20"
                          : "bg-red-50 text-red-700 ring-red-600/20"
                      }`}
                    >
                      <option value="active" className="bg-white text-gray-900">
                        Active
                      </option>
                      <option value="blocked" className="bg-white text-gray-900">
                        Blocked
                      </option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(vendor.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => viewOrders(vendor)}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      View Orders
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default VendorsSection;