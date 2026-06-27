"use client";

// Loads the Vimeo iframe off-screen from page load so the video buffers
// while the user plays in the pit. position:fixed left:-9999px makes the
// browser treat it as a live document (unlike display:none) so Vimeo
// actually starts buffering. By the time game over hits the video is ready.
export default function VideoPreload() {
  return (
    <iframe
      src="https://player.vimeo.com/video/1199216471?autoplay=1&loop=0&muted=1&controls=0&title=0&byline=0&portrait=0&autopause=0&background=1"
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: "1px",
        height: "1px",
        border: 0,
        pointerEvents: "none",
      }}
      allow="autoplay; fullscreen; picture-in-picture"
      title=""
      aria-hidden="true"
    />
  );
}
