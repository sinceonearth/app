"use client";

import React from "react";
import {
  Icon,
  Award,
  Shield,
  Settings,
  AlignVerticalJustifyStart,
  UsersRound,
} from "lucide-react";
import { faceAlien } from "@lucide/lab";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Custom Alien icon
const AlienIcon = ({ stroke }: { stroke?: string }) => (
  <Icon
    iconNode={faceAlien}
    className="h-7 w-7"
    style={{ stroke: stroke || "#9ca3af", fill: "none" }}
  />
);

export function FooterNav() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  const menuItems = [
    { path: "/dashboard", icon: AlienIcon },
    { path: "/achievements", icon: Award },
    { path: "/radr_messages", icon: UsersRound },
    { path: "/travel", icon: AlignVerticalJustifyStart },
    ...(user?.is_admin ? [{ path: "/admin", icon: Shield }] : []),
    { path: "/account", icon: Settings },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50">
      <div className="flex justify-center items-center gap-4 px-6 py-4 bg-white/5 backdrop-blur-xl border-t border-white/10">
        {menuItems.map(({ path, icon: IconComponent }) => {
          const isActive =
            location === path || (path === "/dashboard" && location === "/");
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center justify-center p-2 relative"
              style={{ background: "transparent" }}
            >
              <IconComponent
                className="h-7 w-7"
                stroke={isActive ? "#22c55e" : "#9ca3af"}
              />
            </button>
          );
        })}
      </div>
    </footer>
  );
}
