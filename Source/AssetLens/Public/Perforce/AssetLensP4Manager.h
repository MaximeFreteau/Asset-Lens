// Copyright Maxime Freteau. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"

UENUM()
enum class EAssetLensP4Status : uint8
{
	Unknown,
	NotInDepot,
	Synced,
	CheckedOut,
	Added,
	Modified,
};

struct FAssetLensP4FileInfo
{
	FString         DepotPath;
	FString         LocalPath;
	EAssetLensP4Status Status;
	FString         CheckedOutBy;
	int32           HeadRevision;
	int32           HaveRevision;
};

class ASSETLENS_API FAssetLensP4Manager
{
public:
	static FAssetLensP4Manager& Get();

	void Init(const FString& InServer, const FString& InUser,
			  const FString& InClient, const FString& InPassword = TEXT(""));

	bool IsConfigured() const;
	
	bool Add(const FString& LocalPath);
	bool Edit(const FString& LocalPath);
	bool Sync(const FString& DepotPath = TEXT("//..."));
	bool Revert(const FString& LocalPath);

	EAssetLensP4Status GetFileStatus(const FString& LocalPath);
	TArray<FString>    GetCheckedOutFiles();

	void OnAssetSaved(const FString& PackagePath);
	void OnAssetAdded(const FString& PackagePath);

private:
	FAssetLensP4Manager() {}

	FString RunP4Command(const TArray<FString>& Args, bool* bSuccess = nullptr);
	FString GetLocalPathFromPackage(const FString& PackagePath);

	FString Server;
	FString User;
	FString Client;
	FString Password;
	bool    bConfigured = false;
};