// Copyright Maxime Freteau. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Dom/JsonObject.h"

class ASSETLENS_API FAssetLensSceneParser
{
public:
	static void ParseAndSyncCurrentLevel();

	static void ParseAndSyncLevel(UWorld* World);

private:
	static TArray<TSharedPtr<FJsonValue>> ParseActors(UWorld* World);

	static TSharedPtr<FJsonObject> ParseActor(AActor* Actor);

	static TSharedPtr<FJsonObject> ParseLightComponent(ULightComponent* LightComp);

	static TSharedPtr<FJsonObject> ParseTransform(const FTransform& Transform);

	static FString ColorToHex(const FLinearColor& Color);
};