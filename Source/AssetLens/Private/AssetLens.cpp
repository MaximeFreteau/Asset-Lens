// Copyright Maxime Freteau. All Rights Reserved.

#include "AssetLens.h"
#include "AssetLensHttpClient.h"
#include "AssetLensSettings.h"
#include "LevelEditor.h"
#include "ToolMenus.h"
#include "ContentBrowser/AssetLensContentBrowserExtension.h"
#include "LevelEditor.h"
#include "ToolMenus.h"
#include "UObject/SavePackage.h"
#include "Perforce/AssetLensP4Manager.h"
#include "UObject/Package.h"
#include "ImportPipeline/AssetLensImportPanel.h"
#include "SceneParser/AssetLensSceneParser.h"
#include "Notifications/AssetLensNotificationManager.h"
#include "WebView/AssetLensWebViewPanel.h"

#define LOCTEXT_NAMESPACE "FAssetLensModule"

void FAssetLensModule::StartupModule()
{
	FAssetLensContentBrowserExtension::Register();
	FAssetLensImportPanel::Register();
	FAssetLensWebViewPanel::Register();
	FAssetLensNotificationManager::Start();

	const UAssetLensSettings* Settings = GetDefault<UAssetLensSettings>();
	FAssetLensP4Manager::Get().Init(
		Settings->P4Server,
		Settings->P4User,
		Settings->P4Client,
		Settings->P4Password);

	UPackage::PackageSavedEvent.AddLambda(
	[](const FString& PackageFilename, UObject* Outer)
	{
		const UAssetLensSettings* S = GetDefault<UAssetLensSettings>();
		if (!S->bP4AutoCheckout) return;

		if (UPackage* Package = Cast<UPackage>(Outer))
			FAssetLensP4Manager::Get().OnAssetSaved(Package->GetName());
	});

	UToolMenus::RegisterStartupCallback(FSimpleMulticastDelegate::FDelegate::CreateLambda([]()
	{
		UToolMenu* Toolbar = UToolMenus::Get()->ExtendMenu(
			TEXT("LevelEditor.LevelEditorToolBar.PlayToolBar"));

		FToolMenuSection& Section = Toolbar->FindOrAddSection(TEXT("AssetLensTools"));
		Section.Label = FText::FromString(TEXT("AssetLens"));

		Section.AddEntry(FToolMenuEntry::InitToolBarButton(
			TEXT("AssetLens_OpenDoc"),
			FUIAction(FExecuteAction::CreateLambda([]()
			{
				FAssetLensWebViewPanel::OpenPanel();
			})),
			FText::FromString(TEXT("Doc")),
			FText::FromString(TEXT("Ouvre le wiki AssetLens")),
			FSlateIcon(FAppStyle::GetAppStyleSetName(), TEXT("Icons.Documentation"))
		));

		Section.AddEntry(FToolMenuEntry::InitToolBarButton(
			TEXT("AssetLens_SyncScene"),
			FUIAction(FExecuteAction::CreateLambda([]()
			{
				FAssetLensSceneParser::ParseAndSyncCurrentLevel();
			})),
			FText::FromString(TEXT("Sync Scene")),
			FText::FromString(TEXT("Synchronise le level avec AssetLens")),
			FSlateIcon(FAppStyle::GetAppStyleSetName(), TEXT("Icons.Refresh"))
		));

		Section.AddEntry(FToolMenuEntry::InitToolBarButton(
			TEXT("AssetLens_OpenImport"),
			FUIAction(FExecuteAction::CreateLambda([]()
			{
				FAssetLensImportPanel::OpenPanel();
			})),
			FText::FromString(TEXT("Import")),
			FText::FromString(TEXT("Ouvre le pipeline d'import AssetLens")),
			FSlateIcon(FAppStyle::GetAppStyleSetName(), TEXT("Icons.Import"))
		));
	}));
}



void FAssetLensModule::ShutdownModule()
{
	FAssetLensContentBrowserExtension::Unregister();
	FAssetLensImportPanel::Unregister();
	FAssetLensWebViewPanel::Unregister();
	FAssetLensNotificationManager::Stop();
}

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(FAssetLensModule, AssetLens)