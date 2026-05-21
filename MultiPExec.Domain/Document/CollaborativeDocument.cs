using System.Text;

namespace MultiPExec.Domain.Document;

public class CollaborativeDocument(Guid documentId)
{
    public Guid DocumentId { get; } = documentId;
    private readonly List<CharNode> _content = new(1024); //todo: change to B-TREE
    
    public void Insert(CharNode node)
    {
        var index = _content.BinarySearch(node, new CharNodeComparer());
        
        if (index < 0)
        {
            index = ~index; 
        }
        
        _content.Insert(index, node);
    }

    public void Remove(FractionalPosition position)
    {
        var dummyNode = new CharNode('\0', position, Guid.Empty);
        
        var index = _content.BinarySearch(dummyNode, new CharNodeComparer());
        
        if (index >= 0)
        {
            _content.RemoveAt(index);
        }
    }

    public string RenderText()
    {
        var sb = new StringBuilder(_content.Count);
        foreach (var node in _content)
        {
            sb.Append(node.Value);
        }
        return sb.ToString();
    }
    
    public IReadOnlyList<CharNode> GetRawNodes()
    {
        return _content.AsReadOnly();
    }
}

