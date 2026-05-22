"use client";
import { useEffect, useState } from "react";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { AdminAuditLog, AdminAuditLogsResponse } from "@/utils/types";

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    admin_user_id: "",
    admin_email: "",
    action: "",
    entity_type: "",
    entity_id: "",
    method: "",
    route: "",
    status_code: "",
    from: "",
    to: "",
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total_pages: 0,
    total_records: 0,
  });
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const fetchAuditLogs = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);

      const queryParams = new URLSearchParams();
      if (filters.admin_user_id) queryParams.append("admin_user_id", filters.admin_user_id);
      if (filters.admin_email) queryParams.append("admin_email", filters.admin_email);
      if (filters.action) queryParams.append("action", filters.action);
      if (filters.entity_type) queryParams.append("entity_type", filters.entity_type);
      if (filters.entity_id) queryParams.append("entity_id", filters.entity_id);
      if (filters.method) queryParams.append("method", filters.method);
      if (filters.route) queryParams.append("route", filters.route);
      if (filters.status_code) queryParams.append("status_code", filters.status_code);
      if (filters.from) queryParams.append("from", filters.from);
      if (filters.to) queryParams.append("to", filters.to);
      queryParams.append("page", page.toString());
      queryParams.append("per_page", pagination.per_page.toString());

      const url = `${apiEndpoints.base}${apiEndpoints.adminAuditLogs}?${queryParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data: AdminAuditLogsResponse = await response.json();
      setLogs(data.data.logs);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    fetchAuditLogs(1);
  };

  const clearFilters = () => {
    setFilters({
      admin_user_id: "",
      admin_email: "",
      action: "",
      entity_type: "",
      entity_id: "",
      method: "",
      route: "",
      status_code: "",
      from: "",
      to: "",
    });
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return "bg-green-100 text-green-800";
    } else if (statusCode >= 400 && statusCode < 500) {
      return "bg-yellow-100 text-yellow-800";
    } else if (statusCode >= 500) {
      return "bg-red-100 text-red-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-green-100 text-green-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "PATCH":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatLatency = (latencyMs: number) => {
    if (latencyMs < 1000) {
      return `${latencyMs}ms`;
    }
    return `${(latencyMs / 1000).toFixed(2)}s`;
  };

  const calculateStats = () => {
    const total = logs.length;
    const success = logs.filter((log) => log.status_code >= 200 && log.status_code < 300).length;
    const errors = logs.filter((log) => log.status_code >= 400).length;
    const avgLatency = total > 0 
      ? Math.round(logs.reduce((sum, log) => sum + log.latency_ms, 0) / total)
      : 0;

    return { total, success, errors, avgLatency };
  };

  const stats = calculateStats();

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchAuditLogs(newPage);
    }
  };

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Admin Audit Logs</h2>
          <p className="text-gray-600 text-sm mt-1">
            Track all admin actions and API requests
          </p>
        </div>
        <button
          onClick={() => fetchAuditLogs(pagination.current_page)}
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
          <div className="text-sm text-gray-600 mb-1">Total Logs</div>
          <div className="text-2xl font-bold">{pagination.total_records}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Success (2xx)</div>
          <div className="text-2xl font-bold text-green-600">{stats.success}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Errors (4xx/5xx)</div>
          <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Avg Latency</div>
          <div className="text-2xl font-bold text-blue-600">{formatLatency(stats.avgLatency)}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              type="text"
              value={filters.admin_email}
              onChange={(e) => handleFilterChange("admin_email", e.target.value)}
              placeholder="Search by email"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              placeholder="Search by action"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method
            </label>
            <select
              value={filters.method}
              onChange={(e) => handleFilterChange("method", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Route
            </label>
            <input
              type="text"
              value={filters.route}
              onChange={(e) => handleFilterChange("route", e.target.value)}
              placeholder="Search by route"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Code
            </label>
            <select
              value={filters.status_code}
              onChange={(e) => handleFilterChange("status_code", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="200">200</option>
              <option value="201">201</option>
              <option value="400">400</option>
              <option value="401">401</option>
              <option value="403">403</option>
              <option value="404">404</option>
              <option value="500">500</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <input
              type="text"
              value={filters.entity_type}
              onChange={(e) => handleFilterChange("entity_type", e.target.value)}
              placeholder="e.g., user, transaction"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange("from", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange("to", e.target.value)}
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
            <p className="mt-2 text-gray-600">Loading audit logs...</p>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
          <i className="las la-inbox text-6xl mb-4"></i>
          <p>No audit logs found</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getMethodColor(
                          log.method
                        )}`}
                      >
                        {log.method}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                          log.status_code
                        )}`}
                      >
                        {log.status_code}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatLatency(log.latency_ms)}
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-800 mb-1">
                      {log.action}
                    </div>
                    <div className="text-sm text-gray-600 font-mono">
                      {log.route || log.path}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Admin:</span>
                    <span className="ml-2 font-medium">
                      {log.admin_name} ({log.admin_email})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">IP Address:</span>
                    <span className="ml-2 font-medium">{log.ip_address}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Timestamp:</span>
                    <span className="ml-2 font-medium">{formatDate(log.created_at)}</span>
                  </div>
                  {log.entity_type && (
                    <div>
                      <span className="text-gray-600">Entity:</span>
                      <span className="ml-2 font-medium">
                        {log.entity_type}
                        {log.entity_id && ` #${log.entity_id}`}
                      </span>
                    </div>
                  )}
                </div>

                {log.query_params && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-xs text-gray-600 mb-1">
                      <strong>Query Params:</strong>
                    </p>
                    <pre className="text-xs overflow-x-auto">{log.query_params}</pre>
                  </div>
                )}

                <div className="mt-3">
                  <button
                    onClick={() =>
                      setSelectedLog(selectedLog?.id === log.id ? null : log)
                    }
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selectedLog?.id === log.id
                      ? "Hide Details"
                      : "View Request/Response"}
                  </button>
                  {selectedLog?.id === log.id && (
                    <div className="mt-2 space-y-2">
                      {log.request_body && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-xs text-gray-600 mb-1">
                            <strong>Request Body:</strong>
                          </p>
                          <pre className="text-xs overflow-x-auto max-h-64">
                            {JSON.stringify(JSON.parse(log.request_body), null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.response_body && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-xs text-gray-600 mb-1">
                            <strong>Response Body:</strong>
                          </p>
                          <pre className="text-xs overflow-x-auto max-h-64">
                            {JSON.stringify(JSON.parse(log.response_body), null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.user_agent && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                          <p className="text-xs text-gray-600 mb-1">
                            <strong>User Agent:</strong>
                          </p>
                          <p className="text-xs">{log.user_agent}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.total_pages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.current_page} of {pagination.total_pages} (
                {pagination.total_records} total)
              </span>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.total_pages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;
