// Copyright Maxime Freteau. All Rights Reserved.

#include "AssetLensHttpClient.h"
#include "AssetLensSettings.h"
#include "HttpModule.h"
#include "Interfaces/IHttpResponse.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

FAssetLensHttpClient& FAssetLensHttpClient::Get()
{
    static FAssetLensHttpClient Instance;
    return Instance;
}

FString FAssetLensHttpClient::GetBaseURL() const
{
    const UAssetLensSettings* Settings = GetDefault<UAssetLensSettings>();
    return Settings ? Settings->GetBackendURL() : TEXT("http://localhost:3001");
}

TSharedRef<IHttpRequest, ESPMode::ThreadSafe> FAssetLensHttpClient::CreateRequest(
    const FString& Verb, const FString& Endpoint)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetVerb(Verb);
    Request->SetURL(GetBaseURL() + Endpoint);
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
    return Request;
}

void FAssetLensHttpClient::GetObject(const FString& Endpoint, FOnAssetLensResponse OnComplete)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = CreateRequest(TEXT("GET"), Endpoint);

    Request->OnProcessRequestComplete().BindLambda(
        [OnComplete](FHttpRequestPtr Req, FHttpResponsePtr Res, bool bSuccess)
        {
            if (!bSuccess || !Res.IsValid())
            {
                OnComplete.ExecuteIfBound(false, nullptr);
                return;
            }

            TSharedPtr<FJsonObject> JsonObject = StringToJsonObject(Res->GetContentAsString());
            OnComplete.ExecuteIfBound(JsonObject.IsValid(), JsonObject);
        });

    Request->ProcessRequest();
}

void FAssetLensHttpClient::GetArray(const FString& Endpoint, FOnAssetLensArrayResponse OnComplete)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = CreateRequest(TEXT("GET"), Endpoint);

    Request->OnProcessRequestComplete().BindLambda(
        [OnComplete](FHttpRequestPtr Req, FHttpResponsePtr Res, bool bSuccess)
        {
            if (!bSuccess || !Res.IsValid())
            {
                OnComplete.ExecuteIfBound(false, {});
                return;
            }

            TArray<TSharedPtr<FJsonValue>> JsonArray;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Res->GetContentAsString());

            if (FJsonSerializer::Deserialize(Reader, JsonArray))
            {
                OnComplete.ExecuteIfBound(true, JsonArray);
            }
            else
            {
                OnComplete.ExecuteIfBound(false, {});
            }
        });

    Request->ProcessRequest();
}

void FAssetLensHttpClient::Post(
    const FString& Endpoint, TSharedPtr<FJsonObject> Body, FOnAssetLensResponse OnComplete)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = CreateRequest(TEXT("POST"), Endpoint);
    Request->SetContentAsString(JsonObjectToString(Body));

    Request->OnProcessRequestComplete().BindLambda(
        [OnComplete](FHttpRequestPtr Req, FHttpResponsePtr Res, bool bSuccess)
        {
            if (!bSuccess || !Res.IsValid())
            {
                OnComplete.ExecuteIfBound(false, nullptr);
                return;
            }

            TSharedPtr<FJsonObject> JsonObject = StringToJsonObject(Res->GetContentAsString());
            OnComplete.ExecuteIfBound(JsonObject.IsValid(), JsonObject);
        });

    Request->ProcessRequest();
}

void FAssetLensHttpClient::Patch(
    const FString& Endpoint, TSharedPtr<FJsonObject> Body, FOnAssetLensResponse OnComplete)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = CreateRequest(TEXT("PATCH"), Endpoint);
    Request->SetContentAsString(JsonObjectToString(Body));

    Request->OnProcessRequestComplete().BindLambda(
        [OnComplete](FHttpRequestPtr Req, FHttpResponsePtr Res, bool bSuccess)
        {
            if (!bSuccess || !Res.IsValid())
            {
                OnComplete.ExecuteIfBound(false, nullptr);
                return;
            }

            TSharedPtr<FJsonObject> JsonObject = StringToJsonObject(Res->GetContentAsString());
            OnComplete.ExecuteIfBound(JsonObject.IsValid(), JsonObject);
        });

    Request->ProcessRequest();
}

FString FAssetLensHttpClient::JsonObjectToString(TSharedPtr<FJsonObject> JsonObject)
{
    FString OutputString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);
    return OutputString;
}

TSharedPtr<FJsonObject> FAssetLensHttpClient::StringToJsonObject(const FString& JsonString)
{
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);
    FJsonSerializer::Deserialize(Reader, JsonObject);
    return JsonObject;
}