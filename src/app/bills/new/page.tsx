"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { CATEGORIES, guessCategory } from "@/lib/categories";
import { Camera, Upload, Save, X, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function NewBillPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  const [storeName, setStoreName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalAmount, setTotalAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [memo, setMemo] = useState("");
  const [items, setItems] = useState<
    { name: string; price: string; quantity: string }[]
  >([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const processImage = useCallback(
    async (file: File) => {
      // Upload the image
      const formData = new FormData();
      formData.append("file", file);

      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          setImageUrl(uploadData.imageUrl);
        }
      } catch {
        console.error("Upload failed");
      }

      // Try OCR
      setOcrLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          const ocrRes = await fetch("/api/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 }),
          });
          const ocrData = await ocrRes.json();

          if (ocrData.result) {
            if (ocrData.result.storeName)
              setStoreName(ocrData.result.storeName);
            if (ocrData.result.date) setDate(ocrData.result.date);
            if (ocrData.result.totalAmount)
              setTotalAmount(ocrData.result.totalAmount.toString());
            if (ocrData.result.category)
              setCategory(ocrData.result.category);
            if (ocrData.result.items && ocrData.result.items.length > 0) {
              setItems(
                ocrData.result.items.map(
                  (item: { name: string; price: number; quantity: number }) => ({
                    name: item.name,
                    price: item.price.toString(),
                    quantity: item.quantity.toString(),
                  })
                )
              );
            }
          }

          if (!ocrData.success) {
            setError(
              ocrData.message ||
                "OCRが利用できません。手動で入力してください。"
            );
          }

          setOcrLoading(false);
        };
        reader.readAsDataURL(file);
      } catch {
        setOcrLoading(false);
        setError("OCR処理に失敗しました。手動で入力してください。");
      }
    },
    []
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        processImage(file);
      }
    },
    [processImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".heic"] },
    maxFiles: 1,
  });

  const handleStoreNameChange = (name: string) => {
    setStoreName(name);
    const guessed = guessCategory(name);
    if (guessed !== "other") {
      setCategory(guessed);
    }
  };

  const addItem = () => {
    setItems([...items, { name: "", price: "", quantity: "1" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: "name" | "price" | "quantity",
    value: string
  ) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const billItems = items
        .filter((item) => item.name && item.price)
        .map((item) => ({
          name: item.name,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity) || 1,
        }));

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          date,
          totalAmount: parseFloat(totalAmount),
          category,
          imageUrl: imageUrl || undefined,
          memo: memo || undefined,
          items: billItems.length > 0 ? billItems : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存に失敗しました");
        setLoading(false);
        return;
      }

      router.push("/bills");
    } catch {
      setError("サーバーエラーが発生しました");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-sakura-600">読み込み中...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          レシート登録
        </h1>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Image Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            レシート画像
          </h2>

          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Receipt preview"
                className="max-h-64 mx-auto rounded-lg"
              />
              <button
                onClick={() => {
                  setImagePreview(null);
                  setImageUrl("");
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
              {ocrLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="bg-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-sakura-600" />
                    <span className="text-sm">OCR処理中...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                isDragActive
                  ? "border-sakura-400 bg-sakura-50"
                  : "border-gray-300 hover:border-sakura-400 hover:bg-sakura-50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">
                レシートの画像をドラッグ&ドロップ
              </p>
              <p className="text-sm text-gray-400 mt-1">
                またはクリックして選択
              </p>
            </div>
          )}
        </div>

        {/* Bill Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              基本情報
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  店名 *
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => handleStoreNameChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-500 focus:border-transparent outline-none"
                  placeholder="例: イオン"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付 *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  合計金額 (円) *
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-500 focus:border-transparent outline-none"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-500 focus:border-transparent outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameJp} ({cat.nameEn})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ
                </label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-500 focus:border-transparent outline-none"
                  placeholder="メモを入力..."
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                明細 (任意)
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="text-sakura-600 hover:text-sakura-700 text-sm font-medium"
              >
                + 項目追加
              </button>
            </div>

            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(index, "name", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sakura-500 outline-none"
                      placeholder="品名"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                      className="w-16 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sakura-500 outline-none"
                      placeholder="数"
                      min="1"
                    />
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(index, "price", e.target.value)
                      }
                      className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sakura-500 outline-none"
                      placeholder="金額"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                明細を追加するには「+ 項目追加」をクリック
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sakura-600 text-white py-3 rounded-xl hover:bg-sakura-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? "保存中..." : "レシートを保存"}
          </button>
        </form>
      </main>
    </>
  );
}
