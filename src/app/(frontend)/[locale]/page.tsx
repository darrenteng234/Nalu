import { Container, HomeView } from "@/components/templates/Views";
import { listPublishedByType } from "@/lib/content/queries";

type P = { params: Promise<{ locale: string }> };

export default async function Home({ params }: P) {
  const { locale } = await params;
  // Job-first homepage: small curated sets per product layer (empty states are fine).
  const [prompts, workflows, tools] = await Promise.all([
    listPublishedByType("prompt_page", locale, 6),
    listPublishedByType("workflow", locale, 3),
    listPublishedByType("tool", locale, 3),
  ]);
  return (
    <Container>
      <HomeView locale={locale} prompts={prompts} workflows={workflows} tools={tools} />
    </Container>
  );
}
