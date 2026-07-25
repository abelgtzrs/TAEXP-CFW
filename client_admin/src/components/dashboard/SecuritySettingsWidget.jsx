// src/components/dashboard/SecuritySettingsWidget.jsx
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Lock, Fingerprint, ShieldAlert, ShieldQuestion } from "lucide-react";
import Widget from "../ui/Widget";
import StyledToggle from "../ui/StyledToggle";

const STORAGE_KEY = "tae.securitySettings.v1";

const DEFAULT_SETTINGS = [
  {
    key: "firewall",
    label: "Firewall",
    icon: ShieldCheck,
    enabled: true,
    onLabel: "Enabled",
    offLabel: "Disabled",
    description: "Blocks unauthorized inbound connections.",
  },
  {
    key: "encryption",
    label: "Encryption",
    icon: Lock,
    enabled: true,
    onLabel: "AES-256",
    offLabel: "Disabled",
    description: "Encrypts data at rest and in transit.",
  },
  {
    key: "auth",
    label: "Biometric Authentication",
    icon: Fingerprint,
    enabled: false,
    onLabel: "Active",
    offLabel: "Not Configured",
    description: "Requires biometric confirmation to sign in.",
  },
];

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    return DEFAULT_SETTINGS.map((setting) => ({
      ...setting,
      enabled: typeof saved[setting.key] === "boolean" ? saved[setting.key] : setting.enabled,
    }));
  } catch {
    return null;
  }
}

const SecuritySettingsWidget = () => {
  const [settings, setSettings] = useState(() => loadInitialState() || DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const toSave = Object.fromEntries(settings.map((s) => [s.key, s.enabled]));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore write failures (e.g. storage disabled/full)
    }
  }, [settings]);

  const toggleSetting = (key) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s)));
  };

  const enabledCount = useMemo(() => settings.filter((s) => s.enabled).length, [settings]);
  const total = settings.length;

  const status = useMemo(() => {
    if (enabledCount === total) return { label: "Secure", color: "text-green-400", Icon: ShieldCheck };
    if (enabledCount === 0) return { label: "Exposed", color: "text-red-400", Icon: ShieldAlert };
    return { label: "At Risk", color: "text-yellow-400", Icon: ShieldQuestion };
  }, [enabledCount, total]);

  const StatusIcon = status.Icon;

  return (
    <Widget
      title="Security Settings"
      padding="p-0"
      titleChildren={
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${status.color}`}>
          <StatusIcon size={14} />
          <span>{status.label}</span>
          <span className="text-text-secondary font-normal">
            ({enabledCount}/{total})
          </span>
        </div>
      }
    >
      <ul className="divide-y divide-gray-700/50">
        {settings.map((setting) => {
          const Icon = setting.icon;
          return (
            <li key={setting.key} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border ${
                    setting.enabled
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-gray-700/30 border-gray-700/50 text-text-secondary"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-main">{setting.label}</p>
                  <p className={`text-xs ${setting.enabled ? "text-text-secondary" : "text-yellow-500/80"}`}>
                    {setting.enabled ? setting.onLabel : setting.offLabel}
                  </p>
                  <p className="text-[11px] text-text-secondary/70 mt-0.5 truncate">{setting.description}</p>
                </div>
              </div>
              <StyledToggle enabled={setting.enabled} setEnabled={() => toggleSetting(setting.key)} />
            </li>
          );
        })}
      </ul>
    </Widget>
  );
};

export default SecuritySettingsWidget;
