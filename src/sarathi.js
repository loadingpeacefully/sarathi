/**
 * sarathi.js — Claude API client + lesson context engine
 *
 * Responsibilities:
 *   - Load lesson JSON from /lessons/
 *   - Build the Claude system prompt from lesson context
 *   - generateOptions(): vision call → 3 prompt suggestions
 *   - askFollowup(): follow-up call → response text + optional [CIRCLE] tag
 *   - Maintain conversation history for multi-turn context
 *   - Parse annotation tags from Claude's response
 *
 * All Claude calls go through this file. Nothing else touches the Anthropic API.
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const CLAUDE_MODEL = 'claude-sonnet-4-6'
const LESSONS_DIR = path.join(__dirname, '..', 'lessons')
const API_TIMEOUT_MS = 15000
const MAX_CONVERSATION_TURNS = 6

// Conversation history for multi-turn context
// Stores { role, content } objects. Reset on each new hotkey press.
let conversationHistory = []

// ─── LESSON LOADER ────────────────────────────────────────────────────────────

function loadAvailableLessons () {
  const lessonFiles = fs.readdirSync(LESSONS_DIR).filter(f => f.endsWith('.json'))

  return lessonFiles.map(filename => {
    const filePath = path.join(LESSONS_DIR, filename)
    const lessonJson = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return { filename, lessonJson }
  })
}

function loadLesson (filename) {
  const filePath = path.join(LESSONS_DIR, filename)
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

// ─── SYSTEM PROMPT BUILDER ────────────────────────────────────────────────────

function buildSystemPrompt (lessonJson) {
  const conceptsText = lessonJson.concept_definitions
    .map(c => `- ${c.concept}: ${c.definition}`)
    .join('\n')

  const warmupText = lessonJson.warmup_qa
    .map(qa => `  Q: ${qa.q}\n  A: ${qa.a}`)
    .join('\n')

  const checkpointText = lessonJson.checkpoint_qa
    .map(qa => `  Q: ${qa.q}\n  A: ${qa.a}${qa.marks ? ` [${qa.marks} marks]` : ''}`)
    .join('\n')

  const errorsText = lessonJson.common_errors
    .map(e => `- ${e}`)
    .join('\n')

  return `You are Sārathi, a silent AI co-pilot for a BrightChamps coding teacher in a live 1:1 class.

LESSON LOADED:
Title: ${lessonJson.lesson_title}
Topics: ${lessonJson.topics_covered}
Objective: ${lessonJson.objective}
Platform: ${lessonJson.tool}
Duration: ${lessonJson.duration_mins} minutes

LESSON CONCEPTS:
${conceptsText}

WARMUP Q&A:
${warmupText}

CHECKPOINT Q&A:
${checkpointText}

COMMON ERRORS IN THIS LESSON:
${errorsText}

YOUR ROLE:
- You assist the teacher, not the student. Use teacher language — direct and professional.
- Every response must be grounded in the lesson content above. Do not invent.
- Be concise. Maximum 3 sentences for explanations. 1 sentence for direct answers.
- No padding, no "Great question!", no student-facing encouragement.
- You have multi-turn memory within this hotkey session. Reference earlier parts of the conversation when relevant.

OUT-OF-SCOPE HANDLING:
If the teacher asks something outside this lesson's scope:
1. Briefly acknowledge: "That's outside today's lesson on ${lessonJson.lesson_title}."
2. Suggest a relevant question they could ask instead, based on what's visible on screen or the lesson concepts above.
3. Never leave the teacher at a dead end.

ANNOTATION RULE:
If your response references a specific element visible on the teacher's screen, end your response with a pointer annotation tag: [POINT:x,y]
Where x and y are pixel coordinates of what you want to point at.
The screenshot resolution is 1920x1080. Use coordinates in that space.
Only annotate when it genuinely helps. Do not annotate for general explanations.`
}

// ─── GENERATE OPTIONS ─────────────────────────────────────────────────────────

/**
 * First call after hotkey. Sends screenshot to Claude vision.
 * Resets conversation history for a fresh session.
 *
 * Returns: { options: ['option 1', 'option 2', 'option 3'] }
 */
async function generateOptions (screenshotBase64, lessonJson) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set in .env')
  }

  // New hotkey press = new conversation
  conversationHistory = []

  const systemPrompt = buildSystemPrompt(lessonJson)

  const userMessage = `Look at this screenshot from the teacher's screen.

Identify what is visible: is it a lesson slide, a code editor, a browser with code.org, or something else?

Then generate exactly 3 short prompt suggestions that this teacher might want to ask right now, given what's on screen and the lesson being taught.

Rules for options:
- Each option must be max 8 words
- Make them specific to what's visible on screen
- Write them as teacher questions (e.g. "Explain the setTimeout error here")
- Do not use generic options like "Help me with this lesson"

Format your response EXACTLY like this — nothing else:
OPTIONS:
1. [option 1]
2. [option 2]
3. [option 3]`

  const requestBody = {
    model: CLAUDE_MODEL,
    max_tokens: 256,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: screenshotBase64
            }
          },
          {
            type: 'text',
            text: userMessage
          }
        ]
      }
    ]
  }

  const responseText = await callAnthropicAPI(requestBody)
  const options = parseOptions(responseText)

  return { options }
}

// ─── ASK FOLLOWUP ─────────────────────────────────────────────────────────────

/**
 * Follow-up call after teacher selects an option or types a question.
 * Maintains conversation history for multi-turn context.
 *
 * Returns: { responseText: string, circleTag: { x, y, r } | null }
 */
async function askFollowup (question, screenshotBase64, lessonJson) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set in .env')
  }

  const systemPrompt = buildSystemPrompt(lessonJson)

  // Always include the screenshot so Claude can see what to point at
  const userContent = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: screenshotBase64
      }
    },
    {
      type: 'text',
      text: question
    }
  ]

  // Add this turn to history
  conversationHistory.push({
    role: 'user',
    content: userContent
  })

  // Trim history to prevent token overflow
  if (conversationHistory.length > MAX_CONVERSATION_TURNS * 2) {
    // Keep the first turn (has the screenshot) and the most recent turns
    conversationHistory = [
      conversationHistory[0],
      ...conversationHistory.slice(-(MAX_CONVERSATION_TURNS * 2 - 1))
    ]
  }

  const requestBody = {
    model: CLAUDE_MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: conversationHistory
  }

  const rawResponse = await callAnthropicAPI(requestBody)

  // Add assistant response to history
  conversationHistory.push({
    role: 'assistant',
    content: rawResponse
  })

  const pointTag = parsePointTag(rawResponse)
  const responseText = rawResponse.replace(/\[POINT:\s*\d+\s*,\s*\d+\s*\]/g, '').trim()

  return { responseText, pointTag }
}

// ─── ANTHROPIC API CALL ───────────────────────────────────────────────────────

/**
 * Low-level HTTP call to the Anthropic messages API.
 * Times out after API_TIMEOUT_MS (15 seconds).
 */
function callAnthropicAPI (requestBody) {
  return new Promise((resolve, reject) => {
    const bodyString = JSON.stringify(requestBody)

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(bodyString)
      },
      timeout: API_TIMEOUT_MS
    }

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', chunk => { data += chunk })

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)

          if (parsed.error) {
            reject(new Error(`Anthropic API error: ${parsed.error.message}`))
            return
          }

          if (!parsed.content || !parsed.content[0]) {
            reject(new Error('Anthropic API returned empty response'))
            return
          }

          resolve(parsed.content[0].text)
        } catch (err) {
          reject(new Error(`Failed to parse Anthropic response: ${err.message}`))
        }
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timed out — the AI took too long to respond. Try again.'))
    })

    req.on('error', (err) => {
      reject(new Error(`Network error calling Anthropic API: ${err.message}`))
    })

    req.write(bodyString)
    req.end()
  })
}

// ─── RESPONSE PARSERS ─────────────────────────────────────────────────────────

function parseOptions (responseText) {
  const lines = responseText.split('\n')
  const options = []

  for (const line of lines) {
    const match = line.match(/^\d+\.\s+(.+)$/)
    if (match) {
      options.push(match[1].trim())
    }
  }

  if (options.length < 3) {
    return [
      'What is on screen right now?',
      'How should I explain this concept?',
      'What is the correct answer here?'
    ]
  }

  return options.slice(0, 3)
}

function parsePointTag (responseText) {
  const match = responseText.match(/\[POINT:\s*(\d+)\s*,\s*(\d+)\s*\]/)
  if (!match) return null

  return {
    x: parseInt(match[1], 10),
    y: parseInt(match[2], 10)
  }
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

module.exports = {
  loadAvailableLessons,
  loadLesson,
  generateOptions,
  askFollowup
}
