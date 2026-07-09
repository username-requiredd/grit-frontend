"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

interface AdminStats {
  totalUsers: number;
  totalBoards: number;
  newUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch("/admin/dashboard-stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (!stats) return <p className="text-red-500">Failed to load data.</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Platform Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
          <p className="text-4xl font-bold">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Boards</h3>
          <p className="text-4xl font-bold">{stats.totalBoards}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 mb-1">New Users (Last 7 Days)</h3>
          <p className="text-4xl font-bold text-green-600">{stats.newUsers}</p>
        </div>
      </div>
    </div>
  );
}