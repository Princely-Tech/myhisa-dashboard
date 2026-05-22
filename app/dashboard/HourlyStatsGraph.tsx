"use client";
import apiEndpoints from "@/utils/api/apiEndpoints";
import AxiosHandler from "@/utils/api/axiosHandler";
import { Spin, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const CanvasJSChart = dynamic(
  () => import("@canvasjs/react-charts").then((mod: any) => {
    return mod.CanvasJSChart || mod.default?.CanvasJSChart || mod;
  }),
  { ssr: false }
);

interface HourlyStat {
  hour_start: string;
  airtime_successful: number;
  airtime_failed: number;
  airtime_others: number;
  data_successful: number;
  data_failed: number;
  data_others: number;
  utilities_successful: number;
  utilities_failed: number;
  utilities_others: number;
}

interface HourlyStatsResponse {
  data: {
    from: string;
    to: string;
    count: number;
    stats: HourlyStat[];
    type: string;
    user_id?: number;
  };
}

const HourlyStatsGraph = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HourlyStat[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const from = dayjs(twentyFourHoursAgo).format("YYYY-MM-DD HH:00:00");
      const to = dayjs(now).format("YYYY-MM-DD HH:00:00");

      console.log("Fetching stats from:", from, "to:", to);

      const endpoint = isAdmin
        ? apiEndpoints.hourlyStatsGlobal
        : apiEndpoints.hourlyStatsUser;

      const res: HourlyStatsResponse = await apiService.get({
        endPoint: `${endpoint}?from=${from}&to=${to}`,
      });

      console.log("API Response:", res);
      console.log("Stats from API:", res.data?.stats);

      // Fill missing hours with zeros (even if no data returned)
      const filledStats = fillMissingHours(
        res.data?.stats || [],
        twentyFourHoursAgo,
        now
      );
      console.log("Filled stats:", filledStats);
      setStats(filledStats);
    } catch (err) {
      console.error("Error fetching hourly stats:", err);
      messageApi.error("Failed to load transaction statistics");
      // Even on error, show empty graph with zeros
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const filledStats = fillMissingHours([], twentyFourHoursAgo, now);
      setStats(filledStats);
    } finally {
      setLoading(false);
    }
  };

  const fillMissingHours = (
    stats: HourlyStat[],
    fromDate: Date,
    toDate: Date
  ): HourlyStat[] => {
    const result: HourlyStat[] = [];
    const statsMap: { [key: string]: HourlyStat } = {};

    console.log("fillMissingHours - Input stats:", stats);
    console.log("fillMissingHours - From:", fromDate, "To:", toDate);

    // Index existing stats by hour (normalize the format)
    stats.forEach((stat) => {
      const normalizedKey = dayjs(stat.hour_start).format("YYYY-MM-DD HH:00:00");
      console.log(`Mapping: ${stat.hour_start} -> ${normalizedKey}`);
      statsMap[normalizedKey] = stat;
    });

    console.log("fillMissingHours - Stats map:", statsMap);

    // Fill all hours in the range
    let current = new Date(fromDate);
    current.setMinutes(0, 0, 0);
    const end = new Date(toDate);

    while (current <= end) {
      const hourKey = dayjs(current).format("YYYY-MM-DD HH:00:00");
      const existingStat = statsMap[hourKey];

      console.log(`Hour ${hourKey}: ${existingStat ? 'FOUND' : 'MISSING'}`);

      result.push(
        existingStat || {
          hour_start: hourKey,
          airtime_successful: 0,
          airtime_failed: 0,
          airtime_others: 0,
          data_successful: 0,
          data_failed: 0,
          data_others: 0,
          utilities_successful: 0,
          utilities_failed: 0,
          utilities_others: 0,
        }
      );

      current.setHours(current.getHours() + 1);
    }

    console.log("fillMissingHours - Result count:", result.length);
    return result;
  };

  // Transform data for chart
  const chartData = stats.map((stat, index) => {
    const isFirstHour = index === 0;
    const isLastHour = index === stats.length - 1;
    const date = dayjs(stat.hour_start);
    
    // Show date + time for first and last labels, otherwise just time
    let label = date.format("HH:00");
    if (isFirstHour || isLastHour) {
      label = date.format("MMM DD, HH:00");
    }
    
    return {
      time: label,
      "Airtime Success": stat.airtime_successful,
      "Airtime Failed": stat.airtime_failed,
      "Airtime Others": stat.airtime_others,
      "Data Success": stat.data_successful,
      "Data Failed": stat.data_failed,
      "Data Others": stat.data_others,
      "Utilities Success": stat.utilities_successful,
      "Utilities Failed": stat.utilities_failed,
      "Utilities Others": stat.utilities_others,
    };
  });

  console.log("chartData length:", chartData.length);
  console.log("chartData sample:", chartData.slice(0, 3));

  const hasData = stats.some(
    (stat) =>
      stat.airtime_successful > 0 ||
      stat.airtime_failed > 0 ||
      stat.airtime_others > 0 ||
      stat.data_successful > 0 ||
      stat.data_failed > 0 ||
      stat.data_others > 0 ||
      stat.utilities_successful > 0 ||
      stat.utilities_failed > 0 ||
      stat.utilities_others > 0
  );

  const options = {
    animationEnabled: true,
    theme: "light2",
    title: {
      text: "",
    },
    axisX: {
      title: "Hour",
      labelAngle: -45,
    },
    axisY: {
      title: "Transaction Count",
      includeZero: true,
    },
    toolTip: {
      shared: true,
    },
    legend: {
      cursor: "pointer",
      verticalAlign: "top",
      horizontalAlign: "center",
      fontSize: 12,
    },
    data: [
      {
        type: "line",
        name: "Airtime Success",
        showInLegend: true,
        color: "#10b981",
        lineThickness: 2,
        markerSize: 5,
        dataPoints: chartData.map((d) => ({
          label: d.time,
          y: d["Airtime Success"],
        })),
      },
      {
        type: "line",
        name: "Airtime Failed",
        showInLegend: true,
        color: "#ef4444",
        lineThickness: 2,
        markerSize: 5,
        dataPoints: chartData.map((d) => ({
          label: d.time,
          y: d["Airtime Failed"],
        })),
      },
      {
        type: "line",
        name: "Airtime Others",
        showInLegend: true,
        color: "#f59e0b",
        lineThickness: 2,
        markerSize: 5,
        dataPoints: chartData.map((d) => ({
          label: d.time,
          y: d["Airtime Others"],
        })),
      },
      {
        type: "line",
        name: "Data Success",
        showInLegend: true,
        color: "#3b82f6",
        lineThickness: 2,
        markerSize: 5,
        dataPoints: chartData.map((d) => ({
          label: d.time,
          y: d["Data Success"],
        })),
      },
      {
        type: "line",
        name: "Data Failed",
        showInLegend: true,
        color: "#dc2626",
        lineThickness: 2,
        markerSize: 5,
        dataPoints: chartData.map((d) => ({
          label: d.time,
          y: d["Data Failed"],
        })),
      },
      {
        type: "line",
        name: "Data Others",
        showInLegend: true,
        color: "#fb923c",
        lineThickness: 2,
        markerSize: 5,
        dataPoints: chartData.map((d) => ({
          label: d.time,
          y: d["Data Others"],
        })),
      },
      {
        type: "line",
        name: "Utilities Success",
        showInLegend: true,
        color: "#8b5cf6",
        lineThickness: 2,
        markerSize: 5,
        dataPoints: chartData.map((d) => ({
          label: d.time,
          y: d["Utilities Success"],
        })),
      },
      {
        type: "line",
        name: "Utilities Failed",
        showInLegend: true,
        color: "#be123c",
        lineThickness: 2,
        markerSize: 5,
        dataPoints: chartData.map((d) => ({
          label: d.time,
          y: d["Utilities Failed"],
        })),
      },
      {
        type: "line",
        name: "Utilities Others",
        showInLegend: true,
        color: "#f97316",
        lineThickness: 2,
        markerSize: 5,
        dataPoints: chartData.map((d) => ({
          label: d.time,
          y: d["Utilities Others"],
        })),
      },
    ],
  };

  return (
    <div className="mb-4">
      {contextHolder}
      <div className="iq-card iq-card-block iq-card-stretch m-0">
        <div className="iq-card-body">
          <h4 className="mb-4">
            {isAdmin ? "Global" : "Your"} Transaction Trends (Last 24 Hours)
          </h4>
          {!hasData && !loading && stats.length > 0 && (
            <div className="text-center py-4 text-gray-500 mb-2">
              <p className="text-sm">
                No transactions in the last 24 hours - showing baseline
              </p>
            </div>
          )}
          <Spin spinning={loading}>
            {!loading && chartData.length > 0 ? (
              <div style={{ width: "100%", height: 400 }}>
                <CanvasJSChart options={options} />
              </div>
            ) : !loading ? (
              <div className="text-center py-8">
                <p>No data available</p>
              </div>
            ) : null}
          </Spin>
        </div>
      </div>
    </div>
  );
};

export default HourlyStatsGraph;
