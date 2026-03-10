// Copyright Maxime Freteau. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Widgets/Docking/SDockTab.h"
#include "SWebBrowser.h"

class ASSETLENS_API FAssetLensWebViewPanel
{
public:
	static void Register();
	static void Unregister();

	static void NavigateTo(const FString& URL);

	static void OpenPanel();

private:
	static TSharedRef<SDockTab> OnSpawnTab(const FSpawnTabArgs& Args);
	static TSharedPtr<SWebBrowser> WebBrowserWidget;
	static const FName TabId;
};