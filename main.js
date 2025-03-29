import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const SUPABASE_URL = 'https://bdpypmaepvkldkziesuy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcHlwbWFlcHZrbGRremllc3V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNzg5NTQsImV4cCI6MjA1ODc1NDk1NH0.Ky6ezteIa6WVo8N-DEk8Hnx9CyYXIN7C7EIwKUaiSpo'
const BUCKET_NAME = 'videos'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const videoEl = document.getElementById('video')
const dateTimeEl = document.getElementById('date-time')
const soundToggle = document.getElementById('sound-toggle')

let videoQueue = []
let allVideos = []

function shuffleArray(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

async function fetchAllVideos() {
  const { data, error } = await supabase
    .from('video_metadata')
    .select('*')

  if (error || !data || data.length === 0) {
    console.error('Error fetching videos:', error)
    return []
  }

  return data
}

async function prepareQueue() {
  if (videoQueue.length === 0) {
    videoQueue = shuffleArray(allVideos)
  }
}

async function getNextVideo() {
  await prepareQueue()
  const next = videoQueue.pop()

  const { data: publicUrlData, error } = await supabase
    .storage
    .from(BUCKET_NAME)
    .getPublicUrl(next.file_path)

  if (error) {
    console.error("Error getting video URL:", error)
    return null
  }

  return {
    url: publicUrlData.publicUrl,
    metadata: next
  }
}

function updateSoundLabel() {
  soundToggle.textContent = videoEl.muted ? "Unmute" : "Mute"
}

soundToggle.addEventListener('click', () => {
  videoEl.muted = !videoEl.muted
  updateSoundLabel()
})

function updateMetadataUI(videoData) {
  dateTimeEl.innerHTML = `${videoData.metadata.date} &nbsp; ${videoData.metadata.time}`
  updateSoundLabel()
}

async function loadAndPlayVideo() {
  const videoData = await getNextVideo()
  if (!videoData) return

  videoEl.src = videoData.url
  videoEl.play()
  updateMetadataUI(videoData)
}

videoEl.addEventListener('ended', loadAndPlayVideo)

async function start() {
  allVideos = await fetchAllVideos()
  videoQueue = shuffleArray(allVideos)
  await loadAndPlayVideo()
}

start()
