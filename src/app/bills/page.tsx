"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { formatCurrency } from "@/lib/utils";
import { CATEGORIES, getCategoryById } from "@/lib/categories";
import { Receipt, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Bill {
  id: string;
  storeName: string;
  date: string;
  totalAmount: number;
  category: string;
  imageUrl: string | null;
  memo: string | null;
}

function BillsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const page = parseInt(searchParams.get("page") ?? "1");
  const [selectedYear, setSelectedYear] = useState(
    searchParams.get("year")
      ? parseInt(searchParams.get("year")!)
      : new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    searchParams.get("month") ?? ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") ?? ""
  );

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("year", selectedYear.toString());
      if (selectedMonth) params.set("month", selectedMonth);
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await fetch(`/api/bills?${params.toString()}`);
      const data = await res.json();
      setBills(data.bills);
      setTotal(data.total);
    } catch {
      console.error("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  }, [page, selectedYear, selectedMonth, selectedCategory]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchBills();
    }
  }, [session, fetchBills]);

  const filteredBills = search
    ? bills.filter((b) =>
        b.storeName.toLowerCase().includes(search.toLowerCase())
      )
    : bills;

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">レシート一覧</h1>
          <Link
            href="/bills/new"
            className="bg-sakura-600 text-white px-4 py-2 rounded-lg hover:bg-sakura-700 transition text-sm font-medium"
          >
            + 新規登録
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="店名で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sakura-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sakura-500 outline-none"
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
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sakura-500 outline-none"
              >
                <option value="">全月</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}月
                  </option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sakura-500 outline-none"
              >
                <option value="">全カテゴリ</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameJp}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bills List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-sakura-600">読み込み中...</div>
          </div>
        ) : filteredBills.length > 0 ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {filteredBills.map((bill) => {
                const cat = getCategoryById(bill.category);
                return (
                  <Link
                    key={bill.id}
                    href={`/bills/${bill.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
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
                          {bill.memo && (
                            <span className="ml-2 text-gray-400">
                              - {bill.memo}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900 flex-shrink-0">
                      {formatCurrency(bill.totalAmount)}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() =>
                    router.push(`/bills?page=${Math.max(1, page - 1)}`)
                  }
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    router.push(
                      `/bills?page=${Math.min(totalPages, page + 1)}`
                    )
                  }
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">レシートが見つかりません</p>
            <Link
              href="/bills/new"
              className="text-sakura-600 hover:text-sakura-700 text-sm font-medium mt-2 inline-block"
            >
              最初のレシートを登録する
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

export default function BillsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sakura-600">読み込み中...</div>
      </div>
    }>
      <BillsContent />
    </Suspense>
  );
}
