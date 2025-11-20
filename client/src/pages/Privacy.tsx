"use client";

import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";
import { useEffect } from "react";

export default function Privacy() {
  const [, navigate] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-24" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top))' }}>
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full mb-4">
            <Shield className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: November 19, 2025</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert max-w-none space-y-8"
        >
          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              Welcome to Since On Earth. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our travel tracking application.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed">
              We may collect information that you provide directly, such as:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Account details (name, email, username, country)</li>
              <li>Travel information (flights, stays, destinations)</li>
              <li>App usage and preferences</li>
              <li>Location data (when you use Radr features)</li>
              <li>Messages and group communication (encrypted)</li>
              <li>Push notification tokens (for iOS notifications)</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>To provide and maintain our services</li>
              <li>To track and visualize your travel history</li>
              <li>To personalize and improve your app experience</li>
              <li>To communicate updates, features, and announcements</li>
              <li>To enable location-based features and group coordination</li>
              <li>To deliver push notifications for messages and group updates</li>
              <li>To facilitate encrypted messaging between group members</li>
            </ul>
          </section>

          {/* Location Data & Radr Features */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Location Data & Radr Features</h2>
            <p className="text-gray-300 leading-relaxed">
              When you use Radr features, we collect and process location data to enable group coordination and arrival notifications. This includes:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Real-time GPS coordinates (only when actively using Radr)</li>
              <li>Target destination coordinates for group meetups</li>
              <li>Arrival status when you reach a destination</li>
              <li>Location sharing is entirely optional and can be disabled anytime</li>
              <li>Location data is only shared with members of your Radr groups</li>
              <li>Location tracking stops when you leave a group or close the app</li>
            </ul>
          </section>

          {/* End-to-End Encryption */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">End-to-End Encryption</h2>
            <p className="text-gray-300 leading-relaxed">
              Your Radr messages are protected with end-to-end encryption to ensure privacy:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Client-side encryption:</strong> Messages are encrypted in your browser before being sent to our servers using AES-256-GCM encryption</li>
              <li><strong>Encrypted storage:</strong> Messages are stored encrypted in our database and cannot be read by our servers</li>
              <li><strong>Group encryption keys:</strong> Each Radr group has a unique encryption key shared only with group members</li>
              <li><strong>Key distribution:</strong> Encryption keys are securely distributed to group members through our servers, enabling authorized access</li>
              <li><strong>Decryption:</strong> Only group members with the correct encryption key can decrypt and read messages</li>
              <li><strong>Important note:</strong> While messages are encrypted end-to-end, encryption keys are stored on our servers to enable key distribution to group members. This means authorized administrators with database access could theoretically access encryption keys</li>
            </ul>
          </section>

          {/* Push Notifications */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Push Notifications</h2>
            <p className="text-gray-300 leading-relaxed">
              We use Apple Push Notification Service (APNs) to deliver notifications for:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>New Radr group invitations</li>
              <li>New messages in your Radr groups</li>
              <li>Member arrivals at destinations</li>
              <li>Travel achievements and milestones</li>
              <li>Trip completion notifications</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Push notification permissions are requested when you join a Radr group and can be disabled in your device settings. We store device push tokens to deliver notifications, which are managed through Apple's secure APNs infrastructure.
            </p>
          </section>

          {/* Lucide Icons Usage */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Use of Lucide Icons</h2>
            <p className="text-gray-300 leading-relaxed">
              This app uses <strong>Lucide icons</strong> (https://lucide.dev) for visual elements such as buttons, flight cards, and status indicators. Lucide icons are MIT-licensed, free for commercial and personal use, and may be modified. Using these icons in the app does not involve any additional licensing fees or restrictions.
            </p>
          </section>

          {/* Data Security */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Data Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement appropriate security measures to protect your personal information. Passwords are encrypted, and sensitive data is transmitted over secure connections. However, no system is completely immune to unauthorized access.
            </p>
          </section>

          {/* Your Rights */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Your Rights</h2>
            <p className="text-gray-300 leading-relaxed">
              You have the right to access, update, or delete your personal information. You can manage your data through your account settings or contact us at <strong>support@sinceonearth.com</strong> for assistance.
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy or data usage, please reach out via our contact page or email at <strong>support@sinceonearth.com</strong>.
            </p>
          </section>
        </motion.div>

        {/* Footer Badge */}
        <div className="flex justify-center mt-16">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-full">
            <span className="text-sm text-gray-400">Created by</span>
            <span className="text-sm font-semibold text-green-400">व्रज पटेल</span>
          </div>
        </div>
      </div>
    </div>
  );
}
