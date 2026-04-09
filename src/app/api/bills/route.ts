import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBillSchema = z.object({
  storeName: z.string().min(1, "店名を入力してください"),
  date: z.string(),
  totalAmount: z.number().min(0, "金額は0以上で入力してください"),
  category: z.string().min(1, "カテゴリを選択してください"),
  imageUrl: z.string().optional(),
  ocrRawText: z.string().optional(),
  memo: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().default(1),
        price: z.number(),
        category: z.string().optional(),
      })
    )
    .optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where: Record<string, unknown> = { userId: session.user.id };

    if (year) {
      const startDate = new Date(
        parseInt(year),
        month ? parseInt(month) - 1 : 0,
        1
      );
      const endDate = month
        ? new Date(parseInt(year), parseInt(month), 1)
        : new Date(parseInt(year) + 1, 0, 1);

      where.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    if (category) {
      where.category = category;
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: { items: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bill.count({ where }),
    ]);

    return NextResponse.json({ bills, total, page, limit });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createBillSchema.parse(body);

    const bill = await prisma.bill.create({
      data: {
        userId: session.user.id,
        storeName: data.storeName,
        date: new Date(data.date),
        totalAmount: data.totalAmount,
        category: data.category,
        imageUrl: data.imageUrl,
        ocrRawText: data.ocrRawText,
        memo: data.memo,
        items: data.items
          ? {
              create: data.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                category: item.category,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
