// Copyright Maxime Freteau. All Rights Reserved.

#include "ContentBrowser/AssetLensContentBrowserExtension.h"
#include "AssetLensHttpClient.h"
#include "AssetLensSettings.h"
#include "WebView/AssetLensWebViewPanel.h"
#include "ContentBrowserModule.h"
#include "IContentBrowserSingleton.h"
#include "AssetRegistry/AssetData.h"
#include "Dom/JsonObject.h"
#include "Framework/MultiBox/MultiBoxBuilder.h"
#include "Styling/AppStyle.h"

FDelegateHandle FAssetLensContentBrowserExtension::ContentBrowserExtenderDelegateHandle;

void FAssetLensContentBrowserExtension::Register()
{
    FContentBrowserModule& ContentBrowserModule =
        FModuleManager::LoadModuleChecked<FContentBrowserModule>(TEXT("ContentBrowser"));

    TArray<FContentBrowserMenuExtender_SelectedAssets>& MenuExtenderDelegates =
        ContentBrowserModule.GetAllAssetViewContextMenuExtenders();

    MenuExtenderDelegates.Add(FContentBrowserMenuExtender_SelectedAssets::CreateStatic(
        &FAssetLensContentBrowserExtension::OnExtendContentBrowserAssetSelectionMenu));

    ContentBrowserExtenderDelegateHandle = MenuExtenderDelegates.Last().GetHandle();
}

void FAssetLensContentBrowserExtension::Unregister()
{
    FContentBrowserModule* ContentBrowserModule =
        FModuleManager::GetModulePtr<FContentBrowserModule>(TEXT("ContentBrowser"));

    if (ContentBrowserModule)
    {
        TArray<FContentBrowserMenuExtender_SelectedAssets>& MenuExtenderDelegates =
            ContentBrowserModule->GetAllAssetViewContextMenuExtenders();

        MenuExtenderDelegates.RemoveAll([](const FContentBrowserMenuExtender_SelectedAssets& Delegate)
        {
            return Delegate.GetHandle() == FAssetLensContentBrowserExtension::ContentBrowserExtenderDelegateHandle;
        });
    }
}

TSharedRef<FExtender> FAssetLensContentBrowserExtension::OnExtendContentBrowserAssetSelectionMenu(
    const TArray<FAssetData>& SelectedAssets)
{
    TSharedRef<FExtender> Extender = MakeShared<FExtender>();

    if (SelectedAssets.Num() > 0)
    {
        Extender->AddMenuExtension(
            TEXT("CommonAssetActions"),
            EExtensionHook::After,
            nullptr,
            FMenuExtensionDelegate::CreateStatic(
                &FAssetLensContentBrowserExtension::AddMenuEntries,
                SelectedAssets));
    }

    return Extender;
}

void FAssetLensContentBrowserExtension::AddMenuEntries(
    FMenuBuilder& MenuBuilder, TArray<FAssetData> SelectedAssets)
{
    MenuBuilder.BeginSection(TEXT("AssetLens"), FText::FromString(TEXT("AssetLens")));

    MenuBuilder.AddMenuEntry(
        FText::FromString(TEXT("Voir la documentation")),
        FText::FromString(TEXT("Ouvre la fiche de cet asset dans AssetLens")),
        FSlateIcon(FAppStyle::GetAppStyleSetName(), TEXT("Icons.Documentation")),
        FUIAction(FExecuteAction::CreateStatic(
            &FAssetLensContentBrowserExtension::OpenDocumentation, SelectedAssets))
    );

    MenuBuilder.AddMenuEntry(
        FText::FromString(TEXT("Créer / Modifier la documentation")),
        FText::FromString(TEXT("Crée ou modifie la fiche de cet asset")),
        FSlateIcon(FAppStyle::GetAppStyleSetName(), TEXT("Icons.Edit")),
        FUIAction(FExecuteAction::CreateStatic(
            &FAssetLensContentBrowserExtension::CreateDocumentation, SelectedAssets))
    );

    MenuBuilder.AddMenuEntry(
        FText::FromString(TEXT("Synchroniser avec AssetLens")),
        FText::FromString(TEXT("Envoie les métadonnées de cet asset au backend")),
        FSlateIcon(FAppStyle::GetAppStyleSetName(), TEXT("Icons.Refresh")),
        FUIAction(FExecuteAction::CreateStatic(
            &FAssetLensContentBrowserExtension::SyncAssetToBackend, SelectedAssets))
    );

    MenuBuilder.EndSection();
}

void FAssetLensContentBrowserExtension::OpenDocumentation(TArray<FAssetData> SelectedAssets)
{
    if (SelectedAssets.Num() == 0) return;

    const FAssetData& Asset = SelectedAssets[0];
    const FString AssetPath = GetAssetPath(Asset);

    const FString Endpoint = FString::Printf(
        TEXT("/api/assets?path=%s"), *FGenericPlatformHttp::UrlEncode(AssetPath));

    FAssetLensHttpClient::Get().GetArray(Endpoint,
        FOnAssetLensArrayResponse::CreateLambda(
            [AssetPath](bool bSuccess, TArray<TSharedPtr<FJsonValue>> Response)
            {
                const UAssetLensSettings* Settings = GetDefault<UAssetLensSettings>();
                FString URL;

                if (bSuccess && Response.Num() > 0)
                {
                    TSharedPtr<FJsonObject> AssetObj = Response[0]->AsObject();
                    FString AssetId;
                    AssetObj->TryGetStringField(TEXT("id"), AssetId);
                    URL = FString::Printf(TEXT("%s/assets/%s"),
                        *Settings->FrontendURL,
                        *AssetId);
                }
                else
                {
                    URL = FString::Printf(TEXT("%s/assets"),
                        *Settings->FrontendURL);
                }

                FAssetLensWebViewPanel::NavigateTo(URL);
            }));
}

void FAssetLensContentBrowserExtension::CreateDocumentation(TArray<FAssetData> SelectedAssets)
{
    if (SelectedAssets.Num() == 0) return;

    const FAssetData& Asset = SelectedAssets[0];
    const FString AssetPath = GetAssetPath(Asset);

    SyncAssetToBackend(SelectedAssets);

    const UAssetLensSettings* Settings = GetDefault<UAssetLensSettings>();
    const FString URL = FString::Printf(TEXT("%s/assets/new"),
        *Settings->FrontendURL);

    FAssetLensWebViewPanel::NavigateTo(URL);
}

void FAssetLensContentBrowserExtension::SyncAssetToBackend(TArray<FAssetData> SelectedAssets)
{
    for (const FAssetData& Asset : SelectedAssets)
    {
        TSharedPtr<FJsonObject> Body = MakeShared<FJsonObject>();
        Body->SetStringField(TEXT("name"), Asset.AssetName.ToString());
        Body->SetStringField(TEXT("path"), GetAssetPath(Asset));
        Body->SetStringField(TEXT("asset_type"), Asset.AssetClassPath.GetAssetName().ToString());

        TSharedPtr<FJsonObject> Metadata = MakeShared<FJsonObject>();
        Metadata->SetStringField(TEXT("package_name"), Asset.PackageName.ToString());

        TArray<TSharedPtr<FJsonValue>> TagsArray;
        Asset.TagsAndValues.ForEach([&TagsArray](const TPair<FName, FAssetTagValueRef>& Tag)
        {
            TagsArray.Add(MakeShared<FJsonValueString>(Tag.Value.AsString()));
        });
        Metadata->SetArrayField(TEXT("tags"), TagsArray);
        Body->SetObjectField(TEXT("metadata"), Metadata);

        FAssetLensHttpClient::Get().Post(TEXT("/api/assets/sync"), Body,
            FOnAssetLensResponse::CreateLambda([Asset](bool bSuccess, TSharedPtr<FJsonObject> Response)
            {
                if (bSuccess)
                {
                    UE_LOG(LogTemp, Log, TEXT("AssetLens: Synced asset %s"),
                        *Asset.AssetName.ToString());
                }
                else
                {
                    UE_LOG(LogTemp, Warning, TEXT("AssetLens: Failed to sync asset %s"),
                        *Asset.AssetName.ToString());
                }
            }));
    }
}

FString FAssetLensContentBrowserExtension::GetAssetPath(const FAssetData& AssetData)
{
    return AssetData.GetObjectPathString();
}