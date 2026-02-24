export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  numComments: number;
  createdUtc: number;
  permalink: string;
}

export interface RedditComment {
  author: string;
  body: string;
  score: number;
}

export interface PostWithComments {
  post: RedditPost;
  comments: RedditComment[];
}

export interface RedditData {
  posts: PostWithComments[];
  fetchedAt: string;
  source: "reddit" | "arctic-shift";
}

type FetchResult =
  | { success: true; data: RedditData }
  | { success: false; error: string };

const USER_AGENT = "finance-insights-bot/1.0 (server-side analysis)";
const REQUEST_TIMEOUT_MS = 10_000;
const COMMENT_DELAY_MS = 7_000;
const MIN_SCORE = 25;
const MAX_POSTS = 25;
const TOP_POSTS_FOR_COMMENTS = 10;
const MAX_COMMENTS_PER_POST = 10;

function createTimeoutSignal(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

function sevenDaysAgoUtc(): number {
  return Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPostsFromArcticShift(): Promise<RedditPost[]> {
  const after = sevenDaysAgoUtc();
  const url = new URL("https://arctic-shift.photon-reddit.com/api/posts");
  url.searchParams.set("subreddit", "stocks");
  url.searchParams.set("after", String(after));
  url.searchParams.set("sort", "score");
  url.searchParams.set("order", "desc");
  url.searchParams.set("limit", "100");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
    signal: createTimeoutSignal(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Arctic Shift returned ${res.status}`);
  }

  const json = await res.json();
  const items: Array<Record<string, unknown>> = json.data ?? json;

  return items
    .map((item) => ({
      id: String(item.id ?? ""),
      title: String(item.title ?? ""),
      selftext: String(item.selftext ?? ""),
      author: String(item.author ?? "[deleted]"),
      score: Number(item.score ?? 0),
      numComments: Number(item.num_comments ?? 0),
      createdUtc: Number(item.created_utc ?? 0),
      permalink: `https://www.reddit.com${item.permalink ?? ""}`,
    }))
    .filter((p) => p.score >= MIN_SCORE && p.id)
    .slice(0, MAX_POSTS);
}

async function fetchPostsFromReddit(): Promise<RedditPost[]> {
  const res = await fetch(
    "https://www.reddit.com/r/stocks/top.json?t=week&limit=100",
    {
      headers: { "User-Agent": USER_AGENT },
      signal: createTimeoutSignal(REQUEST_TIMEOUT_MS),
    }
  );

  if (!res.ok) {
    throw new Error(`Reddit returned ${res.status}`);
  }

  const json = await res.json();
  const children: Array<{ data: Record<string, unknown> }> =
    json?.data?.children ?? [];

  return children
    .map(({ data }) => ({
      id: String(data.id ?? ""),
      title: String(data.title ?? ""),
      selftext: String(data.selftext ?? ""),
      author: String(data.author ?? "[deleted]"),
      score: Number(data.score ?? 0),
      numComments: Number(data.num_comments ?? 0),
      createdUtc: Number(data.created_utc ?? 0),
      permalink: `https://www.reddit.com${data.permalink ?? ""}`,
    }))
    .filter((p) => p.score >= MIN_SCORE && p.id)
    .slice(0, MAX_POSTS);
}

async function fetchComments(postId: string): Promise<RedditComment[]> {
  const res = await fetch(
    `https://www.reddit.com/r/stocks/comments/${postId}.json`,
    {
      headers: { "User-Agent": USER_AGENT },
      signal: createTimeoutSignal(REQUEST_TIMEOUT_MS),
    }
  );

  if (!res.ok) {
    throw new Error(`Comments fetch returned ${res.status}`);
  }

  const json = await res.json();
  const listing = json?.[1]?.data?.children ?? [];

  return listing
    .filter(
      (child: { kind: string }) => child.kind === "t1"
    )
    .map((child: { data: Record<string, unknown> }) => ({
      author: String(child.data.author ?? "[deleted]"),
      body: String(child.data.body ?? ""),
      score: Number(child.data.score ?? 0),
    }))
    .sort((a: RedditComment, b: RedditComment) => b.score - a.score)
    .slice(0, MAX_COMMENTS_PER_POST);
}

export async function fetchRedditData(): Promise<FetchResult> {
  let posts: RedditPost[];
  let source: "arctic-shift" | "reddit";

  try {
    posts = await fetchPostsFromArcticShift();
    source = "arctic-shift";
  } catch (arcticErr) {
    console.warn(
      "Arctic Shift failed, falling back to Reddit:",
      arcticErr instanceof Error ? arcticErr.message : arcticErr
    );

    try {
      posts = await fetchPostsFromReddit();
      source = "reddit";
    } catch (redditErr) {
      const message = [
        "Both Reddit sources failed.",
        `Arctic Shift: ${arcticErr instanceof Error ? arcticErr.message : String(arcticErr)}`,
        `Reddit: ${redditErr instanceof Error ? redditErr.message : String(redditErr)}`,
      ].join(" ");

      return { success: false, error: message };
    }
  }

  if (posts.length === 0) {
    return { success: false, error: "No posts matched filters from either source" };
  }

  const topPosts = posts.slice(0, TOP_POSTS_FOR_COMMENTS);
  const postsWithComments: PostWithComments[] = [];

  for (let i = 0; i < topPosts.length; i++) {
    const post = topPosts[i];
    let comments: RedditComment[] = [];

    try {
      comments = await fetchComments(post.id);
    } catch (err) {
      console.warn(
        `Failed to fetch comments for post ${post.id}:`,
        err instanceof Error ? err.message : err
      );
    }

    postsWithComments.push({ post, comments });

    if (i < topPosts.length - 1) {
      await delay(COMMENT_DELAY_MS);
    }
  }

  const remainingPosts = posts.slice(TOP_POSTS_FOR_COMMENTS);
  for (const post of remainingPosts) {
    postsWithComments.push({ post, comments: [] });
  }

  return {
    success: true,
    data: {
      posts: postsWithComments,
      fetchedAt: new Date().toISOString(),
      source,
    },
  };
}
