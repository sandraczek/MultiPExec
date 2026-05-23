using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using MultiPExec.Domain.Execution;

namespace MultiPExec.Infrastructure.Execution;

public class Executor()
{
    private const int TimeLimit = 3;
    public async Task<string> ExecuteCodeAsync(string code, CodeLanguage language)
    {
        
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(TimeLimit));

        var languageData = CodeLanguageProvider.Data[language];

        var tempFolder = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempFolder);
        var tempFilePath = Path.Combine(tempFolder, $"Program{languageData.FileExtension}");
        await File.WriteAllTextAsync(tempFilePath, code, cts.Token);

        try
        {
            var processStartInfo = new ProcessStartInfo
            {
                FileName = languageData.FileName,
                Arguments = languageData.Arguments + tempFilePath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = tempFolder
            };

            using var process = new Process();
            process.StartInfo = processStartInfo;
            process.Start();
            
            await process.WaitForExitAsync(cts.Token);

            var output = await process.StandardOutput.ReadToEndAsync(cts.Token);
            var error = await process.StandardError.ReadToEndAsync(cts.Token);

            return string.IsNullOrEmpty(error) ? output : $"Execution Error:\n{error}";
        }
        catch (OperationCanceledException)
        {
            return "System Error: Execution timed out (Possible infinite loop detected).";
        }
        catch (Exception ex)
        {
            return $"System Error: {ex.Message}";
        }
        finally
        {
            if (Directory.Exists(tempFolder))
            {
                try { Directory.Delete(tempFolder, true); } catch {/* ignored */}
            }
        }
    }
}