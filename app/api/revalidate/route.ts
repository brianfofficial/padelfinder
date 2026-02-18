import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidation-secret");

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const paths: string[] = body.paths || [];

  if (paths.length === 0) {
    // Revalidate key pages by default
    revalidatePath("/");
    revalidatePath("/courts");
    revalidatePath("/states");
    return NextResponse.json({ revalidated: true, paths: ["/", "/courts", "/states"] });
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true, paths });
}
