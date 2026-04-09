import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") ?? new Date().getFullYear().toString()
    );
    const month = searchParams.get("month")
      ? parseInt(searchParams.get("month")!)
      : null;

    const userId = session.user.id;

    // Get monthly totals for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    const yearBills = await prisma.bill.findMany({
      where: {
        userId,
        date: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
      select: {
        date: true,
        totalAmount: true,
        category: true,
      },
    });

    // Monthly totals
    const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      count: 0,
    }));

    // Category totals
    const categoryTotals: Record<string, number> = {};

    for (const bill of yearBills) {
      const billMonth = new Date(bill.date).getMonth();
      monthlyTotals[billMonth].total += bill.totalAmount;
      monthlyTotals[billMonth].count += 1;

      if (!month || new Date(bill.date).getMonth() === month - 1) {
        categoryTotals[bill.category] =
          (categoryTotals[bill.category] || 0) + bill.totalAmount;
      }
    }

    // Current month stats
    const now = new Date();
    const currentMonth = month ?? now.getMonth() + 1;
    const currentMonthData = monthlyTotals[currentMonth - 1];

    // Previous month comparison
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthData = monthlyTotals[prevMonth - 1];

    const monthOverMonthChange =
      prevMonthData.total > 0
        ? ((currentMonthData.total - prevMonthData.total) /
            prevMonthData.total) *
          100
        : 0;

    // Year total
    const yearTotal = monthlyTotals.reduce((sum, m) => sum + m.total, 0);

    // Recent bills
    const recentBills = await prisma.bill.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true,
        storeName: true,
        date: true,
        totalAmount: true,
        category: true,
      },
    });

    return NextResponse.json({
      monthlyTotals,
      categoryTotals: Object.entries(categoryTotals).map(
        ([category, total]) => ({
          category,
          total,
        })
      ),
      currentMonth: {
        month: currentMonth,
        total: currentMonthData.total,
        count: currentMonthData.count,
        change: Math.round(monthOverMonthChange * 10) / 10,
      },
      yearTotal,
      recentBills,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
