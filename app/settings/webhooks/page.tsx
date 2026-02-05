"use client";
import { useEffect, useState } from "react";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { WebhookItem, WebhookResponse } from "@/utils/types";
import Link from "next/link";

const WebhooksPage = () => {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookItem | null>(null);
  const [formData, setFormData] = useState({
    webhook_url: "",
    auth_token: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      const response = await fetch(
        `${apiEndpoints.base}${apiEndpoints.webhooks}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch webhooks");
      }

      const data: WebhookResponse = await response.json();
      setWebhooks(Array.isArray(data.data) ? data.data : [data.data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      const url = editingWebhook
        ? `${apiEndpoints.base}${apiEndpoints.webhookById(editingWebhook.id)}`
        : `${apiEndpoints.base}${apiEndpoints.webhooks}`;
      
      const method = editingWebhook ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save webhook");
      }

      setFormData({ webhook_url: "", auth_token: "", description: "" });
      setShowForm(false);
      setEditingWebhook(null);
      fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      const response = await fetch(
        `${apiEndpoints.base}${apiEndpoints.webhookById(id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete webhook");
      }

      fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEdit = (webhook: WebhookItem) => {
    setEditingWebhook(webhook);
    setFormData({
      webhook_url: webhook.webhook_url,
      auth_token: "",
      description: webhook.description || "",
    });
    setShowForm(true);
  };

  const handleToggleActive = async (webhook: WebhookItem) => {
    try {
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      const response = await fetch(
        `${apiEndpoints.base}${apiEndpoints.webhookById(webhook.id)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            webhook_url: webhook.webhook_url,
            description: webhook.description,
            is_active: !webhook.is_active,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update webhook");
      }

      fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Webhook Configuration</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage your webhook endpoints for service availability notifications
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingWebhook(null);
            setFormData({ webhook_url: "", auth_token: "", description: "" });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <i className="las la-plus"></i>
          Add Webhook
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {editingWebhook ? "Edit Webhook" : "Add New Webhook"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                value={formData.webhook_url}
                onChange={(e) =>
                  setFormData({ ...formData, webhook_url: e.target.value })
                }
                placeholder="https://your-domain.com/webhooks/service-status"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be HTTPS in production
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authorization Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required={!editingWebhook}
                value={formData.auth_token}
                onChange={(e) =>
                  setFormData({ ...formData, auth_token: e.target.value })
                }
                placeholder="your_secure_webhook_secret_token"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {editingWebhook
                  ? "Leave blank to keep existing token"
                  : "This token will be sent in the Authorization header"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Production webhook for service status notifications"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? "Saving..." : editingWebhook ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingWebhook(null);
                  setFormData({ webhook_url: "", auth_token: "", description: "" });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <i className="las la-spinner la-spin text-4xl text-blue-600"></i>
            <p className="mt-2 text-gray-600">Loading webhooks...</p>
          </div>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
          <i className="las la-webhook text-6xl mb-4"></i>
          <p className="mb-4">No webhooks configured</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Your First Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{webhook.webhook_url}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        webhook.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {webhook.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {webhook.description && (
                    <p className="text-gray-600 text-sm mb-2">
                      {webhook.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    <span>Created: {new Date(webhook.created_at).toLocaleString()}</span>
                    {webhook.updated_at !== webhook.created_at && (
                      <span className="ml-4">
                        Updated: {new Date(webhook.updated_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={routes.webhookDeliveries(webhook.id.toString())}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                  >
                    <i className="las la-history"></i> History
                  </Link>
                  <button
                    onClick={() => handleToggleActive(webhook)}
                    className={`px-3 py-1 rounded text-sm ${
                      webhook.is_active
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    <i
                      className={`las ${
                        webhook.is_active ? "la-pause" : "la-play"
                      }`}
                    ></i>
                    {webhook.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => handleEdit(webhook)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                  >
                    <i className="las la-edit"></i> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                  >
                    <i className="las la-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WebhooksPage;
