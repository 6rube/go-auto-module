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

async function create_module(module_name) {

	try {
		const current_path = path.dirname(vscode.window.activeTextEditor.document.uri.fsPath);
		const parent_path = path.dirname(current_path);

		vscode.workspace.fs.createDirectory(vscode.Uri.file(parent_path + '/' + module_name));
		const go_file_path = vscode.Uri.file(parent_path + '/' + module_name + '/' + module_name + '.go');
		const content = `package ${module_name}`;
		vscode.workspace.fs.writeFile(go_file_path, Buffer.from(content));

		var term = vscode.window.createTerminal('Go Module')
		term.sendText(`cd ${parent_path}/${module_name}`);
		term.sendText(`go mod init module.localhost/${module_name}`);
		term.sendText(`cd ${current_path}`);
		term.sendText(`go mod edit -replace module.localhost/${module_name}=..\\${module_name}`);

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
		term.sendText(`go mod tidy`);
		return true;
	} catch {
		return false;
	}
}


// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
