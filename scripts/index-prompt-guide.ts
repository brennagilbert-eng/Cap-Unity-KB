import 'dotenv/config';
import { upsertDocument } from '../server/lib/embeddings.js';

const CHUNK_SIZE = 1500;
const OVERLAP = 225;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start += CHUNK_SIZE - OVERLAP;
  }
  return chunks.filter((c) => c.length > 50);
}

const CONTENT = `The Wonderful World of AI and Prompt Engineering — Capacity Internal Guide

IMPORTANT SETTINGS
- ALWAYS set temperature to 0 to avoid hallucination
- ALWAYS turn off groundedness toggle (unless needed)
- Use GPT-4o or newer model
- Set tokens high to maintain conversation context

AGENTIC CARD BACKGROUND PROMPTS (AI Agent Card runs these in order)
1. Variable Collection Prompt - collects variables
2. Answering Prompt - answers user question
3. Quick Reasoning Prompt - decides whether to exit agent card (DONE/WAIT)
4. Resolution Prompt - determines resolution
5. Groundedness Prompt - grounds the answers

Issues caused by hidden prompts: Agent ignoring user instructions, unreliable exit behavior, agents not continuing to next GC steps.

HOW TO REPLACE HIDDEN PROMPTS using XML tags:
<agent:quick_reasoning>your instructions</agent:quick_reasoning>
<agent:variable_collection>your instructions</agent:variable_collection>
<agent:answering>your instructions</agent:answering>
<agent:resolution>your instructions</agent:resolution>
<agent:filler>your instructions</agent:filler>

TEMPERATURE / MODEL / TOKEN DEFINITIONS
- Temperature 0 = no creativity, no hallucination; 1-2 = very creative, very hallucinative
- Model = the LLM (GPT-4.1, Gemini, Claude-sonnet, etc.)
- Tokens = total context allowed (character limit for conversation history)
- Variables = agents do NOT have memory. The full conversation is sent with every message. Variables must be provided in the prompt or via tool call responses.

CONTEXT — How to provide context per experience
- Basic GPT endpoints: add variables/data directly to card
- Assistant Card: add variables/data directly to card
- Agent Card: add variables/data to card, OR tell agent to use a tool and reference output
- GSE Beta: tell agent to use a tool and reference output
Answer Engine is Capacity's secret sauce — indexing allows providing really good context to agents, improving quality and reliability.

TOOLS — How agents use them
1. Agent requests tools be run, providing inputs/parameters
2. Capacity's system runs the function and returns output to Agent
3. Agent handles the returned data per prompt instructions

Rules for referencing tools in prompts:
- Make sure agent response is the LAST step
- Be explicit: use the [tool name] tool to...
- Define which inputs (parameters) to use and how to use outputs
- ALWAYS define data type (integer, string, json object/array) — wrong datatype causes tool call failures
- Update Dev Platform titles and descriptions for better results
- Limit tools to 5-7 max — agents fall apart with too many tools

Search tool backend names: answer_engine_search, vector_search, tavily_web_search, tavily_answer_search

GENERAL PROMPT RULES — treat the agent like a middle schooler
1. Put names in quotation marks
2. Define proper nouns and concepts — never assume agent knows company-specific terms
3. Use Markdown Headers and Spacing to indicate sections
4. Use Numbered Lists to imply order of operations
5. Use Bullet Lists when order is unimportant
6. Always include an Order of Operations section when using tools
7. Provide examples of desired responses
8. Have a Response Rules section — situational rules near relevant steps, general rules in their own section

PROCESS / ORDER OF OPERATIONS
- Almost every agentic experience needs an Order of Operations section
- Agent response must be the LAST step
- Use numbered lists
- Explicit instructions for EVERYTHING
- Repetition only when it does not conflict with prior instructions
- Limit tools (5-7 max)
- Keep instructions as concise as possible

FORMATTING BEST PRACTICES
- Agents do really well with Markdown (# headers, ## subheaders, bullets, numbers)
- Use ALL CAPS for critical/important things
- Use # headers to create hierarchy
- Always provide examples for: response formatting, how to handle edge cases

DEBUGGING AGENT CARD
Add this to prompt for tool call debugging:
## Tool Call Verification (Development Mode)
CRITICAL: After ANY tool call, verify actual result before reporting success.
If tool returns error, report failure with: tool name, error type, failed parameter, error value, full error message.
Error type reference:
- Unexpected keyword argument = parameter name not accepted by this tool
- Input should be a valid string = wrong data type (number instead of string)
- Missing required argument = required parameter was not provided

VARIABLE COLLECTION PROMPT PATTERN
Use a single concise question to collect ALL missing required variables at once.
Response must be valid JSON: { "variables": { "varName": "value" }, "message": "follow-up text" }
Never ask for variables not listed in the missing information section.
Validate obvious formats (email, phone, date) and politely re-ask if invalid.

QUICK REASONING PROMPT PATTERN
DONE — user expressed satisfaction, said no further questions, explicitly ended conversation.
WAIT — assistant asked a question needing response, more info needed, user query ambiguous, follow-up points remain.
Default to WAIT unless user clearly and explicitly closes the conversation.`;

async function main() {
  const chunks = chunkText(CONTENT);
  console.log(`Indexing Capacity Prompt Engineering Guide: ${chunks.length} chunks`);
  for (let i = 0; i < chunks.length; i++) {
    await upsertDocument({
      source: 'drive',
      source_id: `drive:capacity-prompt-engineering-guide:${i}`,
      title: 'Capacity AI Prompt Engineering Guide',
      content: chunks[i],
      url: 'https://docs.google.com/document/d/1xRUoG86ZLWJs_oCCx90LZfVzdOb43eSgol9vxOMs8A8/edit',
      author: 'capacity-internal',
    });
    console.log(`  chunk ${i + 1}/${chunks.length} done`);
  }
  console.log('Done!');
}

main().catch((err) => { console.error(err); process.exit(1); });
