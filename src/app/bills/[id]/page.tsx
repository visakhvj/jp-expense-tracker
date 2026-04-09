"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCategoryById } from "@/lib/categories";
import {
  ArrowLeft,
  Trash2,
  Receipt,
  Store,
  Calendar,
  Tag,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";

interface BillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string | null;
}

interface Bill {
  id: string;
  storeName: string;
  date: string;
  totalAmount: number;
  category: string;
  imageUrl: string | null;
  ocrRawText: string | null;
  memo: string | null;
  createdAt: string;
  items: BillItem[];
}

export default function BillDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchBill = useCallback(async () => {
    try {
      const res = await fetch(`/api/bills/${params.id}`);
      if (!res.ok) {
        router.push("/bills");
        return;
      }
      const data = await res.json();
      setBill(data);
    } catch {
      router.push("/bills");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchBill();
    }
  }, [session, fetchBill]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/bills/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/bills");
      }
    } catch {
      console.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

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

  if (!bill) return null;

  const cat = getCategoryById(bill.category);

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/bills"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition"
            >
              <Trash2 className="w-4 h-4" />
              削除
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800 font-medium mb-3">
              このレシートを削除しますか？
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-white text-gray-600 px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* Bill Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Banner */}
          <div
            className="p-6 text-white"
            style={{ backgroundColor: cat?.color ?? "#6b7280" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{cat?.nameJp ?? bill.category}</p>
                <h1 className="text-2xl font-bold mt-1">{bill.storeName}</h1>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">合計</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(bill.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">店名</p>
                  <p className="font-medium">{bill.storeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">日付</p>
                  <p className="font-medium">{formatDate(bill.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">カテゴリ</p>
                  <p className="font-medium">{cat?.nameJp ?? bill.category}</p>
                </div>
              </div>
              {bill.memo && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">メモ</p>
                    <p className="font-medium">{bill.memo}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            {bill.items.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  明細
                </h3>
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                  {bill.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <span className="text-gray-900">{item.name}</span>
                        {item.quantity > 1 && (
                          <span className="text-gray-400 text-sm ml-2">
                            x{item.quantity}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Receipt Image */}
            {bill.imageUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  レシート画像
                </h3>
                <img
                  src={bill.imageUrl}
                  alt="Receipt"
                  className="max-h-96 rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            登録日: {formatDate(bill.createdAt)}
          </div>
        </div>
      </main>
    </>
  );
}
