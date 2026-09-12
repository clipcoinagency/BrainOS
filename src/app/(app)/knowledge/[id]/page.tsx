import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleEditor } from "@/features/knowledge";
import {
  getArticle,
  listArticles,
  listBacklinks,
} from "@/features/knowledge/queries";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "Article not found" };
  return { title: article.title.trim() || "Untitled article" };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) notFound();

  const [allArticles, backlinks] = await Promise.all([
    listArticles(),
    listBacklinks(article.id, article.title),
  ]);

  return (
    <ArticleEditor
      article={article}
      allArticles={allArticles}
      backlinks={backlinks}
    />
  );
}
