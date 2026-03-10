// Copyright Maxime Freteau. All Rights Reserved.

using UnrealBuildTool;

public class AssetLens : ModuleRules
{
	public AssetLens(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = ModuleRules.PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[]
		{
			"Core",
			"CoreUObject",
			"Engine",
			"InputCore",
			"HTTP",
			"Json",
			"JsonUtilities",
		});

		PrivateDependencyModuleNames.AddRange(new string[]
		{
			"Slate",
			"SlateCore",
			"EditorStyle",
			"UnrealEd",
			"LevelEditor",
			"ContentBrowser",
			"ContentBrowserData",
			"AssetTools",
			"AssetRegistry",
			"PropertyEditor",
			"EditorWidgets",
			"ToolMenus",
			"WebBrowser",
			"WebBrowserWidget",
			"UMG",
			"WorkspaceMenuStructure",
			"DesktopPlatform",
			"DeveloperSettings",
			"EditorScriptingUtilities", 
			"TextureCompressor",
		});
	}
}