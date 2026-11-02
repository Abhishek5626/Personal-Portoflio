import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  createYouTubePlayer,
  YT_PLAYER_STATE,
  type YouTubePlayer,
} from './youtubePlayerApi.ts'
import './music-card.css'

const track = {
  title: "L'Amour Toujours",
  artist: "Gigi D'Agostino",
  videoId: 'uU_B9eZvc0U',
  youtubeUrl: 'https://www.youtube.com/watch?v=uU_B9eZvc0U',
  // Shown until the player loads on first use and reports the real length.
  durationSeconds: 230,
}

const CONTOUR_POINTS = 192

// Figma's eight-lobed art shape on a 132-unit canvas, clockwise from the top.
function scallopPoints(radius: number) {
  return Array.from({ length: CONTOUR_POINTS }, (_, index) => {
    const angle = (index / CONTOUR_POINTS) * Math.PI * 2
    const r = radius * (1 + 0.057 * Math.cos(angle * 8))
    return [66 + r * Math.sin(angle), 66 - r * Math.cos(angle)] as const
  })
}

function pathFrom(points: readonly (readonly [number, number])[]) {
  return `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`
}

const contour = scallopPoints(61.5)
const contourPath = pathFrom(contour)
const artFill = pathFrom(scallopPoints(50))

// Distance along the contour at each point, ending back at the top.
const contourLengths = contour.reduce(
  (lengths, [x, y], index) => {
    const [nextX, nextY] = contour[(index + 1) % CONTOUR_POINTS]!
    lengths.push(lengths[index]! + Math.hypot(nextX - x, nextY - y))
    return lengths
  },
  [0],
)
const contourLength = contourLengths[CONTOUR_POINTS]!

function contourPoint(ratio: number) {
  const target = ratio * contourLength
  let index = 0
  while (index < CONTOUR_POINTS - 1 && contourLengths[index + 1]! < target) {
    index += 1
  }
  const start = contourLengths[index]!
  const along = (target - start) / (contourLengths[index + 1]! - start)
  const [x, y] = contour[index]!
  const [nextX, nextY] = contour[(index + 1) % CONTOUR_POINTS]!
  return { x: x + (nextX - x) * along, y: y + (nextY - y) * along }
}

// Each contour point sits at its own angle, so a pointer's angle finds its place.
function contourRatioAtAngle(angle: number) {
  const position = (((angle / (Math.PI * 2)) % 1) + 1) % 1 * CONTOUR_POINTS
  const index = Math.floor(position)
  const start = contourLengths[index]!
  return (start + (contourLengths[index + 1]! - start) * (position - index)) / contourLength
}

type PlayerStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function PlayTriangle() {
  return (
    <svg className="music-card-play-icon" width="13" height="15" viewBox="0 0 13 15" aria-hidden="true">
      <path
        d="M2.1 1.05c0-.72.79-1.16 1.4-.78l8.15 5.45c.55.37.55 1.19 0 1.56L3.5 12.73c-.61.38-1.4-.06-1.4-.78V1.05Z"
        fill="currentColor"
      />
    </svg>
  )
}

function PauseBars() {
  return (
    <svg className="music-card-pause-icon" width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
      <rect x="1" y="1" width="3.5" height="12" rx="1" fill="currentColor" />
      <rect x="7.5" y="1" width="3.5" height="12" rx="1" fill="currentColor" />
    </svg>
  )
}

function ContourSeek({
  progress,
  disabled,
  labelledBy,
  clipId,
  onSeek,
}: {
  progress: number
  disabled: boolean
  labelledBy: string
  clipId: string
  onSeek: (ratio: number) => void
}) {
  const artRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef(false)
  const lastRatioRef = useRef(0)
  const [dragging, setDragging] = useState(false)

  const ratioFromPointer = (clientX: number, clientY: number) => {
    const art = artRef.current
    if (!art) {
      return 0
    }
    const rect = art.getBoundingClientRect()
    return contourRatioAtAngle(
      Math.atan2(
        clientX - (rect.left + rect.width / 2),
        rect.top + rect.height / 2 - clientY,
      ),
    )
  }

  const finishPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) {
      return
    }
    draggingRef.current = false
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const played = clamp(progress, 0, 1)
  const playhead = contourPoint(played)

  return (
    <svg
      ref={artRef}
      className={[
        'music-card-art',
        'music-card-seek',
        dragging ? 'is-dragging' : '',
        disabled ? 'is-disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      viewBox="0 0 132 132"
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(played * 100)}
      aria-valuetext={`${Math.round(played * 100)}% through the track`}
      aria-labelledby={labelledBy}
      aria-disabled={disabled || undefined}
      data-fisheye-drag-axis="both"
      onPointerDown={(event) => {
        if (disabled || event.button !== 0) {
          return
        }
        event.preventDefault()
        draggingRef.current = true
        setDragging(true)
        event.currentTarget.setPointerCapture(event.pointerId)
        lastRatioRef.current = ratioFromPointer(event.clientX, event.clientY)
        onSeek(lastRatioRef.current)
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) {
          return
        }
        const ratio = ratioFromPointer(event.clientX, event.clientY)
        // Crossing the top would jump between the track's start and end.
        if (Math.abs(ratio - lastRatioRef.current) > 0.5) {
          return
        }
        lastRatioRef.current = ratio
        onSeek(ratio)
      }}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      onLostPointerCapture={finishPointer}
      onKeyDown={(event: KeyboardEvent<SVGSVGElement>) => {
        if (disabled) {
          return
        }
        const step = event.shiftKey ? 0.1 : 0.05
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault()
          onSeek(clamp(progress + step, 0, 1))
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault()
          onSeek(clamp(progress - step, 0, 1))
        } else if (event.key === 'Home') {
          event.preventDefault()
          onSeek(0)
        } else if (event.key === 'End') {
          event.preventDefault()
          onSeek(1)
        }
      }}
    >
      <clipPath id={clipId}>
        <path d={artFill} />
      </clipPath>
      <path className="music-card-art-ring" d={contourPath} />
      <image
        href="/landing/music-cover.webp"
        x="-20"
        y="-146"
        width="165"
        height="295"
        clipPath={`url(#${clipId})`}
      />
      <path
        className="music-card-contour-played"
        d={contourPath}
        pathLength={1}
        strokeDasharray={`${played} 1`}
      />
      <circle
        className="music-card-playhead"
        cx={playhead.x}
        cy={playhead.y}
        r="6"
      />
      <path className="music-card-contour-hit" d={contourPath} />
    </svg>
  )
}

export function MusicCard() {
  const reactId = useId()
  const hostId = `music-yt-host-${reactId.replace(/:/g, '')}`
  const titleId = `music-card-title-${reactId.replace(/:/g, '')}`
  const statusId = `music-card-status-${reactId.replace(/:/g, '')}`
  const artClipId = `music-card-art-${reactId.replace(/\W/g, '')}`

  const playerRef = useRef<YouTubePlayer | null>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const tickerRef = useRef<number | null>(null)
  const tickerModeRef = useRef<'raf' | 'timeout' | null>(null)
  const playIntentRef = useRef(false)
  const reduceMotionRef = useRef(false)

  const pendingSeekRef = useRef<number | null>(null)

  const [playerWanted, setPlayerWanted] = useState(false)
  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(track.durationSeconds)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stopTicker = () => {
    if (tickerRef.current === null) {
      return
    }
    if (tickerModeRef.current === 'timeout') {
      window.clearTimeout(tickerRef.current)
    } else {
      cancelAnimationFrame(tickerRef.current)
    }
    tickerRef.current = null
    tickerModeRef.current = null
  }

  const readTimes = useEffectEvent(() => {
    const player = playerRef.current
    if (!player) {
      return
    }
    try {
      const nextCurrent = player.getCurrentTime() || 0
      const nextDuration = player.getDuration() || 0
      setCurrentTime(nextCurrent)
      if (nextDuration > 0) {
        setDuration(nextDuration)
      }
    } catch {
      // Player may be mid-teardown.
    }
  })

  const startTicker = useEffectEvent(() => {
    stopTicker()
    const tick = () => {
      readTimes()
      if (reduceMotionRef.current) {
        tickerModeRef.current = 'timeout'
        tickerRef.current = window.setTimeout(tick, 250)
      } else {
        tickerModeRef.current = 'raf'
        tickerRef.current = requestAnimationFrame(tick)
      }
    }
    tick()
  })

  useEffect(() => {
    if (!playerWanted) return
    reduceMotionRef.current = prefersReducedMotion()
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      reduceMotionRef.current = media.matches
    }
    media.addEventListener('change', onChange)

    let cancelled = false
    let becameReady = false
    setStatus('loading')
    setErrorMessage(null)

    let readyPoll: number | null = null
    let readyTimeout: number | null = null

    const shell = shellRef.current
    if (!shell) {
      setStatus('unavailable')
      setErrorMessage(
        'Playback is unavailable right now. Open the track on YouTube instead.',
      )
      return () => {
        media.removeEventListener('change', onChange)
      }
    }

    shell.replaceChildren()
    const mountNode = document.createElement('div')
    mountNode.id = hostId
    shell.appendChild(mountNode)

    const clearReadyWaiters = () => {
      if (readyPoll !== null) {
        window.clearInterval(readyPoll)
        readyPoll = null
      }
      if (readyTimeout !== null) {
        window.clearTimeout(readyTimeout)
        readyTimeout = null
      }
    }

    const markReady = (player: YouTubePlayer) => {
      if (cancelled || becameReady) {
        return
      }
      becameReady = true
      clearReadyWaiters()
      playerRef.current = player
      setStatus('ready')
      try {
        const readyDuration = player.getDuration() || 0
        if (readyDuration > 0) {
          setDuration(readyDuration)
        }
        if (pendingSeekRef.current !== null) {
          player.seekTo(pendingSeekRef.current, true)
          pendingSeekRef.current = null
        } else {
          setCurrentTime(player.getCurrentTime() || 0)
        }
      } catch {
        // Duration can arrive after buffering starts.
      }
      if (playIntentRef.current) {
        try {
          player.playVideo()
        } catch {
          // Ignore until the API becomes fully responsive.
        }
      }
    }

    createYouTubePlayer(mountNode, {
      height: 48,
      width: 48,
      videoId: track.videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: (event) => {
          markReady(event.target)
        },
        onStateChange: (event) => {
          if (cancelled) {
            return
          }
          playerRef.current = event.target
          const state = event.data
          if (state === YT_PLAYER_STATE.PLAYING) {
            setPlaying(true)
            setStatus('ready')
            setErrorMessage(null)
            startTicker()
            readTimes()
          } else if (
            state === YT_PLAYER_STATE.PAUSED ||
            state === YT_PLAYER_STATE.ENDED ||
            state === YT_PLAYER_STATE.CUED
          ) {
            setPlaying(false)
            stopTicker()
            readTimes()
            if (state === YT_PLAYER_STATE.ENDED) {
              playIntentRef.current = false
            }
          } else if (state === YT_PLAYER_STATE.BUFFERING) {
            setStatus('ready')
            startTicker()
          }
        },
        onError: () => {
          if (cancelled) {
            return
          }
          playIntentRef.current = false
          setPlaying(false)
          stopTicker()
          setStatus('unavailable')
          setErrorMessage(
            'This track cannot be played here. Open it on YouTube instead.',
          )
        },
      },
    })
      .then((player) => {
        if (cancelled) {
          try {
            player.destroy()
          } catch {
            // Ignore destroy races during teardown.
          }
          return
        }
        playerRef.current = player
        readyPoll = window.setInterval(() => {
          try {
            const nextDuration = player.getDuration() || 0
            const state = player.getPlayerState()
            if (
              nextDuration > 0 ||
              state === YT_PLAYER_STATE.CUED ||
              state === YT_PLAYER_STATE.PAUSED ||
              state === YT_PLAYER_STATE.PLAYING
            ) {
              markReady(player)
            }
          } catch {
            // Keep polling until the API responds.
          }
        }, 200)
        readyTimeout = window.setTimeout(() => {
          if (cancelled || becameReady) {
            return
          }
          markReady(player)
        }, 5000)
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        setStatus('unavailable')
        setErrorMessage(
          'Playback is unavailable right now. Open the track on YouTube instead.',
        )
      })

    return () => {
      cancelled = true
      stopTicker()
      clearReadyWaiters()
      try {
        playerRef.current?.destroy()
      } catch {
        // Ignore destroy races.
      }
      playerRef.current = null
      shell.replaceChildren()
      media.removeEventListener('change', onChange)
    }
  }, [hostId, playerWanted])

  const canSeek = status !== 'unavailable' && duration > 0
  const progress = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0

  const seekToRatio = (ratio: number) => {
    const player = playerRef.current
    if (!(duration > 0) || status === 'unavailable') {
      return
    }
    const next = clamp(ratio, 0, 1) * duration
    setCurrentTime(next)
    if (!player) {
      pendingSeekRef.current = next
      setPlayerWanted(true)
      return
    }
    try {
      player.seekTo(next, true)
    } catch {
      setErrorMessage('Could not seek this track.')
    }
  }

  const togglePlayback = () => {
    if (status === 'unavailable') {
      return
    }
    const player = playerRef.current
    if (!player) {
      playIntentRef.current = true
      setPlayerWanted(true)
      setStatus('loading')
      return
    }
    try {
      if (playing) {
        playIntentRef.current = false
        player.pauseVideo()
        setPlaying(false)
        stopTicker()
        readTimes()
      } else {
        playIntentRef.current = true
        setErrorMessage(null)
        player.playVideo()
      }
    } catch {
      // Keep the card usable; YouTube may still raise onError if playback fails.
    }
  }

  return (
    <article className="music-card" data-hover-tile="" data-repel="">
      <div className="music-card-surface">
        <img
          className="music-card-photo"
          src="/landing/music-cover.webp"
          alt=""
          width={477}
          height={851}
        />
        <div className="music-card-heading">
          <span className="music-card-icon" aria-hidden="true">
            <img src="/landing/music-aperture.svg" alt="" width={14} height={14} />
          </span>
          <h2 className="music-card-label">My Fav Music</h2>
        </div>
        <ContourSeek
          progress={progress}
          disabled={!canSeek}
          labelledBy={titleId}
          clipId={artClipId}
          onSeek={seekToRatio}
        />
        <div className="music-card-body">
          <div className="music-card-times">
            <span>{formatTime(currentTime)}</span>
            <span className="music-card-duration">
              {duration > 0 ? formatTime(duration) : '--:--'}
            </span>
          </div>
          <div className="music-card-meta">
            <p id={titleId} className="music-card-title">
              {track.title}
            </p>
            <p className="music-card-artist">{track.artist}</p>
          </div>
          {status === 'unavailable' ? null : (
            <button
              type="button"
              className="music-card-play"
              aria-label={
                playing
                  ? `Pause ${track.title} by ${track.artist}`
                  : `Play ${track.title} by ${track.artist}`
              }
              aria-pressed={playing}
              aria-describedby={statusId}
              onClick={togglePlayback}
            >
              {status === 'loading' && !playing ? (
                <span className="music-card-loading-dot" aria-hidden="true" />
              ) : playing ? (
                <PauseBars />
              ) : (
                <PlayTriangle />
              )}
            </button>
          )}
          {errorMessage ? (
            <p className="music-card-error" role="status">
              {errorMessage}{' '}
              <a href={track.youtubeUrl} target="_blank" rel="noreferrer">
                Open on YouTube
              </a>
            </p>
          ) : null}
        </div>
      </div>
      <div ref={shellRef} className="music-card-yt-host" aria-hidden="true" />
      <p id={statusId} className="visually-hidden" role="status">
        {status === 'loading'
          ? 'Loading track.'
          : status === 'unavailable'
            ? errorMessage || 'Track unavailable.'
            : playing
              ? 'Playing.'
              : 'Paused.'}
      </p>
    </article>
  )
}
