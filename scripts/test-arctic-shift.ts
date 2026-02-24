import { fetchRedditData } from "../lib/reddit";

async function main() {
  console.log("Testing Arctic Shift API...\n");

  const result = await fetchRedditData();

  if (!result.success) {
    console.error("FAILED:", result.error);
    process.exit(1);
  }

  const { data } = result;
  console.log(`Source: ${data.source}`);
  console.log(`Fetched at: ${data.fetchedAt}`);
  console.log(`Total posts: ${data.posts.length}\n`);

  for (const { post, comments } of data.posts.slice(0, 5)) {
    console.log(`--- [${post.score} pts] ${post.title}`);
    console.log(`    Author: ${post.author} | Comments: ${post.numComments}`);
    console.log(`    ${post.permalink}`);
    if (comments.length > 0) {
      console.log(`    Top comment (${comments[0].score} pts): ${comments[0].body.slice(0, 120)}...`);
    }
    console.log();
  }

  const withComments = data.posts.filter((p) => p.comments.length > 0).length;
  console.log(`Posts with comments fetched: ${withComments}/${data.posts.length}`);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
