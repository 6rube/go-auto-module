# go-auto-module README

go-auto-module can create and link local modules with just one command.
I created this extension because i think that linking all modules induvidually is annoying. 

## Features

Before you create a new Module open the file where you want to import the new Module.

To create a local module just open the command window with 
```win + p``` and then type in ```Create Local Go Module```
and press ```Enter```.

To Build Locally (Create vsix file):
```bash
vsce package
```

To install:
- Donwload Release
- open vscode
- press ```win + p```
- Type ```Install from VSIX```
- Press ```Enter```
- Select the VSIX
- Press ```Install```

## Requirements
- yeoman
- generator-code
- vsce


None

## Extension Settings

None

## Known Issues

None

## Release Notes

### 1.0.0

Initial release