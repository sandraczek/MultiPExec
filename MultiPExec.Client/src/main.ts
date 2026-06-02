import { EditorClient } from "./EditorClient";
import type { CharNodeDto } from "./EditorClient";
import { PositionAllocator } from "./PositionAllocator";
import type { CodeLanguage } from './EditorClient';

type CharNode = { value: string, path: number[], clientId: string };
let localDoc: CharNode[] = [];

function comparePaths(path1: number[], path2: number[]): number {
    const minLen = Math.min(path1.length, path2.length);
    
    for (let i = 0; i < minLen; i++) {
        if (path1[i] !== path2[i]) {
            return path1[i] - path2[i];
        }
    }

    return path1.length - path2.length;
}

const editorDom = document.getElementById("editor") as HTMLTextAreaElement;
const statusDom = document.getElementById("status") as HTMLDivElement;

const WORKSPACE_ID = "test-room";
const CLIENT_ID = crypto.randomUUID();
const client = new EditorClient(WORKSPACE_ID, CLIENT_ID);

const btnRun = document.getElementById("btn-run") as HTMLButtonElement;
const languageSelect = document.getElementById("language-select") as HTMLSelectElement;
const consoleOutput = document.getElementById("console-output") as HTMLPreElement;

client.onDocumentLoaded = (nodes: CharNodeDto[]) => {
    localDoc = nodes.map(n => ({
        value: n.value,
        path: n.position.path,
        clientId: n.clientId
    }));
    
    localDoc.sort((a, b) => comparePaths(a.path,b.path));
    
    editorDom.value = localDoc.map(n => n.value).join('');

    editorDom.disabled = false;
    btnRun.disabled = false;
    statusDom.innerText = `Status: Connected (Room: ${WORKSPACE_ID} | Client: ${CLIENT_ID.split('-')[0]})\n\n Open a second window and have fun!`;
};

client.onCharacterInserted = (value, path, authorId) => {
    const currentCursor = editorDom.selectionStart;

    localDoc.push({ value, path, clientId: authorId });
    localDoc.sort((a, b) => comparePaths(a.path,b.path));

    editorDom.value = localDoc.map(n => n.value).join('');

    editorDom.setSelectionRange(currentCursor, currentCursor);
};
client.onCharacterRemoved = (path, charClientId) => {
    const targetPathString = path.join(',');
    const index = localDoc.findIndex(
        n => n.path.join(',') === targetPathString && n.clientId === charClientId);

    if (index !== -1) {
        const currentCursor = editorDom.selectionStart;

        localDoc.splice(index, 1);
        editorDom.value = localDoc.map(n => n.value).join('');

        let newCursor = currentCursor;
        if (index < currentCursor) {
            newCursor--;
        }
        editorDom.setSelectionRange(newCursor, newCursor);
    }
};

client.onSelectionRemoved = (nodesToRemove) => {
    const currentCursor = editorDom.selectionStart;
    let cursorOffset = 0;
    
    for (const targetNode of nodesToRemove) {
        const targetPathString = targetNode.path.join(',');
        const index = localDoc.findIndex(n =>
            n.path.join(',') === targetPathString && n.clientId === targetNode.clientId
        );

        if (index !== -1) {
            localDoc.splice(index, 1);
            
            if (index < currentCursor) {
                cursorOffset--;
            }
        }
    }
    
    editorDom.value = localDoc.map(n => n.value).join('');
    
    const newCursor = currentCursor + cursorOffset;
    editorDom.setSelectionRange(newCursor, newCursor);
};

client.onCodeExecuted = (output: string) => {
    btnRun.disabled = false;
    consoleOutput.innerText = output;
};

editorDom.addEventListener("input", async (e: Event) => {
    const inputEvent = e as InputEvent;

    if (inputEvent.inputType === "insertText" || inputEvent.inputType === "insertLineBreak") {

        const charToInsert = inputEvent.inputType === "insertLineBreak" ? '\n' : inputEvent.data;

        if (!charToInsert) return;

        const cursorPos = editorDom.selectionStart;

        const insertIndex = cursorPos - 1;

        const leftNode = insertIndex > 0 ? localDoc[insertIndex - 1] : null;
        const rightNode = insertIndex < localDoc.length ? localDoc[insertIndex] : null;

        const leftPath = leftNode ? leftNode.path : null;
        const rightPath = rightNode ? rightNode.path : null;

        const newPath = PositionAllocator.allocateBetween(leftPath, rightPath);

        localDoc.splice(insertIndex, 0, {value: charToInsert, path: newPath, clientId: CLIENT_ID});

        await client.insert(charToInsert, newPath);
    }
    if (inputEvent.inputType === "deleteContentBackward" || inputEvent.inputType === "deleteContentForward") {

        const indexToRemove = editorDom.selectionStart;

        if (indexToRemove >= 0 && indexToRemove < localDoc.length) {

            const nodeToRemove = localDoc[indexToRemove];
            
            localDoc.splice(indexToRemove, 1);
            
            await client.remove(nodeToRemove.path, nodeToRemove.clientId);
        }
    }
    if (inputEvent.inputType.startsWith("delete")) {

        const currentLength = editorDom.value.length;
        const deletedCount = localDoc.length - currentLength;

        if (deletedCount > 0) {
            const startIndex = editorDom.selectionStart;
            
            const removedNodes = localDoc.splice(startIndex, deletedCount);
            
            const identifiers = removedNodes.map(n => ({
                path: n.path,
                clientId: n.clientId
            }));

            await client.removeBulk(identifiers);
        }
    }
});
editorDom.addEventListener("keydown", async (e: KeyboardEvent) => {
    if (e.key === "Tab") {
        
        e.preventDefault();

        const charToInsert = '\t';
        
        const cursorPos = editorDom.selectionStart;
        const insertIndex = cursorPos;

        const leftNode = insertIndex > 0 ? localDoc[insertIndex - 1] : null;
        const rightNode = insertIndex < localDoc.length ? localDoc[insertIndex] : null;

        const leftPath = leftNode ? leftNode.path : null;
        const rightPath = rightNode ? rightNode.path : null;
        
        const newPath = PositionAllocator.allocateBetween(leftPath, rightPath);
        
        localDoc.splice(insertIndex, 0, {
            value: charToInsert,
            path: newPath,
            clientId: CLIENT_ID
        });
        
        editorDom.value = localDoc.map(n => n.value).join('');
        
        editorDom.setSelectionRange(cursorPos + 1, cursorPos + 1);
        
        await client.insert(charToInsert, newPath);
    }
});

btnRun.addEventListener("click", async () => {
    btnRun.disabled = true;
    consoleOutput.innerText = "Executing...";

    const selectedLanguage = languageSelect.value as CodeLanguage;

    await client.executeCode(selectedLanguage);
});

async function init() {
    try {
        await client.connect();
    } catch (e) {
        statusDom.innerText = "Status: Connection failed. Check C# backend.";
        console.error(e);
    }
}

init();