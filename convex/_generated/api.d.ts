/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as advisorMemories from "../advisorMemories.js";
import type * as advisors from "../advisors.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as conversations from "../conversations.js";
import type * as messages from "../messages.js";
import type * as middleware from "../middleware.js";
import type * as realtime from "../realtime.js";
import type * as threadSummaries from "../threadSummaries.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  advisorMemories: typeof advisorMemories;
  advisors: typeof advisors;
  auth: typeof auth;
  chat: typeof chat;
  conversations: typeof conversations;
  messages: typeof messages;
  middleware: typeof middleware;
  realtime: typeof realtime;
  threadSummaries: typeof threadSummaries;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
