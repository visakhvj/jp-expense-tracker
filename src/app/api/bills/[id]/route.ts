import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bill = await prisma.bill.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { items: true },
    });

    if (!bill) {
      return NextResponse.json(
        { error: "レシートが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(bill);
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingBill = await prisma.bill.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existingBill) {
      return NextResponse.json(
        { error: "レシートが見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const bill = await prisma.bill.update({
      where: { id: params.id },
      data: {
        storeName: body.storeName,
        date: body.date ? new Date(body.date) : undefined,
        totalAmount: body.totalAmount,
        category: body.category,
        memo: body.memo,
      },
      include: { items: true },
    });

    return NextResponse.json(bill);
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingBill = await prisma.bill.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existingBill) {
      return NextResponse.json(
        { error: "レシートが見つかりません" },
        { status: 404 }
      );
    }

    await prisma.bill.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "削除しました" });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
