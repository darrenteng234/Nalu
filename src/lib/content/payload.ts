import { getPayload } from "payload";
import config from "@payload-config";

/** Cached Payload instance for server components / route handlers. */
let _instance: Awaited<ReturnType<typeof getPayload>> | null = null;

export async function payloadClient() {
  if (_instance) return _instance;
  _instance = await getPayload({ config });
  return _instance;
}
