import { enhanceResumeCopy } from './resumeEngine.js'

const MODEL_ID = 'Xenova/LaMini-Flan-T5-77M'
const MAX_NEW_TOKENS = 64
const LOAD_TIMEOUT_MS = 90000

let generatorPromise = null

function withTimeout(promise, ms, message) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

function extractGeneratedText(output) {
  if (typeof output === 'string') return output
  if (Array.isArray(output)) return extractGeneratedText(output[0])
  if (output && typeof output === 'object') {
    if (typeof output.generated_text === 'string') return output.generated_text
    if (Array.isArray(output.generated_text)) {
      const last = output.generated_text[output.generated_text.length - 1]
      if (typeof last === 'string') return last
      if (last?.content) return last.content
    }
  }
  return ''
}

function cleanModelText(raw, fallback) {
  let text = extractGeneratedText(raw)
  text = String(text || '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/^(output|answer|result)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text || text.length < 8) return fallback
  if (/as an ai|language model|i cannot|please provide/i.test(text)) return fallback
  if (text.length > Math.max(220, String(fallback || '').length * 3)) return fallback
  const lowered = text.toLowerCase()
  const promptLeak = /rewrite|paraphrase|resume bullet|professional english/i.test(text)
  if (promptLeak && lowered.includes(String(fallback || '').toLowerCase().slice(0, 18))) return fallback
  return text.charAt(0).toUpperCase() + text.slice(1)
}

async function getGenerator(onProgress) {
  if (!generatorPromise) {
    generatorPromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers')
      env.allowLocalModels = false
      env.allowRemoteModels = true
      env.useBrowserCache = true
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.proxy = false
        env.backends.onnx.wasm.numThreads = 1
      }
      return pipeline('text2text-generation', MODEL_ID, {
        device: 'wasm',
        progress_callback: (event) => {
          if (typeof onProgress !== 'function') return
          const progress = Number(event?.progress)
          const percent = progress > 1 ? Math.round(progress) : Math.round(progress * 100)
          onProgress({
            status: event?.status || 'progress',
            file: String(event?.file || event?.name || event?.model || ''),
            progress: Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0,
          })
        },
      })
    })().catch((error) => {
      generatorPromise = null
      throw error
    })
  }
  return generatorPromise
}

async function rewrite(generator, prompt, fallback) {
  try {
    const output = await generator(prompt, { max_new_tokens: MAX_NEW_TOKENS })
    return cleanModelText(output, fallback)
  } catch {
    return fallback
  }
}

async function rewriteResumeWithModel(resume, generator, onProgress) {
  const next = JSON.parse(JSON.stringify(resume))
  const role = next.targetRole || 'professional'
  onProgress?.({ status: 'ready', progress: 100, file: MODEL_ID })

  next.summary = await rewrite(
    generator,
    `Rewrite this as a 3-sentence professional resume summary for a ${role}. Keep facts only:\n${next.summary}`,
    next.summary,
  )

  for (const job of next.experience || []) {
    const polished = []
    for (const bullet of job.bullets || []) {
      polished.push(
        await rewrite(
          generator,
          `Rewrite as one professional resume bullet. Keep facts. Do not add employers or dates:\n${bullet}`,
          bullet,
        ),
      )
    }
    job.bullets = polished
  }

  for (const project of next.projects || []) {
    const polished = []
    for (const bullet of project.bullets || []) {
      polished.push(
        await rewrite(
          generator,
          `Rewrite as one professional project bullet. Keep facts only:\n${bullet}`,
          bullet,
        ),
      )
    }
    project.bullets = polished
  }

  next.polishSource = 'on-device'
  return next
}

export async function polishResumeOnDevice(resume, { onProgress } = {}) {
  const local = enhanceResumeCopy(resume)
  try {
    const generator = await withTimeout(
      getGenerator(onProgress),
      LOAD_TIMEOUT_MS,
      'On-device model took too long to load.',
    )
    return await rewriteResumeWithModel(local, generator, onProgress)
  } catch (error) {
    generatorPromise = null
    local.polishSource = 'engine'
    local.polishNote = error?.message || 'Used Guardian AI writer because the Hugging Face model could not load.'
    return local
  }
}

export function resetOnDeviceModelCache() {
  generatorPromise = null
}
