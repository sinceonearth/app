"use client";

import { Header } from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useCallback } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Plus, Send, MapPinned, Trash2, MapPin, Clock, Users as UsersIcon, Target, Navigation, ArrowLeft, UsersRound } from "lucide-react";
import { UserIcon } from "@/components/UserIcon";
import * as E2E from "@/services/e2e-encryption";

interface User {
  id: string;
  username: string;
  name: string;
  alien: string;
  profile_icon: string | null;
  profile_color: string | null;
}

interface NearbyUser {
  userId: string;
  username: string;
  lat: number;
  lng: number;
  distance: number;
  lastSeen: number;
  profile_icon?: string;
  profile_color?: string;
}

interface RadrGroup {
  id: string;
  target_name: string;
  target_lat: number;
  target_lng: number;
  target_radius_km: number;
  expires_at: string;
  created_at: string;
  has_arrived: boolean;
  arrived_at?: string;
  member_count: number;
  arrived_count: number;
  is_creator: boolean;
  members?: Array<{
    user_id: string;
    username: string;
    name: string;
    has_arrived: boolean;
    profile_icon: string | null;
    profile_color: string | null;
  }>;
}

interface RadrMessage {
  id: string;
  group_id: string;
  user_id: string;
  type: string;
  content: string;
  metadata: any;
  created_at: string;
  username: string;
  name?: string;
}

const RadrMessages = () => {
  const { token, user } = useAuth();
  
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [radrGroups, setRadrGroups] = useState<RadrGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupMessages, setGroupMessages] = useState<RadrMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [createGroupData, setCreateGroupData] = useState({
    targetName: '',
    targetLat: 0,
    targetLng: 0,
    targetRadiusKm: 10,
    expiresInHours: 24,
    inviteUsernames: [] as string[],
  });
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [addMembersUsernames, setAddMembersUsernames] = useState<string[]>([]);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [showAddMemberDropdown, setShowAddMemberDropdown] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const useCurrentLocation = async () => {
    setDetectingLocation(true);
    try {
      let latitude: number;
      let longitude: number;

      try {
        const position = await Geolocation.getCurrentPosition();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (capacitorError) {
        if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser');
          setDetectingLocation(false);
          return;
        }
        
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      setCreateGroupData({
        ...createGroupData,
        targetLat: latitude,
        targetLng: longitude
      });
    } catch (err: any) {
      console.error("Geolocation error:", err);
      alert('Unable to detect your location. Please enter coordinates manually.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const detectLocation = async () => {
    try {
      let latitude: number;
      let longitude: number;

      try {
        const position = await Geolocation.getCurrentPosition();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (capacitorError) {
        if (!navigator.geolocation) {
          return;
        }
        
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      setLocation({ lat: latitude, lng: longitude });
      
      if (token) {
        await apiRequest("POST", "/api/radr/update", { lat: latitude, lng: longitude }, token);
      }
    } catch (err: any) {
      console.error("Geolocation error:", err);
    }
  };

  const fetchAllUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiRequest("GET", "/api/users/search", null, token);
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, [token]);

  const fetchNearbyUsers = useCallback(async () => {
    if (!location || !token) return;
    
    try {
      const res = await apiRequest(
        "GET",
        `/api/radr/nearby?lat=${location.lat}&lng=${location.lng}`,
        null,
        token
      );
      
      if (res.ok) {
        const data = await res.json();
        setNearbyUsers(data.nearby || []);
      }
    } catch (err) {
      console.error("Failed to fetch nearby users:", err);
    }
  }, [location, token]);

  const fetchRadrGroups = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await apiRequest("GET", "/api/radr/groups", null, token);
      
      if (res.ok) {
        const data = await res.json();
        const groups = data.groups || [];
        
        for (const group of groups) {
          if (group.encryption_key) {
            await E2E.importGroupKey(group.id, group.encryption_key);
          }
        }
        
        setRadrGroups(groups);
      }
    } catch (err) {
      console.error("Failed to fetch radr groups:", err);
    }
  }, [token]);

  const checkArrival = useCallback(async (groupId: string) => {
    if (!location || !token) return;
    
    try {
      const res = await apiRequest(
        "POST",
        `/api/radr/groups/${groupId}/check-arrival`,
        { lat: location.lat, lng: location.lng },
        token
      );
      
      if (res.ok) {
        const data = await res.json();
        if (data.arrived) {
          await fetchRadrGroups();
          await fetchGroupMessages(groupId);
        }
      }
    } catch (err) {
      console.error("Failed to check arrival:", err);
    }
  }, [location, token, fetchRadrGroups]);

  const fetchGroupMessages = async (groupId: string) => {
    if (!token) return;
    
    try {
      const res = await apiRequest("GET", `/api/radr/groups/${groupId}/messages`, null, token);
      
      if (res.ok) {
        const data = await res.json();
        const messages = data.messages || [];
        
        const decryptedMessages = await Promise.all(
          messages.map(async (msg: RadrMessage) => {
            if (msg.type === 'text') {
              try {
                const decryptedContent = await E2E.decryptMessage(groupId, msg.content);
                return { ...msg, content: decryptedContent };
              } catch (err) {
                console.error('Decryption failed for message:', err);
                return { ...msg, content: '[Decryption failed]' };
              }
            }
            return msg;
          })
        );
        
        setGroupMessages(decryptedMessages);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!selectedGroup || !token || !newMessage.trim()) return;
    
    try {
      const encryptedContent = await E2E.encryptMessage(selectedGroup, newMessage);
      
      const res = await apiRequest(
        "POST",
        `/api/radr/groups/${selectedGroup}/messages`,
        { content: encryptedContent },
        token
      );
      
      if (res.ok) {
        setNewMessage('');
        await fetchGroupMessages(selectedGroup);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!token || !confirm('Are you sure you want to delete this group?')) return;
    
    try {
      const res = await apiRequest("DELETE", `/api/radr/groups/${groupId}`, null, token);
      
      if (res.ok) {
        await fetchRadrGroups();
        if (selectedGroup === groupId) {
          setSelectedGroup(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete group:", err);
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!token || !confirm('Are you sure you want to leave this group?')) return;
    
    try {
      const res = await apiRequest("POST", `/api/radr/groups/${groupId}/leave`, null, token);
      
      if (res.ok) {
        await fetchRadrGroups();
        if (selectedGroup === groupId) {
          setSelectedGroup(null);
        }
      }
    } catch (err) {
      console.error("Failed to leave group:", err);
    }
  };

  const removeMember = async (groupId: string, userId: string) => {
    if (!token || !confirm('Remove this member from the group?')) return;
    
    try {
      const res = await apiRequest("POST", `/api/radr/groups/${groupId}/remove-member`, { userId }, token);
      
      if (res.ok) {
        await fetchRadrGroups();
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const addMembers = async (groupId: string) => {
    if (!token || addMembersUsernames.length === 0) return;
    
    try {
      const res = await apiRequest("POST", `/api/radr/groups/${groupId}/add-members`, { usernames: addMembersUsernames }, token);
      
      if (res.ok) {
        setAddMembersUsernames([]);
        setAddMemberSearch('');
        await fetchRadrGroups();
      }
    } catch (err) {
      console.error("Failed to add members:", err);
    }
  };

  const createGroup = async () => {
    if (!token || !location) return;
    
    try {
      const encryptionKey = await E2E.generateGroupKey('temp-id');
      
      const groupData = {
        ...createGroupData,
        targetLat: location.lat,
        targetLng: location.lng,
        encryptionKey,
      };

      const res = await apiRequest("POST", "/api/radr/groups", groupData, token);
      
      if (res.ok) {
        const newGroup = await res.json();
        
        await E2E.importGroupKey(newGroup.id, encryptionKey);
        
        setShowCreateGroup(false);
        setCreateGroupData({
          targetName: '',
          targetLat: 0,
          targetLng: 0,
          targetRadiusKm: 10,
          expiresInHours: 24,
          inviteUsernames: [],
        });
        await fetchRadrGroups();
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchAllUsers();
  }, [token, fetchAllUsers]);

  useEffect(() => {
    if (!location || !token) return;
    fetchNearbyUsers();
  }, [location, token, fetchNearbyUsers]);

  useEffect(() => {
    if (!token) return;
    fetchRadrGroups();
    const interval = setInterval(fetchRadrGroups, 30000);
    return () => clearInterval(interval);
  }, [token, fetchRadrGroups]);

  useEffect(() => {
    if (!selectedGroup || !token) return;
    fetchGroupMessages(selectedGroup);
    const interval = setInterval(() => fetchGroupMessages(selectedGroup), 5000);
    return () => clearInterval(interval);
  }, [selectedGroup, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages]);

  useEffect(() => {
    if (!location || !token) return;
    
    radrGroups.forEach((group) => {
      if (!group.has_arrived) {
        checkArrival(group.id);
      }
    });
  }, [location, radrGroups, token, checkArrival]);

  return (
    <>
      {!selectedGroup && <Header />}
      <div className={`relative min-h-screen w-full bg-black text-white ${!selectedGroup ? 'pt-24' : 'pt-4'} pb-24 flex flex-col items-center px-4`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-[#22c55e]/10 blur-[120px] rounded-full pointer-events-none" />

        {!selectedGroup && (
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#22c55e] drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] text-center mb-10"
          >
            Groups
          </motion.h1>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl space-y-6">
          {!selectedGroup ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">My Groups</h2>
                <button
                  onClick={() => setShowCreateGroup(!showCreateGroup)}
                  className="px-6 py-3 bg-[#22c55e] hover:bg-[#1ea54e] text-black rounded-full flex items-center gap-2 transition-all shadow-lg shadow-green-500/30 font-semibold"
                >
                  <Plus size={20} />
                  Create Group
                </button>
              </div>

              {showCreateGroup && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-neutral-900/80 to-neutral-900/50 backdrop-blur-xl border border-green-500/20 rounded-2xl p-8 mb-6 shadow-2xl shadow-green-500/5"
                >
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <Target className="text-green-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Create Location Group</h3>
                      <p className="text-sm text-gray-400">Set a meetup point and invite travelers</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                          <MapPin size={16} className="text-green-400" />
                          Location Name
                        </label>
                        <input
                          type="text"
                          value={createGroupData.targetName}
                          onChange={(e) => setCreateGroupData({ ...createGroupData, targetName: e.target.value })}
                          placeholder="e.g., Tokyo Shibuya Crossing"
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                            <Target size={16} className="text-green-400" />
                            Target Coordinates
                          </label>
                          <button
                            type="button"
                            onClick={useCurrentLocation}
                            disabled={detectingLocation}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium rounded-full transition-all disabled:opacity-50"
                          >
                            <Navigation size={14} className={detectingLocation ? 'animate-pulse' : ''} />
                            {detectingLocation ? 'Detecting...' : 'Use Current Location'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            step="any"
                            value={createGroupData.targetLat}
                            onChange={(e) => setCreateGroupData({ ...createGroupData, targetLat: Number(e.target.value) })}
                            placeholder="Latitude"
                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                          />
                          <input
                            type="number"
                            step="any"
                            value={createGroupData.targetLng}
                            onChange={(e) => setCreateGroupData({ ...createGroupData, targetLng: Number(e.target.value) })}
                            placeholder="Longitude"
                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                          <Target size={16} className="text-green-400" />
                          Detection Radius (km)
                        </label>
                        <input
                          type="number"
                          value={createGroupData.targetRadiusKm}
                          onChange={(e) => setCreateGroupData({ ...createGroupData, targetRadiusKm: Number(e.target.value) })}
                          placeholder="10"
                          min="0.1"
                          step="0.5"
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                          <Clock size={16} className="text-green-400" />
                          Expires In (hours)
                        </label>
                        <input
                          type="number"
                          value={createGroupData.expiresInHours}
                          onChange={(e) => setCreateGroupData({ ...createGroupData, expiresInHours: Number(e.target.value) })}
                          placeholder="24"
                          min="1"
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-5 border border-white/5">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                        <UsersIcon size={16} className="text-green-400" />
                        Invite Travelers
                      </label>
                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Search by name, username, or alien number..."
                          value={userSearchQuery}
                          onChange={(e) => {
                            setUserSearchQuery(e.target.value);
                            setShowUserDropdown(e.target.value.length > 0);
                          }}
                          onFocus={() => setShowUserDropdown(userSearchQuery.length > 0)}
                          className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                        />
                        
                        {showUserDropdown && userSearchQuery && (
                          <div className="absolute z-50 w-full mt-2 bg-neutral-900 border border-green-500/20 rounded-xl max-h-72 overflow-y-auto shadow-2xl shadow-green-500/10">
                            {allUsers
                              .filter((user) => {
                                const query = userSearchQuery.toLowerCase();
                                return (
                                  user.name.toLowerCase().includes(query) ||
                                  user.username.toLowerCase().includes(query) ||
                                  user.alien.toLowerCase().includes(query)
                                );
                              })
                              .filter((user) => !createGroupData.inviteUsernames.includes(user.username))
                              .slice(0, 10)
                              .map((user) => (
                                <button
                                  key={user.id}
                                  onClick={() => {
                                    setCreateGroupData({
                                      ...createGroupData,
                                      inviteUsernames: [...createGroupData.inviteUsernames, user.username]
                                    });
                                    setUserSearchQuery('');
                                    setShowUserDropdown(false);
                                  }}
                                  className="w-full flex items-center gap-3 p-4 hover:bg-green-500/5 transition-all text-left border-b border-white/5 last:border-0"
                                >
                                  <UserIcon iconName={user.profile_icon} color={user.profile_color || undefined} className="w-8 h-8" />
                                  <div className="flex-1">
                                    <div className="font-semibold text-white">{user.name}</div>
                                    <div className="text-sm text-gray-400">@{user.username} · {user.alien}</div>
                                  </div>
                                </button>
                              ))}
                            {allUsers.filter((user) => {
                              const query = userSearchQuery.toLowerCase();
                              return (
                                user.name.toLowerCase().includes(query) ||
                                user.username.toLowerCase().includes(query) ||
                                user.alien.toLowerCase().includes(query)
                              );
                            }).length === 0 && (
                              <div className="p-8 text-center text-gray-500">
                                <UsersIcon className="mx-auto mb-2 opacity-50" size={32} />
                                <p className="text-sm">No users found</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {createGroupData.inviteUsernames.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {createGroupData.inviteUsernames.map((username) => (
                            <div key={username} className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30 rounded-full text-sm hover:from-green-500/25 hover:to-green-500/15 transition-all">
                              <span className="text-green-300 font-medium">@{username}</span>
                              <button
                                onClick={() => {
                                  setCreateGroupData({
                                    ...createGroupData,
                                    inviteUsernames: createGroupData.inviteUsernames.filter(u => u !== username)
                                  });
                                }}
                                className="w-5 h-5 flex items-center justify-center rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 transition-all"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {nearbyUsers.length > 0 && (
                        <>
                          <label className="block text-sm text-gray-400 mb-2 mt-4">Or select from nearby travelers</label>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {nearbyUsers.map((user) => (
                              <label key={user.userId} className="flex items-center gap-3 p-2 bg-black/40 rounded-lg cursor-pointer hover:bg-black/60">
                                <input
                                  type="checkbox"
                                  checked={createGroupData.inviteUsernames.includes(user.username)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setCreateGroupData({
                                        ...createGroupData,
                                        inviteUsernames: [...createGroupData.inviteUsernames, user.username]
                                      });
                                    } else {
                                      setCreateGroupData({
                                        ...createGroupData,
                                        inviteUsernames: createGroupData.inviteUsernames.filter(u => u !== user.username)
                                      });
                                    }
                                  }}
                                  className="w-4 h-4"
                                />
                                <UserIcon iconName={user.profile_icon} color={user.profile_color} className="w-8 h-8" />
                                <div className="flex-1">
                                  <p className="text-white text-sm">{user.username}</p>
                                  <p className="text-xs text-gray-400">{user.distance.toFixed(1)} km away</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4 mt-6 border-t border-white/10">
                      <button
                        onClick={createGroup}
                        disabled={!createGroupData.targetName || !createGroupData.targetLat || !createGroupData.targetLng}
                        className="flex-1 px-6 py-3.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-full shadow-lg shadow-green-500/20 disabled:shadow-none transition-all"
                      >
                        Create Group
                      </button>
                      <button
                        onClick={() => setShowCreateGroup(false)}
                        className="px-6 py-3.5 bg-neutral-800/50 hover:bg-neutral-800 text-white font-medium rounded-full border border-white/10 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-4 overflow-visible">
                {radrGroups.map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedGroup(group.id)}
                    className="group relative bg-gradient-to-br from-neutral-900/80 to-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5 pr-3 cursor-pointer hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all"
                  >
                    {group.is_creator && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGroup(group.id);
                        }}
                        className="absolute top-4 right-4 z-50 p-2.5 bg-black/60 hover:bg-black/80 text-red-400 hover:text-red-300 rounded-full transition-all"
                        title="Delete group"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    )}
                    
                    <div className="flex items-center gap-3 pr-12">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                        <MapPinned className="text-green-400" size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors truncate flex-1">
                            {group.target_name}
                          </h3>
                          {group.has_arrived ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-500/20 border border-gray-500/30 text-gray-400 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <UsersIcon size={13} className="text-gray-500 flex-shrink-0" />
                            <span className="text-gray-400">
                              <span className="text-white font-semibold">{group.arrived_count}</span>/{group.member_count}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-gray-500 flex-shrink-0" />
                            <span className="text-gray-400">
                              {Math.round((new Date(group.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))}h
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {radrGroups.length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/5 to-green-600/5 border border-green-500/10 flex items-center justify-center">
                      <UsersRound className="text-green-500/30" size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-300 mb-2">No groups yet</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Create your first location group to start coordinating with fellow travelers!
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {(() => {
                const currentGroup = radrGroups.find(g => g.id === selectedGroup);
                return currentGroup ? (
                  <div className="fixed inset-0 bg-black flex flex-col" style={{paddingBottom: '80px'}}>
                    {/* Header */}
                    <div className="flex-shrink-0 border-b border-white/10 bg-black/95 backdrop-blur-xl">
                      <div className="flex items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => setSelectedGroup(null)}
                            className="p-2.5 bg-black/60 hover:bg-black/80 text-green-400 hover:text-green-300 rounded-full transition-all flex-shrink-0"
                            title="Back to groups"
                          >
                            <ArrowLeft size={20} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-white flex items-center gap-2 truncate">
                              <MapPinned className="text-green-400 flex-shrink-0" size={18} />
                              <span className="truncate">{currentGroup.target_name}</span>
                            </h3>
                            <p className="text-xs text-gray-400">
                              {currentGroup.arrived_count}/{currentGroup.member_count} arrived
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setShowMembersModal(true)}
                            className="p-2.5 bg-black/60 hover:bg-black/80 text-green-400 hover:text-green-300 rounded-full transition-all"
                            title="View members"
                          >
                            <UsersIcon size={20} />
                          </button>
                          {currentGroup.is_creator ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteGroup(currentGroup.id);
                              }}
                              className="p-2.5 bg-black/60 hover:bg-black/80 text-red-400 hover:text-red-300 rounded-full transition-all"
                              title="Delete group"
                            >
                              <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                leaveGroup(currentGroup.id);
                              }}
                              className="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-orange-400 hover:text-orange-300 rounded-full transition-all text-xs font-medium"
                              title="Leave group"
                            >
                              Leave
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* End-to-End Encryption Badge */}
                    <div className="px-4 pt-3 pb-2 border-b border-white/5">
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>End-to-End Encrypted</span>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                      {groupMessages.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/5 flex items-center justify-center">
                            <MessageCircle className="opacity-30" size={40} />
                          </div>
                          <p className="text-lg font-medium text-gray-300">No messages yet</p>
                          <p className="text-sm mt-2 max-w-md mx-auto">
                            {currentGroup.has_arrived 
                              ? 'Be the first to say hello! Start the conversation.' 
                              : `Chat will unlock when members arrive at ${currentGroup.target_name}`}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-w-4xl mx-auto">
                          {groupMessages.map((msg) => (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              {msg.type === 'arrival' ? (
                                <div className="flex items-center justify-center my-4">
                                  <div className="px-6 py-3 bg-gradient-to-r from-green-500/20 via-green-500/30 to-green-500/20 border border-green-500/40 rounded-full shadow-lg shadow-green-500/10">
                                    <p className="text-green-300 text-sm font-semibold">
                                      {msg.content}
                                    </p>
                                  </div>
                                </div>
                              ) : msg.type === 'leave' ? (
                                <div className="flex items-center justify-center my-4">
                                  <div className="px-6 py-3 bg-gradient-to-r from-orange-500/20 via-orange-500/30 to-orange-500/20 border border-orange-500/40 rounded-full shadow-lg shadow-orange-500/10">
                                    <p className="text-orange-300 text-sm font-semibold">
                                      {msg.content}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className={`flex flex-col space-y-1 ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-green-400">{msg.name || msg.username}</p>
                                    <span className="text-gray-600">•</span>
                                    <p className="text-xs text-gray-500">{formatTime(msg.created_at)}</p>
                                  </div>
                                  <p className={`text-white text-[15px] leading-relaxed ${msg.user_id === user?.id ? 'text-right' : 'text-left'}`}>{msg.content}</p>
                                </div>
                              )}
                            </motion.div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Input Bar */}
                    <div className="flex-shrink-0 border-t border-white/10 bg-black/95 backdrop-blur-xl p-4">
                      <div className="flex gap-3 max-w-4xl mx-auto">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                          placeholder={currentGroup.has_arrived ? "Type your message..." : "🔒 Arrive at the location to unlock chat"}
                          disabled={!currentGroup.has_arrived}
                          className="flex-1 px-5 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!currentGroup.has_arrived || !newMessage.trim()}
                          className="p-3 bg-[#22c55e] hover:bg-[#1ea54e] disabled:bg-gray-600 disabled:cursor-not-allowed text-black rounded-full transition-all shadow-lg shadow-green-500/20 disabled:shadow-none"
                          style={{width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </>
          )}
        </motion.div>


        <AnimatePresence>
          {showMembersModal && selectedGroup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowMembersModal(false)}
            >
              {(() => {
                const currentGroup = radrGroups.find(g => g.id === selectedGroup);
                return currentGroup ? (
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                  >
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                      <UsersIcon size={22} className="text-green-400" />
                      Members ({currentGroup.members?.length || 0})
                    </h3>

                    {currentGroup.is_creator && (
                      <div className="mb-4 p-3 bg-black/40 rounded-xl border border-green-500/20">
                        <div className="relative mb-3">
                          <input
                            type="text"
                            placeholder="Search users to add..."
                            value={addMemberSearch}
                            onChange={(e) => {
                              setAddMemberSearch(e.target.value);
                              setShowAddMemberDropdown(e.target.value.length > 0);
                            }}
                            onFocus={() => setShowAddMemberDropdown(addMemberSearch.length > 0)}
                            className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                          />
                          
                          {showAddMemberDropdown && addMemberSearch && (
                            <div className="absolute z-50 w-full mt-2 bg-neutral-900 border border-green-500/20 rounded-xl max-h-72 overflow-y-auto shadow-2xl shadow-green-500/10">
                              {allUsers
                                .filter((u) => {
                                  const query = addMemberSearch.toLowerCase();
                                  return (
                                    (u.name.toLowerCase().includes(query) ||
                                    u.username.toLowerCase().includes(query) ||
                                    u.alien.toLowerCase().includes(query)) &&
                                    !currentGroup.members?.some(m => m.user_id === u.id) &&
                                    !addMembersUsernames.includes(u.username)
                                  );
                                })
                                .slice(0, 10)
                                .map((u) => (
                                  <button
                                    key={u.id}
                                    onClick={() => {
                                      setAddMembersUsernames([...addMembersUsernames, u.username]);
                                      setAddMemberSearch('');
                                      setShowAddMemberDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-4 hover:bg-green-500/5 transition-all text-left border-b border-white/5 last:border-0"
                                  >
                                    <UserIcon iconName={u.profile_icon} color={u.profile_color || undefined} className="w-6 h-6" />
                                    <div className="flex-1">
                                      <div className="font-semibold text-white">{u.name}</div>
                                      <div className="text-sm text-gray-400">@{u.username}</div>
                                    </div>
                                  </button>
                                ))}
                              {allUsers.filter((u) => {
                                const query = addMemberSearch.toLowerCase();
                                return (
                                  u.name.toLowerCase().includes(query) ||
                                  u.username.toLowerCase().includes(query) ||
                                  u.alien.toLowerCase().includes(query)
                                );
                              }).filter((u) => 
                                !currentGroup.members?.some(m => m.user_id === u.id) &&
                                !addMembersUsernames.includes(u.username)
                              ).length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                  <UsersIcon className="mx-auto mb-2 opacity-50" size={32} />
                                  <p className="text-sm">No users found</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {addMembersUsernames.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {addMembersUsernames.map((username) => (
                              <div key={username} className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30 rounded-full text-sm hover:from-green-500/25 hover:to-green-500/15 transition-all">
                                <span className="text-green-300 font-medium">@{username}</span>
                                <button
                                  onClick={() => setAddMembersUsernames(addMembersUsernames.filter(u => u !== username))}
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 transition-all"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => addMembers(currentGroup.id)}
                          disabled={addMembersUsernames.length === 0}
                          className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
                        >
                          Add {addMembersUsernames.length > 0 && `(${addMembersUsernames.length})`}
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {currentGroup.members?.map((member) => (
                        <div key={member.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20">
                          <UserIcon 
                            iconName={member.profile_icon} 
                            color={member.profile_color ?? undefined} 
                            className="w-9 h-9"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{member.name}</p>
                            <p className="text-xs text-gray-500">@{member.username}</p>
                          </div>
                          {member.has_arrived && (
                            <span className="flex-shrink-0 px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold rounded-full">
                              Arrived
                            </span>
                          )}
                          {currentGroup.is_creator && member.user_id !== user?.id && (
                            <button
                              onClick={() => removeMember(currentGroup.id, member.user_id)}
                              className="flex-shrink-0 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-full transition-all"
                              title="Remove member"
                            >
                              <Trash2 size={16} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : null;
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default RadrMessages;
