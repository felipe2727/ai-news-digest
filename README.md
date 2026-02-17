# AI News Digest

An automated pipeline that fetches AI news from Reddit, YouTube, news sites, and GitHub, scores items using hybrid keyword + semantic scoring, summarizes them with Google Gemini, and delivers a formatted HTML email digest on a schedule.

## How It Works

```
Fetch (20+ sources)  -->  Dedup  -->  Keyword Score  -->  Semantic Rerank  -->  AI Summarize  -->  Email
     ~3 seconds                       regex matching      Gemini embeddings     Gemini Flash       Gmail SMTP
```

### Pipeline

1. **Fetch** - Pulls content from 20+ RSS feeds and GitHub concurrently (8 threads)
2. **Dedup** - Filters out items already sent in previous digests (30-day memory)
3. **Keyword Score** - Regex-based keyword matching across 7 configurable topics (title matches weighted 3x)
4. **Semantic Rerank** - Gemini embeddings compute cosine similarity between items and topic descriptions, boosting relevant items and rescuing ones that keywords missed
5. **Summarize** - Gemini 2.0 Flash generates 2-3 sentence summaries per item, an executive overview, and top 3 project recommendations
6. **Email** - Sends a styled HTML digest via Gmail SMTP

### Sources

| Type | Sources |
|------|---------|
| Reddit | r/LocalLLaMA, r/artificial, r/MachineLearning, r/singularity, r/ChatGPT, r/ClaudeAI, r/StableDiffusion, r/OpenAI |
| YouTube | Two Minute Papers, AI Explained, Matt Wolfe, TheAIGRID, Fireship, Yannic Kilcher, Wes Roth |
| News | Google News AI, Google News LLM, The Verge AI, TechCrunch AI, Ars Technica |
| GitHub | Trending repos + API search (machine-learning, llm, generative-ai) |

### Hybrid Scoring System

Scoring happens in two passes:

**Pass 1: Keyword Scoring** — Fast regex matching against configured keywords. Title matches count 3x, content matches count 1x, multiplied by topic weight. All items are kept (including zero-score) for the semantic pass.

**Pass 2: Semantic Reranking** — Uses Gemini `gemini-embedding-001` (free tier) to embed item titles/snippets and topic descriptions, then computes cosine similarity. Each item receives a semantic bonus (up to +20 points). Items with no keyword matches but high semantic similarity (>0.65) are "rescued" and assigned to the best-matching topic.

| Topic | Weight | Example Keywords | Semantic Description |
|-------|--------|-----------------|---------------------|
| Coding Assistants | 10 | claude code, codex, cursor, copilot | AI coding tools, developer productivity, IDE integrations |
| Open Source AI | 9 | llama, mistral, qwen, deepseek | Open source ML models, released weights, community projects |
| Breaking News | 8 | announced, launches, new model, SOTA | Major AI announcements, model releases, benchmarks |
| Media Generation | 8 | video generation, stable diffusion, flux | AI video/image/voice generation, creative AI tools |
| AI Agents | 8 | ai agent, multi-agent, mcp | Autonomous agents, tool use, function calling |
| Entrepreneurship | 7 | startup, SaaS, indie hacker, funding | AI startups, SaaS businesses, revenue generation |
| GitHub Repos | 6 | github, trending, framework, library | Notable repositories, frameworks, CLI utilities |

### Email Sections

Each digest email includes:
- **TL;DR** - AI-generated executive summary of the day's news
- **Topic Sections** - Grouped items with source badges, clickable titles, and AI summaries
- **Top 3 Projects** - AI-recommended projects worth exploring based on the digest

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/felipe2727/ai-news-digest.git
cd ai-news-digest
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file:

```
GEMINI_API_KEY=your_gemini_api_key_here
GMAIL_ADDRESS=your_email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

- **Gemini API key**: Get one for free at [Google AI Studio](https://aistudio.google.com/apikey)
- **Gmail App Password**: Requires 2-Step Verification enabled. Generate one at [Google App Passwords](https://myaccount.google.com/apppasswords)

### 4. Run

```bash
# Full run - fetch, score, summarize, and send email
python main.py --force

# Dry run - fetch and score only, prints results (no AI or email)
python main.py --dry-run --force

# Normal run - respects the 2-day interval since last run
python main.py
```

## Deployment (GitHub Actions)

The included workflow runs the digest automatically every 2 days at 9:00 AM UTC. It can also be triggered manually from the Actions tab.

### Setup

1. Push the repo to GitHub
2. Go to **Settings > Secrets and variables > Actions**
3. Add these repository secrets:
   - `GEMINI_API_KEY`
   - `GMAIL_ADDRESS`
   - `GMAIL_APP_PASSWORD`
4. Go to the **Actions** tab and click **"Run workflow"** to test

The workflow commits updated state files (`state/seen_items.json`, `state/last_run.json`) back to the repo after each run so deduplication persists between runs.

## Project Structure

```
ai-news-digest/
├── main.py              # Orchestrator - wires the full pipeline
├── fetchers.py          # RSS, GitHub API, and GitHub trending scrapers
├── scorer.py            # Hybrid keyword + semantic scoring and grouping
├── dedup.py             # Deduplication with 30-day seen-item memory
├── summarizer.py        # Google Gemini API integration (summaries + recommendations)
├── emailer.py           # HTML/plaintext email rendering and SMTP sending
├── models.py            # Data classes (NewsItem, DigestSection, Digest)
├── config.yaml          # Sources, topics, scoring weights, schedule
├── requirements.txt     # Python dependencies
├── templates/
│   └── digest.html      # Jinja2 HTML email template
├── state/
│   ├── seen_items.json  # Dedup registry (committed for persistence)
│   └── last_run.json    # Last run timestamp
├── .github/
│   └── workflows/
│       └── digest.yml   # GitHub Actions scheduled workflow
└── .env                 # API keys and credentials (not committed)
```

## Configuration

Edit `config.yaml` to customize:

- **`schedule.interval_days`** - How often to send (default: 2)
- **`schedule.max_items_in_digest`** - Max items per digest (default: 30)
- **`schedule.lookback_hours`** - How far back to fetch content (default: 52)
- **`topics`** - Add/remove topics, keywords, semantic descriptions, and scoring weights
- **`sources`** - Add/remove RSS feeds, subreddits, YouTube channels, or GitHub search queries
- **`email.recipients`** - Add more email recipients

## Rate Limits

- **Gemini 2.0 Flash** (summaries): 15 RPM free tier. The summarizer adds a 4-second delay between calls. A full 30-item digest takes ~2 minutes to summarize.
- **Gemini Embeddings** (semantic scoring): 100 texts/minute free tier. Items are capped at ~83 per run to stay under the limit in a single API call.
