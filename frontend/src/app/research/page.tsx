import ResearchClient from "./ResearchClient";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ResearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q ? decodeURIComponent(q) : "";
  return <ResearchClient initialQuery={query} />;
}
