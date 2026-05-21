namespace MultiPExec.Domain.Document;

public static class PositionAllocator
{
    private const int Step = 100_000;

    public static FractionalPosition AllocateBetween(FractionalPosition? left, FractionalPosition? right)
    {
        var leftPath = left?.Path ?? [];
        var rightPath = right?.Path ?? [];

        var newPath = new List<int>(Math.Max(leftPath.Length, rightPath.Length) + 1);
        var depth = 0;

        while (true)
        {
            var l = depth < leftPath.Length ? leftPath[depth] : 0;

            var r = depth < rightPath.Length ? rightPath[depth] : Step;
            
            if (depth < leftPath.Length && depth < rightPath.Length && l > r)
            {
                throw new InvalidOperationException("Critical error: left char node is bigger than right.");
            }
            
            if (right == null)
            {
                newPath.Add(l + Step);
                return new FractionalPosition(newPath.ToArray());
            }
            
            if (l == r)
            {
                newPath.Add(l);
                depth++;
                continue;
            }

            if (r - l > 1)
            {
                newPath.Add(l + (int)((r - l) / 2));
                return new FractionalPosition(newPath.ToArray());
            }
            
            newPath.Add(l);
            depth++;
        }
    }
}