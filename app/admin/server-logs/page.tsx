"use client";
import { useEffect, useState } from "react";
import apiEndpoints from "@/utils/api/apiEndpoints";
import useRequirePermission from "@/utils/useRequirePermission";
import { message } from "antd";

interface LogEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified_at: string;
}

const formatSize = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const ServerLogsPage = () => {
  useRequirePermission("logs.view");
  const [messageApi, contextHolder] = message.useMessage();
  const [source, setSource] = useState<"logs" | "reports">("logs");
  const [path, setPath] = useState("");
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(apiEndpoints.tokenSetUrl)}`,
  });

  const load = async (p: string, src: "logs" | "reports" = source) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiEndpoints.base}${apiEndpoints.adminLogFiles}?source=${src}&path=${encodeURIComponent(p)}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Failed to load directory");
      const data = await res.json();
      setEntries(data.data.entries || []);
      setPath(data.data.path || "");
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const download = async (p: string, name: string) => {
    setDownloading(p);
    try {
      const res = await fetch(
        `${apiEndpoints.base}${apiEndpoints.adminLogFiles}/download?source=${source}&path=${encodeURIComponent(p)}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Download failed");
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "logs"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const crumbs = path ? path.split("/") : [];
  const switchSource = (src: "logs" | "reports") => {
    setSource(src);
    setPath("");
    load("", src);
  };
  const goUp = () => load(crumbs.slice(0, -1).join("/"));

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold">Server Logs</h2>
      <p className="text-gray-600 text-sm mt-1 mb-4">
        Browse server logs and generated reports. Downloads are delivered as zip archives.
      </p>

      <div className="flex gap-2 mb-4">
        {(["logs", "reports"] as const).map((s) => (
          <button
            key={s}
            onClick={() => switchSource(s)}
            className={`px-4 py-2 rounded capitalize ${
              source === s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
        <button
          className="px-2 py-1 border rounded disabled:opacity-40"
          disabled={!path || loading}
          onClick={goUp}
          title="Back one level"
        >
          <i className="las la-arrow-left"></i> Back
        </button>
        <button className="text-blue-600 hover:underline" onClick={() => load("")}>
          {source}
        </button>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            <span>/</span>
            <button
              className="text-blue-600 hover:underline"
              onClick={() => load(crumbs.slice(0, i + 1).join("/"))}
            >
              {c}
            </button>
          </span>
        ))}
        <button
          className="ml-auto px-3 py-1 bg-gray-700 text-white rounded disabled:bg-gray-400"
          disabled={downloading !== null}
          onClick={() => download(path, crumbs[crumbs.length - 1] || source)}
        >
          Download this folder
        </button>
      </div>

      <table className="w-full text-sm bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Name</th>
            <th className="p-3">Size</th>
            <th className="p-3">Modified</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td className="p-3" colSpan={4}>Loading...</td></tr>
          ) : entries.length === 0 ? (
            <tr><td className="p-3" colSpan={4}>Empty directory</td></tr>
          ) : (
            entries.map((e) => (
              <tr key={e.path} className="border-b">
                <td className="p-3">
                  {e.is_dir ? (
                    <button className="text-blue-600 hover:underline" onClick={() => load(e.path)}>
                      <i className="las la-folder"></i> {e.name}
                    </button>
                  ) : (
                    <span><i className="las la-file-alt"></i> {e.name}</span>
                  )}
                </td>
                <td className="p-3">{e.is_dir ? "-" : formatSize(e.size)}</td>
                <td className="p-3">{new Date(e.modified_at).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    disabled={downloading !== null}
                    onClick={() => download(e.path, e.name)}
                  >
                    {downloading === e.path ? "Zipping..." : "Download .zip"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ServerLogsPage;
