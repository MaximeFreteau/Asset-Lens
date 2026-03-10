// Copyright Maxime Freteau. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"

class ASSETLENS_API FAssetLensNotificationManager
{
public:
	static void Start();
	static void Stop();

private:
	static void Poll();
	static void ShowToast(const FString& Title, const FString& Message, const FString& Type);

	static FTimerHandle PollTimerHandle;
	static FDateTime    LastPollTime;
};