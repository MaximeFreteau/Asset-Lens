// Copyright Maxime Freteau. All Rights Reserved.

#include "WebView/AssetLensWebViewPanel.h"
#include "AssetLensSettings.h"
#include "WorkspaceMenuStructure.h"
#include "WorkspaceMenuStructureModule.h"
#include "Framework/Docking/TabManager.h"
#include "Styling/AppStyle.h"
#include "Widgets/Docking/SDockTab.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Text/STextBlock.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Layout/SScrollBox.h"
#include "SWebBrowser.h"

const FName FAssetLensWebViewPanel::TabId = FName(TEXT("AssetLensWebView"));
TSharedPtr<SWebBrowser> FAssetLensWebViewPanel::WebBrowserWidget = nullptr;

void FAssetLensWebViewPanel::Register()
{
    FGlobalTabmanager::Get()->RegisterNomadTabSpawner(
        TabId,
        FOnSpawnTab::CreateStatic(&FAssetLensWebViewPanel::OnSpawnTab))
        .SetDisplayName(FText::FromString(TEXT("AssetLens")))
        .SetTooltipText(FText::FromString(TEXT("Wiki de production AssetLens")))
        .SetIcon(FSlateIcon(FAppStyle::GetAppStyleSetName(), TEXT("Icons.Documentation")))
        .SetGroup(WorkspaceMenu::GetMenuStructure().GetToolsCategory());
}

void FAssetLensWebViewPanel::Unregister()
{
    FGlobalTabmanager::Get()->UnregisterNomadTabSpawner(TabId);
    WebBrowserWidget = nullptr;
}

TSharedRef<SDockTab> FAssetLensWebViewPanel::OnSpawnTab(const FSpawnTabArgs& Args)
{
    const UAssetLensSettings* Settings = GetDefault<UAssetLensSettings>();
    const FString FrontendURL = Settings->GetBackendURL()
        .Replace(TEXT(":3001"), TEXT(":3000"));

    TSharedPtr<SEditableTextBox> URLBar;

    TSharedRef<SDockTab> Tab = SNew(SDockTab)
        .TabRole(ETabRole::NomadTab)
        [
            SNew(SVerticalBox)

            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(4.f, 4.f)
            [
                SNew(SHorizontalBox)

                + SHorizontalBox::Slot()
                .AutoWidth()
                .Padding(0.f, 0.f, 4.f, 0.f)
                [
                    SNew(SButton)
                    .Text(FText::FromString(TEXT("←")))
                    .OnClicked_Lambda([]()
                    {
                        if (WebBrowserWidget.IsValid())
                            WebBrowserWidget->GoBack();
                        return FReply::Handled();
                    })
                ]

                + SHorizontalBox::Slot()
                .AutoWidth()
                .Padding(0.f, 0.f, 4.f, 0.f)
                [
                    SNew(SButton)
                    .Text(FText::FromString(TEXT("→")))
                    .OnClicked_Lambda([]()
                    {
                        if (WebBrowserWidget.IsValid())
                            WebBrowserWidget->GoForward();
                        return FReply::Handled();
                    })
                ]

                + SHorizontalBox::Slot()
                .AutoWidth()
                .Padding(0.f, 0.f, 8.f, 0.f)
                [
                    SNew(SButton)
                    .Text(FText::FromString(TEXT("↺")))
                    .OnClicked_Lambda([]()
                    {
                        if (WebBrowserWidget.IsValid())
                            WebBrowserWidget->Reload();
                        return FReply::Handled();
                    })
                ]

                + SHorizontalBox::Slot()
                .FillWidth(1.f)
                .Padding(0.f, 0.f, 4.f, 0.f)
                [
                    SAssignNew(URLBar, SEditableTextBox)
                    .Text(FText::FromString(FrontendURL))
                    .OnTextCommitted_Lambda([](const FText& Text, ETextCommit::Type CommitType)
                    {
                        if (CommitType == ETextCommit::OnEnter && WebBrowserWidget.IsValid())
                            WebBrowserWidget->LoadURL(Text.ToString());
                    })
                ]

                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SNew(SButton)
                    .Text(FText::FromString(TEXT("🏠")))
                    .OnClicked_Lambda([FrontendURL]()
                    {
                        if (WebBrowserWidget.IsValid())
                            WebBrowserWidget->LoadURL(FrontendURL);
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
            .FillHeight(1.f)
            [
                SAssignNew(WebBrowserWidget, SWebBrowser)
                .InitialURL(FrontendURL)
                .ShowControls(false)
                .ShowAddressBar(false)
                .OnUrlChanged_Lambda([URLBar](const FText& NewURL)
                {
                    if (URLBar.IsValid())
                        URLBar->SetText(NewURL);
                })
            ]
        ];

    return Tab;
}

void FAssetLensWebViewPanel::NavigateTo(const FString& URL)
{
    OpenPanel();

    if (WebBrowserWidget.IsValid())
    {
        WebBrowserWidget->LoadURL(URL);
    }
}

void FAssetLensWebViewPanel::OpenPanel()
{
    FGlobalTabmanager::Get()->TryInvokeTab(TabId);
}