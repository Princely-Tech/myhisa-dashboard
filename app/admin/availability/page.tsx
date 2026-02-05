"use client";
import { useEffect, useState } from "react";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { AvailabilityItem } from "@/utils/types";

const serviceProviderMap: Record<string, string[]> = {
  electricity: [
    "aedc",
    "ekedc",
    "ikedc",
    "ibedc",
    "eedc",
    "phed",
    "jedc",
    "kaedco",
    "kedco",
    "yedc",
    "bedc",
    "yedco",
    "aba",
  ],
  airtime: ["mtn", "airtel", "glo", "9mobile"],
  data: ["mtn", "airtel", "glo", "9mobile"],
  cable: ["dstv", "gotv", "startimes"],
};

const AdminAvailabilityPage = () => {
  const [serviceType, setServiceType] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [availability, setAvailability] = useState<number>(100);
  const [note, setNote] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<AvailabilityItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCurrentStatus = async () => {
    if (!serviceType || !provider) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      const response = await fetch(
        `${apiEndpoints.base}/${apiEndpoints.availabilityByService(serviceType)}?provider=${provider}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch current status");
      }

      const data = await response.json();
      setCurrentStatus(data.data);
      setAvailability(data.data.percent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceType && provider) {
      fetchCurrentStatus();
    }
  }, [serviceType, provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStatus && availability === currentStatus.percent) {
      setError("Availability percentage is the same as current status");
      return;
    }

    const willTriggerWebhook =
      (currentStatus && currentStatus.percent >= 80 && availability < 80) ||
      (currentStatus && currentStatus.percent < 80 && availability >= 80);

    if (
      willTriggerWebhook &&
      !confirm(
        `This change will trigger webhook notifications to all partners. Continue?`
      )
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      const response = await fetch(
        `${apiEndpoints.base}/${apiEndpoints.adminAvailability}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service: serviceType,
            provider,
            percent: availability,
            note,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update availability");
      }

      setSuccess(
        `Successfully updated ${serviceType}/${provider} to ${availability}%`
      );
      setNote("");
      fetchCurrentStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (percent: number) => {
    if (percent >= 100) return "text-green-600";
    if (percent >= 80) return "text-yellow-600";
    if (percent >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getStatusText = (percent: number) => {
    if (percent >= 100) return "Available";
    if (percent >= 80) return "Degraded";
    if (percent >= 50) return "Limited";
    return "Down";
  };

  const availableProviders = serviceType ? serviceProviderMap[serviceType] || [] : [];

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Update Service Availability</h2>
        <p className="text-gray-600 text-sm mt-1">
          Update service availability status (Admin Only)
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={serviceType}
              onChange={(e) => {
                setServiceType(e.target.value);
                setProvider("");
                setCurrentStatus(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select service type</option>
              <option value="electricity">Electricity</option>
              <option value="airtime">Airtime</option>
              <option value="data">Data</option>
              <option value="cable">Cable</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={!serviceType}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select provider</option>
              {availableProviders.map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {currentStatus && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">Current Status</h4>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm text-gray-600">Service:</span>
                  <span className="ml-2 font-medium capitalize">
                    {currentStatus.service}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Provider:</span>
                  <span className="ml-2 font-medium uppercase">
                    {currentStatus.provider}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Availability:</span>
                  <span
                    className={`ml-2 font-bold ${getStatusColor(
                      currentStatus.percent
                    )}`}
                  >
                    {currentStatus.percent}% ({getStatusText(currentStatus.percent)})
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Availability <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={availability}
                onChange={(e) => setAvailability(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">0%</span>
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${getStatusColor(availability)}`}
                  >
                    {availability}%
                  </div>
                  <div className={`text-sm ${getStatusColor(availability)}`}>
                    {getStatusText(availability)}
                  </div>
                </div>
                <span className="text-sm text-gray-600">100%</span>
              </div>
            </div>
          </div>

          {currentStatus && (
            <div>
              {currentStatus.percent >= 80 && availability < 80 && (
                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded flex items-start gap-2">
                  <i className="las la-exclamation-triangle text-yellow-600 text-xl"></i>
                  <div className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This change will trigger{" "}
                    <strong>service_down</strong> webhook notifications to all
                    partners.
                  </div>
                </div>
              )}
              {currentStatus.percent < 80 && availability >= 80 && (
                <div className="p-3 bg-green-50 border border-green-300 rounded flex items-start gap-2">
                  <i className="las la-check-circle text-green-600 text-xl"></i>
                  <div className="text-sm text-green-800">
                    <strong>Info:</strong> This change will trigger{" "}
                    <strong>service_restored</strong> webhook notifications to all
                    partners.
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for availability change (e.g., Upstream provider experiencing connectivity issues)"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This note will be included in webhook notifications
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || loading || !serviceType || !provider}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="las la-spinner la-spin"></i>
                  Updating...
                </>
              ) : (
                <>
                  <i className="las la-save"></i>
                  Update Availability
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setServiceType("");
                setProvider("");
                setAvailability(100);
                setNote("");
                setCurrentStatus(null);
                setError(null);
                setSuccess(null);
              }}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAvailabilityPage;
