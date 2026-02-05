"use client";
import { useEffect, useState } from "react";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { AvailabilityItem, AvailabilityResponse } from "@/utils/types";

const AvailabilityPage = () => {
  const [services, setServices] = useState<AvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      const response = await fetch(
        `${apiEndpoints.base}${apiEndpoints.availabilityAll}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch availability data");
      }

      const data: AvailabilityResponse = await response.json();
      setServices(data.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
    const interval = setInterval(fetchAvailability, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (percent: number) => {
    if (percent >= 100) return "bg-green-500";
    if (percent >= 80) return "bg-yellow-500";
    if (percent >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusText = (percent: number) => {
    if (percent >= 100) return "Available";
    if (percent >= 80) return "Degraded";
    if (percent >= 50) return "Limited";
    return "Down";
  };

  const getStatusIcon = (percent: number) => {
    if (percent >= 100) return "🟢";
    if (percent >= 80) return "🟡";
    if (percent >= 50) return "🟠";
    return "🔴";
  };

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.service]) acc[service.service] = [];
    acc[service.service].push(service);
    return acc;
  }, {} as Record<string, AvailabilityItem[]>);

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Service Availability</h2>
          <p className="text-gray-600 text-sm mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchAvailability}
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

      {loading && services.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <i className="las la-spinner la-spin text-4xl text-blue-600"></i>
            <p className="mt-2 text-gray-600">Loading service status...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedServices).map(([serviceType, providers]) => (
            <div key={serviceType} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4 capitalize">
                {serviceType}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {providers.map((provider) => (
                  <div
                    key={`${provider.service}-${provider.provider}`}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium uppercase text-gray-700">
                        {provider.provider}
                      </span>
                      <span className="text-2xl">
                        {getStatusIcon(provider.percent)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold text-white ${getStatusColor(
                          provider.percent
                        )}`}
                      >
                        {getStatusText(provider.percent)}
                      </span>
                      <span className="text-lg font-bold text-gray-800">
                        {provider.percent}%
                      </span>
                    </div>
                    {provider.percent < 80 && (
                      <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                        <i className="las la-exclamation-triangle"></i>
                        Service temporarily unavailable
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && services.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          <i className="las la-inbox text-6xl mb-4"></i>
          <p>No service availability data available</p>
        </div>
      )}
    </div>
  );
};

export default AvailabilityPage;
