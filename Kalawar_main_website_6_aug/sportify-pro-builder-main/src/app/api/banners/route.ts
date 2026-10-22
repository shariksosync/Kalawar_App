import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings-store";
import { defaultBannerSlides, type BannerSlide } from "@/types/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    const bannerSlides =
      Array.isArray(settings.bannerSlides) && settings.bannerSlides.length > 0
        ? settings.bannerSlides
        : defaultBannerSlides;

    return NextResponse.json({
      success: true,
      count: bannerSlides.length,
      banners: bannerSlides,
    });
  } catch (error) {
    console.error("GET /api/banners error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banner images", banners: defaultBannerSlides },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const banners = body.banners;

    if (!Array.isArray(banners)) {
      return NextResponse.json(
        { success: false, error: "Invalid banners payload: must be an array" },
        { status: 400 }
      );
    }

    const sanitizedBanners: BannerSlide[] = banners.slice(0, 5).map((b: any, index: number) => ({
      id: String(b.id || `slide-${index + 1}`),
      image: String(b.image || "").trim(),
      alt: String(b.alt || `Kalawar Sports Banner ${index + 1}`).trim(),
      title: String(b.title || "").trim(),
      link: String(b.link || "").trim(),
      active: b.active !== false,
    }));

    // Pad with defaults if less than 5
    while (sanitizedBanners.length < 5) {
      const idx = sanitizedBanners.length;
      const def = defaultBannerSlides[idx] || defaultBannerSlides[0];
      sanitizedBanners.push({ ...def, id: `slide-${idx + 1}` });
    }

    const updated = await updateSettings({ bannerSlides: sanitizedBanners });

    return NextResponse.json({
      success: true,
      message: "Banner images updated successfully",
      banners: updated.bannerSlides || sanitizedBanners,
    });
  } catch (error) {
    console.error("PUT /api/banners error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update banner images" },
      { status: 500 }
    );
  }
}
