import { detailMetadata, DetailPage } from "@/lib/render/detail";

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P) {
  const { locale, slug } = await params;
  return detailMetadata("role_page", locale, slug);
}

export default async function Page({ params }: P) {
  const { locale, slug } = await params;
  return DetailPage({ type: "role_page", locale, slug });
}
