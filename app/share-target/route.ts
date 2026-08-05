import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadMedia } from "@/lib/storage";
import { absoluteUrl } from "@/lib/url";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(absoluteUrl("/login"), 303);
  }

  const formData = await request.formData();
  const text = ((formData.get("text") as string) || (formData.get("title") as string) || "").trim();
  const sharedUrl = ((formData.get("url") as string) || "").trim();
  const file = formData.getAll("files").find((f): f is File => f instanceof File && f.size > 0);

  const params = new URLSearchParams();
  const caption = [text, sharedUrl].filter(Boolean).join(" ").trim();
  if (caption) params.set("caption", caption);

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const key = `shares/${user.id}/${randomUUID()}.${ext}`;
    const { storageKey } = await uploadMedia(key, buffer, file.type || "application/octet-stream");
    params.set("sharedKey", storageKey);
    params.set("sharedType", file.type || "application/octet-stream");
  }

  return NextResponse.redirect(absoluteUrl(`/memory?${params.toString()}`), 303);
}
