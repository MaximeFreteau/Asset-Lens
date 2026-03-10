// Copyright Maxime Freteau. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"

class FAssetLensModule : public IModuleInterface
{
public:
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;

	static FAssetLensModule& Get()
	{
		return FModuleManager::LoadModuleChecked<FAssetLensModule>("AssetLens");
	}

	static bool IsAvailable()
	{
		return FModuleManager::Get().IsModuleLoaded("AssetLens");
	}
};