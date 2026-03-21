// Admin login page for The Abel Experience dashboard
// Technical and tasteful aesthetic
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiEyeOff, FiCpu } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import SystemStatusModal from "../components/status/SystemStatusModal";
import WaveGridBackground from "../components/background/WaveGridBackground";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const isDev = import.meta?.env?.MODE === "development";
  const [email, setEmail] = useState(isDev ? "" : "");
  const [password, setPassword] = useState(isDev ? "" : "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState("wave");
  const [waveConfig, setWaveConfig] = useState({
    gridSize: 32,
    waveHeight: 34,
    waveSpeed: 0.82,
    color: "#14b8a6",
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background text-text-main font-sans text-xs">
      {backgroundMode === "wave" ? (
        <WaveGridBackground
          gridSize={waveConfig.gridSize}
          waveHeight={waveConfig.waveHeight}
          waveSpeed={waveConfig.waveSpeed}
          color={waveConfig.color}
        />
      ) : (
        <motion.div
          animate={{ opacity: [0.82, 1, 0.82] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.28),transparent_40%),radial-gradient(circle_at_80%_75%,rgba(165,243,252,0.2),transparent_44%),#030712]"
        />
      )}

      {/* Top Bar */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 flex items-center justify-between border-b border-white/5 bg-surface/70 px-5 py-3 backdrop-blur-lg"
      >
        <div className="flex items-center gap-4">
          <span className="tracking-wide text-text-secondary">Administrator</span>
          <span className="text-text-tertiary">•</span>
          <span className="flex items-center gap-1.5 text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
            Connected
          </span>
        </div>
        <span className="tabular-nums text-text-secondary">{formatTime(currentTime)}</span>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-8">
        <div className={`w-full ${isStatusModalOpen ? "max-w-[1500px]" : "max-w-sm"}`}>
          {isStatusModalOpen ? (
            <SystemStatusModal
              open={isStatusModalOpen}
              onClose={() => setIsStatusModalOpen(false)}
              embedded
              backgroundMode={backgroundMode}
              onBackgroundModeChange={setBackgroundMode}
              waveConfig={waveConfig}
              onWaveConfigChange={setWaveConfig}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="widget-container relative rounded-2xl border border-white/10 bg-surface/55 shadow-[0_20px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/5" />
              <div className="pointer-events-none absolute inset-px rounded-[calc(1rem-1px)] bg-gradient-to-b from-white/[0.05] to-transparent" />
              <div className="pointer-events-none absolute left-4 right-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
              <div className="pointer-events-none absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
              <div className="pointer-events-none absolute -left-px top-16 h-14 w-px bg-gradient-to-b from-transparent via-tertiary/50 to-transparent" />
              <div className="pointer-events-none absolute -right-px bottom-16 h-14 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
              {/* Card Header */}
              <div className="relative flex items-center justify-between rounded-t-2xl border-b border-white/10 bg-background/55 px-4 py-2.5 backdrop-blur-md">
                <div>
                  <span className="text-text-secondary">Sign in</span>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Secure Access Node</p>
                </div>
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary/35" />
                  <div className="h-2 w-2 rounded-full bg-secondary/35" />
                  <div className="h-2 w-2 rounded-full bg-tertiary/35" />
                </div>
              </div>

              {/* Form Content */}
              <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-blue-900/5 px-3 py-2.5 text-sm text-text-main placeholder:text-text-tertiary shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-primary/25 focus:border-primary/35 focus:outline-none focus:ring-1 focus:ring-primary/25"
                      placeholder="example@taexp.com"
                      required
                      autoComplete="email"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-secondary">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-blue-900/5 px-3 py-2.5 pr-10 text-sm text-text-main placeholder:text-text-tertiary shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-primary/25 focus:border-primary/35 focus:outline-none focus:ring-1 focus:ring-primary/25"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-primary"
                      >
                        {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-lg border border-red-900/20 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                          {error}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-white/10 bg-gradient-to-r from-primary/25 to-secondary/20 py-2.5 text-sm tracking-wide text-text-main shadow-[0_12px_28px_rgba(0,0,0,0.3)] transition-all hover:from-primary/35 hover:to-secondary/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <FiCpu className="animate-spin" size={14} />
                        Signing in...
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </motion.button>
                </form>

                {/* Register Link */}
                <div className="mt-4 border-t border-white/10 pt-4 text-center">
                  <button
                    onClick={() => navigate("/register")}
                    className="rounded-lg px-2 py-1 text-xs text-text-secondary transition-all hover:bg-white/5 hover:text-text-main"
                  >
                    <span className="text-primary">Create an account</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex items-center justify-between px-1 text-[10px] text-text-tertiary"
          >
            <span>Encrypted connection</span>
            <span>v2.4</span>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 flex items-center justify-between border-t border-white/5 bg-surface/70 px-5 py-3 text-text-tertiary backdrop-blur-lg"
      >
        <span>&copy; {new Date().getFullYear()} TAEXP™ CFW v4.5</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsStatusModalOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-text-secondary transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-text-main"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-status-success/80" />
            {isStatusModalOpen ? "Back to Login" : "System Status"}
          </button>
        </div>
      </motion.footer>
    </main>
  );
};

export default LoginPage;
