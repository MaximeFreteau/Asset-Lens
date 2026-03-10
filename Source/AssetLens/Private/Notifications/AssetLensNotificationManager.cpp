// Copyright Maxime Freteau. All Rights Reserved.

#include "Notifications/AssetLensNotificationManager.h"
#include "AssetLensHttpClient.h"
#include "AssetLensSettings.h"
#include "Framework/Notifications/NotificationManager.h"
#include "Widgets/Notifications/SNotificationList.h"
#include "Dom/JsonObject.h"
#include "Dom/JsonValue.h"

FTimerHandle FAssetLensNotificationManager::PollTimerHandle;
FDateTime    FAssetLensNotificationManager::LastPollTime = FDateTime::UtcNow();

void FAssetLensNotificationManager::Start()
{
    if (GEditor)
    {
        GEditor->GetTimerManager()->SetTimer(
            PollTimerHandle,
            []() { FAssetLensNotificationManager::Poll(); },
            30.f,
            true,
            10.f 
        );
    }
}

void FAssetLensNotificationManager::Stop()
{
    if (GEditor)
    {
        GEditor->GetTimerManager()->ClearTimer(PollTimerHandle);
    }
}

void FAssetLensNotificationManager::Poll()
{
    const UAssetLensSettings* Settings = GetDefault<UAssetLensSettings>();

    if (Settings->UserID.IsEmpty()) return;

    const FString Endpoint = FString::Printf(
        TEXT("/api/notifications?user_id=%s&unread_only=true"),
        *Settings->UserID);

    FAssetLensHttpClient::Get().GetArray(Endpoint,
        FOnAssetLensArrayResponse::CreateLambda(
            [](bool bSuccess, TArray<TSharedPtr<FJsonValue>> Response)
            {
                if (!bSuccess || Response.Num() == 0) return;

                for (const TSharedPtr<FJsonValue>& NotifValue : Response)
                {
                    TSharedPtr<FJsonObject> Notif = NotifValue->AsObject();
                    if (!Notif.IsValid()) continue;

                    FString Title, Message, Type, Id;
                    Notif->TryGetStringField(TEXT("title"),   Title);
                    Notif->TryGetStringField(TEXT("message"), Message);
                    Notif->TryGetStringField(TEXT("type"),    Type);
                    Notif->TryGetStringField(TEXT("id"),      Id);

                    AsyncTask(ENamedThreads::GameThread,
                        [Title, Message, Type, Id]()
                        {
                            FAssetLensNotificationManager::ShowToast(Title, Message, Type);

                            FAssetLensHttpClient::Get().Patch(
                                FString::Printf(TEXT("/api/notifications/%s/read"), *Id),
                                MakeShared<FJsonObject>(),
                                FOnAssetLensResponse::CreateLambda(
                                    [](bool, TSharedPtr<FJsonObject>) {}));
                        });
                }
            }));
}

void FAssetLensNotificationManager::ShowToast(
    const FString& Title, const FString& Message, const FString& Type)
{
    FNotificationInfo Info(FText::FromString(Title));
    Info.SubText        = FText::FromString(Message);
    Info.bFireAndForget = true;
    Info.bUseLargeFont  = false;
    Info.ExpireDuration = 6.f;
    Info.bUseSuccessFailIcons = true;

    if (Type == TEXT("task_validated"))
    {
        Info.Image = FAppStyle::GetBrush(TEXT("Icons.SuccessWithColor"));
    }
    else if (Type == TEXT("task_rejected"))
    {
        Info.Image = FAppStyle::GetBrush(TEXT("Icons.WarningWithColor"));
    }
    else if (Type == TEXT("task_assigned"))
    {
        Info.Image = FAppStyle::GetBrush(TEXT("Icons.Plus"));
    }
    else
    {
        Info.Image = FAppStyle::GetBrush(TEXT("Icons.InfoWithColor"));
    }

    FSlateNotificationManager::Get().AddNotification(Info);
}