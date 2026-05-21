using Xunit;
using MultiPExec.Domain.Document;

namespace MultiPExec.Domain.Tests;

public class CollaborativeDocumentTests
{
    [Fact]
    public void Insert_OutOfOrderPackets_ShouldMaintainCorrectState()
    {
        var doc = new CollaborativeDocument(Guid.NewGuid());
        var clientId1 = Guid.NewGuid();
        var clientId2 = Guid.NewGuid();

        var nodeA = new CharNode('A', new FractionalPosition([1]), clientId1);
        var nodeC = new CharNode('C', new FractionalPosition([3]), clientId2);
        var nodeB = new CharNode('B', new FractionalPosition([2]), clientId1);
        
        doc.Insert(nodeA);
        doc.Insert(nodeC);
        doc.Insert(nodeB);
        
        Assert.Equal("ABC", doc.RenderText());
    }
}
