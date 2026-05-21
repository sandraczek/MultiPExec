using MultiPExec.Domain.Document;

namespace MultiPExec.Application.Interfaces;

public interface IWorkspaceManager
{
    CollaborativeDocument GetOrAddWorkspace(string workspaceId);
    void ApplyInsert(string workspaceId, CharNode node);
    void ApplyRemove(string workspaceId, FractionalPosition position);
    IReadOnlyList<CharNode> GetRawState(string workspaceId);
}