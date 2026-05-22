"use client";
import apiEndpoints from "@/utils/api/apiEndpoints";
import AxiosHandler from "@/utils/api/axiosHandler";
import { message } from "antd";
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

const TransactionGraph = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const apiService = new AxiosHandler(messageApi);
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const from = dayjs(yesterday).format("YYYY-MM-DD HH:00:00");
      const to = dayjs(now).format("YYYY-MM-DD HH:00:00");

      console.log("TransactionGraph - Fetching from:", from, "to:", to);

      const endpoint = isAdmin
        ? apiEndpoints.hourlyStatsGlobal
        : apiEndpoints.hourlyStatsUser;

      const response = await apiService.get({
        endPoint: `${endpoint}?from=${from}&to=${to}`,
      });

      console.log("TransactionGraph - API Response:", response);

      const stats: HourlyStat[] = response.data?.stats || [];
      console.log("TransactionGraph - Stats from API:", stats);

      // Create a map of existing stats
      const statsMap: { [key: string]: HourlyStat } = {};
      stats.forEach((stat) => {
        statsMap[stat.hour_start] = stat;
      });

      // Generate all 25 hours
      const data = [];
      let current = new Date(yesterday);
      current.setMinutes(0, 0, 0);

      while (current <= now) {
        const hourKey = dayjs(current).format("YYYY-MM-DD HH:00:00");
        const stat = statsMap[hourKey];

        data.push({
          hour: dayjs(current).format("HH:00"),
          "Airtime Success": stat?.airtime_successful || 0,
          "Airtime Failed": stat?.airtime_failed || 0,
          "Airtime Others": stat?.airtime_others || 0,
          "Data Success": stat?.data_successful || 0,
          "Data Failed": stat?.data_failed || 0,
          "Data Others": stat?.data_others || 0,
          "Utilities Success": stat?.utilities_successful || 0,
          "Utilities Failed": stat?.utilities_failed || 0,
          "Utilities Others": stat?.utilities_others || 0,
        });

        current.setHours(current.getHours() + 1);
      }

      console.log("TransactionGraph - Final chart data:", data);
      setChartData(data);
    } catch (error) {
      console.error("TransactionGraph - Error fetching stats:", error);
      messageApi.error("Failed to load transaction statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-4">
        <div className="iq-card iq-card-block iq-card-stretch m-0">
          <div className="iq-card-body">
            <h4 className="mb-4">
              {isAdmin ? "Global" : "Your"} Transaction Trends (Last 24 Hours)
            </h4>
            <div className="text-center py-8">
              <p>Loading graph...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          label: d.hour,
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
          label: d.hour,
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
          label: d.hour,
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
          label: d.hour,
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
          label: d.hour,
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
          label: d.hour,
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
          label: d.hour,
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
          label: d.hour,
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
          label: d.hour,
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
          
          {!loading && chartData.length > 0 ? (
            <div style={{ width: "100%", height: "400px" }}>
              <CanvasJSChart options={options} />
            </div>
          ) : !loading ? (
            <div className="text-center py-8">
              <p>No data available</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TransactionGraph;
