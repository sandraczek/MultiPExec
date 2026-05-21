
namespace MultiPExec.Domain.Document;

public class CharNodeComparer : IComparer<CharNode>
{
    public int Compare(CharNode x, CharNode y)
    {
        var posComparison = x.Position.CompareTo(y.Position);
        
        return posComparison == 0 ? x.ClientId.CompareTo(y.ClientId) : posComparison;
    }
}