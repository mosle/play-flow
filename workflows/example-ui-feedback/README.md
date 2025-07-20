# UI Feedback Example Workflow

This workflow demonstrates PlayFlow's UI injection features.

## Features

### 1. Message Display (showMessage)
- Display messages in various styles (info, warning, error, success)
- 6 position options (top-left, top-center, top-right, bottom-left, bottom-center, bottom-right, center)
- Auto-dismiss or wait for user to close

### 2. Manual Action Overlay (waitForManualAction)
- Clear feedback to users when manual intervention is required
- Darkened backdrop with centered message
- Customizable title and instructions

## Running the Workflow

```bash
# Execute without recording
yarn execute workflows/example-ui-feedback

# Execute with recording
yarn record workflows/example-ui-feedback
```

## Workflow Steps

1. **Welcome Message** - Info message displayed in center
2. **Page Navigation** - Navigate to example.com
3. **Success Notification** - Success message in top-right
4. **Warning Message** - Wait for user to close
5. **Manual Action Wait** - Manual intervention with overlay
6. **Completion Notice** - Success message in bottom-center
7. **Error Example** - Error message in top-center
8. **Position Demo** - Messages in various positions
9. **Screenshot** - Capture demo screenshot
10. **Completion Message** - Wait for user to close

## Customization

Edit `actions.json` to customize message content, styles, display duration, etc.

### showMessage Action Options

```json
{
  "type": "showMessage",
  "message": "Message to display",
  "position": "top-center",  // Display position
  "style": "info",          // Style (info/warning/error/success)
  "duration": 5000,         // Display duration (ms), 0 for manual close
  "closeButton": true,      // Show close button
  "waitForClose": true      // Wait for user to close
}
```

### waitForManualAction Overlay Options

```json
{
  "type": "waitForManualAction",
  "showOverlay": true,
  "overlayOptions": {
    "title": "Title text",
    "instruction": "Detailed instructions",
    "backdrop": true,     // Darken background
    "progress": false     // Show progress bar
  }
}
```