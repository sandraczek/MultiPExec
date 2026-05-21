namespace MultiPExec.Domain.Document;

public readonly struct CharNode(char value, FractionalPosition position, Guid clientId)
{
    public char Value { get; } = value;

    public FractionalPosition Position { get; } = position;

    public Guid ClientId { get; } = clientId;
}