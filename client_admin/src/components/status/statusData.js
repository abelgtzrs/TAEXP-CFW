// Simulated operations telemetry for the Operations Control Console (login screen) and the
// dashboard Security widget. Every value is generated from `statusTick`; nothing is measured.
export function buildStatusData(statusTick) {
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
}
