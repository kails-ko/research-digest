import { Suspense } from "react";
import { cacheLife } from "next/cache";
import Feed from "@/components/Feed";
import { fetchFeed } from "@/lib/openalex";
import { JOURNALS } from "@/lib/journals";

/**
 * The whole month is fetched once here, on the server, and handed to the client
 * as a single payload. Every filter in the UI then runs against that payload in
 * memory — no chip click costs a network request, and OpenAlex sees one call an
 * hour rather than one per interaction.
 */
async function FeedLoader() {
  "use cache";
  // Re-fetch roughly hourly. OpenAlex updates throughout the day, but a feed
  // scoped to the last 30 days does not change meaningfully faster than that.
  cacheLife("hours");
  const feed = await fetchFeed();
  return <Feed feed={feed} />;
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <FeedLoader />
    </Suspense>
  );
}

function Skeleton() {
  return (
    <>
      <header className="masthead">
        <div className="shell">
          <h1>Child &amp; Adolescent Clinical Research Digest</h1>
          <p className="sub">
            Loading the last 30 days across {JOURNALS.length} journals&hellip;
          </p>
        </div>
      </header>
      <div className="shell">
        <div className="empty">
          <h3>Fetching from OpenAlex</h3>
          <p>This takes a second or two on a cold load, then it&rsquo;s cached.</p>
        </div>
      </div>
    </>
  );
}
