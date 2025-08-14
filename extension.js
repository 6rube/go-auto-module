// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('go-auto-module is now active!');

	// Create a local go module Command
	const disposable = vscode.commands.registerCommand('go-auto-module.createLocalGoModule', async function () {

		// Request new module name
		const moduleName = await vscode.window.showInputBox({
			placeHolder: 'Enter the name of the Go module'
		});

		if (moduleName) {
			vscode.window.showInformationMessage(`Creating local go module: ${moduleName}`);
			if (await create_module(moduleName)) {
				vscode.window.showInformationMessage(`Creation complete: ${moduleName}`);
			} else {
				vscode.window.showErrorMessage(`Failed to create module: ${moduleName}`);
			}
		} else {
			vscode.window.showInformationMessage('No module name provided');
		}
	});
	context.subscriptions.push(disposable);

}


async function isExactlyWorkspaceRoot(testPath) {
  const uri = vscode.Uri.file(testPath);
  const wsFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!wsFolder) return false;
  // Check exact match with that folder’s root
  const a = wsFolder.uri.fsPath;
  const b = uri.fsPath;
  return process.platform === 'win32'
    ? a.toLowerCase() === b.toLowerCase()
    : a === b;
}

async function create_module(module_name) {
	try {
		const current_path = path.dirname(vscode.window.activeTextEditor.document.uri.fsPath);
		let target_path = current_path
		if((await get_config()).add_mode==2){
			if(await isExactlyWorkspaceRoot(current_path)){
				target_path = path.dirname(current_path);
			}
		}
		
		//Creates new Module Directory
		vscode.workspace.fs.createDirectory(vscode.Uri.file(target_path + '/' + module_name));

		//Creates new Module File
		const go_file_path = vscode.Uri.file(target_path + '/' + module_name + '/' + module_name + '.go');
		console.log(go_file_path);
		const content = `package ${module_name}`;
		vscode.workspace.fs.writeFile(go_file_path, Buffer.from(content));

		// Get Terminal
		const go_module_terminal = vscode.window.terminals.find(terminal_name => terminal_name.name == 'Go Module')
		let terminal
		if(!go_module_terminal){
			terminal = vscode.window.createTerminal('Go Module')
		} else {
			terminal = go_module_terminal
		}
		
		// Init module and add replace in parent folder
		terminal.sendText(`cd "${target_path}/${module_name}"`);
		terminal.sendText(`go mod init module.localhost/${module_name}`);
		terminal.sendText(`cd "${target_path}"`);
		if((await get_config()).add_mode==1){
		terminal.sendText(`go mod edit -replace module.localhost/${module_name}=.\\${module_name}`);
		}
		if((await get_config()).add_mode==2){
		terminal.sendText(`cd "${current_path}"`);
		terminal.sendText(`go mod edit -replace module.localhost/${module_name}=..\\${module_name}`);
		}
		terminal.sendText(`go mod edit -require="module.localhost/${module_name}@v0.0.0-00010101000000-000000000000"`);

		let editor = vscode.window.activeTextEditor;
		if (editor) {
			let document = editor.document;
			let text = document.getText();
			let importStatement = `import ${module_name} "module.localhost/${module_name}"\n`;

			if (!text.includes(importStatement)) {
				let edit = new vscode.WorkspaceEdit();
				let position = new vscode.Position(1, 0);
				edit.insert(document.uri, position, importStatement);
				await vscode.workspace.applyEdit(edit);
				await document.save();
			}
		}
		terminal.sendText(`go mod tidy`);
		return true;
	} catch {
		return false;
	}
}

async function get_config(){
	const cfg = vscode.workspace.getConfiguration('go_auto_module');
	const add_mode = cfg.get('add_mode');
	return { add_mode };
}


// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}