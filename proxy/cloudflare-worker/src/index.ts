export interface Env {
  GITHUB_TOKEN: string;
  GITHUB_REPOSITORY: string;
  ALLOWED_ORIGINS?: string;
  DEFAULT_LABELS?: string;
}

interface BookingPayload {
  houseId: string;
  guestName: string;
  guestEmail: string;
  guests: number;
  arrival: string;
  departure: string;
  notes?: string;
  language: "it" | "en";
  privacyAccepted: boolean;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return handleCors(env, new Response(null, { status: 204 }));
    }

    if (request.method === "POST" && url.pathname === "/bookings") {
      try {
        const payload = (await request.json()) as BookingPayload;
        const validationError = validatePayload(payload);
        if (validationError) {
          return handleCors(
            env,
            new Response(JSON.stringify({ error: validationError }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        const issueResponse = await createIssue(payload, request, env);
        return handleCors(
          env,
          new Response(JSON.stringify(issueResponse), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          }),
        );
      } catch (error) {
        console.error("booking error", error);
        return handleCors(
          env,
          new Response(JSON.stringify({ error: "Unable to submit booking" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
    }

    return handleCors(env, new Response("Not Found", { status: 404 }));
  },
};

export default worker;

function validatePayload(payload: BookingPayload): string | null {
  const required = [
    "houseId",
    "guestName",
    "guestEmail",
    "arrival",
    "departure",
    "language",
  ] as const;

  for (const field of required) {
    if (!payload[field]) {
      return `Missing field: ${field}`;
    }
  }

  if (!payload.privacyAccepted) {
    return "Privacy policy must be accepted";
  }

  if (new Date(payload.arrival) >= new Date(payload.departure)) {
    return "Departure must be after arrival";
  }

  return null;
}

async function createIssue(payload: BookingPayload, request: Request, env: Env) {
  const labels = new Set(["booking"]);
  if (env.DEFAULT_LABELS) {
    env.DEFAULT_LABELS.split(",")
      .map((label) => label.trim())
      .filter(Boolean)
      .forEach((label) => labels.add(label));
  }

  const issueBody = buildIssueBody(payload, request);
  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "User-Agent": "citta-futura-worker",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `Prenotazione ${payload.houseId} · ${payload.guestName}`,
      body: issueBody,
      labels: Array.from(labels),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("GitHub API error", response.status, text);
    throw new Error(`GitHub API error ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  return {
    issueNumber: data["number"],
    issueUrl: data["html_url"],
  };
}

function buildIssueBody(payload: BookingPayload, request: Request) {
  const enriched = {
    ...payload,
    submittedAt: new Date().toISOString(),
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  return [
    "### Booking request",
    "",
    "```json",
    JSON.stringify(enriched, null, 2),
    "```",
    "",
    "Richiesta generata automaticamente dal portale Città Futura.",
  ].join("\n");
}

function handleCors(env: Env, response: Response): Response {
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim());
  const headers = new Headers(response.headers);
  if (allowedOrigins && allowedOrigins.length > 0) {
    headers.set("Access-Control-Allow-Origin", allowedOrigins.join(","));
  } else {
    headers.set("Access-Control-Allow-Origin", "*");
  }
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
