"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { WebhookDeliveryItem, WebhookDeliveryResponse } from "@/utils/types";
import Link from "next/link";
import routes from "@/utils/routes";

const WebhookDeliveriesPage = () => {
  const params = useParams();
  const webhookId = params.id as string;
  const [deliveries, setDeliveries] = useState<WebhookDeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDeliveryItem | null>(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      const response = await fetch(
        `${apiEndpoints.base}/${apiEndpoints.webhookDeliveries(parseInt(webhookId))}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch delivery history");
      }

      const data: WebhookDeliveryResponse = await response.json();
      setDeliveries(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [webhookId]);

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (filter === "all") return true;
    return delivery.status === filter;
  });

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

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            href={routes.webhooks}
            className="text-blue-600 hover:underline text-sm mb-2 inline-block"
          >
            <i className="las la-arrow-left"></i> Back to Webhooks
          </Link>
          <h2 className="text-2xl font-bold">Webhook Delivery History</h2>
          <p className="text-gray-600 text-sm mt-1">
            View delivery logs for webhook #{webhookId}
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

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("success")}
          className={`px-4 py-2 rounded ${
            filter === "success"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Success
        </button>
        <button
          onClick={() => setFilter("failed")}
          className={`px-4 py-2 rounded ${
            filter === "failed"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Failed
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded ${
            filter === "pending"
              ? "bg-yellow-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Pending
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <i className="las la-spinner la-spin text-4xl text-blue-600"></i>
            <p className="mt-2 text-gray-600">Loading delivery history...</p>
          </div>
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
          <i className="las la-inbox text-6xl mb-4"></i>
          <p>No deliveries found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => (
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

                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
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

export default WebhookDeliveriesPage;
