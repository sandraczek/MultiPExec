namespace MultiPExec.Domain.Document;

public readonly struct FractionalPosition(int[] path) : IComparable<FractionalPosition>
{
    public int[] Path { get; } = path ?? [];

    public int CompareTo(FractionalPosition other)
    {
        var minLength = Math.Min(Path.Length, other.Path.Length);
        
        for (var i = 0; i < minLength; i++)
        {
            if (Path[i] != other.Path[i])
            {
                return Path[i].CompareTo(other.Path[i]);
            }
        }
        
        return Path.Length.CompareTo(other.Path.Length);
    }
}