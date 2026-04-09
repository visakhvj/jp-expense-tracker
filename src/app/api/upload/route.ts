import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルを選択してください" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueName = `${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Use Supabase Storage if configured
    const supabase = getSupabase();
    if (supabase) {
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(uniqueName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: "アップロードに失敗しました: " + uploadError.message },
          { status: 500 }
        );
      }

      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(uniqueName);

      return NextResponse.json({ imageUrl: urlData.publicUrl }, { status: 201 });
    }

    // Fallback: local file storage (for development)
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const localName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, localName);
    await writeFile(filePath, buffer);

    return NextResponse.json({ imageUrl: `/uploads/${localName}` }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
