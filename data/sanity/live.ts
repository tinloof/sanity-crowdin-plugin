import config from "@/config";
import {defineLive} from "next-sanity";
import "server-only";

import {client} from "./client";

export const {SanityLive, sanityFetch} = defineLive({
  client,
  browserToken: config.sanity.token,
  serverToken: config.sanity.token,
});
