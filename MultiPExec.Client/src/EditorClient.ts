import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

export type CharNodeDto = {
    value: string;
    position: { path: number[] };
    clientId: string;
};

export type NodeIdentifierDto = {
    path: number[],
    clientId: string
};

export type CodeLanguage = "Python" | "CSharp";

export class EditorClient {
    private connection: HubConnection;

    public onDocumentLoaded?: (nodes: CharNodeDto[]) => void;
    public onCharacterInserted?: (value: string, path: number[], authorId: string) => void;
    public onCharacterRemoved?: (path: number[], charClientId: string) => void;
    public onSelectionRemoved?: (nodes: NodeIdentifierDto[]) => void;
    public onCodeExecuted?: (output: string) => void;

    constructor(private workspaceId: string, private clientId: string) {
        
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

        this.connection = new HubConnectionBuilder()
            .withUrl(`${baseUrl}/editor`)
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        this.registerListeners();
    }

    private registerListeners() {
        this.connection.on("DocumentLoaded", (nodes: CharNodeDto[]) => this.onDocumentLoaded?.(nodes));
        this.connection.on("CharacterInserted", (val, path, authorId) => this.onCharacterInserted?.(val, path, authorId));
        this.connection.on("CharacterRemoved", (path, charClientId) => this.onCharacterRemoved?.(path, charClientId));
        this.connection.on("CodeExecuted", (output: string) => this.onCodeExecuted?.(output));
        this.connection.on("SelectionRemoved", (nodes: NodeIdentifierDto[]) => this.onSelectionRemoved?.(nodes));
    }

    public async connect() {
        await this.connection.start();
        await this.connection.invoke("JoinWorkspace", this.workspaceId);
    }

    public async insert(value: string, path: number[]) {
        await this.connection.invoke("InsertCharacter", this.workspaceId, value, path, this.clientId);
    }

    public async remove(path: number[], charClientId: string) {
        await this.connection.invoke("RemoveCharacter", this.workspaceId, path, charClientId);
    }

    public async removeBulk(nodes: NodeIdentifierDto[]) {
        if (nodes.length > 0) {
            await this.connection.invoke("RemoveSelection", this.workspaceId, nodes);
        }
    }

    public async executeCode(language: CodeLanguage) {
        await this.connection.invoke("ExecuteWorkspace", this.workspaceId, language);
    }
}