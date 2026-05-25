"use client";

import { useState, useCallback } from "react";
import { Play, Copy, ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle } from "lucide-react";

interface SandboxProps {
  baseUrl?: string;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-green-100 text-green-800",
  POST: "bg-blue-100 text-blue-800",
  PUT: "bg-amber-100 text-amber-800",
  PATCH: "bg-purple-100 text-purple-800",
  DELETE: "bg-red-100 text-red-800",
};

export default function ApiSandbox({ baseUrl = "" }: SandboxProps) {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("/api/v1/products");
  const [activeTab, setActiveTab] = useState<"headers" | "params" | "body">("headers");
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
    { key: "Authorization", value: "Bearer ", enabled: true },
  ]);
  const [params, setParams] = useState<KeyValuePair[]>([
    { key: "", value: "", enabled: true },
  ]);
  const [body, setBody] = useState('{\n  \n}');
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const addRow = (setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>) => {
    setter((prev) => [...prev, { key: "", value: "", enabled: true }]);
  };

  const updateRow = (
    setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>,
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => {
    setter((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const removeRow = (
    setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const buildUrl = useCallback(() => {
    const enabledParams = params.filter((p) => p.enabled && p.key.trim());
    const queryString = enabledParams
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join("&");
    const fullUrl = `${baseUrl}${url}${queryString ? `?${queryString}` : ""}`;
    return fullUrl;
  }, [baseUrl, url, params]);

  const executeRequest = async () => {
    setIsLoading(true);
    setShowResponse(true);
    const startTime = Date.now();

    try {
      const fullUrl = buildUrl();
      const requestHeaders: Record<string, string> = {};
      headers
        .filter((h) => h.enabled && h.key.trim())
        .forEach((h) => {
          requestHeaders[h.key] = h.value;
        });

      const options: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
        options.body = body;
      }

      const res = await fetch(fullUrl, options);
      const elapsed = Date.now() - startTime;
      setResponseTime(elapsed);
      setResponseStatus(res.status);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        setResponse(JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setResponse(text);
      }
    } catch (error: any) {
      setResponseTime(Date.now() - startTime);
      setResponseStatus(0);
      setResponse(`Error: ${error.message || "Network request failed"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response);
    }
  };

  const copyCurl = () => {
    const fullUrl = buildUrl();
    const enabledHeaders = headers.filter((h) => h.enabled && h.key.trim());
    let curl = `curl -X ${method} '${fullUrl}'`;
    enabledHeaders.forEach((h) => {
      curl += ` \\\n  -H '${h.key}: ${h.value}'`;
    });
    if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
      curl += ` \\\n  -d '${body.replace(/'/g, "\\'")}'`;
    }
    navigator.clipboard.writeText(curl);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Request Bar */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold border-0 cursor-pointer ${METHOD_COLORS[method]}`}
        >
          {(["GET", "POST", "PUT", "PATCH", "DELETE"] as HttpMethod[]).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/api/v1/endpoint"
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={executeRequest}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Send
        </button>
        <button
          onClick={copyCurl}
          title="Copy as cURL"
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["headers", "params", "body"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {tab === "headers" && <span className="ml-1 text-gray-400">({headers.filter(h => h.enabled && h.key).length})</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-3 max-h-[250px] overflow-y-auto">
        {activeTab === "headers" && (
          <div className="space-y-2">
            {headers.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => updateRow(setHeaders, i, "enabled", e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) => updateRow(setHeaders, i, "key", e.target.value)}
                  placeholder="Header name"
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded font-mono"
                />
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => updateRow(setHeaders, i, "value", e.target.value)}
                  placeholder="Value"
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded font-mono"
                />
                <button
                  onClick={() => removeRow(setHeaders, i)}
                  className="text-gray-400 hover:text-red-500 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => addRow(setHeaders)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              + Add header
            </button>
          </div>
        )}

        {activeTab === "params" && (
          <div className="space-y-2">
            {params.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => updateRow(setParams, i, "enabled", e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) => updateRow(setParams, i, "key", e.target.value)}
                  placeholder="Parameter"
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded font-mono"
                />
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => updateRow(setParams, i, "value", e.target.value)}
                  placeholder="Value"
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded font-mono"
                />
                <button
                  onClick={() => removeRow(setParams, i)}
                  className="text-gray-400 hover:text-red-500 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => addRow(setParams)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              + Add parameter
            </button>
          </div>
        )}

        {activeTab === "body" && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{"key": "value"}'
            className="w-full h-[180px] px-3 py-2 text-xs font-mono border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            spellCheck={false}
          />
        )}
      </div>

      {/* Response */}
      {showResponse && (
        <div className="border-t border-gray-200">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResponse(!showResponse)}
                className="flex items-center gap-1 text-xs font-medium text-gray-700"
              >
                {showResponse ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Response
              </button>
              {responseStatus !== null && (
                <span className={`flex items-center gap-1 text-xs font-medium ${
                  responseStatus >= 200 && responseStatus < 300
                    ? "text-green-600"
                    : responseStatus === 0
                    ? "text-red-600"
                    : "text-amber-600"
                }`}>
                  {responseStatus >= 200 && responseStatus < 300 ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {responseStatus === 0 ? "Error" : responseStatus}
                </span>
              )}
              {responseTime !== null && (
                <span className="text-xs text-gray-500">{responseTime}ms</span>
              )}
            </div>
            {response && (
              <button
                onClick={copyResponse}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <pre className="px-3 py-2 text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
                {response || "No response yet"}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
