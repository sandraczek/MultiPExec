using Microsoft.AspNetCore.SignalR;
using MultiPExec.Application.Interfaces;
using MultiPExec.Domain.Document;

namespace MultiPExec.Api.Hubs;

public class EditorHub(IWorkspaceManager workspaceManager) : Hub
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
}