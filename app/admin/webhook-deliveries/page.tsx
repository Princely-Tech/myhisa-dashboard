"use client";
import { useEffect, useState } from "react";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { AdminWebhookDeliveryItem, AdminWebhookDeliveryResponse } from "@/utils/types";
import useRequirePermission from "@/utils/useRequirePermission";

const AdminWebhookDeliveriesPage = () => {
  useRequirePermission("webhooks.view");
  const [deliveries, setDeliveries] = useState<AdminWebhookDeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    service: "",
    user_id: "",
  });
  const [selectedDelivery, setSelectedDelivery] = useState<AdminWebhookDeliveryItem | null>(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.service) queryParams.append("service", filters.service);
      if (filters.user_id) queryParams.append("user_id", filters.user_id);

      const url = `${apiEndpoints.base}${apiEndpoints.adminWebhookDeliveries}${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch webhook deliveries");
      }

      const data: AdminWebhookDeliveryResponse = await response.json();
      setDeliveries(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    fetchDeliveries();
  };

  const clearFilters = () => {
    setFilters({ status: "", service: "", user_id: "" });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    return eventType === "service_down" ? "🔴" : "🟢";
  };

  const calculateStats = () => {
    const total = deliveries.length;
    const success = deliveries.filter((d) => d.status === "success").length;
    const failed = deliveries.filter((d) => d.status === "failed").length;
    const pending = deliveries.filter((d) => d.status === "pending").length;
    const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : "0";

    return { total, success, failed, pending, successRate };
  };

  const stats = calculateStats();

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">All Webhook Deliveries</h2>
          <p className="text-gray-600 text-sm mt-1">
            View and manage webhook delivery logs for all partners
          </p>
        </div>
        <button
          onClick={fetchDeliveries}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <i className={`las la-sync ${loading ? "la-spin" : ""}`}></i>
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Deliveries</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Success</div>
          <div className="text-2xl font-bold text-green-600">{stats.success}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-blue-600">{stats.successRate}%</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service
            </label>
            <select
              value={filters.service}
              onChange={(e) => handleFilterChange("service", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="electricity">Electricity</option>
              <option value="airtime">Airtime</option>
              <option value="data">Data</option>
              <option value="cable">Cable</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              value={filters.user_id}
              onChange={(e) => handleFilterChange("user_id", e.target.value)}
              placeholder="Enter user ID"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex-1"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <i className="las la-spinner la-spin text-4xl text-blue-600"></i>
            <p className="mt-2 text-gray-600">Loading deliveries...</p>
          </div>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
          <i className="las la-inbox text-6xl mb-4"></i>
          <p>No webhook deliveries found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {getEventTypeIcon(delivery.event.event_type)}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold capitalize">
                        {delivery.event.event_type.replace("_", " ")}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {delivery.event.service} - {delivery.event.provider.toUpperCase()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                        delivery.status
                      )}`}
                    >
                      {delivery.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-600">User:</span>
                      <span className="ml-2 font-medium">
                        {delivery.user_email} (ID: {delivery.user_id})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Webhook URL:</span>
                      <span className="ml-2 font-medium text-xs break-all">
                        {delivery.webhook_url}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status Change:</span>
                      <span className="ml-2 font-medium">
                        {delivery.event.previous_state}% → {delivery.event.new_state}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Response Code:</span>
                      <span className="ml-2 font-medium">
                        {delivery.response_code || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Attempts:</span>
                      <span className="ml-2 font-medium">
                        {delivery.attempt_count}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Timestamp:</span>
                      <span className="ml-2 font-medium">
                        {new Date(delivery.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {delivery.error_message && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700">
                        <strong>Error:</strong> {delivery.error_message}
                      </p>
                    </div>
                  )}

                  {delivery.response_body && (
                    <div className="mt-3">
                      <button
                        onClick={() =>
                          setSelectedDelivery(
                            selectedDelivery?.id === delivery.id ? null : delivery
                          )
                        }
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedDelivery?.id === delivery.id
                          ? "Hide Details"
                          : "View Details"}
                      </button>
                      {selectedDelivery?.id === delivery.id && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded">
                          <p className="text-xs text-gray-600 mb-1">
                            <strong>Response Body:</strong>
                          </p>
                          <pre className="text-xs overflow-x-auto">
                            {delivery.response_body}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminWebhookDeliveriesPage;
