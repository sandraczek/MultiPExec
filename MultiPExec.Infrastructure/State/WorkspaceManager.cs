using System.Collections.Concurrent;
using MultiPExec.Application.Interfaces;
using MultiPExec.Domain.Document;

namespace MultiPExec.Infrastructure.State;

public class WorkspaceManager : IWorkspaceManager
{
    private readonly ConcurrentDictionary<string, CollaborativeDocument> _documents = new();

    public CollaborativeDocument GetOrAddWorkspace(string workspaceId)
    {
        return _documents.GetOrAdd(workspaceId, id => new CollaborativeDocument(Guid.NewGuid()));
    }
    
    public void ApplyInsert(string workspaceId, CharNode node)
    {
        var doc = GetOrAddWorkspace(workspaceId);
        
        lock (doc)
        {
            doc.Insert(node);
        }
    }

    public void ApplyRemove(string workspaceId, FractionalPosition position, Guid charClientId)
    {
        var doc = GetOrAddWorkspace(workspaceId);
        lock (doc)
        {
            doc.Remove(position, charClientId);
        }
    }

    public IReadOnlyList<CharNode> GetRawState(string workspaceId)
    {
        var doc = GetOrAddWorkspace(workspaceId);
        lock (doc)
        {
            return doc.GetRawNodes().ToList();
        }
    }
}