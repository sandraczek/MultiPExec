import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

export type CharNodeDto = {
    value: string;
    position: { path: number[] };
    clientId: string;
};

export class EditorClient {
    private connection: HubConnection;

    public onDocumentLoaded?: (nodes: CharNodeDto[]) => void;
    public onCharacterInserted?: (value: string, path: number[], authorId: string) => void;

    constructor(private workspaceId: string, private clientId: string) {

        // Zczytujemy adres z .env lub używamy domyślnego
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
    }

    public async connect() {
        await this.connection.start();
        await this.connection.invoke("JoinWorkspace", this.workspaceId);
    }

    public async insert(value: string, path: number[]) {
        await this.connection.invoke("InsertCharacter", this.workspaceId, value, path, this.clientId);
    }
}