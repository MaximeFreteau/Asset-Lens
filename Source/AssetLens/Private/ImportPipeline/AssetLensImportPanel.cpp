// Copyright Maxime Freteau. All Rights Reserved.

#include "ImportPipeline/AssetLensImportPanel.h"
#include "AssetLensHttpClient.h"
#include "AssetLensSettings.h"
#include "WebView/AssetLensWebViewPanel.h"
#include "Framework/Docking/TabManager.h"
#include "Framework/Application/SlateApplication.h"
#include "WorkspaceMenuStructure.h"
#include "WorkspaceMenuStructureModule.h"
#include "Styling/AppStyle.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Layout/SScrollBox.h"
#include "Widgets/Layout/SSplitter.h"
#include "Widgets/Text/STextBlock.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Input/SEditableTextBox.h"
#include "Widgets/Views/SListView.h"
#include "Widgets/Views/STableRow.h"
#include "DesktopPlatformModule.h"
#include "IDesktopPlatform.h"
#include "AssetToolsModule.h"
#include "IAssetTools.h"
#include "AssetImportTask.h"
#include "EditorAssetLibrary.h"
#include "Engine/Texture2D.h"
#include "TextureCompressorModule.h"
#include "Dom/JsonObject.h"
#include "Dom/JsonValue.h"

const FName FAssetLensImportPanel::TabId = FName(TEXT("AssetLensImport"));
TArray<TSharedPtr<FAssetLensTask>> FAssetLensImportPanel::Tasks;
TSharedPtr<SListView<TSharedPtr<FAssetLensTask>>> FAssetLensImportPanel::TaskListView;

TArray<FTextureSlot> FAssetLensImportPanel::GetDefaultTextureSlots()
{
    TArray<FTextureSlot> Slots;

    Slots.Add({ TEXT("Albedo / Diffuse"),     TEXT("_D"),   TEXT(""), EAssetLensTextureType::Albedo,           true,  false, TEXT("TC_Default")  });
    Slots.Add({ TEXT("Normal Map"),           TEXT("_N"),   TEXT(""), EAssetLensTextureType::Normal,           false, false, TEXT("TC_Normalmap") });
    Slots.Add({ TEXT("ORM (AO+Rough+Metal)"), TEXT("_ORM"), TEXT(""), EAssetLensTextureType::ORM,              false, false, TEXT("TC_Masks")     });
    Slots.Add({ TEXT("Roughness"),            TEXT("_R"),   TEXT(""), EAssetLensTextureType::Roughness,        false, true,  TEXT("TC_Grayscale") });
    Slots.Add({ TEXT("Metallic"),             TEXT("_M"),   TEXT(""), EAssetLensTextureType::Metallic,         false, true,  TEXT("TC_Grayscale") });
    Slots.Add({ TEXT("Emissive"),             TEXT("_E"),   TEXT(""), EAssetLensTextureType::Emissive,         true,  false, TEXT("TC_Default")   });
    Slots.Add({ TEXT("Ambient Occlusion"),    TEXT("_AO"),  TEXT(""), EAssetLensTextureType::AmbientOcclusion, false, true,  TEXT("TC_Grayscale") });
    Slots.Add({ TEXT("Opacity / Mask"),       TEXT("_OP"),  TEXT(""), EAssetLensTextureType::Opacity,          false, true,  TEXT("TC_Grayscale") });

    return Slots;
}

TSharedRef<SWidget> FAssetLensImportPanel::BuildTextureSlotList(
    TSharedPtr<TArray<FTextureSlot>> Slots)
{
    TSharedRef<SVerticalBox> SlotList = SNew(SVerticalBox);

    for (int32 i = 0; i < Slots->Num(); i++)
    {
        TSharedPtr<FTextureSlot> Slot = MakeShared<FTextureSlot>((*Slots)[i]);

        FLinearColor BadgeColor = FLinearColor(0.3f, 0.3f, 0.3f);
        switch (Slot->TextureType)
        {
            case EAssetLensTextureType::Albedo:   BadgeColor = FLinearColor(0.8f, 0.4f, 0.1f); break;
            case EAssetLensTextureType::Normal:   BadgeColor = FLinearColor(0.2f, 0.4f, 0.9f); break;
            case EAssetLensTextureType::ORM:      BadgeColor = FLinearColor(0.1f, 0.7f, 0.3f); break;
            case EAssetLensTextureType::Emissive: BadgeColor = FLinearColor(0.9f, 0.8f, 0.1f); break;
            default:                              BadgeColor = FLinearColor(0.5f, 0.5f, 0.5f); break;
        }

        SlotList->AddSlot()
        .AutoHeight()
        .Padding(0.f, 3.f)
        [
            SNew(SHorizontalBox)

            + SHorizontalBox::Slot()
            .AutoWidth()
            .VAlign(VAlign_Center)
            .Padding(0.f, 0.f, 6.f, 0.f)
            [
                SNew(SBox)
                .WidthOverride(8.f)
                .HeightOverride(8.f)
                [
                    SNew(SBorder)
                    .BorderBackgroundColor(BadgeColor)
                ]
            ]

            + SHorizontalBox::Slot()
            .FillWidth(0.28f)
            .VAlign(VAlign_Center)
            [
                SNew(STextBlock)
                .Text(FText::FromString(Slot->SlotName))
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 9))
            ]

            + SHorizontalBox::Slot()
            .FillWidth(0.28f)
            .VAlign(VAlign_Center)
            .Padding(4.f, 0.f)
            [
                SNew(STextBlock)
                .Text(FText::FromString(FString::Printf(TEXT("%s • %s"),
                    Slot->bSRGB ? TEXT("sRGB") : TEXT("Linear"),
                    *Slot->CompressionSettings)))
                .ColorAndOpacity(FSlateColor(FLinearColor(0.45f, 0.45f, 0.45f)))
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 8))
            ]

            + SHorizontalBox::Slot()
            .FillWidth(0.28f)
            .VAlign(VAlign_Center)
            .Padding(4.f, 0.f)
            [
                SNew(STextBlock)
                .Text_Lambda([Slot]()
                {
                    return FText::FromString(
                        Slot->FilePath.IsEmpty()
                            ? TEXT("—")
                            : FPaths::GetCleanFilename(Slot->FilePath));
                })
                .ColorAndOpacity_Lambda([Slot]()
                {
                    return FSlateColor(Slot->FilePath.IsEmpty()
                        ? FLinearColor(0.4f, 0.4f, 0.4f)
                        : FLinearColor(0.4f, 0.9f, 0.4f));
                })
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 9))
            ]

            + SHorizontalBox::Slot()
            .AutoWidth()
            .VAlign(VAlign_Center)
            .Padding(2.f, 0.f)
            [
                SNew(SButton)
                .Text(FText::FromString(TEXT("...")))
                .OnClicked_Lambda([Slot]()
                {
                    IDesktopPlatform* DP = FDesktopPlatformModule::Get();
                    TArray<FString> Files;
                    if (DP && DP->OpenFileDialog(nullptr,
                        FString::Printf(TEXT("Choisir %s"), *Slot->SlotName),
                        TEXT(""), TEXT(""),
                        TEXT("Textures|*.png;*.jpg;*.tga;*.exr;*.hdr|Tous|*.*"),
                        EFileDialogFlags::None, Files))
                    {
                        Slot->FilePath = Files[0];
                    }
                    return FReply::Handled();
                })
            ]

            + SHorizontalBox::Slot()
            .AutoWidth()
            .VAlign(VAlign_Center)
            [
                SNew(SButton)
                .Text(FText::FromString(TEXT("✕")))
                .OnClicked_Lambda([Slot]()
                {
                    Slot->FilePath = TEXT("");
                    return FReply::Handled();
                })
            ]
        ];
    }

    return SlotList;
}

void FAssetLensImportPanel::ApplyTextureSettings(UTexture2D* Texture, const FTextureSlot& Slot)
{
    if (!Texture) return;

    const UAssetLensSettings* Settings = GetDefault<UAssetLensSettings>();

    switch (Slot.TextureType)
    {
        case EAssetLensTextureType::Albedo:
            Texture->SRGB                = Settings->bAlbedo_SRGB;
            Texture->CompressionSettings = Settings->Albedo_Compression;
            Texture->LODGroup            = Settings->Albedo_LODGroup;
            break;

        case EAssetLensTextureType::Normal:
            Texture->SRGB                = Settings->bNormal_SRGB;
            Texture->CompressionSettings = Settings->Normal_Compression;
            Texture->LODGroup            = Settings->Normal_LODGroup;
            Texture->bFlipGreenChannel   = Settings->bNormal_FlipGreenChannel;
            break;

        case EAssetLensTextureType::ORM:
            Texture->SRGB                = Settings->bORM_SRGB;
            Texture->CompressionSettings = Settings->ORM_Compression;
            Texture->LODGroup            = Settings->ORM_LODGroup;
            break;

        case EAssetLensTextureType::Roughness:
            Texture->SRGB                = Settings->bRoughness_SRGB;
            Texture->CompressionSettings = Settings->Roughness_Compression;
            Texture->LODGroup            = Settings->Roughness_LODGroup;
            break;

        case EAssetLensTextureType::Metallic:
            Texture->SRGB                = Settings->bMetallic_SRGB;
            Texture->CompressionSettings = Settings->Metallic_Compression;
            Texture->LODGroup            = Settings->Metallic_LODGroup;
            break;

        case EAssetLensTextureType::Emissive:
            Texture->SRGB                = Settings->bEmissive_SRGB;
            Texture->CompressionSettings = Settings->Emissive_Compression;
            Texture->LODGroup            = Settings->Emissive_LODGroup;
            break;

        case EAssetLensTextureType::AmbientOcclusion:
            Texture->SRGB                = Settings->bAO_SRGB;
            Texture->CompressionSettings = Settings->AO_Compression;
            Texture->LODGroup            = Settings->AO_LODGroup;
            if (Settings->bAO_NoMipmaps)
                Texture->MipGenSettings  = TMGS_NoMipmaps;
            break;

        case EAssetLensTextureType::Opacity:
            Texture->SRGB                = Settings->bOpacity_SRGB;
            Texture->CompressionSettings = Settings->Opacity_Compression;
            Texture->LODGroup            = Settings->Opacity_LODGroup;
            if (Settings->bOpacity_NoMipmaps)
                Texture->MipGenSettings  = TMGS_NoMipmaps;
            break;
    }

    Texture->MarkPackageDirty();
    Texture->PostEditChange();

    UE_LOG(LogTemp, Log, TEXT("AssetLens: Applied settings to %s — sRGB:%d"),
        *Texture->GetName(), Texture->SRGB ? 1 : 0);
}

void FAssetLensImportPanel::Register()
{
    FGlobalTabmanager::Get()->RegisterNomadTabSpawner(
        TabId,
        FOnSpawnTab::CreateStatic(&FAssetLensImportPanel::OnSpawnTab))
        .SetDisplayName(FText::FromString(TEXT("AssetLens Import")))
        .SetTooltipText(FText::FromString(TEXT("Pipeline d'import AssetLens")))
        .SetIcon(FSlateIcon(FAppStyle::GetAppStyleSetName(), TEXT("Icons.Import")))
        .SetGroup(WorkspaceMenu::GetMenuStructure().GetToolsCategory());
}

void FAssetLensImportPanel::Unregister()
{
    FGlobalTabmanager::Get()->UnregisterNomadTabSpawner(TabId);
    Tasks.Empty();
    TaskListView = nullptr;
}

void FAssetLensImportPanel::OpenPanel()
{
    FGlobalTabmanager::Get()->TryInvokeTab(TabId);
    RefreshTasks();
}

TSharedRef<SDockTab> FAssetLensImportPanel::OnSpawnTab(const FSpawnTabArgs& Args)
{
    RefreshTasks();

    return SNew(SDockTab)
        .TabRole(ETabRole::NomadTab)
        [
            SNew(SVerticalBox)

            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(12.f, 12.f, 12.f, 8.f)
            [
                SNew(SHorizontalBox)

                + SHorizontalBox::Slot()
                .FillWidth(1.f)
                [
                    SNew(STextBlock)
                    .Text(FText::FromString(TEXT("Import Pipeline")))
                    .Font(FCoreStyle::GetDefaultFontStyle("Bold", 14))
                ]

                + SHorizontalBox::Slot()
                .AutoWidth()
                .VAlign(VAlign_Center)
                .Padding(0.f, 0.f, 8.f, 0.f)
                [
                    SNew(STextBlock)
                    .Text_Lambda([]()
                    {
                        const UAssetLensSettings* S = GetDefault<UAssetLensSettings>();
                        return FText::FromString(FString::Printf(
                            TEXT("[%s]"), *S->UserRole.ToUpper()));
                    })
                    .ColorAndOpacity_Lambda([]()
                    {
                        const UAssetLensSettings* S = GetDefault<UAssetLensSettings>();
                        const bool bIsLead = (S->UserRole == TEXT("lead") ||
                                              S->UserRole == TEXT("producer"));
                        return FSlateColor(bIsLead
                            ? FLinearColor(0.4f, 0.9f, 0.4f)
                            : FLinearColor(0.6f, 0.6f, 0.6f));
                    })
                    .Font(FCoreStyle::GetDefaultFontStyle("Bold", 9))
                ]

                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SNew(SButton)
                    .Text(FText::FromString(TEXT("↺ Rafraîchir")))
                    .OnClicked_Lambda([]()
                    {
                        FAssetLensImportPanel::RefreshTasks();
                        return FReply::Handled();
                    })
                ]
            ]

            + SVerticalBox::Slot()
            .AutoHeight()
            [
                SNew(SSeparator)
            ]

            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(12.f, 8.f)
            [
                SNew(STextBlock)
                .Text_Lambda([]()
                {
                    const UAssetLensSettings* S = GetDefault<UAssetLensSettings>();
                    const bool bIsLead = (S->UserRole == TEXT("lead") ||
                                          S->UserRole == TEXT("producer"));
                    return FText::FromString(bIsLead
                        ? TEXT("Tasks en attente de validation. Vous pouvez valider ou renvoyer à l'artiste.")
                        : TEXT("Vos tasks assignées. Cliquez sur Importer pour livrer un asset."));
                })
                .ColorAndOpacity(FSlateColor(FLinearColor(0.6f, 0.6f, 0.6f)))
            ]

            + SVerticalBox::Slot()
            .FillHeight(1.f)
            .Padding(12.f, 4.f)
            [
                SAssignNew(TaskListView, SListView<TSharedPtr<FAssetLensTask>>)
                .ListItemsSource(&Tasks)
                .OnGenerateRow_Static(&FAssetLensImportPanel::OnGenerateTaskRow)
                .SelectionMode(ESelectionMode::Single)
                .HeaderRow(
                    SNew(SHeaderRow)

                    + SHeaderRow::Column(TEXT("Name"))
                    .DefaultLabel(FText::FromString(TEXT("Asset")))
                    .FillWidth(0.25f)

                    + SHeaderRow::Column(TEXT("Type"))
                    .DefaultLabel(FText::FromString(TEXT("Type")))
                    .FillWidth(0.12f)

                    + SHeaderRow::Column(TEXT("Status"))
                    .DefaultLabel(FText::FromString(TEXT("Statut")))
                    .FillWidth(0.13f)

                    + SHeaderRow::Column(TEXT("Priority"))
                    .DefaultLabel(FText::FromString(TEXT("Priorité")))
                    .FillWidth(0.12f)

                    + SHeaderRow::Column(TEXT("Destination"))
                    .DefaultLabel(FText::FromString(TEXT("Destination")))
                    .FillWidth(0.23f)

                    + SHeaderRow::Column(TEXT("Actions"))
                    .DefaultLabel(FText::FromString(TEXT("Actions")))
                    .FillWidth(0.15f)
                )
            ]
        ];
}

TSharedRef<ITableRow> FAssetLensImportPanel::OnGenerateTaskRow(
    TSharedPtr<FAssetLensTask> Task,
    const TSharedRef<STableViewBase>& OwnerTable)
{
    FLinearColor PriorityColor = FLinearColor::White;
    if      (Task->Priority == TEXT("critical")) PriorityColor = FLinearColor(1.f, 0.2f, 0.2f);
    else if (Task->Priority == TEXT("high"))     PriorityColor = FLinearColor(1.f, 0.6f, 0.1f);
    else if (Task->Priority == TEXT("normal"))   PriorityColor = FLinearColor(0.4f, 0.7f, 1.f);
    else if (Task->Priority == TEXT("low"))      PriorityColor = FLinearColor(0.6f, 0.6f, 0.6f);

    FLinearColor StatusColor = FLinearColor::White;
    if      (Task->Status == TEXT("todo"))        StatusColor = FLinearColor(0.6f, 0.6f, 0.6f);
    else if (Task->Status == TEXT("in_progress")) StatusColor = FLinearColor(0.4f, 0.7f, 1.f);
    else if (Task->Status == TEXT("review"))      StatusColor = FLinearColor(1.f, 0.8f, 0.2f);
    else if (Task->Status == TEXT("validated"))   StatusColor = FLinearColor(0.2f, 0.9f, 0.2f);

    return SNew(STableRow<TSharedPtr<FAssetLensTask>>, OwnerTable)
        .Padding(FMargin(4.f, 6.f))
        [
            SNew(SHorizontalBox)

            + SHorizontalBox::Slot()
            .FillWidth(0.25f)
            .VAlign(VAlign_Center)
            [
                SNew(STextBlock)
                .Text(FText::FromString(Task->AssetName))
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 10))
            ]

            + SHorizontalBox::Slot()
            .FillWidth(0.12f)
            .VAlign(VAlign_Center)
            [
                SNew(STextBlock)
                .Text(FText::FromString(Task->AssetType))
                .ColorAndOpacity(FSlateColor(FLinearColor(0.6f, 0.6f, 0.6f)))
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 9))
            ]

            + SHorizontalBox::Slot()
            .FillWidth(0.13f)
            .VAlign(VAlign_Center)
            [
                SNew(STextBlock)
                .Text(FText::FromString(Task->Status))
                .ColorAndOpacity(FSlateColor(StatusColor))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 9))
            ]

            + SHorizontalBox::Slot()
            .FillWidth(0.12f)
            .VAlign(VAlign_Center)
            [
                SNew(STextBlock)
                .Text(FText::FromString(Task->Priority))
                .ColorAndOpacity(FSlateColor(PriorityColor))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 9))
            ]

            + SHorizontalBox::Slot()
            .FillWidth(0.23f)
            .VAlign(VAlign_Center)
            [
                SNew(STextBlock)
                .Text(FText::FromString(Task->DestinationPath))
                .ColorAndOpacity(FSlateColor(FLinearColor(0.6f, 0.6f, 0.6f)))
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 9))
            ]

            + SHorizontalBox::Slot()
            .AutoWidth()
            .VAlign(VAlign_Center)
            .Padding(2.f, 0.f)
            [
                SNew(SButton)
                .Text(FText::FromString(TEXT("Importer")))
                .Visibility_Lambda([Task]()
                {
                    const UAssetLensSettings* S = GetDefault<UAssetLensSettings>();
                    const bool bIsLead = (S->UserRole == TEXT("lead") ||
                                          S->UserRole == TEXT("producer"));
                    const bool bCanImport = (Task->Status == TEXT("todo") ||
                                             Task->Status == TEXT("in_progress"));
                    return (!bIsLead && bCanImport)
                        ? EVisibility::Visible : EVisibility::Collapsed;
                })
                .OnClicked_Lambda([Task]()
                {
                    FAssetLensImportPanel::OpenImportMappingDialog(Task);
                    return FReply::Handled();
                })
            ]

            + SHorizontalBox::Slot()
            .AutoWidth()
            .VAlign(VAlign_Center)
            .Padding(2.f, 0.f)
            [
                SNew(SButton)
                .Text(FText::FromString(TEXT("✓ Valider")))
                .Visibility_Lambda([Task]()
                {
                    const UAssetLensSettings* S = GetDefault<UAssetLensSettings>();
                    const bool bIsLead = (S->UserRole == TEXT("lead") ||
                                          S->UserRole == TEXT("producer"));
                    return (bIsLead && Task->Status == TEXT("review"))
                        ? EVisibility::Visible : EVisibility::Collapsed;
                })
                .OnClicked_Lambda([Task]()
                {
                    FAssetLensImportPanel::ValidateTask(Task);
                    return FReply::Handled();
                })
            ]

            + SHorizontalBox::Slot()
            .AutoWidth()
            .VAlign(VAlign_Center)
            .Padding(2.f, 0.f)
            [
                SNew(SButton)
                .Text(FText::FromString(TEXT("↩ Refaire")))
                .Visibility_Lambda([Task]()
                {
                    const UAssetLensSettings* S = GetDefault<UAssetLensSettings>();
                    const bool bIsLead = (S->UserRole == TEXT("lead") ||
                                          S->UserRole == TEXT("producer"));
                    return (bIsLead && Task->Status == TEXT("review"))
                        ? EVisibility::Visible : EVisibility::Collapsed;
                })
                .OnClicked_Lambda([Task]()
                {
                    FAssetLensImportPanel::SendBackTask(Task);
                    return FReply::Handled();
                })
            ]

            + SHorizontalBox::Slot()
            .AutoWidth()
            .VAlign(VAlign_Center)
            .Padding(2.f, 0.f)
            [
                SNew(SButton)
                .Text(FText::FromString(TEXT("Doc")))
                .OnClicked_Lambda([Task]()
                {
                    const UAssetLensSettings* Settings = GetDefault<UAssetLensSettings>();
                    const FString URL = FString::Printf(TEXT("%s/tasks/%s"),
                        *Settings->FrontendURL, *Task->Id);
                    FAssetLensWebViewPanel::NavigateTo(URL);
                    return FReply::Handled();
                })
            ]
        ];
}

void FAssetLensImportPanel::ValidateTask(TSharedPtr<FAssetLensTask> Task)
{
    TSharedPtr<FJsonObject> Body = MakeShared<FJsonObject>();
    Body->SetStringField(TEXT("status"), TEXT("validated"));

    FAssetLensHttpClient::Get().Patch(
        FString::Printf(TEXT("/api/tasks/%s/status"), *Task->Id),
        Body,
        FOnAssetLensResponse::CreateLambda([](bool bSuccess, TSharedPtr<FJsonObject>)
        {
            if (bSuccess)
            {
                UE_LOG(LogTemp, Log, TEXT("AssetLens: Task validated"));
                AsyncTask(ENamedThreads::GameThread, []()
                {
                    FAssetLensImportPanel::RefreshTasks();
                });
            }
        }));
}

void FAssetLensImportPanel::SendBackTask(TSharedPtr<FAssetLensTask> Task)
{
    TSharedPtr<FJsonObject> Body = MakeShared<FJsonObject>();
    Body->SetStringField(TEXT("status"), TEXT("todo"));

    FAssetLensHttpClient::Get().Patch(
        FString::Printf(TEXT("/api/tasks/%s/status"), *Task->Id),
        Body,
        FOnAssetLensResponse::CreateLambda([](bool bSuccess, TSharedPtr<FJsonObject>)
        {
            if (bSuccess)
            {
                UE_LOG(LogTemp, Log, TEXT("AssetLens: Task sent back to artist"));
                AsyncTask(ENamedThreads::GameThread, []()
                {
                    FAssetLensImportPanel::RefreshTasks();
                });
            }
        }));
}

void FAssetLensImportPanel::OpenImportMappingDialog(TSharedPtr<FAssetLensTask> Task)
{
    TSharedPtr<TArray<FTextureSlot>> Slots =
        MakeShared<TArray<FTextureSlot>>(GetDefaultTextureSlots());

    TSharedPtr<FString> MeshFilePath   = MakeShared<FString>();
    TSharedPtr<FString> CustomDestPath = MakeShared<FString>(
        Task->DestinationPath.IsEmpty() ? TEXT("") : Task->DestinationPath);

    TSharedPtr<SWindow> Window = SNew(SWindow)
        .Title(FText::FromString(FString::Printf(
            TEXT("Import — %s"), *Task->AssetName)))
        .ClientSize(FVector2D(640, 600))
        .SupportsMaximize(false)
        .SupportsMinimize(false);

    Window->SetContent(
        SNew(SVerticalBox)

        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(12.f, 12.f, 12.f, 4.f)
        [
            SNew(STextBlock)
            .Text(FText::FromString(TEXT("Dossier de destination")))
            .Font(FCoreStyle::GetDefaultFontStyle("Bold", 11))
        ]

        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(12.f, 0.f, 12.f, 8.f)
        [
            SNew(SHorizontalBox)

            + SHorizontalBox::Slot()
            .FillWidth(1.f)
            [
                SNew(SEditableTextBox)
                .Text_Lambda([CustomDestPath]()
                {
                    return FText::FromString(*CustomDestPath);
                })
                .OnTextChanged_Lambda([CustomDestPath](const FText& NewText)
                {
                    *CustomDestPath = NewText.ToString();
                })
                .HintText(FText::FromString(TEXT("/Game/Assets/Environment/...")))
            ]

            + SHorizontalBox::Slot()
            .AutoWidth()
            .VAlign(VAlign_Center)
            .Padding(6.f, 0.f, 0.f, 0.f)
            [
                SNew(STextBlock)
                .Text_Lambda([CustomDestPath]()
                {
                    return CustomDestPath->IsEmpty()
                        ? FText::FromString(TEXT("⚠ Requis"))
                        : FText::GetEmpty();
                })
                .ColorAndOpacity(FSlateColor(FLinearColor(1.f, 0.3f, 0.3f)))
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 9))
            ]
        ]

        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(12.f, 0.f)
        [
            SNew(SSeparator)
        ]

        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(12.f, 12.f, 12.f, 4.f)
        [
            SNew(STextBlock)
            .Text(FText::FromString(TEXT("Mesh (FBX / OBJ)")))
            .Font(FCoreStyle::GetDefaultFontStyle("Bold", 11))
        ]

        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(12.f, 0.f, 12.f, 8.f)
        [
            SNew(SHorizontalBox)

            + SHorizontalBox::Slot()
            .FillWidth(1.f)
            .VAlign(VAlign_Center)
            [
                SNew(STextBlock)
                .Text_Lambda([MeshFilePath]()
                {
                    return FText::FromString(
                        MeshFilePath->IsEmpty()
                            ? TEXT("Aucun fichier sélectionné")
                            : FPaths::GetCleanFilename(*MeshFilePath));
                })
                .ColorAndOpacity_Lambda([MeshFilePath]()
                {
                    return FSlateColor(MeshFilePath->IsEmpty()
                        ? FLinearColor(0.5f, 0.5f, 0.5f)
                        : FLinearColor(0.4f, 0.9f, 0.4f));
                })
            ]

            + SHorizontalBox::Slot()
            .AutoWidth()
            [
                SNew(SButton)
                .Text(FText::FromString(TEXT("Parcourir...")))
                .OnClicked_Lambda([MeshFilePath]()
                {
                    IDesktopPlatform* DP = FDesktopPlatformModule::Get();
                    TArray<FString> Files;
                    if (DP && DP->OpenFileDialog(nullptr,
                        TEXT("Choisir le mesh"), TEXT(""), TEXT(""),
                        TEXT("Mesh|*.fbx;*.obj|Tous|*.*"),
                        EFileDialogFlags::None, Files))
                    {
                        *MeshFilePath = Files[0];
                    }
                    return FReply::Handled();
                })
            ]
        ]

        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(12.f, 0.f)
        [
            SNew(SSeparator)
        ]

        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(12.f, 8.f, 12.f, 4.f)
        [
            SNew(SHorizontalBox)

            + SHorizontalBox::Slot()
            .FillWidth(1.f)
            [
                SNew(STextBlock)
                .Text(FText::FromString(TEXT("Textures")))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 11))
            ]

            + SHorizontalBox::Slot()
            .AutoWidth()
            [
                SNew(STextBlock)
                .Text(FText::FromString(TEXT("Settings appliqués depuis Project Settings")))
                .ColorAndOpacity(FSlateColor(FLinearColor(0.5f, 0.5f, 0.5f)))
                .Font(FCoreStyle::GetDefaultFontStyle("Italic", 8))
            ]
        ]

        + SVerticalBox::Slot()
        .FillHeight(1.f)
        .Padding(12.f, 0.f)
        [
            SNew(SScrollBox)
            + SScrollBox::Slot()
            [
                FAssetLensImportPanel::BuildTextureSlotList(Slots)
            ]
        ]

        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(12.f, 4.f)
        [
            SNew(SSeparator)
        ]

        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(12.f, 0.f, 12.f, 12.f)
        [
            SNew(SHorizontalBox)

            + SHorizontalBox::Slot()
            .FillWidth(1.f)

            + SHorizontalBox::Slot()
            .AutoWidth()
            .Padding(0.f, 0.f, 8.f, 0.f)
            [
                SNew(SButton)
                .Text(FText::FromString(TEXT("Annuler")))
                .OnClicked_Lambda([Window]()
                {
                    Window->RequestDestroyWindow();
                    return FReply::Handled();
                })
            ]

            + SHorizontalBox::Slot()
            .AutoWidth()
            [
                SNew(SButton)
                .Text(FText::FromString(TEXT("Importer → Review")))
                .IsEnabled_Lambda([CustomDestPath]()
                {
                    return !CustomDestPath->IsEmpty();
                })
                .OnClicked_Lambda([Task, MeshFilePath, Slots, Window, CustomDestPath]()
                {
                    if (CustomDestPath->IsEmpty())
                        return FReply::Handled();

                    Window->RequestDestroyWindow();

                    FString DestPath = *CustomDestPath;

                    if (!MeshFilePath->IsEmpty())
                    {
                        FAssetLensImportPanel::RunImportTask(
                            *MeshFilePath, DestPath,
                            Task->MaterialPath, Task->Id, nullptr);
                    }

                    for (const FTextureSlot& Slot : *Slots)
                    {
                        if (!Slot.FilePath.IsEmpty())
                        {
                            FAssetLensImportPanel::RunImportTask(
                                Slot.FilePath,
                                FPaths::Combine(DestPath, TEXT("Textures")),
                                TEXT(""), Task->Id, &Slot);
                        }
                    }

                    return FReply::Handled();
                })
            ]
        ]
    );

    FSlateApplication::Get().AddWindow(Window.ToSharedRef());
}

void FAssetLensImportPanel::ImportAssetForTask(
    TSharedPtr<FAssetLensTask> Task, const FString& FilePath)
{
    if (!Task.IsValid() || FilePath.IsEmpty()) return;

    FString DestPath = Task->DestinationPath.IsEmpty()
        ? TEXT("/Game/Imports") : Task->DestinationPath;

    RunImportTask(FilePath, DestPath, Task->MaterialPath, Task->Id, nullptr);
}

void FAssetLensImportPanel::RunImportTask(
    const FString& FilePath,
    const FString& DestinationPath,
    const FString& MaterialPath,
    const FString& TaskId,
    const FTextureSlot* TextureSlot)
{
    if (!UEditorAssetLibrary::DoesDirectoryExist(DestinationPath))
    {
        UEditorAssetLibrary::MakeDirectory(DestinationPath);
        UE_LOG(LogTemp, Log, TEXT("AssetLens: Created directory %s"), *DestinationPath);
    }

    UAssetImportTask* ImportTask = NewObject<UAssetImportTask>();
    ImportTask->Filename         = FilePath;
    ImportTask->DestinationPath  = DestinationPath;
    ImportTask->bAutomated       = true;
    ImportTask->bSave            = false;
    ImportTask->bReplaceExisting = true;

    IAssetTools& AssetTools = FModuleManager::GetModuleChecked<FAssetToolsModule>(
        TEXT("AssetTools")).Get();

    TArray<UAssetImportTask*> ImportTasks;
    ImportTasks.Add(ImportTask);
    AssetTools.ImportAssetTasks(ImportTasks);

    if (TextureSlot && ImportTask->ImportedObjectPaths.Num() > 0)
    {
        const FString ImportedPath = ImportTask->ImportedObjectPaths[0];
        UTexture2D* Texture = Cast<UTexture2D>(
            UEditorAssetLibrary::LoadAsset(ImportedPath));

        if (Texture)
        {
            ApplyTextureSettings(Texture, *TextureSlot);
            UEditorAssetLibrary::SaveAsset(ImportedPath);

            UE_LOG(LogTemp, Log, TEXT("AssetLens: Texture %s imported — %s • %s"),
                *FPaths::GetCleanFilename(FilePath),
                TextureSlot->bSRGB ? TEXT("sRGB") : TEXT("Linear"),
                *TextureSlot->CompressionSettings);
        }
    }

    if (!TextureSlot && !MaterialPath.IsEmpty() && ImportTask->ImportedObjectPaths.Num() > 0)
    {
        const FString ImportedPath = ImportTask->ImportedObjectPaths[0];
        UStaticMesh* Mesh = Cast<UStaticMesh>(
            UEditorAssetLibrary::LoadAsset(ImportedPath));

        if (Mesh)
        {
            UMaterialInterface* Material = Cast<UMaterialInterface>(
                UEditorAssetLibrary::LoadAsset(MaterialPath));

            if (Material)
            {
                Mesh->SetMaterial(0, Material);
                UEditorAssetLibrary::SaveAsset(ImportedPath);
            }
        }
    }

    if (ImportTask->ImportedObjectPaths.Num() > 0)
    {
        UEditorAssetLibrary::SaveAsset(ImportTask->ImportedObjectPaths[0]);
    }

    UE_LOG(LogTemp, Log, TEXT("AssetLens: Imported %s → %s"),
        *FPaths::GetCleanFilename(FilePath), *DestinationPath);

    if (!TextureSlot)
    {
        TSharedPtr<FJsonObject> Body = MakeShared<FJsonObject>();
        Body->SetStringField(TEXT("status"), TEXT("review"));

        FAssetLensHttpClient::Get().Patch(
            FString::Printf(TEXT("/api/tasks/%s/status"), *TaskId),
            Body,
            FOnAssetLensResponse::CreateLambda([TaskId](bool bSuccess, TSharedPtr<FJsonObject>)
            {
                if (bSuccess)
                {
                    UE_LOG(LogTemp, Log,
                        TEXT("AssetLens: Task %s moved to review"), *TaskId);

                    AsyncTask(ENamedThreads::GameThread, []()
                    {
                        FAssetLensImportPanel::RefreshTasks();
                    });
                }
            }));
    }
}

void FAssetLensImportPanel::RefreshTasks()
{
    const UAssetLensSettings* Settings = GetDefault<UAssetLensSettings>();
    const bool bIsLead = (Settings->UserRole == TEXT("lead") ||
                           Settings->UserRole == TEXT("producer"));

    FString Endpoint;

    if (bIsLead)
    {
        Endpoint = FString::Printf(
    TEXT("/api/tasks?assigned_to=%s&exclude_status[]=review&exclude_status[]=validated&exclude_status[]=integrated"),
    *Settings->UserID);
    }
    else
    {
        if (!Settings->UserID.IsEmpty())
        {
            Endpoint = FString::Printf(
                TEXT("/api/tasks?assigned_to=%s&status[]=todo&status[]=in_progress"),
                *Settings->UserID);
        }
        else
        {
            Endpoint = TEXT("/api/tasks?status[]=todo&status[]=in_progress");
        }
    }

    FAssetLensHttpClient::Get().GetArray(Endpoint,
        
        FOnAssetLensArrayResponse::CreateLambda(
            [](bool bSuccess, TArray<TSharedPtr<FJsonValue>> Response)
            {
                if (!bSuccess) return;

                Tasks.Empty();
                UE_LOG(LogTemp, Log, TEXT("AssetLens: Got %d tasks from backend"), Response.Num());

                for (const TSharedPtr<FJsonValue>& TaskValue : Response)
                {
                    TSharedPtr<FJsonObject> TaskObj = TaskValue->AsObject();
                    if (!TaskObj.IsValid()) continue;

                    TSharedPtr<FAssetLensTask> Task = MakeShared<FAssetLensTask>();

                    TaskObj->TryGetStringField(TEXT("id"),                  Task->Id);
                    TaskObj->TryGetStringField(TEXT("asset_name"),          Task->AssetName);
                    TaskObj->TryGetStringField(TEXT("asset_type"),          Task->AssetType);
                    TaskObj->TryGetStringField(TEXT("status"),              Task->Status);
                    TaskObj->TryGetStringField(TEXT("priority"),            Task->Priority);
                    TaskObj->TryGetStringField(TEXT("destination_path"),    Task->DestinationPath);
                    TaskObj->TryGetStringField(TEXT("material_path"),       Task->MaterialPath);
                    TaskObj->TryGetStringField(TEXT("brief"),               Task->Brief);
                    TaskObj->TryGetNumberField(TEXT("target_polycount"),    Task->TargetPolycount);
                    TaskObj->TryGetStringField(TEXT("target_texture_size"), Task->TargetTextureSize);

                    Tasks.Add(Task);
                }

                AsyncTask(ENamedThreads::GameThread, []()
                {
                    if (TaskListView.IsValid())
                        TaskListView->RequestListRefresh();
                });
            }))
    ;
}