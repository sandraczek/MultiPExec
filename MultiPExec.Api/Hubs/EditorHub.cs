using Microsoft.AspNetCore.SignalR;
using MultiPExec.Application.Interfaces;
using MultiPExec.Domain.Document;
using MultiPExec.Domain.Execution;
using MultiPExec.Infrastructure.Execution;

namespace MultiPExec.Api.Hubs;

public class EditorHub(IWorkspaceManager workspaceManager, Executor executor) : Hub
{
    public async Task JoinWorkspace(string workspaceId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, workspaceId);
        
        var nodes = workspaceManager.GetRawState(workspaceId);
        
        await Clients.Caller.SendAsync("DocumentLoaded", nodes);
        
    }
    

    public async Task InsertCharacter(string workspaceId, char value, int[] path, Guid clientId)
    {
        var position = new FractionalPosition(path);
        var node = new CharNode(value, position, clientId);

        workspaceManager.ApplyInsert(workspaceId, node);
        
        await Clients.OthersInGroup(workspaceId).SendAsync("CharacterInserted", value, path, clientId);
    }

    public async Task RemoveCharacter(string workspaceId, int[] path, Guid charClientId)
    {
        var position = new FractionalPosition(path);
        
        workspaceManager.ApplyRemove(workspaceId, position, charClientId);
        
        await Clients.OthersInGroup(workspaceId).SendAsync("CharacterRemoved", path, charClientId);
    }
    
    public async Task RemoveSelection(string workspaceId, List<NodeIdentifierDto> nodes)
    {
        if (nodes.Count == 0) return;
        
        foreach (var node in nodes)
        {
            if (!Guid.TryParse(node.ClientId, out var targetGuid)) continue;
            workspaceManager.ApplyRemove(workspaceId, new FractionalPosition(node.Path), targetGuid);
        }
        
        await Clients.OthersInGroup(workspaceId).SendAsync("SelectionRemoved", nodes);
    }
    
    public async Task ExecuteWorkspace(string workspaceId, CodeLanguage language)
    {
        var nodes = workspaceManager.GetRawState(workspaceId);
        
        var codeBuilder = new System.Text.StringBuilder();
        foreach (var node in nodes)
        {
            codeBuilder.Append(node.Value);
        }

        var code = codeBuilder.ToString();

        var output = await executor.ExecuteCodeAsync(code, language);
        
        await Clients.Group(workspaceId).SendAsync("CodeExecuted", output);
    }
}

public struct NodeIdentifierDto
{
    public required int[] Path { get; set; }
    public required string ClientId { get; set; }
}