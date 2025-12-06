// Admin login page for The Abel Experience dashboard
// Technical and tasteful aesthetic
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiEyeOff, FiCpu } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <main className="relative flex flex-col min-h-screen w-full overflow-hidden bg-[#0c0c0c] text-zinc-300 font-mono text-xs">
      
      {/* Top Bar */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60"
      >
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 tracking-wide">Admin</span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Connected
          </span>
        </div>
        <span className="text-zinc-500 tabular-nums">{formatTime(currentTime)}</span>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-sm">
          
          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="border border-zinc-800 bg-zinc-900/40"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/60 bg-zinc-900/60">
              <span className="text-zinc-400">Sign in</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-zinc-700" />
                <div className="w-2 h-2 rounded-full bg-zinc-700" />
                <div className="w-2 h-2 rounded-full bg-zinc-700" />
              </div>
            </div>

            {/* Form Content */}
            <div className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-zinc-500 text-[10px] uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm px-3 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-zinc-500 text-[10px] uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm px-3 py-2.5 pr-10 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
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
                      <div className="px-3 py-2 bg-red-950/30 border border-red-900/40 text-red-400 text-xs">
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ backgroundColor: "rgba(63, 63, 70, 0.6)" }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm tracking-wide hover:border-zinc-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="mt-4 pt-4 border-t border-zinc-800/60 text-center">
                <button
                  onClick={() => navigate("/register")}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
                >
                  Need an account? <span className="text-zinc-400">Register</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Footer Info */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex items-center justify-between text-[10px] text-zinc-600"
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
        className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/60 text-zinc-600"
      >
        <span>&copy; {new Date().getFullYear()} The Abel Experience</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/70" />
            Online
          </span>
        </div>
      </motion.footer>
    </main>
  );
};

export default LoginPage;

