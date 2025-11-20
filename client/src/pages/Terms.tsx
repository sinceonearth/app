"use client";

import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";
import { useEffect } from "react";

export default function Terms() {
  const [, navigate] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-24">
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
            <FileText className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-400">Last updated: November 19, 2025</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert max-w-none space-y-8"
        >
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Agreement to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using Since On Earth, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Use of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              Since On Earth provides a platform to track and visualize your travel history, connect with fellow travelers through Radr messaging, and coordinate meetups at destinations. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Provide accurate and complete information</li>
              <li>Keep your account credentials secure</li>
              <li>Use the service in compliance with all applicable laws</li>
              <li>Not misuse or disrupt the service</li>
              <li>Use Radr messaging and location features responsibly</li>
              <li>Respect other users' privacy and safety</li>
              <li>Not share inappropriate, harmful, or illegal content in messages or groups</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Radr Messaging & Location Features</h2>
            <p className="text-gray-300 leading-relaxed">
              Our Radr feature allows you to create location-based groups, share real-time location, and communicate with other travelers. By using Radr, you understand and agree that:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Location sharing is optional and controlled by you</li>
              <li>Messages are encrypted end-to-end for your privacy</li>
              <li>Group creators can manage members and delete groups</li>
              <li>Groups expire automatically after the set time period</li>
              <li>You are responsible for the content you share in messages</li>
              <li>We may remove or disable access to groups that violate our terms</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">User Accounts</h2>
            <p className="text-gray-300 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account. You accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Content Ownership</h2>
            <p className="text-gray-300 leading-relaxed">
              You retain ownership of content you submit. By using the service, you grant Since On Earth a license to store, display, and use your travel data to provide our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Service Availability</h2>
            <p className="text-gray-300 leading-relaxed">
              We aim to provide reliable service but do not guarantee uninterrupted access. Services may be modified or discontinued at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              Since On Earth is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Lucide Icons Usage</h2>
            <p className="text-gray-300 leading-relaxed">
              This app uses <strong>Lucide icons</strong> (https://lucide.dev) for visual elements such as buttons, flight cards, and status indicators. Lucide icons are MIT-licensed, free for commercial and personal use, and may be modified. Use of these icons in the app does not require additional licenses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update these terms periodically. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-green-400">Contact Information</h2>
            <p className="text-gray-300 leading-relaxed">
              For questions about these Terms of Service, contact us at <strong>support@sinceonearth.com</strong>.
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
