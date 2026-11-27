import '../styles/videoguide.css'

/**
 * Tutorial videos that are approved and uploaded to /public/media. A guide whose video is not listed
 * here renders nothing, so a page never shows an empty player while its video is still in production.
 */
const PUBLISHED_VIDEOS = new Set([
  '/media/welcome-tour.mp4',
  '/media/test-centre-tutorial.mp4',
  '/media/topic-wise-past-papers-tutorial.mp4',
])

/**
 * A short tutorial video in a gold card: title, one-line summary and the player.
 * Videos live in /public/media (720p MP4 + WebP poster); nothing loads until the visitor presses play.
 */
export default function VideoGuide({ src, poster, title, duration, children, id = 'video-guide' }) {
  if (!PUBLISHED_VIDEOS.has(src)) return null
  return (
    <section className="vg-card" id={id} aria-labelledby={`${id}-title`}>
      <div className="vg-copy">
        <p className="vg-kicker">Video guide{duration ? ` · ${duration}` : ''}</p>
        <h3 id={`${id}-title`}>{title}</h3>
        {children ? <p>{children}</p> : null}
      </div>
      <video className="vg-video" controls preload="none" playsInline poster={poster}>
        <source src={src} type="video/mp4" />
        Your browser cannot play this video.
      </video>
    </section>
  )
}
