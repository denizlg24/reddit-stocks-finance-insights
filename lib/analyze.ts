import Anthropic from "@anthropic-ai/sdk";
import { buildAnalysisPrompt } from "@/lib/prompt";
import type { RedditData } from "@/lib/reddit";

const SONNET_INPUT_COST_PER_TOKEN = 3 / 1_000_000;
const SONNET_OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;

const SELFTEXT_MAX_LENGTH = 2000;
const COMMENT_BODY_MAX_LENGTH = 500;

export interface AnalysisResult {
  response: string;
  inputTokens: number;
  outputTokens: number;
  searchQueries: number;
  costUsd: number;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

function formatRedditContext(data: RedditData): string {
  const lines: string[] = [
    `# Pre-Fetched Reddit Data (r/stocks)`,
    `Source: ${data.source} | Fetched: ${data.fetchedAt}`,
    `Total posts: ${data.posts.length}`,
    "",
  ];

  for (let i = 0; i < data.posts.length; i++) {
    const { post, comments } = data.posts[i];
    const date = new Date(post.createdUtc * 1000).toISOString().split("T")[0];

    lines.push(`## Post ${i + 1}: ${post.title}`);
    lines.push(`- Author: u/${post.author}`);
    lines.push(`- Score: ${post.score} | Comments: ${post.numComments}`);
    lines.push(`- Date: ${date}`);
    lines.push(`- Permalink: ${post.permalink}`);

    if (post.selftext.trim()) {
      lines.push("");
      lines.push(truncate(post.selftext.trim(), SELFTEXT_MAX_LENGTH));
    }

    if (comments.length > 0) {
      lines.push("");
      lines.push(`### Top Comments (${comments.length})`);
      for (const comment of comments) {
        lines.push(
          `- [score: ${comment.score}] u/${comment.author}: ${truncate(comment.body.trim(), COMMENT_BODY_MAX_LENGTH)}`
        );
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

export async function runAnalysis(
  redditData?: RedditData
): Promise<AnalysisResult> {
  const client = new Anthropic();
  const hasData = !!redditData;
  const systemPrompt = buildAnalysisPrompt(hasData);

  const userContent = hasData
    ? `Here is the pre-fetched Reddit data from r/stocks. Analyze these posts and produce the top five trade setups as specified.\n\n${formatRedditContext(redditData)}`
    : "Analyze r/stocks posts from the past 24 hours and produce the top five trade setups as specified.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: hasData ? 10 : 15,
      },
    ],
  });

  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  const fullText = textBlocks.map((b) => b.text).join("\n");

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const searchQueries =
    response.usage.server_tool_use?.web_search_requests ?? 0;

  const costUsd =
    inputTokens * SONNET_INPUT_COST_PER_TOKEN +
    outputTokens * SONNET_OUTPUT_COST_PER_TOKEN;

  return {
    response: fullText,
    inputTokens,
    outputTokens,
    searchQueries,
    costUsd: Math.round(costUsd * 10000) / 10000,
  };
}
