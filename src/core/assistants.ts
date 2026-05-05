import { AppId, AppTargets, parseApps } from "./apps";

export type Assistant = AppId;
export type AssistantTargets = AppTargets;

export function parseAssistants(input: string | undefined): AssistantTargets {
  try {
    return parseApps(input);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message.replace("app target", "assistant target"));
    }

    throw error;
  }
}
