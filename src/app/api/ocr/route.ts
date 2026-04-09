import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { guessCategory } from "@/lib/categories";

interface OcrResult {
  storeName: string;
  date: string;
  totalAmount: number;
  category: string;
  items: { name: string; price: number; quantity: number }[];
  rawText: string;
}

function parseJapaneseReceipt(text: string): OcrResult {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Try to find store name (usually first non-empty line)
  const storeName = lines[0] || "不明な店舗";

  // Try to find date
  let date = new Date().toISOString().split("T")[0];
  const datePatterns = [
    /(\d{4})[年\/\-.](\d{1,2})[月\/\-.](\d{1,2})/,
    /令和(\d+)年(\d{1,2})月(\d{1,2})日/,
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        if (pattern === datePatterns[1]) {
          const reiwaYear = parseInt(match[1]) + 2018;
          date = `${reiwaYear}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
        } else {
          date = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
        }
        break;
      }
    }
  }

  // Try to find total amount
  let totalAmount = 0;
  const totalPatterns = [
    /合計[^\d]*[¥￥]?\s*([\d,]+)/,
    /(?:合計|お買上|お買い上げ|計)[^\d]*(\d[\d,]*)/,
    /(?:TOTAL|Total)[^\d]*[¥￥]?\s*([\d,]+)/,
  ];

  for (const line of lines) {
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        totalAmount = parseInt(match[1].replace(/,/g, ""));
        break;
      }
    }
    if (totalAmount > 0) break;
  }

  // Try to extract items
  const items: { name: string; price: number; quantity: number }[] = [];
  const itemPattern = /(.+?)\s+[¥￥]?\s*(\d[\d,]*)\s*$/;

  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match) {
      const name = match[1].trim();
      const price = parseInt(match[2].replace(/,/g, ""));
      if (price > 0 && price < totalAmount * 2 && name.length > 0) {
        items.push({ name, price, quantity: 1 });
      }
    }
  }

  const category = guessCategory(storeName);

  return {
    storeName,
    date,
    totalAmount,
    category,
    items,
    rawText: text,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "画像データが必要です" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

    if (!apiKey) {
      // Return a demo/manual mode response
      return NextResponse.json({
        success: false,
        message: "OCR APIキーが設定されていません。手動で入力してください。",
        result: {
          storeName: "",
          date: new Date().toISOString().split("T")[0],
          totalAmount: 0,
          category: "other",
          items: [],
          rawText: "",
        },
      });
    }

    // Call Google Cloud Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: "TEXT_DETECTION" }],
              imageContext: {
                languageHints: ["ja", "en"],
              },
            },
          ],
        }),
      }
    );

    const visionData = await visionResponse.json();
    const textAnnotations = visionData.responses?.[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return NextResponse.json({
        success: false,
        message: "テキストを検出できませんでした",
        result: {
          storeName: "",
          date: new Date().toISOString().split("T")[0],
          totalAmount: 0,
          category: "other",
          items: [],
          rawText: "",
        },
      });
    }

    const fullText = textAnnotations[0].description;
    const result = parseJapaneseReceipt(fullText);

    return NextResponse.json({ success: true, result });
  } catch {
    return NextResponse.json(
      { error: "OCR処理に失敗しました" },
      { status: 500 }
    );
  }
}
