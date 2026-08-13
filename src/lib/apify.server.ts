/**
 * Shared Apify runner through the Lovable connector gateway.
 * Server-only: reads LOVABLE_API_KEY / APIFY_API_KEY.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/apify";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function headers() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const apifyKey = process.env["APIFY_API_KEY"];
  if (!lovableKey) throw new Error("LOVABLE_API_KEY가 설정되어 있지 않습니다.");
  if (!apifyKey) throw new Error("Apify 연결이 필요합니다.");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": apifyKey,
    "Content-Type": "application/json",
  };
}

const fail = async (res: Response, stage: string): Promise<never> => {
  const body = await res.text();
  console.error(`Apify ${stage} failed [${res.status}]: ${body}`);
  throw new Error(`수집 실패 [${res.status}]: ${body.slice(0, 300)}`);
};

/** 액터를 비동기로 실행하고 결과 아이템을 돌려준다. (동기 실행은 게이트웨이 502가 잦음) */
export async function runApifyActor<T>(actorId: string, input: unknown, limit = 500): Promise<T[]> {
  const h = headers();

  const startRes = await fetch(`${GATEWAY_URL}/acts/${actorId}/runs`, {
    method: "POST",
    headers: h,
    body: JSON.stringify(input),
  });
  if (!startRes.ok) await fail(startRes, "run start");

  const started = (await startRes.json()) as { data?: { id?: string; defaultDatasetId?: string } };
  const runId = started.data?.id;
  let datasetId = started.data?.defaultDatasetId;
  if (!runId) throw new Error("수집 실패: 실행 ID를 받지 못했습니다.");

  let status = "READY";
  for (let i = 0; i < 90; i++) {
    await sleep(3000);
    const statusRes = await fetch(`${GATEWAY_URL}/actor-runs/${runId}`, { headers: h });
    if (!statusRes.ok) {
      if (statusRes.status >= 500) continue;
      await fail(statusRes, "run status");
    }
    const info = (await statusRes.json()) as {
      data?: { status?: string; defaultDatasetId?: string };
    };
    status = info.data?.status ?? status;
    datasetId = info.data?.defaultDatasetId ?? datasetId;
    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) break;
  }

  if (status !== "SUCCEEDED" && status !== "TIMED-OUT") {
    throw new Error(`수집 실패: 실행 상태 ${status}`);
  }
  if (!datasetId) throw new Error("수집 실패: 데이터셋을 찾을 수 없습니다.");

  const itemsRes = await fetch(
    `${GATEWAY_URL}/datasets/${datasetId}/items?clean=true&limit=${limit}`,
    { headers: h },
  );
  if (!itemsRes.ok) await fail(itemsRes, "dataset items");
  return (await itemsRes.json()) as T[];
}
