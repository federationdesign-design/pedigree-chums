"use client";
import { useEffect } from "react";
import { track } from "../../lib/track";

/* Fires one named event when the page it sits on is reached. Drop it into any
   page whose arrivals are worth counting on their own, rather than being lost
   among every other PageView.

   ViewContent is a Meta STANDARD event, which matters: standard events can be
   used as a campaign optimisation goal and as a custom audience without any
   extra setup in Events Manager. A made-up name cannot.

   `name` becomes content_name, so several pages can share the event and still
   be told apart in reporting.

   It renders nothing. Safe in a server-rendered page: the effect only runs in
   the browser, and track() refuses on the server, without consent, and off the
   production host. */
export default function TrackView({ event = "ViewContent", name }: { event?: string; name: string }) {
  useEffect(() => {
    track(event, { content_name: name });
  }, [event, name]);
  return null;
}
