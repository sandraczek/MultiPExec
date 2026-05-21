import { EditorClient } from "./EditorClient";
import type { CharNodeDto } from "./EditorClient";
import { PositionAllocator } from "./PositionAllocator";

type CharNode = { value: string, path: number[], clientId: string };
let localDoc: CharNode[] = [];

const editorDom = document.getElementById("editor") as HTMLTextAreaElement;
const statusDom = document.getElementById("status") as HTMLDivElement;

const WORKSPACE_ID = "test-room";
const CLIENT_ID = crypto.randomUUID();
const client = new EditorClient(WORKSPACE_ID, CLIENT_ID);

client.onDocumentLoaded = (nodes: CharNodeDto[]) => {
    localDoc = nodes.map(n => ({
        value: n.value,
        path: n.position.path,
        clientId: n.clientId
    }));
    
    localDoc.sort((a, b) => a.path[0] - b.path[0]);
    
    editorDom.value = localDoc.map(n => n.value).join('');

    editorDom.disabled = false;
    statusDom.innerText = `Status: Connected (Room: ${WORKSPACE_ID} | Client: ${CLIENT_ID.split('-')[0]})`;
};

// Krok 2: Odbieranie pakietów od Innych użytkowników
client.onCharacterInserted = (value, path, authorId) => {
    // 1. Zapisujemy pozycję kursora lokalnego użytkownika
    const currentCursor = editorDom.selectionStart;

    // 2. Dodajemy nowy znak od kolegi i sortujemy dokument
    localDoc.push({ value, path, clientId: authorId });
    localDoc.sort((a, b) => a.path[0] - b.path[0]);

    // 3. Nadpisujemy tekst w przeglądarce
    editorDom.value = localDoc.map(n => n.value).join('');

    // 4. Przywracamy kursor. 
    // Uwaga: Jeśli nowa litera wpadła PRZED naszym kursorem, musimy go przesunąć o 1 w prawo!
    // Dla uproszczenia w PoC po prostu przywracamy go tam, gdzie był.
    editorDom.setSelectionRange(currentCursor, currentCursor);
};

// Krok 3: Wysyłanie naszych intencji (przechwytywanie klawiatury z uwzględnieniem kursora)
editorDom.addEventListener("input", async (e: Event) => {
    const inputEvent = e as InputEvent;

    // Obsługujemy na razie tylko pojedyncze uderzenia w klawisze (bez wklejania całych bloków tekstu)
    if (inputEvent.inputType === "insertText" && inputEvent.data) {
        const char = inputEvent.data;

        // Gdzie znajduje się kursor PO wpisaniu litery?
        const cursorPos = editorDom.selectionStart;

        // Indeks nowej litery w czystym tekście to pozycja kursora minus 1
        const insertIndex = cursorPos - 1;

        // Szukamy węzłów "sąsiadów" w naszej strukturze CRDT (jeszcze sprzed aktualizacji)
        const leftNode = insertIndex > 0 ? localDoc[insertIndex - 1] : null;
        const rightNode = insertIndex < localDoc.length ? localDoc[insertIndex] : null;

        const leftPath = leftNode ? leftNode.path : null;
        const rightPath = rightNode ? rightNode.path : null;

        // Uruchamiamy nasz silnik matematyczny!
        const newPath = PositionAllocator.allocateBetween(leftPath, rightPath);

        // Aktualizujemy lokalny stan - używamy splice, żeby wcisnąć element w środek tablicy
        localDoc.splice(insertIndex, 0, { value: char, path: newPath, clientId: CLIENT_ID });

        // Wysyłamy asynchronicznie pakiet na serwer
        await client.insert(char, newPath);
    }
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