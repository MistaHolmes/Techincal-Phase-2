
# Team Split (9 Members)

## **1. Abhash — Backend + DevOps Lead (Critical Path)**

**Owns:** `db/`, `scheduler/`, Docker, config

* PostgreSQL schema + queries (`schema.sql`, `database.py`)
* Leaderboard, streak logic
* APScheduler + job persistence
* Docker Compose (Postgres, Redis, Bot)
* Env config + deployment pipeline


## **2. Suprit — Bot Core & Orchestration**

**Owns:** `bot.py`

* Discord bot initialization
* Cog loading system
* `active_sessions` in-memory state
* Global error handling
* Slash command sync


## **3. Abhinash — Study Session Engine**

**Owns:** `cogs/study.py`

* `/study start`, `/study end`
* Pomodoro loop (async tasks)
* Session lifecycle handling
* Trigger quiz + voice + summary hooks

---

## **4. Soumya — RAG Command Layer**

**Owns:** `cogs/rag.py`

* `/ask` command
* Calls RAG pipeline
* Formats answers + citations
* Handles empty/no-data cases

---

## **5. Subham — Quiz System (Frontend + State)**

**Owns:** `cogs/quiz.py`

* Quiz embed generation
* Reaction handling (`on_raw_reaction_add`)
* Vote tracking
* Quiz state machine (OPEN → LOCKED)

---

## **6. Kiran — AI Pipeline (Core Intelligence)**

**Owns:** `rag/`

* `pipeline.py` → retrieval
* `embeddings.py`
* `quiz_engine.py` (GPT JSON MCQs)
* `summariser.py` (session summary)

---

## **7. Jenny — Voice + Transcription**

**Owns:** `cogs/voice.py`, `utils/audio.py`

* Voice channel join/leave
* PCM audio capture
* Buffer handling
* Whisper integration (local/cloud)

---

## **8. Pratyush — Scheduling + Command Integration**

**Owns:** `cogs/schedule.py`

* `/schedule` command
* Timezone handling
* Reminder triggers
* Connects to APScheduler (Abhash)

---

## **9. Mustakim — UI + Embeds + Testing**

**Owns:** `utils/embeds.py`, `tests/`

* All embed formatting (colors, layouts)
* Leaderboard UI rendering
* Error message formatting
* Unit tests (quiz, rag, db mocks)

---

# Clean Responsibility Map

| Area         | Owner    |
| ------------ | -------- |
| Bot Core     | Suprit   |
| Sessions     | Abhinash |
| Quiz         | Subham   |
| RAG Command  | Soumya   |
| AI Logic     | Kiran    |
| Voice        | Jenny    |
| Database     | Abhash   |
| Scheduling   | Pratyush |
| UI + Testing | Mustakim |

---

# Execution Note (important)

* **Kiran (AI)** + **Soumya (RAG)** must sync early → `/ask` depends on pipeline
* **Abhash (DB)** + **Pratyush (Scheduler)** tightly coupled
* **Subham (Quiz)** depends on Kiran (quiz generation)
* **Abhinash (Study)** depends on everyone (central orchestrator)
