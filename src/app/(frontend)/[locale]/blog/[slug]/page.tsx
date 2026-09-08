import { detailMetadata, DetailPage } from "@/lib/render/detail";
type P = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: P) { const { locale, slug } = await params; return detailMetadata("blog_post", locale, slug); }
export default async function Page({ params }: P) { const { locale, slug } = await params; return DetailPage({ type: "blog_post", locale, slug }); }
