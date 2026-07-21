import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for Google Places hotel search so the API key never
// reaches the browser. Without a key configured, the client quietly falls
// back to fuzzy matching against team-entered hotels.
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

export const dynamic = "force-dynamic";

interface HotelResult {
  name: string;
  address: string;
}

async function searchNew(query: string): Promise<HotelResult[] | null> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 6 }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.places ?? []).map(
    (p: { displayName?: { text?: string }; formattedAddress?: string }) => ({
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
    })
  );
}

// Fallback for projects with only the legacy Places API enabled.
async function searchLegacy(query: string): Promise<HotelResult[] | null> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return null;
  return (data.results ?? [])
    .slice(0, 6)
    .map((p: { name?: string; formatted_address?: string }) => ({
      name: p.name ?? "",
      address: p.formatted_address ?? "",
    }));
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  const near = (req.nextUrl.searchParams.get("near") ?? "").trim().slice(0, 100);

  if (!API_KEY) return NextResponse.json({ enabled: false, hotels: [] });
  if (q.length < 3) return NextResponse.json({ enabled: true, hotels: [] });

  const query = near ? `${q} hotel near ${near}` : `${q} hotel`;
  try {
    const hotels =
      (await searchNew(query)) ?? (await searchLegacy(query)) ?? [];
    return NextResponse.json({
      enabled: true,
      hotels: hotels.filter((h) => h.name),
    });
  } catch {
    return NextResponse.json({ enabled: true, hotels: [] });
  }
}
