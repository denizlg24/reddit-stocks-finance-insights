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
  source: "arctic-shift";
}

type FetchResult =
  | { success: true; data: RedditData }
  | { success: false; error: string };

const ARCTIC_SHIFT_BASE = "https://arctic-shift.photon-reddit.com";
const USER_AGENT = "finance-insights-bot/1.0 (server-side analysis)";
const REQUEST_TIMEOUT_MS = 15_000;
const COMMENT_DELAY_MS = 500;
const MIN_SCORE = 25;
const MAX_POSTS = 25;
const TOP_POSTS_FOR_COMMENTS = 10;
const MAX_COMMENTS_PER_POST = 10;

function createTimeoutSignal(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

function sevenDaysAgoDate(): string {
  const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapPost(item: Record<string, unknown>): RedditPost {
  const permalink = String(item.permalink ?? "");
  return {
    id: String(item.id ?? ""),
    title: String(item.title ?? ""),
    selftext: String(item.selftext ?? ""),
    author: String(item.author ?? "[deleted]"),
    score: Number(item.score ?? 0),
    numComments: Number(item.num_comments ?? 0),
    createdUtc: Number(item.created_utc ?? 0),
    permalink: permalink.startsWith("http")
      ? permalink
      : `https://www.reddit.com${permalink}`,
  };
}

async function fetchPostsFromArcticShift(): Promise<RedditPost[]> {
  const after = sevenDaysAgoDate();
  const url = new URL(`${ARCTIC_SHIFT_BASE}/api/posts/search`);
  url.searchParams.set("subreddit", "stocks");
  url.searchParams.set("after", after);
  url.searchParams.set("limit", "auto");
  url.searchParams.set("sort", "asc");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
    signal: createTimeoutSignal(30_000),
  });

  if (!res.ok) {
    throw new Error(`Arctic Shift posts returned ${res.status}`);
  }

  const json = await res.json();
  const items: Array<Record<string, unknown>> = json.data ?? [];

  return items
    .map(mapPost)
    .filter((p) => p.score >= MIN_SCORE && p.id)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_POSTS);
}

async function fetchCommentsFromArcticShift(
  postId: string
): Promise<RedditComment[]> {
  const url = new URL(`${ARCTIC_SHIFT_BASE}/api/comments/search`);
  url.searchParams.set("link_id", `t3_${postId}`);
  url.searchParams.set("limit", "100");
  url.searchParams.set("sort", "desc");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
    signal: createTimeoutSignal(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Arctic Shift comments returned ${res.status}`);
  }

  const json = await res.json();
  const items: Array<Record<string, unknown>> = json.data ?? [];

  return items
    .map((item) => ({
      author: String(item.author ?? "[deleted]"),
      body: String(item.body ?? ""),
      score: Number(item.score ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_COMMENTS_PER_POST);
}

export async function fetchRedditData(): Promise<FetchResult> {
  let posts: RedditPost[];

  try {
    posts = await fetchPostsFromArcticShift();
  } catch (err) {
    const message = `Arctic Shift failed: ${err instanceof Error ? err.message : String(err)}`;
    return { success: false, error: message };
  }

  if (posts.length === 0) {
    return { success: false, error: "No posts matched filters from Arctic Shift" };
  }

  const topPosts = posts.slice(0, TOP_POSTS_FOR_COMMENTS);
  const postsWithComments: PostWithComments[] = [];

  for (let i = 0; i < topPosts.length; i++) {
    const post = topPosts[i];
    let comments: RedditComment[] = [];

    try {
      comments = await fetchCommentsFromArcticShift(post.id);
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
      source: "arctic-shift",
    },
  };
}
