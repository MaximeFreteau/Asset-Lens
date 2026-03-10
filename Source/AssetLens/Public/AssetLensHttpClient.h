// Copyright Maxime Freteau. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Http.h"
#include "Dom/JsonObject.h"

DECLARE_DELEGATE_TwoParams(FOnAssetLensResponse, bool /*bSuccess*/, TSharedPtr<FJsonObject> /*Response*/);
DECLARE_DELEGATE_TwoParams(FOnAssetLensArrayResponse, bool /*bSuccess*/, TArray<TSharedPtr<FJsonValue>> /*Response*/);

class ASSETLENS_API FAssetLensHttpClient
{
public:
	static FAssetLensHttpClient& Get();

	void GetObject(const FString& Endpoint, FOnAssetLensResponse OnComplete);

	void GetArray(const FString& Endpoint, FOnAssetLensArrayResponse OnComplete);

	void Post(const FString& Endpoint, TSharedPtr<FJsonObject> Body, FOnAssetLensResponse OnComplete);

	void Patch(const FString& Endpoint, TSharedPtr<FJsonObject> Body, FOnAssetLensResponse OnComplete);

	static FString JsonObjectToString(TSharedPtr<FJsonObject> JsonObject);
	static TSharedPtr<FJsonObject> StringToJsonObject(const FString& JsonString);

private:
	FString GetBaseURL() const;
	TSharedRef<IHttpRequest, ESPMode::ThreadSafe> CreateRequest(const FString& Verb, const FString& Endpoint);
};