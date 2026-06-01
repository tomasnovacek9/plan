export async function onRequestGet(context) {
  const url = context.env.EDUPAGE_ICS_URL;

  if (!url) {
    return new Response("EDUPAGE_ICS_URL is not configured.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "tydenni-plan-generator/1.0"
    }
  });

  if (!response.ok) {
    return new Response(`Calendar upstream returned ${response.status}.`, {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  return new Response(await response.text(), {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/calendar; charset=utf-8"
    }
  });
}
