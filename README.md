# Rix — Interface Layer (iOS)

The **interface layer** described in [`pdr/frontend_prd.md`](pdr/frontend_prd.md): a
React Native + Expo app that onboards the user, captures input (typed or
spoken→transcribed), writes it to a local-storage "mailbox", reads the matching
output the logic layer produces, and renders it (and optionally speaks it).

This repo is **front end only**. It knows nothing about how output is produced
(agent reasoning, LLM calls, browser automation) — that's the teammate's Swift
side. The two sides meet at one shared JSON file (see [Storage contract](#storage-contract)).

**Built on Expo SDK 54** — runs in the standard **Expo Go** app (runtime
`exposdk:54.0.0`). Make sure your Expo Go install supports SDK 54.

## Quick start (Windows, no Mac needed)

```bash
npm install --legacy-peer-deps   # peer-dep flag needed for the current Expo tree
npx expo start                   # then scan the QR code with Expo Go on your iPhone
```

Open **Expo Go** on a real iPhone and scan the QR code. The app runs entirely in
Expo Go — `expo-speech`, `expo-audio`, `expo-file-system`, and `expo-crypto` all
work without a custom native build.

### Demo it end-to-end before the Swift side exists

`EXPO_PUBLIC_DEV_ECHO=true` (also a **Settings → Developer → Simulate responses**
toggle) makes the interface auto-write a fake `done` output a moment after each
input, so the whole flow renders on its own. Turn it off once the real logic
layer is writing outputs.

## Configuration (`.env`)

Copy [`.env.example`](.env.example) to `.env` and fill in values. Only vars
prefixed `EXPO_PUBLIC_` are inlined into the app.

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_OPENAI_API_KEY` | OpenAI key for Whisper speech-to-text. Blank → Voice mode shows a clear "not configured" error instead of crashing. |
| `EXPO_PUBLIC_RESPONSE_TIMEOUT_MS` | How long to wait for a matching output before a timeout error (default `18000`). |
| `EXPO_PUBLIC_DEV_ECHO` | `true`/`false` default for the "Simulate responses" demo toggle. |

> ⚠️ **Security note:** an `EXPO_PUBLIC_` key is shipped *inside the app bundle*
> and can be extracted. Fine for a dev/MVP key on a frontend-only build, but for
> production move transcription behind your own backend rather than embedding the
> raw OpenAI key.

## Storage contract

The interface and the Swift logic layer share a single flat JSON file,
`agent_mailbox.json`, in the app's document directory
(`FileSystem.documentDirectory`). **The interface only writes `inputs` and only
reads `outputs`** (the one exception is the dev-echo simulator, which exists
solely so the UI is demoable alone).

```jsonc
{
  "inputs": [
    {
      "id": "uuid-v4",
      "createdAt": "2026-06-19T14:03:00Z",
      "mode": "voice",                 // "voice" | "chat"
      "inputText": "search chrome for cheap flights to lisbon"
    }
  ],
  "outputs": [
    {
      "id": "uuid-v4",                 // matches the input id it answers
      "status": "done",                // "pending" | "done" | "error"
      "outputText": "Done — opened a Lisbon flight search in Chrome.",
      "error": null
    }
  ]
}
```

The interface writes an input, then polls `outputs` for an entry with the same
`id` whose `status` is `done` or `error`. The PRD shows the entries as single
objects; this implementation uses `inputs`/`outputs` **arrays** so multiple
messages per session work. **Confirm this exact shape and file location with the
Swift side before building against it** (PRD §12).

## Project layout

```
app/                       # Expo Router (file-based routes)
  _layout.tsx              # providers + hydration gate
  index.tsx                # first launch → onboarding, else → home
  onboarding/
    welcome.tsx            # §6.1 Welcome
    mode.tsx               # §6.2 Mode Selection (two large cards)
    permissions.tsx        # §6.3 Microphone permission
  home.tsx                 # renders Chat or Voice per saved mode
  settings.tsx             # §6.6 font size / contrast / TTS / mode / dev
src/
  settings.tsx             # SettingsContext (AsyncStorage) + derived theme
  theme.ts                 # palette (white/cream/light blue/light pink) + font scale
  mailbox.ts               # JSON file IO, polling, dev-echo simulator
  transcribe.ts            # OpenAI Whisper STT
  speech.ts                # expo-speech TTS wrapper
  components/
    Screen.tsx  Button.tsx  AppHeader.tsx
    ChatScreen.tsx         # §6.4 chat bubbles, send, loading, timeout
    VoiceScreen.tsx        # §6.5 big-button state machine
```

## Accessibility & theming

- **Palette:** white / cream / light blue / light pink. Default theme targets
  WCAG AA text contrast; **High Contrast** targets 7:1+.
- App-wide **font size** (Default / Large / Extra Large / Maximum) scales all text.
- State is never signalled by colour alone (labels, icons, borders too).
- Custom controls (big button, mode cards) carry explicit
  `accessibilityLabel` / `accessibilityHint` / `accessibilityRole`.
- Voice-mode errors are both visible **and** spoken aloud.

## Notes for final assembly

This layer is meant to be compiled into the same Xcode project as the Swift code
for production (`eas build` can produce the combined project) so both sides share
one document directory. The teammate will likely own the final Xcode-side
assembly. See PRD §9 / §12.
```
