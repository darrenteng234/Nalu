import { Container, HubView } from "@/components/templates/Views";
import { listPublishedByType } from "@/lib/content/queries";

type P = { params: Promise<{ locale: string }> };

export default async function Hub({ params }: P) {
  const { locale } = await params;
  const items = await listPublishedByType("collection", locale, 100);
  return (
    <Container>
      <HubView locale={locale} type="collection" entities={items} />
    </Container>
  );
}
