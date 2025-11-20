"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { z } from "zod";
import { UserIcon as UserIconComponent } from "@/components/UserIcon";
import {
  User as UserIcon,
  Mail,
  Key,
  LogOut,
  Shield,
  FileText,
  ExternalLink,
  Send,
  MessageSquare,
  MessageCircle,
  CheckCircle2,
  Plane,
  Globe,
  Map,
  Compass,
  Luggage,
  Camera,
  Mountain,
  Palmtree,
  Ship,
  Train,
} from "lucide-react";

const TRAVEL_ICONS = [
  { name: "plane", Icon: Plane },
  { name: "globe", Icon: Globe },
  { name: "map", Icon: Map },
  { name: "compass", Icon: Compass },
  { name: "luggage", Icon: Luggage },
  { name: "camera", Icon: Camera },
  { name: "mountain", Icon: Mountain },
  { name: "palmtree", Icon: Palmtree },
  { name: "ship", Icon: Ship },
  { name: "train", Icon: Train },
];
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

const countries = [
  "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "China",
  "Denmark", "Egypt", "Finland", "France", "Germany", "Greece", "Hungary",
  "Iceland", "India", "Indonesia", "Ireland", "Israel", "Italy", "Japan",
  "Kenya", "Luxembourg", "Malaysia", "Mexico", "Morocco", "Netherlands",
  "New Zealand", "Nigeria", "Norway", "Pakistan", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia",
  "Singapore", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland",
  "Thailand", "Turkey", "UAE", "UK", "USA", "Vietnam"
].sort();

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  country: z.string(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const contactFormSchema = z.object({
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
type ContactForm = z.infer<typeof contactFormSchema>;

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  admin_reply: string | null;
  replied_at: string | null;
  user_reply: string | null;
  user_replied_at: string | null;
  created_at: string;
}

export default function Account() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<"profile" | "password" | "support">("profile");
  const [replyingToMessage, setReplyingToMessage] = useState<string | null>(null);
  const [userReplyText, setUserReplyText] = useState<string>("");
  const [selectedIcon, setSelectedIcon] = useState<string>(user?.profile_icon || "plane");

  const { data: userMessages, refetch: refetchMessages } = useQuery<ContactMessage[]>({
    queryKey: ["/api/contact-messages"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contact-messages");
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: activeSection === "support",
  });

  // Forms
  const profileForm = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      country: user?.country || "Other",
    },
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileForm) => {
      const res = await apiRequest("PATCH", "/api/auth/profile", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile updated ✅",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      const res = await apiRequest("PATCH", "/api/auth/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password changed ✅",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Password change failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const sendSupportMessageMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user?.name || "User",
          email: user?.email || "",
          subject: data.subject,
          message: data.message,
        }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      contactForm.reset();
      refetchMessages();
      toast({
        title: "Message sent ✅",
        description: "Your message has been sent. We'll get back to you soon!",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/auth/account");
      if (!res.ok) throw new Error("Failed to delete account");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      logout();
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Failed to delete account",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const updateIconMutation = useMutation({
    mutationFn: async (icon: string) => {
      const res = await apiRequest("PATCH", "/api/auth/profile-icon", { profile_icon: icon });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update icon");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Icon updated ✅",
        description: "Your profile icon has been updated successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const userReplyMutation = useMutation({
    mutationFn: async ({ messageId, reply }: { messageId: string; reply: string }) => {
      const res = await apiRequest("PATCH", `/api/contact-messages/${messageId}/user-reply`, { reply });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      refetchMessages();
      toast({ title: "Reply sent ✅", description: "Your reply has been sent to the admin." });
      setReplyingToMessage(null);
      setUserReplyText("");
    },
  });

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "See you next time! 👋",
    });
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col relative px-4 md:px-14 pb-16 pt-1 overflow-x-hidden">
      <Header />

      <div className="w-full flex flex-col pt-24 pb-12">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#22c55e] drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] text-center mb-8"
        >
          Account Settings
        </motion.h1>

        {/* User Card */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-xl p-6 mb-8 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
              <UserIconComponent iconName={user?.profile_icon} className="h-10 w-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
              <p className="text-green-400">@{user?.username} · Alien #{user?.alien}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

{/* Tabs */}
<div className="w-full flex flex-wrap items-center justify-center gap-3 mb-4">
  <div className="flex flex-wrap justify-center gap-3 w-full">
    {["profile", "password", "support"].map((tab) => {
      const labels = { profile: "Profile", password: "Security", support: "Support" };
      const icons = { profile: UserIcon, password: Key, support: Mail };
      const Icon = icons[tab as keyof typeof icons];
      return (
        <button
          key={tab}
          onClick={() => setActiveSection(tab as any)}
          className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all ${
            activeSection === tab
              ? "bg-green-500 text-black"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Icon size={16} />
          {labels[tab as keyof typeof labels]}
        </button>
      );
    })}
  </div>
</div>

         <div className="border-b border-gray-600/40 my-6" />

        {/* Profile Section */}
        {activeSection === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 w-full max-w-3xl mx-auto"
          >
            <div className="bg-neutral-900 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-green-400 mb-4">Edit Profile</h3>
              <form
                onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Full Name</label>
                  <Input {...profileForm.register("name")} className="bg-black border-gray-700 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Username</label>
                  <Input {...profileForm.register("username")} className="bg-black border-gray-700 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email</label>
                  <Input {...profileForm.register("email")} type="email" className="bg-black border-gray-700 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Country</label>
                  <select {...profileForm.register("country")} className="w-full h-10 bg-black border border-gray-700 text-white rounded-md px-3">
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Profile Icon</label>
                  <div className="flex flex-wrap justify-center gap-3 mb-4 p-4 bg-black/40 rounded-lg border border-gray-700">
                    {TRAVEL_ICONS.map(({ name, Icon }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setSelectedIcon(name)}
                        className="transition-all duration-200 hover:scale-110 bg-transparent"
                      >
                        <Icon 
                          className={`w-8 h-8 transition-all duration-200 ${
                            selectedIcon === name ? 'text-white' : 'text-green-500/50'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 py-2 bg-green-500 hover:bg-green-600 border-green-600 text-black font-semibold rounded-full">
                    Save Changes
                  </Button>
                  {selectedIcon !== user?.profile_icon && (
                    <Button
                      type="button"
                      onClick={() => updateIconMutation.mutate(selectedIcon)}
                      disabled={updateIconMutation.isPending}
                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 border-green-600 text-black font-semibold rounded-full"
                    >
                      {updateIconMutation.isPending ? "Saving..." : "Save Icon"}
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Logout Section */}
            <div className="bg-neutral-900 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-green-400 mb-4">Session</h3>
              <p className="text-gray-300 mb-4">
                Log out of your account on this device.
              </p>
              <Button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full border-0 flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Log Out
              </Button>
            </div>
          </motion.div>
        )}

        {/* Password Section */}
        {activeSection === "password" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 w-full max-w-3xl mx-auto"
          >
            <div className="bg-neutral-900 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-green-400 mb-4">Change Password</h3>
              <form
                onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Current Password</label>
                  <Input {...passwordForm.register("currentPassword")} type="password" className="bg-black border-gray-700 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">New Password</label>
                  <Input {...passwordForm.register("newPassword")} type="password" className="bg-black border-gray-700 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Confirm New Password</label>
                  <Input {...passwordForm.register("confirmPassword")} type="password" className="bg-black border-gray-700 text-white" />
                </div>
                <Button type="submit" className="w-full py-2 bg-green-500 hover:bg-green-600  border-green-600 text-black font-semibold rounded-full">
                  Change Password
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        
{/* Support Section */}
{activeSection === "support" && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6 w-full max-w-4xl mx-auto"
  >
    {/* Previous Messages */}
    {userMessages && userMessages.length > 0 && (
      <div className="bg-neutral-900 rounded-xl p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Your Messages
        </h3>
        <div className={userMessages.length > 1 ? "space-y-2" : "space-y-4"}>
          {userMessages.map((msg) => (
            <div
              key={msg.id}
              className={`bg-black rounded-lg border border-gray-700 ${userMessages.length > 1 ? "p-3" : "p-4"}`}
            >
              <div className={userMessages.length > 1 ? "flex justify-between items-start mb-1" : "flex justify-between items-start mb-2"}>
                <div className="flex-1">
                  <h4 className={`font-semibold text-white ${userMessages.length > 1 ? "text-sm" : ""}`}>{msg.subject}</h4>
                  <p className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleDateString()} {userMessages.length > 1 ? "" : `at ${new Date(msg.created_at).toLocaleTimeString()}`}
                  </p>
                </div>
                {msg.admin_reply && (
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full flex-shrink-0">
                    Replied
                  </span>
                )}
              </div>
              <p className={`text-gray-300 whitespace-pre-wrap ${userMessages.length > 1 ? "text-xs mb-2" : "text-sm mb-3"}`}>{msg.message}</p>
              
              {msg.admin_reply && (
                <div className={`bg-green-900/20 border border-green-700/50 rounded-lg ${userMessages.length > 1 ? "mt-2 p-2" : "mt-3 p-3"}`}>
                  <div className={userMessages.length > 1 ? "flex items-center gap-2 mb-1" : "flex items-center gap-2 mb-2"}>
                    <CheckCircle2 className={userMessages.length > 1 ? "h-3 w-3 text-green-400" : "h-4 w-4 text-green-400"} />
                    <span className="text-xs text-green-400 font-semibold">Admin Reply</span>
                    <span className="text-xs text-gray-400">
                      {msg.replied_at && new Date(msg.replied_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-gray-300 whitespace-pre-wrap ${userMessages.length > 1 ? "text-xs" : "text-sm"}`}>{msg.admin_reply}</p>
                </div>
              )}

              {msg.user_reply && (
                <div className={`bg-blue-900/20 border border-blue-700/50 rounded-lg ${userMessages.length > 1 ? "mt-2 p-2" : "mt-3 p-3"}`}>
                  <div className={userMessages.length > 1 ? "flex items-center gap-2 mb-1" : "flex items-center gap-2 mb-2"}>
                    <MessageCircle className={userMessages.length > 1 ? "h-3 w-3 text-blue-400" : "h-4 w-4 text-blue-400"} />
                    <span className="text-xs text-blue-400 font-semibold">Your Reply</span>
                    <span className="text-xs text-gray-400">
                      {msg.user_replied_at && new Date(msg.user_replied_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-gray-300 whitespace-pre-wrap ${userMessages.length > 1 ? "text-xs" : "text-sm"}`}>{msg.user_reply}</p>
                </div>
              )}

              {msg.admin_reply && !msg.user_reply && (
                <div className={userMessages.length > 1 ? "mt-2" : "mt-3"}>
                  {replyingToMessage === msg.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={userReplyText}
                        onChange={(e) => setUserReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className={`bg-black border-gray-700 text-white ${userMessages.length > 1 ? "min-h-[80px] text-sm" : "min-h-[100px]"}`}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => userReplyMutation.mutate({ messageId: msg.id, reply: userReplyText })}
                          disabled={!userReplyText.trim() || userReplyMutation.isPending}
                          className={`flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full ${userMessages.length > 1 ? "text-xs py-1.5" : ""}`}
                        >
                          {userReplyMutation.isPending ? "Sending..." : "Send Reply"}
                        </Button>
                        <Button
                          onClick={() => {
                            setReplyingToMessage(null);
                            setUserReplyText("");
                          }}
                          variant="outline"
                          className={`flex-1 border-gray-700 text-white hover:bg-white/5 rounded-full ${userMessages.length > 1 ? "text-xs py-1.5" : ""}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setReplyingToMessage(msg.id)}
                      variant="outline"
                      className={`w-full border-gray-700 text-white hover:bg-white/5 rounded-full ${userMessages.length > 1 ? "text-xs py-1.5" : ""}`}
                    >
                      <MessageCircle className={userMessages.length > 1 ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"} />
                      Reply to Admin
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Contact Support Form */}
    <div className="bg-neutral-900 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold text-green-400 mb-4">Send us a message</h3>
      <form
        onSubmit={contactForm.handleSubmit((data) => sendSupportMessageMutation.mutate(data))}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm text-gray-300 mb-1">Subject</label>
          <Input
            {...contactForm.register("subject")}
            placeholder="What can we help you with?"
            className="bg-black border-gray-700 text-white"
          />
          {contactForm.formState.errors.subject && (
            <p className="text-red-400 text-xs mt-1">{contactForm.formState.errors.subject.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Message</label>
          <textarea
            {...contactForm.register("message")}
            placeholder="Please describe your issue or question..."
            className="w-full h-32 bg-black border border-gray-700 text-white rounded-md px-3 py-2 resize-none focus:border-green-500 focus:outline-none"
          />
          {contactForm.formState.errors.message && (
            <p className="text-red-400 text-xs mt-1">{contactForm.formState.errors.message.message}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={sendSupportMessageMutation.isPending}
          className="w-full py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-full border-0"
        >
          <Send className="w-4 h-4 mr-2 inline" />
          {sendSupportMessageMutation.isPending ? "Sending..." : "Send Message"}
        </Button>
      </form>
      <p className="text-sm text-gray-500 mt-4 text-center">
        Or email us directly at{" "}
        <a href="mailto:support@sinceonearth.com" className="text-green-400 hover:underline">
          support@sinceonearth.com
        </a>
      </p>
    </div>

    {/* Quick Links / Resources */}
    <div className="bg-neutral-900 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold text-green-400 mb-4">Resources</h3>
      <div className="space-y-3">
        <button
          onClick={() => navigate("/privacy")}
          className="w-full flex items-center justify-between p-3 bg-black hover:bg-white/5 border border-gray-700 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-green-400" />
            <span className="text-white">Privacy Policy</span>
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400" />
        </button>

        <button
          onClick={() => navigate("/terms")}
          className="w-full flex items-center justify-between p-3 bg-black hover:bg-white/5 border border-gray-700 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-green-400" />
            <span className="text-white">Terms of Service</span>
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>

    {/* Delete Account Section - LAST */}
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h3>
      <p className="text-gray-300 mb-4">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>
      <Button
        onClick={() => {
          if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            deleteAccountMutation.mutate();
          }
        }}
        disabled={deleteAccountMutation.isPending}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full border-0"
      >
        {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
      </Button>
    </div>
  </motion.div>
)}



        </div>
      </div>
  );
}
