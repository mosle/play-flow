# PlayFlow

**English** | [日本語](./README.ja.md)

A CLI tool that automates web browser operations and records the entire process as a video. Built with Playwright, TypeScript, and yarn.

## Features

- 🎥 Record entire browser operation process as video
- 📝 Define workflows with JSON files
- 🎯 14 rich action types including manual intervention
- ⏱️ Automatically generate detailed timecode logs
- 📸 Take screenshots at any timing
- 🔧 Flexible configuration options
- ✅ Workflow validation feature
- 📍 Video chapter markers for easy navigation (QuickTime compatible)
- 📄 WebVTT subtitle generation for action descriptions

## Requirements

- Node.js 16.0.0 or higher
- yarn
- FFmpeg (required for video recording)

## Installation

```bash
# Clone repository
git clone [repository-url]
cd PlayFlow

# Install dependencies
yarn install

# Run initial setup
yarn setup
```

## Usage

### Basic Commands

```bash
# Execute and record a workflow
yarn record <workflow-name>

# Execute without recording (useful for login/setup)
yarn execute <workflow-name>

# Display available workflows
yarn list

# Validate workflow
yarn validate <workflow-name>

# Initial setup
yarn setup
```

### Creating Workflows

1. Create a new folder in the `workflows/` directory
2. Define actions in `actions.json` file
3. Optionally create `config.json` to apply custom settings

#### Example actions.json

```json
[
  {
    "type": "goto",
    "url": "https://example.com",
    "description": "Navigate to website"
  },
  {
    "type": "click",
    "selector": "button#submit",
    "description": "Click submit button"
  },
  {
    "type": "screenshot",
    "description": "Take a screenshot"
  }
]
```

## Action Types

| Action | Description | Required Parameters |
|--------|-------------|-------------------|
| `goto` | Navigate to URL | `url` |
| `click` | Click element | `selector` |
| `fill` | Fill form field | `selector`, `value` |
| `type` | Type text | `selector`, `text` |
| `press` | Press key | `key` |
| `hover` | Hover over element | `selector` |
| `screenshot` | Take screenshot | - |
| `waitForSelector` | Wait for element | `selector` |
| `waitForTimeout` | Wait for specified time | `timeout` |
| `waitForManualAction` | Wait for manual intervention | - |
| `selectOption` | Select from dropdown | `selector`, `value` |
| `check` | Check checkbox | `selector` |
| `uncheck` | Uncheck checkbox | `selector` |
| `evaluate` | Execute JavaScript | `script` |

### Action Options

All actions support these optional parameters:

| Option | Type | Description |
|--------|------|-------------|
| `description` | string | Human-readable description shown in logs and video markers |
| `skipVtt` | boolean | Skip this action in WebVTT subtitle generation |
| `skipChapter` | boolean | Skip this action in video chapter markers |

#### Example with options

```json
[
  {
    "type": "waitForTimeout",
    "timeout": 3000,
    "description": "Wait for animation",
    "skipVtt": true,
    "skipChapter": true
  }
]

## Configuration

### Global Configuration

Copy `recording-config.default.json` to `recording-config.json` to customize settings.
If `recording-config.json` doesn't exist, settings from `recording-config.default.json` will be used.

```json
{
  "browser": {
    "headless": false,
    "slowMo": 0,
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "defaultTimeout": 30000,      // Default timeout for all actions (ms)
    "navigationTimeout": 30000    // Timeout for navigation actions like goto (ms)
  },
  "video": {
    "size": {
      "width": 1920,
      "height": 1080
    },
    "fps": 30,
    "skipAllVtt": false,      // Skip WebVTT subtitle generation
    "skipAllChapters": false  // Skip chapter marker generation
  }
}
```

### Workflow-specific Configuration

Create `config.json` in your workflow directory to override global settings:

```json
{
  "browser": {
    "headless": true
  },
  "video": {
    "fps": 60,
    "skipAllVtt": true  // Skip all WebVTT subtitles for this workflow
  }
}
```

## Output

All output files are organized in a directory named `[workflow-name]_[timestamp]/`:

- **Video file**: `video.mp4` - Recording with embedded chapter markers
- **Timecode log**: `timecode.txt` - Detailed action timing log
- **Screenshots**: `screenshots/` - Individual screenshots taken during workflow
- **WebVTT subtitles**: `markers.vtt` - Action descriptions as video subtitles
- **Chapter metadata**: `chapters.txt` - Chapter markers in FFMETADATA format

### Timecode Log Example

```
Workflow: example-workflow
Started at: 2025-01-18T14:30:00.000Z
================================================================================

TIME		DURATION	ACTION			DESCRIPTION
--------------------------------------------------------------------------------

00:00.000		+0ms		goto                	Navigate to website
00:01.523		+1523ms		[Completed #1]
00:02.045		+0ms		click               	Click submit button
00:02.567		+522ms		[Completed #2]

--------------------------------------------------------------------------------
Total duration: 2s 567ms
Completed at: 2025-01-18T14:30:02.567Z
```

## Development

```bash
# Build TypeScript
yarn build

# Development mode (watch mode)
yarn dev

# Run tests
yarn test

# Lint
yarn lint

# Type check
yarn typecheck
```

## Manual Intervention

For cases requiring manual action (like Google login, 2FA, CAPTCHA), use `waitForManualAction`:

### Option 1: Wait for specific element
```json
{
  "type": "waitForManualAction",
  "message": "Please complete Google login",
  "continueSelector": "#account-menu",
  "timeout": 300000,
  "description": "Wait for user to complete login"
}
```

### Option 2: Wait for specific text
```json
{
  "type": "waitForManualAction", 
  "message": "Please complete 2FA authentication",
  "continueText": "Welcome back",
  "timeout": 180000,
  "description": "Wait for login success"
}
```

### Option 3: Manual file trigger
```json
{
  "type": "waitForManualAction",
  "message": "Complete the payment process",
  "description": "Wait for manual payment completion"
}
```

For Option 3, create a `.continue` file in the project root when ready to proceed:
```bash
touch .continue
```

## Session Management

The `execute` command allows you to run workflows without recording, which is perfect for:
- Login workflows that save session state
- Setup workflows that prepare the environment
- Any workflow where video recording is not needed

### Example: Google Login Session

1. Create a login workflow and save the session:
```bash
yarn execute example-google-login --save-session google-account
```

2. Use the saved session in other workflows:
```bash
yarn record example-use-google-session --session google-account
```

### Session Commands

```bash
# Save session after execution
yarn execute <workflow> --save-session <session-name>

# Use saved session for recording
yarn record <workflow> --session <session-name>

# Both save and load sessions
yarn record <workflow> --session old-session --save-session new-session
```

Sessions are stored in the `sessions/` directory and include:
- Cookies
- Local storage
- Session storage
- Authentication state

## Video Navigation Features

### Chapter Markers

Videos automatically include chapter markers that appear in QuickTime Player and other compatible video players. Each action becomes a clickable chapter for easy navigation.

To disable chapters for specific actions:
```json
{
  "type": "waitForTimeout",
  "timeout": 5000,
  "skipChapter": true
}
```

### WebVTT Subtitles

Action descriptions are exported as WebVTT subtitles (`markers.vtt`). Most video players can load these as external subtitle tracks.

To disable subtitles for specific actions:
```json
{
  "type": "click",
  "selector": ".button",
  "skipVtt": true
}
```

## Troubleshooting

### FFmpeg not found

Installation methods for each OS:

- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt-get install ffmpeg`
- **Windows**: Download from [official website](https://ffmpeg.org/download.html)

### Video not recording

1. Verify FFmpeg is properly installed
2. Check write permissions for `output/` directory
3. Try disabling browser headless mode

## License

MIT