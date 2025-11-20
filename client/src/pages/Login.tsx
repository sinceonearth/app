"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, createLucideIcon, Globe, Plane, Trophy, BarChart3 } from "lucide-react";
import { faceAlien } from "@lucide/lab";
import { z } from "zod";

import { loginUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, setAuthToken } from "@/lib/queryClient";

const FaceAlien = createLucideIcon("FaceAlien", faceAlien);
type LoginUser = z.infer<typeof loginUserSchema>;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: { email: "", password: "" },
  });

const loginMutation = useMutation({
  mutationFn: async (data: LoginUser) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      throw new Error(result.message || "Login failed");
    }
    return res.json();
  },
  onSuccess: async (data) => {
    if (data.token) setAuthToken(data.token); // save token globally
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    toast({
      title: "Welcome back 👽",
      description: "Successfully signed in to SinceOnEarth!",
    });

    // Redirect to dashboard instead of root
    setLocation("/dashboard"); 
  },
  onError: (err: any) => {
    const msg = err?.message || "Invalid email or password";
    setError(msg);
    toast({
      title: "Login failed 🚫",
      description: msg,
      variant: "destructive",
    });
  },
});


  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Branding & Effects (Desktop Only) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        >

          {/* Content */}
          <div className="relative z-10 max-w-lg">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative mb-12 inline-block"
            >
              <FaceAlien className="h-28 w-28 relative z-10 drop-shadow-2xl" style={{ color: '#22c55e' }} />
            </motion.div>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg text-gray-300 mb-12 leading-relaxed"
            >
              Continue tracking your adventures across the globe and watch your travel story unfold in real-time.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-5"
            >
              {[
                { icon: Globe, text: "Interactive 3D Globe Visualization" },
                { icon: Plane, text: "Track Flights & Accommodations" },
                { icon: Trophy, text: "Collect Country Stamps & Achievements" },
                { icon: BarChart3, text: "Beautiful Travel Statistics" },
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-4 group"
                  >
                    <IconComponent className="w-6 h-6 text-green-400 group-hover:text-green-300 transition-colors" />
                    <span className="text-gray-200 group-hover:text-white transition-colors">
                      {item.text}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="w-full lg:w-1/2 min-h-screen flex items-center justify-center px-4 lg:p-12"
        >
          <div className="w-full max-w-md space-y-6">
            {/* Mobile Logo */}
            <div className="flex flex-col items-center mb-4 lg:hidden">
              <FaceAlien className="h-16 w-16 drop-shadow-lg" style={{ color: '#22c55e' }} />
            </div>

            {/* Headings */}
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                Welcome Back
              </h1>
              <p className="text-white/90">
                Log in to explore your journeys 🌍
              </p>
            </div>

            {/* Login Form */}
            <form
              onSubmit={form.handleSubmit((data) =>
                loginMutation.mutate({
                  email: data.email.trim(),
                  password: data.password,
                })
              )}
              className="space-y-4"
            >
              {/* Email or Username */}
              <Input
                id="email"
                type="text"
                placeholder="Email or Username"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full h-14 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60 border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}

              {/* Password */}
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoCapitalize="none"
                  className="w-full h-14 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60 border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 pr-12"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-transparent border-0 p-0"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-2 rounded">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-14 bg-white hover:bg-gray-100 text-green-600 border-2 border-green-500 font-semibold text-base rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            {/* Register link */}
            <div className="text-center text-sm text-gray-300">
              Don't have an account?{" "}
              <Link href="/register" className="text-green-400 font-semibold hover:text-green-300 hover:underline">
                Sign up
              </Link>
            </div>

            {/* Created by footer */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-green-500/10 backdrop-blur-sm border border-green-500/20 px-6 py-3 rounded-full">
                <span className="text-sm text-gray-300">Created by</span>
                <span className="text-sm font-semibold text-green-400">व्रज पटेल</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
