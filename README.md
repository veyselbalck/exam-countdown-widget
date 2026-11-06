# Exam Countdown

A lightweight, customizable countdown widget for exams, tests, and important dates on the Windows desktop. Set an event name, date, and time in the app, then keep the countdown in view while you work.

## Features

- First-run setup for any exam, test, or important date
- Custom event name, date, and start time
- Forest, Midnight, and Light themes
- Adjustable background opacity
- Optional Windows startup, disabled by default
- Opens in the top-right corner without staying above other apps
- Saves settings locally on your computer
- Portable Windows `.exe`

## Download and use

Download `Exam Countdown 1.0.0.exe` from the project's **Releases** page and run it. Enter your event name, date, and time, then select **Save and view countdown**. To make changes later, select **Settings** on the widget.

The app does not start with Windows unless you enable **Launch with Windows** in settings.

## Run from source

Install Node.js, then open a terminal in the project folder:

```powershell
npm install
npm start
```

To build the portable Windows app:

```powershell
npm run dist
```

The `.exe` is created in the `dist` folder. `dist` is excluded from Git, so attach the executable to a GitHub Release if you want people to download it directly.

## Publish with GitHub Desktop

1. In GitHub Desktop, select **File > Add Local Repository** and choose the `exam-countdown-widget` folder.
2. If prompted, choose the option to create a repository in that folder.
3. Enter a commit summary such as `Initial release`, then select **Commit to main**.
4. Select **Publish repository** and choose whether the repository should be public or private.

The app's settings are stored in the user's local application data folder and are not added to the repository.