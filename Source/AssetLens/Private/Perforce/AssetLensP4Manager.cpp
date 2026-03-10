// Copyright Maxime Freteau. All Rights Reserved.

#include "Perforce/AssetLensP4Manager.h"
#include "AssetLensSettings.h"
#include "HAL/PlatformProcess.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"

FAssetLensP4Manager& FAssetLensP4Manager::Get()
{
    static FAssetLensP4Manager Instance;
    return Instance;
}

void FAssetLensP4Manager::Init(
    const FString& InServer, const FString& InUser,
    const FString& InClient, const FString& InPassword)
{
    Server     = InServer;
    User       = InUser;
    Client     = InClient;
    Password   = InPassword;
    bConfigured = !Server.IsEmpty() && !User.IsEmpty() && !Client.IsEmpty();

    UE_LOG(LogTemp, Log, TEXT("AssetLens P4: Initialized — %s@%s (%s)"),
        *User, *Server, *Client);
}

bool FAssetLensP4Manager::IsConfigured() const
{
    return bConfigured;
}

FString FAssetLensP4Manager::RunP4Command(
    const TArray<FString>& Args, bool* bSuccess)
{
    const UAssetLensSettings* Settings = GetDefault<UAssetLensSettings>();
    
    FString CmdArgs = FString::Printf(
        TEXT("-p %s -u %s -c %s"), *Server, *User, *Client);
    
    for (const FString& Arg : Args)
        CmdArgs += TEXT(" ") + Arg;

    UE_LOG(LogTemp, Log, TEXT("AssetLens P4 [SIMULATED]: p4 %s"), *CmdArgs);

    if (Settings->bP4SimulationMode)
    {
        if (bSuccess) *bSuccess = true;
        return TEXT("Simulated OK");
    }
    
    FString Output;
    FString StdErr;
    int32   ReturnCode = 0;

    FPlatformProcess::ExecProcess(
        TEXT("p4"), *CmdArgs, &ReturnCode, &Output, &StdErr);

    if (bSuccess) *bSuccess = (ReturnCode == 0);

    if (ReturnCode != 0)
    {
        UE_LOG(LogTemp, Warning,
            TEXT("AssetLens P4 Error: %s"), *StdErr);
    }

    return Output;
}

bool FAssetLensP4Manager::Add(const FString& LocalPath)
{
    if (!bConfigured) return false;
    bool bSuccess = false;
    RunP4Command({ TEXT("add"), LocalPath }, &bSuccess);
    if (bSuccess)
        UE_LOG(LogTemp, Log, TEXT("AssetLens P4: Added %s"), *LocalPath);
    return bSuccess;
}

bool FAssetLensP4Manager::Edit(const FString& LocalPath)
{
    if (!bConfigured) return false;
    bool bSuccess = false;
    RunP4Command({ TEXT("edit"), LocalPath }, &bSuccess);
    if (bSuccess)
        UE_LOG(LogTemp, Log, TEXT("AssetLens P4: Checked out %s"), *LocalPath);
    return bSuccess;
}

bool FAssetLensP4Manager::Sync(const FString& DepotPath)
{
    if (!bConfigured) return false;
    bool bSuccess = false;
    RunP4Command({ TEXT("sync"), DepotPath }, &bSuccess);
    if (bSuccess)
        UE_LOG(LogTemp, Log, TEXT("AssetLens P4: Synced %s"), *DepotPath);
    return bSuccess;
}

bool FAssetLensP4Manager::Revert(const FString& LocalPath)
{
    if (!bConfigured) return false;
    bool bSuccess = false;
    RunP4Command({ TEXT("revert"), LocalPath }, &bSuccess);
    return bSuccess;
}

EAssetLensP4Status FAssetLensP4Manager::GetFileStatus(const FString& LocalPath)
{
    if (!bConfigured) return EAssetLensP4Status::Unknown;

    bool bSuccess = false;
    FString Output = RunP4Command(
        { TEXT("fstat"), LocalPath }, &bSuccess);

    if (!bSuccess || Output.IsEmpty())
        return EAssetLensP4Status::NotInDepot;

    if (Output.Contains(TEXT("action edit")))
        return EAssetLensP4Status::CheckedOut;
    if (Output.Contains(TEXT("action add")))
        return EAssetLensP4Status::Added;

    return EAssetLensP4Status::Synced;
}

TArray<FString> FAssetLensP4Manager::GetCheckedOutFiles()
{
    TArray<FString> Files;
    if (!bConfigured) return Files;

    FString Output = RunP4Command({ TEXT("opened") });
    TArray<FString> Lines;
    Output.ParseIntoArrayLines(Lines);

    for (const FString& Line : Lines)
    {
        FString DepotPath = Line.Left(Line.Find(TEXT("#")));
        if (!DepotPath.IsEmpty())
            Files.Add(DepotPath);
    }

    return Files;
}

FString FAssetLensP4Manager::GetLocalPathFromPackage(const FString& PackagePath)
{
    FString RelativePath = PackagePath;
    RelativePath.RemoveFromStart(TEXT("/Game/"));
    return FPaths::ConvertRelativePathToFull(
        FPaths::ProjectContentDir() / RelativePath + TEXT(".uasset"));
}

void FAssetLensP4Manager::OnAssetSaved(const FString& PackagePath)
{
    if (!bConfigured) return;

    FString LocalPath = GetLocalPathFromPackage(PackagePath);
    EAssetLensP4Status Status = GetFileStatus(LocalPath);

    if (Status == EAssetLensP4Status::Synced)
    {
        Edit(LocalPath);
    }
    else if (Status == EAssetLensP4Status::NotInDepot)
    {
        Add(LocalPath);
    }
}

void FAssetLensP4Manager::OnAssetAdded(const FString& PackagePath)
{
    if (!bConfigured) return;

    FString LocalPath = GetLocalPathFromPackage(PackagePath);
    Add(LocalPath);
}