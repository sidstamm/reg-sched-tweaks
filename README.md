# Rose-Hulman reg-sched tweaks
An addon to make the schedule lookup page a little better.  More info coming soon.

## Installation

## Usage and Features

When installed, this extension modifies the schedule lookup page to have a pretty blue banner to let you know it's active.

### On the main lookup page
* Search buttons are enabled by default so you don't have to click in text fields before submitting forms.
* You can hit "enter" in a text box to submit the relevant form.
* Shortcut button for quickly looking up your own schedule.  There's a `+` button that allows you to store your own username in the browser. Clicking the `me` button next to the `+` submits a username search for whatever you stored.  The username is stored in your browser's localStorage (like a cookie) and will persist across visits to the site.

### When viewing class schedule (course schedule grid)
* If viewing only one section, a link to view all sections is available
* A link to view the class's roster (for one or many sections) is available
* Previous and Next quarter links available to quickly see the schedule of all sections offered in adjacent quarters.

### When viewing a class roster
* If viewing only one section, a link to view all sections is available
* A link to view the class meeting schedule (for one or many sections) is available

### On the "ad-hoc group schedules" page
* A new text box and three buttons (`add`, `find`, `toggle unselected`) allows quick selection of individuals in the list.
  - **add**: entering something in the text box, then clicking the `add` button will cause *ALL* matching entries in the list to be selected
  - **find**: entering something in the text box, then clicking the `find` button will scroll to the first matching entry in the list
  - **toggle unselected**: shows or hides the unselected entries in the list.  This is a quick way to see who you've selected.
* Similar documentation is added to the Ad-Hoc Group Schedules page for quick access.

## Development
Some information about developing extensions and testing them is [here](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/#testing-out-an-extension)

You'll probably want to install Node.js, and then use the `web-ext` node package to configure and run.

### Setup
Install Node.js and web-ext.  Then, create a Firefox profile for testing, using the profile management screen:

- on linux/mac: `firefox --no-remote -P`
- on windows powershell: `& 'C:\Program Files\Mozilla Firefox\firefox.exe' --no-remote -P`

### Running to debug
Once a profile is created, use web-ext to run it:
```
web-ext run --keep-profile-changes --firefox-profile=<profilename>
```

Or you can use the VS Code "Debugger for Firefox" extension and the `.vscode/launch.json` file provided in this repo.