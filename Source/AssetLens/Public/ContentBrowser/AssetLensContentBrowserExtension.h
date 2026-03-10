// Copyright Maxime Freteau. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "ContentBrowserDelegates.h"

class ASSETLENS_API FAssetLensContentBrowserExtension
{
public:
	static void Register();
	static void Unregister();

private:
	static FDelegateHandle ContentBrowserExtenderDelegateHandle;

	static TSharedRef<FExtender> OnExtendContentBrowserAssetSelectionMenu(
		const TArray<FAssetData>& SelectedAssets);

	static void AddMenuEntries(FMenuBuilder& MenuBuilder, TArray<FAssetData> SelectedAssets);

	static void OpenDocumentation(TArray<FAssetData> SelectedAssets);
	static void CreateDocumentation(TArray<FAssetData> SelectedAssets);
	static void SyncAssetToBackend(TArray<FAssetData> SelectedAssets);

	static FString GetAssetPath(const FAssetData& AssetData);
};