import { Container, HomeView } from "@/components/templates/Views";
import { listPublishedByType } from "@/lib/content/queries";

type P = { params: Promise<{ locale: string }> };

export default async function Home({ params }: P) {
  const { locale } = await params;
  // Featured = a small mix of published content in this locale.
  const [tools, tutorials] = await Promise.all([
    listPublishedByType("tool", locale, 3),
    listPublishedByType("tutorial", locale, 3),
  ]);
  return (
    <Container>
      <HomeView locale={locale} featured={[...tutorials, ...tools].slice(0, 6)} />
    </Container>
  );
}
