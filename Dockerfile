FROM mcr.microsoft.com/dotnet/sdk:10.0 AS base
WORKDIR /app
EXPOSE 8080

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["MultiPExec.Api/MultiPExec.Api.csproj", "MultiPExec.Api/"]
RUN dotnet restore "MultiPExec.Api/MultiPExec.Api.csproj"
COPY . .
WORKDIR "/src/MultiPExec.Api"
RUN dotnet build "MultiPExec.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MultiPExec.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MultiPExec.Api.dll"]