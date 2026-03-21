import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const SystemStatusModal = ({
  open,
  onClose,
  embedded = false,
  backgroundMode = "wave",
  onBackgroundModeChange = () => {},
  waveConfig = { gridSize: 32, waveHeight: 34, waveSpeed: 0.82, color: "#14b8a6" },
  onWaveConfigChange = () => {},
}) => {
  const [statusTick, setStatusTick] = useState(0);

  const setWaveValue = (key, value) => {
    onWaveConfigChange({
      ...waveConfig,
      [key]: value,
    });
  };

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setStatusTick((v) => v + 1), 1500);
    return () => clearInterval(timer);
  }, [open]);

  const statusData = useMemo(() => {
    const services = Array.from({ length: 84 }, (_, idx) => {
      const cycle = (idx + statusTick) % 18;
      const state = cycle === 0 ? "degraded" : cycle === 1 ? "warning" : "healthy";
      return {
        id: `svc-${String(idx + 1).padStart(3, "0")}`,
        name: `service-${String(idx + 1).padStart(3, "0")}`,
        region: ["us-east-1", "us-west-2", "eu-west-1", "sa-east-1"][idx % 4],
        latencyMs: 38 + ((idx * 7 + statusTick * 3) % 170),
        errorRate: (((idx % 11) + statusTick) % 9) * 0.07,
        queueDepth: (idx * 17 + statusTick * 5) % 620,
        state,
      };
    });

    const nodes = Array.from({ length: 48 }, (_, idx) => ({
      host: `edge-node-${String(idx + 1).padStart(2, "0")}`,
      cpu: 22 + ((idx * 9 + statusTick * 4) % 68),
      memory: 35 + ((idx * 7 + statusTick * 3) % 60),
      disk: 26 + ((idx * 5 + statusTick * 2) % 62),
      threads: 64 + ((idx * 41 + statusTick * 7) % 900),
      temperature: 41 + ((idx * 3 + statusTick) % 34),
    }));

    const pipelines = Array.from({ length: 36 }, (_, idx) => ({
      key: `PL-${String(8800 + idx)}`,
      owner: ["core", "analytics", "identity", "edge", "billing", "storage"][idx % 6],
      throughput: 150 + ((idx * 53 + statusTick * 11) % 2600),
      lagSec: (idx * 13 + statusTick * 2) % 95,
      retries: (idx * 5 + statusTick) % 15,
      health: idx % 9 === 0 ? "attention" : "stable",
    }));

    const alerts = Array.from({ length: 28 }, (_, idx) => ({
      id: `ALT-${String(5000 + idx)}`,
      severity: ["P1", "P2", "P3", "P4"][idx % 4],
      area: ["network", "database", "compute", "identity", "cache", "orchestration"][idx % 6],
      openForMin: 5 + ((idx * 9 + statusTick * 2) % 420),
      status: idx % 5 === 0 ? "in review" : "observing",
    }));

    const events = Array.from({ length: 140 }, (_, idx) => {
      const offsetMin = idx * 2 + (statusTick % 3);
      const timestamp = new Date(Date.now() - offsetMin * 60 * 1000).toLocaleString("en-US", {
        hour12: false,
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      return {
        timestamp,
        source: ["gateway", "scheduler", "ingestion", "api", "worker", "orchestrator"][idx % 6],
        message: `Routine synchronization completed for cluster segment ${String((idx % 12) + 1).padStart(2, "0")}.`,
      };
    });

    const regionSummary = ["us-east-1", "us-west-2", "eu-west-1", "sa-east-1"].map((region) => {
      const items = services.filter((svc) => svc.region === region);
      const avgLatency = Math.round(items.reduce((acc, item) => acc + item.latencyMs, 0) / items.length);
      const totalQueue = items.reduce((acc, item) => acc + item.queueDepth, 0);
      const warningCount = items.filter((item) => item.state !== "healthy").length;
      return {
        region,
        avgLatency,
        totalQueue,
        warningCount,
      };
    });

    const sourceActivity = ["gateway", "scheduler", "ingestion", "api", "worker", "orchestrator"].map((source) => ({
      source,
      count: events.filter((event) => event.source === source).length,
    }));

    const stabilityTimeline = Array.from({ length: 48 }, (_, idx) => {
      const signal = (idx * 5 + statusTick * 3) % 100;
      return {
        slot: idx + 1,
        signal,
        state: signal > 82 ? "degraded" : signal > 62 ? "warning" : "stable",
      };
    });

    const resourceProfile = {
      avgCpu: Math.round(nodes.reduce((acc, n) => acc + n.cpu, 0) / nodes.length),
      avgMemory: Math.round(nodes.reduce((acc, n) => acc + n.memory, 0) / nodes.length),
      avgDisk: Math.round(nodes.reduce((acc, n) => acc + n.disk, 0) / nodes.length),
    };

    const threadPools = Array.from({ length: 16 }, (_, idx) => {
      const workers = 4 + (idx % 6) * 2;
      const active = (idx * 3 + statusTick) % workers;
      const queued = (idx * 41 + statusTick * 13) % 620;
      const steals = 100 + ((idx * 59 + statusTick * 17) % 3200);
      const lockNs = 45 + ((idx * 23 + statusTick * 11) % 900);
      const mask = `0x${(0xff0f + idx * 137 + statusTick * 19).toString(16).toUpperCase()}`;
      return {
        pool: `pool_${String(idx).padStart(2, "0")}`,
        workers,
        active,
        queued,
        steals,
        lockNs,
        mask,
      };
    });

    const allocatorArenas = Array.from({ length: 20 }, (_, idx) => {
      const reservedMb = 256 + idx * 64;
      const committedMb = 120 + ((idx * 27 + statusTick * 9) % (reservedMb - 50));
      return {
        arena: `0x${(0x1000 + idx * 48).toString(16).toUpperCase()}`,
        reservedMb,
        committedMb,
        fragmentation: ((idx * 5 + statusTick * 2) % 32) + 2,
        allocRateMb: 10 + ((idx * 7 + statusTick * 3) % 88),
      };
    });

    const abiSnapshot = [
      "namespace runtime {",
      "  struct SchedulerFrame {",
      `    uint32_t tick = ${statusTick};`,
      `    uint32_t healthy_services = ${services.filter((s) => s.state === "healthy").length};`,
      `    uint32_t warning_services = ${services.filter((s) => s.state === "warning").length};`,
      `    uint32_t degraded_services = ${services.filter((s) => s.state === "degraded").length};`,
      `    uint64_t global_queue_depth = ${services.reduce((acc, s) => acc + s.queueDepth, 0)}ULL;`,
      `    uint32_t avg_node_cpu = ${Math.round(nodes.reduce((acc, n) => acc + n.cpu, 0) / nodes.length)};`,
      "  };",
      "",
      "  constexpr uint32_t kRegionCount = 4;",
      "  constexpr uint32_t kWorkerPools = 16;",
      "}",
    ];

    return {
      services,
      nodes,
      pipelines,
      alerts,
      events,
      regionSummary,
      sourceActivity,
      stabilityTimeline,
      resourceProfile,
      threadPools,
      allocatorArenas,
      abiSnapshot,
      summary: {
        healthy: services.filter((s) => s.state === "healthy").length,
        degraded: services.filter((s) => s.state === "degraded").length,
        warnings: services.filter((s) => s.state === "warning").length,
        activeAlerts: alerts.length,
      },
    };
  }, [statusTick]);

  if (!open) return null;

  const panel = (
    <motion.section
      initial={{ opacity: 0, y: 24, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.24 }}
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-background/80 font-mono shadow-[0_35px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl ${
        embedded ? "max-w-none" : "mx-auto max-w-[1500px]"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-surface/65 px-3 py-3 sm:px-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-main sm:text-base">
            Operations Control Console
          </h2>
          <p className="text-[11px] text-text-secondary sm:text-xs">
            Legacy board composition with live operational telemetry and condensed diagnostics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs">
          <span className="rounded-md border border-green-800 bg-white/5 px-2 py-1 text-green-500">
            Healthy: {statusData.summary.healthy}
          </span>
          <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-amber-300">
            Warning: {statusData.summary.warnings}
          </span>
          <span className="rounded-md border border-red-500/25 bg-red-500/10 px-2 py-1 text-red-300">
            Degraded: {statusData.summary.degraded}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-main"
          >
            Close
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-2 sm:p-3 lg:grid-cols-12">
        <section className="rounded-xl border border-white/10 bg-surface/45 p-2 lg:col-span-12">
          <div className="mb-2 flex items-center justify-between border border-white/10 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-text-tertiary">
            <span>Primary Summary Bus</span>
            <span className="tabular-nums text-text-secondary">Tick {statusTick}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Total Services</p>
              <p className="mt-1 text-lg tabular-nums text-text-main">{statusData.services.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Compute Nodes</p>
              <p className="mt-1 text-lg tabular-nums text-text-main">{statusData.nodes.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Data Pipelines</p>
              <p className="mt-1 text-lg tabular-nums text-text-main">{statusData.pipelines.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Active Alerts</p>
              <p className="mt-1 text-lg tabular-nums text-text-main">{statusData.summary.activeAlerts}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-surface/45 p-2 lg:col-span-3">
          <div className="mb-2 border border-white/10 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-text-tertiary">
            Control Panel
          </div>

          <div className="space-y-3">
            <div className="rounded border border-white/10 bg-white/5 p-2">
              <p className="mb-2 text-[10px] uppercase tracking-wide text-text-tertiary">Background Controls</p>
              <div className="space-y-2">
                <label className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-text-secondary">Background Mode</span>
                  <select
                    value={backgroundMode}
                    onChange={(e) => onBackgroundModeChange(e.target.value)}
                    className="rounded border border-white/10 bg-background px-2 py-1 text-text-main"
                  >
                    <option value="wave">Wave Grid</option>
                    <option value="aurora">Aurora Gradient</option>
                  </select>
                </label>

                <label className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-text-secondary">Grid Size</span>
                  <input
                    type="range"
                    min="16"
                    max="56"
                    step="1"
                    value={waveConfig.gridSize}
                    onChange={(e) => setWaveValue("gridSize", Number(e.target.value))}
                    className="w-28"
                    disabled={backgroundMode !== "wave"}
                  />
                </label>

                <label className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-text-secondary">Wave Height</span>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="1"
                    value={waveConfig.waveHeight}
                    onChange={(e) => setWaveValue("waveHeight", Number(e.target.value))}
                    className="w-28"
                    disabled={backgroundMode !== "wave"}
                  />
                </label>

                <label className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-text-secondary">Wave Speed</span>
                  <input
                    type="range"
                    min="0.2"
                    max="2"
                    step="0.02"
                    value={waveConfig.waveSpeed}
                    onChange={(e) => setWaveValue("waveSpeed", Number(e.target.value))}
                    className="w-28"
                    disabled={backgroundMode !== "wave"}
                  />
                </label>

                <label className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-text-secondary">Accent Color</span>
                  <input
                    type="color"
                    value={waveConfig.color}
                    onChange={(e) => setWaveValue("color", e.target.value)}
                    className="h-6 w-10 rounded border border-white/10 bg-transparent"
                    disabled={backgroundMode !== "wave"}
                  />
                </label>
              </div>
            </div>

            {[
              { label: "Average CPU", value: statusData.resourceProfile.avgCpu },
              { label: "Average Memory", value: statusData.resourceProfile.avgMemory },
              { label: "Average Disk", value: statusData.resourceProfile.avgDisk },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="text-text-secondary">{metric.label}</span>
                  <span className="tabular-nums text-text-main">{metric.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-background">
                  <motion.div
                    key={`${metric.label}-${metric.value}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 0.45 }}
                    className="h-full rounded bg-gradient-to-r from-primary/80 to-tertiary/70"
                  />
                </div>
              </div>
            ))}

            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-text-tertiary">Source Distribution</p>
              <div className="space-y-1">
                {statusData.sourceActivity.map((item) => (
                  <div
                    key={item.source}
                    className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px]"
                  >
                    <span className="text-text-secondary">{item.source}</span>
                    <span className="tabular-nums text-text-main">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-text-tertiary">Stability</p>
              <div className="grid grid-cols-12 gap-1">
                {statusData.stabilityTimeline.map((point) => (
                  <div
                    key={point.slot}
                    title={`Window ${point.slot}: ${point.signal}`}
                    className={`h-3 rounded-sm border border-white/10 ${
                      point.state === "stable"
                        ? "bg-emerald-500/25"
                        : point.state === "warning"
                          ? "bg-amber-500/30"
                          : "bg-red-500/35"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-text-tertiary">Runtime JSON</p>
              <pre className="max-h-44 overflow-auto rounded border border-white/10 bg-background px-2 py-2 text-[10px] leading-4 text-text-secondary">
                {statusData.abiSnapshot.join("\n")}
              </pre>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-surface/45 p-2 lg:col-span-6">
          <div className="mb-2 border border-white/10 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-text-tertiary">
            Service Board
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-left text-[10px] sm:text-[11px]">
              <thead className="sticky top-0 border-b border-white/10 bg-background text-text-tertiary">
                <tr>
                  <th className="px-2 py-1.5 font-medium">ID</th>
                  <th className="px-2 py-1.5 font-medium">Service</th>
                  <th className="px-2 py-1.5 font-medium">Region</th>
                  <th className="px-2 py-1.5 font-medium">Latency</th>
                  <th className="px-2 py-1.5 font-medium">Error %</th>
                  <th className="px-2 py-1.5 font-medium">Queue</th>
                  <th className="px-2 py-1.5 font-medium">State</th>
                </tr>
              </thead>
              <tbody>
                {statusData.services.map((svc) => (
                  <tr key={svc.id} className="border-t border-white/5">
                    <td className="px-2 py-1 tabular-nums text-text-secondary">{svc.id}</td>
                    <td className="px-2 py-1 text-text-main">{svc.name}</td>
                    <td className="px-2 py-1 text-text-secondary">{svc.region}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{svc.latencyMs}ms</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{svc.errorRate.toFixed(2)}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{svc.queueDepth}</td>
                    <td className="px-2 py-1">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                          svc.state === "healthy"
                            ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                            : svc.state === "warning"
                              ? "border border-amber-500/25 bg-amber-500/10 text-amber-300"
                              : "border border-red-500/25 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {svc.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 border border-white/10 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-text-tertiary">
            Node Diagnostics
          </div>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-left text-[10px] sm:text-[11px]">
              <thead className="sticky top-0 border-b border-white/10 bg-background text-text-tertiary">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Node</th>
                  <th className="px-2 py-1.5 font-medium">CPU</th>
                  <th className="px-2 py-1.5 font-medium">Memory</th>
                  <th className="px-2 py-1.5 font-medium">Disk</th>
                  <th className="px-2 py-1.5 font-medium">Temp</th>
                </tr>
              </thead>
              <tbody>
                {statusData.nodes.map((node) => (
                  <tr key={node.host} className="border-t border-white/5">
                    <td className="px-2 py-1 text-text-secondary">{node.host}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{node.cpu}%</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{node.memory}%</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{node.disk}%</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{node.temperature}C</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 border border-white/10 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-text-tertiary">
            Thread Pool Scheduler
          </div>
          <div className="max-h-52 overflow-auto">
            <table className="w-full text-left text-[10px] sm:text-[11px]">
              <thead className="sticky top-0 border-b border-white/10 bg-background text-text-tertiary">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Pool</th>
                  <th className="px-2 py-1.5 font-medium">W</th>
                  <th className="px-2 py-1.5 font-medium">A</th>
                  <th className="px-2 py-1.5 font-medium">Queue</th>
                  <th className="px-2 py-1.5 font-medium">Steals</th>
                  <th className="px-2 py-1.5 font-medium">Lock(ns)</th>
                  <th className="px-2 py-1.5 font-medium">Mask</th>
                </tr>
              </thead>
              <tbody>
                {statusData.threadPools.map((pool) => (
                  <tr key={pool.pool} className="border-t border-white/5">
                    <td className="px-2 py-1 text-text-secondary">{pool.pool}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{pool.workers}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{pool.active}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{pool.queued}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{pool.steals}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{pool.lockNs}</td>
                    <td className="px-2 py-1 tabular-nums text-text-secondary">{pool.mask}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-surface/45 p-2 lg:col-span-3">
          <div className="mb-2 border border-white/10 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-text-tertiary">
            Incident Desk
          </div>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="sticky top-0 border-b border-white/10 bg-background text-text-tertiary">
                <tr>
                  <th className="px-2 py-1.5 font-medium">ID</th>
                  <th className="px-2 py-1.5 font-medium">Priority</th>
                  <th className="px-2 py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {statusData.alerts.map((alert) => (
                  <tr key={alert.id} className="border-t border-white/5">
                    <td className="px-2 py-1 tabular-nums text-text-secondary">{alert.id}</td>
                    <td className="px-2 py-1 text-text-main">{alert.severity}</td>
                    <td className="px-2 py-1 text-text-secondary">{alert.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 border border-white/10 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-text-tertiary">
            Pipeline Watch
          </div>
          <div className="max-h-44 overflow-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="sticky top-0 border-b border-white/10 bg-background text-text-tertiary">
                <tr>
                  <th className="px-2 py-1.5 font-medium">ID</th>
                  <th className="px-2 py-1.5 font-medium">TPS</th>
                  <th className="px-2 py-1.5 font-medium">Lag</th>
                </tr>
              </thead>
              <tbody>
                {statusData.pipelines.map((pl) => (
                  <tr key={pl.key} className="border-t border-white/5">
                    <td className="px-2 py-1 tabular-nums text-text-secondary">{pl.key}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{pl.throughput}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{pl.lagSec}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 border border-white/10 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-text-tertiary">
            Region Snapshot
          </div>
          <div className="space-y-2 pt-2">
            {statusData.regionSummary.map((region) => (
              <div key={region.region} className="rounded border border-white/10 bg-white/5 p-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-text-main">{region.region}</span>
                  <span className="tabular-nums text-text-secondary">{region.avgLatency}ms</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded bg-background">
                  <div
                    className="h-full rounded bg-gradient-to-r from-primary/70 to-secondary/70"
                    style={{ width: `${Math.min(100, Math.round((region.avgLatency / 220) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 border border-white/10 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-text-tertiary">
            Allocator Arenas
          </div>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="sticky top-0 border-b border-white/10 bg-background text-text-tertiary">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Arena</th>
                  <th className="px-2 py-1.5 font-medium">Res</th>
                  <th className="px-2 py-1.5 font-medium">Com</th>
                  <th className="px-2 py-1.5 font-medium">Frag%</th>
                </tr>
              </thead>
              <tbody>
                {statusData.allocatorArenas.map((arena) => (
                  <tr key={arena.arena} className="border-t border-white/5">
                    <td className="px-2 py-1 tabular-nums text-text-secondary">{arena.arena}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{arena.reservedMb}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{arena.committedMb}</td>
                    <td className="px-2 py-1 tabular-nums text-text-main">{arena.fragmentation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-surface/45 p-2 lg:col-span-12">
          <div className="mb-2 border border-white/10 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-text-tertiary">
            Event Tape
          </div>
          <div className="max-h-64 overflow-auto sm:max-h-[18rem]">
            <table className="w-full text-left text-[10px] sm:text-[11px]">
              <thead className="sticky top-0 border-b border-white/10 bg-background text-text-tertiary">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Timestamp</th>
                  <th className="px-2 py-1.5 font-medium">Source</th>
                  <th className="px-2 py-1.5 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {statusData.events.map((evt, idx) => (
                  <tr key={`${evt.timestamp}-${idx}`} className="border-t border-white/5">
                    <td className="px-2 py-1 tabular-nums text-text-secondary">{evt.timestamp}</td>
                    <td className="px-2 py-1 text-text-main">{evt.source}</td>
                    <td className="px-2 py-1 text-text-secondary">{evt.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </motion.section>
  );

  if (embedded) {
    return panel;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 p-2 sm:p-4"
    >
      <button
        type="button"
        aria-label="Close system status modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
      />
      {panel}
    </motion.div>
  );
};

export default SystemStatusModal;
