using MultiPExec.Domain.Execution;

namespace MultiPExec.Infrastructure.Execution;

public static class CodeLanguageProvider
{
    public static readonly Dictionary<CodeLanguage, CodeLanguageData> Data = new();

    static CodeLanguageProvider()
    {
        Data.Add(CodeLanguage.Python, new CodeLanguageData
        {
            FileExtension = ".py",
            FileName = "python3",
            Arguments = ""
        });
        Data.Add(CodeLanguage.CSharp, new CodeLanguageData
        {
            FileExtension = ".cs",
            FileName = "dotnet",
            Arguments = "run "
        });
    }
}

public struct CodeLanguageData
{
    public string FileExtension;
    public string FileName;
    public string Arguments;
}