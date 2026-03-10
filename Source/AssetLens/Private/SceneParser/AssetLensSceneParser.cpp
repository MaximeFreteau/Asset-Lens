// Copyright Maxime Freteau. All Rights Reserved.

#include "SceneParser/AssetLensSceneParser.h"
#include "AssetLensHttpClient.h"
#include "AssetLensSettings.h"
#include "Engine/World.h"
#include "Engine/Level.h"
#include "GameFramework/Actor.h"
#include "Components/LightComponent.h"
#include "Components/PointLightComponent.h"
#include "Components/SpotLightComponent.h"
#include "Components/DirectionalLightComponent.h"
#include "Components/RectLightComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMeshActor.h"
#include "EngineUtils.h"
#include "Engine/PointLight.h"
#include "Engine/SpotLight.h"
#include "Engine/DirectionalLight.h"
#include "Blueprint/UserWidget.h"
#include "Editor.h"
#include "LevelEditor.h"
#include "Dom/JsonObject.h"
#include "Dom/JsonValue.h"
#include "WebView/AssetLensWebViewPanel.h"

void FAssetLensSceneParser::ParseAndSyncCurrentLevel()
{
    if (!GEditor) return;

    UWorld* World = GEditor->GetEditorWorldContext().World();
    if (!World)
    {
        UE_LOG(LogTemp, Warning, TEXT("AssetLens: No world found"));
        return;
    }

    ParseAndSyncLevel(World);
}

void FAssetLensSceneParser::ParseAndSyncLevel(UWorld* World)
{
    if (!World) return;

    TSharedPtr<FJsonObject> SceneBody = MakeShared<FJsonObject>();
    SceneBody->SetStringField(TEXT("name"), World->GetMapName());
    SceneBody->SetStringField(TEXT("path"),
        World->GetPathName().Replace(TEXT("/Game/"), TEXT("/Game/")));

    TSharedPtr<FJsonObject> Metadata = MakeShared<FJsonObject>();
    Metadata->SetNumberField(TEXT("actor_count"), World->GetActorCount());
    SceneBody->SetObjectField(TEXT("metadata"), Metadata);

    TArray<TSharedPtr<FJsonValue>> ActorsArray = ParseActors(World);
    SceneBody->SetArrayField(TEXT("actors"), ActorsArray);

    UE_LOG(LogTemp, Log, TEXT("AssetLens: Syncing scene '%s' with %d actors"),
        *World->GetMapName(), ActorsArray.Num());

    FAssetLensHttpClient::Get().Post(TEXT("/api/scenes/sync"), SceneBody,
        FOnAssetLensResponse::CreateLambda([World](bool bSuccess, TSharedPtr<FJsonObject> Response)
        {
            if (bSuccess)
            {
                UE_LOG(LogTemp, Log, TEXT("AssetLens: Scene '%s' synced successfully"),
                    *World->GetMapName());

                FString SceneId;
                if (Response.IsValid() && Response->TryGetStringField(TEXT("id"), SceneId))
                {
                    const UAssetLensSettings* Settings = GetDefault<UAssetLensSettings>();
                    const FString URL = FString::Printf(TEXT("%s/scenes/%s"),
                        *Settings->FrontendURL,
                        *SceneId);

                    AsyncTask(ENamedThreads::GameThread, [URL]()
                    {
                        FAssetLensWebViewPanel::NavigateTo(URL);
                    });
                }
            }
            else
            {
                UE_LOG(LogTemp, Warning, TEXT("AssetLens: Failed to sync scene"));
            }
        }));
}

TArray<TSharedPtr<FJsonValue>> FAssetLensSceneParser::ParseActors(UWorld* World)
{
    TArray<TSharedPtr<FJsonValue>> ActorsArray;

    for (TActorIterator<AActor> It(World); It; ++It)
    {
        AActor* Actor = *It;
        if (!Actor || Actor->IsHidden()) continue;

        const FString ActorName = Actor->GetName();
        if (ActorName.StartsWith(TEXT("Default")) ||
            ActorName.StartsWith(TEXT("WorldSettings")) ||
            ActorName.StartsWith(TEXT("GameMode")) ||
            ActorName.StartsWith(TEXT("AtmosphericFog")) ||
            ActorName.StartsWith(TEXT("SkyAtmosphere")))
        {
            continue;
        }

        TSharedPtr<FJsonObject> ActorJson = ParseActor(Actor);
        if (ActorJson.IsValid())
        {
            ActorsArray.Add(MakeShared<FJsonValueObject>(ActorJson));
        }
    }

    return ActorsArray;
}

TSharedPtr<FJsonObject> FAssetLensSceneParser::ParseActor(AActor* Actor)
{
    if (!Actor) return nullptr;

    TSharedPtr<FJsonObject> ActorJson = MakeShared<FJsonObject>();

    ActorJson->SetStringField(TEXT("name"), Actor->GetName());
    ActorJson->SetStringField(TEXT("label"), Actor->GetActorLabel());
    ActorJson->SetObjectField(TEXT("transform"), ParseTransform(Actor->GetActorTransform()));

    FString ActorType = TEXT("Actor");

    ULightComponent* LightComp = Actor->FindComponentByClass<ULightComponent>();
    if (LightComp)
    {
        ActorType = TEXT("Light");
        ActorJson->SetObjectField(TEXT("light"), ParseLightComponent(LightComp));
    }
    else if (Actor->IsA<AStaticMeshActor>())
    {
        ActorType = TEXT("StaticMeshActor");

        UStaticMeshComponent* MeshComp = Actor->FindComponentByClass<UStaticMeshComponent>();
        if (MeshComp && MeshComp->GetStaticMesh())
        {
            TSharedPtr<FJsonObject> MeshMeta = MakeShared<FJsonObject>();
            MeshMeta->SetStringField(TEXT("mesh_path"),
                MeshComp->GetStaticMesh()->GetPathName());
            MeshMeta->SetNumberField(TEXT("lod_count"),
                MeshComp->GetStaticMesh()->GetNumLODs());
            ActorJson->SetObjectField(TEXT("mesh_metadata"), MeshMeta);
        }
    }
    else if (Actor->GetClass()->IsInBlueprint())
    {
        ActorType = TEXT("Blueprint");
        ActorJson->SetStringField(TEXT("blueprint_path"),
            Actor->GetClass()->GetPathName());
    }

    ActorJson->SetStringField(TEXT("actor_type"), ActorType);

    TArray<TSharedPtr<FJsonValue>> TagsArray;
    for (const FName& Tag : Actor->Tags)
    {
        TagsArray.Add(MakeShared<FJsonValueString>(Tag.ToString()));
    }
    ActorJson->SetArrayField(TEXT("tags"), TagsArray);

    return ActorJson;
}

TSharedPtr<FJsonObject> FAssetLensSceneParser::ParseLightComponent(ULightComponent* LightComp)
{
    if (!LightComp) return nullptr;

    TSharedPtr<FJsonObject> LightJson = MakeShared<FJsonObject>();

    FString LightType = TEXT("Unknown");
    if (LightComp->IsA<UPointLightComponent>())       LightType = TEXT("Point");
    else if (LightComp->IsA<USpotLightComponent>())   LightType = TEXT("Spot");
    else if (LightComp->IsA<UDirectionalLightComponent>()) LightType = TEXT("Directional");
    else if (LightComp->IsA<URectLightComponent>())   LightType = TEXT("Rect");

    LightJson->SetStringField(TEXT("type"), LightType);
    LightJson->SetNumberField(TEXT("intensity"), LightComp->Intensity);
    LightJson->SetStringField(TEXT("color"), ColorToHex(LightComp->LightColor));
    LightJson->SetBoolField(TEXT("cast_shadows"), LightComp->CastShadows);

    if (LightComp->bUseTemperature)
    {
        LightJson->SetNumberField(TEXT("temperature"), LightComp->Temperature);
    }

    if (UPointLightComponent* PointComp = Cast<UPointLightComponent>(LightComp))
    {
        LightJson->SetNumberField(TEXT("attenuation_radius"), PointComp->AttenuationRadius);
    }

    if (USpotLightComponent* SpotComp = Cast<USpotLightComponent>(LightComp))
    {
        LightJson->SetNumberField(TEXT("inner_cone_angle"), SpotComp->InnerConeAngle);
        LightJson->SetNumberField(TEXT("outer_cone_angle"), SpotComp->OuterConeAngle);
    }

    return LightJson;
}

TSharedPtr<FJsonObject> FAssetLensSceneParser::ParseTransform(const FTransform& Transform)
{
    TSharedPtr<FJsonObject> TransformJson = MakeShared<FJsonObject>();

    TSharedPtr<FJsonObject> Location = MakeShared<FJsonObject>();
    Location->SetNumberField(TEXT("x"), Transform.GetLocation().X);
    Location->SetNumberField(TEXT("y"), Transform.GetLocation().Y);
    Location->SetNumberField(TEXT("z"), Transform.GetLocation().Z);

    TSharedPtr<FJsonObject> Rotation = MakeShared<FJsonObject>();
    Rotation->SetNumberField(TEXT("pitch"), Transform.GetRotation().Rotator().Pitch);
    Rotation->SetNumberField(TEXT("yaw"), Transform.GetRotation().Rotator().Yaw);
    Rotation->SetNumberField(TEXT("roll"), Transform.GetRotation().Rotator().Roll);

    TSharedPtr<FJsonObject> Scale = MakeShared<FJsonObject>();
    Scale->SetNumberField(TEXT("x"), Transform.GetScale3D().X);
    Scale->SetNumberField(TEXT("y"), Transform.GetScale3D().Y);
    Scale->SetNumberField(TEXT("z"), Transform.GetScale3D().Z);

    TransformJson->SetObjectField(TEXT("location"), Location);
    TransformJson->SetObjectField(TEXT("rotation"), Rotation);
    TransformJson->SetObjectField(TEXT("scale"), Scale);

    return TransformJson;
}

FString FAssetLensSceneParser::ColorToHex(const FLinearColor& Color)
{
    return FString::Printf(TEXT("#%02X%02X%02X"),
        FMath::Clamp(FMath::RoundToInt(Color.R * 255), 0, 255),
        FMath::Clamp(FMath::RoundToInt(Color.G * 255), 0, 255),
        FMath::Clamp(FMath::RoundToInt(Color.B * 255), 0, 255));
}