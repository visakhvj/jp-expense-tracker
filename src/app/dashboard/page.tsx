"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { formatCurrency } from "@/lib/utils";
import { getCategoryById } from "@/lib/categories";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Calendar,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Stats {
  monthlyTotals: { month: number; total: number; count: number }[];
  categoryTotals: { category: string; total: number }[];
  currentMonth: { month: number; total: number; count: number; change: number };
  yearTotal: number;
  recentBills: {
    id: string;
    storeName: string;
    date: string;
    totalAmount: number;
    category: string;
  }[];
}

const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats?year=${selectedYear}`);
      const data = await res.json();
      setStats(data);
    } catch {
      console.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session, fetchStats]);

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-sakura-600">読み込み中...</div>
        </div>
      </>
    );
  }

  if (!stats) return null;

  const chartData = stats.monthlyTotals.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    金額: m.total,
  }));

  const pieData = stats.categoryTotals
    .filter((c) => c.total > 0)
    .map((c) => {
      const cat = getCategoryById(c.category);
      return {
        name: cat ? `${cat.nameJp}` : c.category,
        value: c.total,
        color: cat?.color ?? "#6b7280",
      };
    });

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ダッシュボード
            </h1>
            <p className="text-gray-500 mt-1">
              {session?.user?.name
                ? `${session.user.name}さん、`
                : ""}
              こんにちは
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sakura-500 outline-none"
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
            <Link
              href="/bills/new"
              className="bg-sakura-600 text-white px-4 py-2 rounded-lg hover:bg-sakura-700 transition flex items-center gap-2 text-sm font-medium"
            >
              <PlusCircle className="w-4 h-4" />
              新規登録
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今月の支出</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.currentMonth.total)}
                </p>
              </div>
              <div
                className={`p-3 rounded-full ${stats.currentMonth.change > 0 ? "bg-red-50" : "bg-green-50"}`}
              >
                {stats.currentMonth.change > 0 ? (
                  <TrendingUp className="w-5 h-5 text-red-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
            <p
              className={`text-sm mt-2 ${stats.currentMonth.change > 0 ? "text-red-500" : "text-green-500"}`}
            >
              先月比 {stats.currentMonth.change > 0 ? "+" : ""}
              {stats.currentMonth.change}%
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今月のレシート数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.currentMonth.count}枚
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Receipt className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{selectedYear}年 合計</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.yearTotal)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">月平均支出</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(
                    Math.round(
                      stats.yearTotal /
                        Math.max(
                          stats.monthlyTotals.filter((m) => m.total > 0)
                            .length,
                          1
                        )
                    )
                  )}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              月別支出
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis
                    fontSize={12}
                    tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "支出",
                    ]}
                  />
                  <Bar dataKey="金額" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              カテゴリ別支出
            </h3>
            {pieData.length > 0 ? (
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-2/5 space-y-2">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-gray-600 truncate">
                        {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              最近のレシート
            </h3>
            <Link
              href="/bills"
              className="text-sakura-600 hover:text-sakura-700 text-sm font-medium flex items-center gap-1"
            >
              すべて表示
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {stats.recentBills.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {stats.recentBills.map((bill) => {
                const cat = getCategoryById(bill.category);
                return (
                  <Link
                    key={bill.id}
                    href={`/bills/${bill.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{
                          backgroundColor: cat?.color ?? "#6b7280",
                        }}
                      >
                        {cat?.nameJp?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {bill.storeName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(bill.date).toLocaleDateString("ja-JP")} ・{" "}
                          {cat?.nameJp ?? bill.category}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(bill.totalAmount)}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>まだレシートが登録されていません</p>
              <Link
                href="/bills/new"
                className="text-sakura-600 hover:text-sakura-700 text-sm font-medium mt-2 inline-block"
              >
                最初のレシートを登録する
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
