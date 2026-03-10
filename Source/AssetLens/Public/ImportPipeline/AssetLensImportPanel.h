// Copyright Maxime Freteau. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Widgets/Docking/SDockTab.h"
#include "Widgets/Views/SListView.h"
#include "Dom/JsonObject.h"

UENUM()
enum class EAssetLensTextureType : uint8
{
    Albedo,
    Normal,
    ORM,
    Roughness,
    Metallic,
    Emissive,
    AmbientOcclusion,
    Opacity,
};

struct FTextureSlot
{
    FString               SlotName;
    FString               Suffix;
    FString               FilePath;
    EAssetLensTextureType TextureType;
    bool                  bSRGB;
    bool                  bGrayscale;
    FString               CompressionSettings;
};

struct FAssetLensTask
{
    FString Id;
    FString AssetName;
    FString AssetType;
    FString Status;
    FString Priority;
    FString DestinationPath;
    FString MaterialPath;
    FString Brief;
    int32   TargetPolycount;
    FString TargetTextureSize;
    TSharedPtr<FJsonObject> ImportConfig;
};

class ASSETLENS_API FAssetLensImportPanel
{
public:
    static void Register();
    static void Unregister();
    static void OpenPanel();

private:
    static TSharedRef<SDockTab> OnSpawnTab(const FSpawnTabArgs& Args);
    static const FName TabId;

    static TSharedRef<ITableRow> OnGenerateTaskRow(
        TSharedPtr<FAssetLensTask> Task,
        const TSharedRef<STableViewBase>& OwnerTable);

    static void RefreshTasks();
    static void OpenImportMappingDialog(TSharedPtr<FAssetLensTask> Task);
    static TSharedRef<SWidget> BuildTextureSlotList(TSharedPtr<TArray<FTextureSlot>> Slots);

    static void ImportAssetForTask(TSharedPtr<FAssetLensTask> Task, const FString& FilePath);

    static void RunImportTask(
        const FString& FilePath,
        const FString& DestinationPath,
        const FString& MaterialPath,
        const FString& TaskId,
        const FTextureSlot* TextureSlot = nullptr);

    static void ApplyTextureSettings(UTexture2D* Texture, const FTextureSlot& Slot);
    static TArray<FTextureSlot> GetDefaultTextureSlots();

    static void ValidateTask(TSharedPtr<FAssetLensTask> Task);
    static void SendBackTask(TSharedPtr<FAssetLensTask> Task);

    static TArray<TSharedPtr<FAssetLensTask>> Tasks;
    static TSharedPtr<SListView<TSharedPtr<FAssetLensTask>>> TaskListView;
};