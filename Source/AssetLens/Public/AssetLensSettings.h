// Copyright Maxime Freteau. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Engine/DeveloperSettings.h"
#include "Engine/Texture.h"
#include "AssetLensSettings.generated.h"

UCLASS(Config=Editor, DefaultConfig, meta=(DisplayName="AssetLens"))
class ASSETLENS_API UAssetLensSettings : public UDeveloperSettings
{
    GENERATED_BODY()

public:
    UAssetLensSettings()
    {
        CategoryName = TEXT("Plugins");
        SectionName  = TEXT("AssetLens");
    }
    
    UPROPERTY(Config, EditAnywhere, Category="Connection",
        meta=(DisplayName="Backend URL (Local)"))
    FString LocalBackendURL = TEXT("http://localhost:3001");

    UPROPERTY(Config, EditAnywhere, Category="Connection",
        meta=(DisplayName="Backend URL (Remote)"))
    FString RemoteBackendURL;

    UPROPERTY(Config, EditAnywhere, Category="Connection",
        meta=(DisplayName="Use Remote Backend"))
    bool bUseRemoteBackend = false;

    UPROPERTY(Config, EditAnywhere, Category="Connection",
        meta=(DisplayName="Frontend URL"))
    FString FrontendURL = TEXT("http://localhost:3000");

    FString GetBackendURL() const
    {
        return bUseRemoteBackend ? RemoteBackendURL : LocalBackendURL;
    }


    UPROPERTY(Config, EditAnywhere, Category="User",
        meta=(DisplayName="Your Name"))
    FString UserName;

    UPROPERTY(Config, EditAnywhere, Category="User",
        meta=(DisplayName="User ID"))
    FString UserID;

    UPROPERTY(Config, EditAnywhere, Category="User",
        meta=(DisplayName="Role",
              GetOptions="GetRoleOptions"))
    FString UserRole = TEXT("artist");

    UFUNCTION()
    TArray<FString> GetRoleOptions() const
    {
        return { TEXT("artist"), TEXT("lead"), TEXT("producer"), TEXT("technical_artist") };
    }


    UPROPERTY(Config, EditAnywhere, Category="General",
        meta=(DisplayName="Auto-open doc on asset selection"))
    bool bAutoOpenOnSelection = false;


    UPROPERTY(Config, EditAnywhere, Category="Perforce",
        meta=(DisplayName="Server (ex: ssl:perforce:1666)"))
    FString P4Server;

    UPROPERTY(Config, EditAnywhere, Category="Perforce",
        meta=(DisplayName="Username"))
    FString P4User;

    UPROPERTY(Config, EditAnywhere, Category="Perforce",
        meta=(DisplayName="Client Workspace"))
    FString P4Client;

    UPROPERTY(Config, EditAnywhere, Category="Perforce",
        meta=(DisplayName="Password"))
    FString P4Password;

    UPROPERTY(Config, EditAnywhere, Category="Perforce",
        meta=(DisplayName="Mode simulation (log sans exécuter p4)"))
    bool bP4SimulationMode = true;

    UPROPERTY(Config, EditAnywhere, Category="Perforce",
        meta=(DisplayName="Auto-checkout on save"))
    bool bP4AutoCheckout = true;

    UPROPERTY(Config, EditAnywhere, Category="Perforce",
        meta=(DisplayName="Auto-add on import"))
    bool bP4AutoAdd = true;


    UPROPERTY(Config, EditAnywhere, Category="Import | Albedo",
        meta=(DisplayName="sRGB"))
    bool bAlbedo_SRGB = true;

    UPROPERTY(Config, EditAnywhere, Category="Import | Albedo",
        meta=(DisplayName="Compression"))
    TEnumAsByte<TextureCompressionSettings> Albedo_Compression = TC_Default;

    UPROPERTY(Config, EditAnywhere, Category="Import | Albedo",
        meta=(DisplayName="LOD Group"))
    TEnumAsByte<TextureGroup> Albedo_LODGroup = TEXTUREGROUP_World;


    UPROPERTY(Config, EditAnywhere, Category="Import | Normal",
        meta=(DisplayName="sRGB"))
    bool bNormal_SRGB = false;

    UPROPERTY(Config, EditAnywhere, Category="Import | Normal",
        meta=(DisplayName="Compression"))
    TEnumAsByte<TextureCompressionSettings> Normal_Compression = TC_Normalmap;

    UPROPERTY(Config, EditAnywhere, Category="Import | Normal",
        meta=(DisplayName="LOD Group"))
    TEnumAsByte<TextureGroup> Normal_LODGroup = TEXTUREGROUP_WorldNormalMap;

    UPROPERTY(Config, EditAnywhere, Category="Import | Normal",
        meta=(DisplayName="Flip Green Channel (OpenGL)"))
    bool bNormal_FlipGreenChannel = false;


    UPROPERTY(Config, EditAnywhere, Category="Import | ORM",
        meta=(DisplayName="sRGB"))
    bool bORM_SRGB = false;

    UPROPERTY(Config, EditAnywhere, Category="Import | ORM",
        meta=(DisplayName="Compression"))
    TEnumAsByte<TextureCompressionSettings> ORM_Compression = TC_Masks;

    UPROPERTY(Config, EditAnywhere, Category="Import | ORM",
        meta=(DisplayName="LOD Group"))
    TEnumAsByte<TextureGroup> ORM_LODGroup = TEXTUREGROUP_WorldSpecular;


    UPROPERTY(Config, EditAnywhere, Category="Import | Roughness",
        meta=(DisplayName="sRGB"))
    bool bRoughness_SRGB = false;

    UPROPERTY(Config, EditAnywhere, Category="Import | Roughness",
        meta=(DisplayName="Compression"))
    TEnumAsByte<TextureCompressionSettings> Roughness_Compression = TC_Grayscale;

    UPROPERTY(Config, EditAnywhere, Category="Import | Roughness",
        meta=(DisplayName="LOD Group"))
    TEnumAsByte<TextureGroup> Roughness_LODGroup = TEXTUREGROUP_WorldSpecular;


    UPROPERTY(Config, EditAnywhere, Category="Import | Metallic",
        meta=(DisplayName="sRGB"))
    bool bMetallic_SRGB = false;

    UPROPERTY(Config, EditAnywhere, Category="Import | Metallic",
        meta=(DisplayName="Compression"))
    TEnumAsByte<TextureCompressionSettings> Metallic_Compression = TC_Grayscale;

    UPROPERTY(Config, EditAnywhere, Category="Import | Metallic",
        meta=(DisplayName="LOD Group"))
    TEnumAsByte<TextureGroup> Metallic_LODGroup = TEXTUREGROUP_WorldSpecular;


    UPROPERTY(Config, EditAnywhere, Category="Import | Emissive",
        meta=(DisplayName="sRGB"))
    bool bEmissive_SRGB = true;

    UPROPERTY(Config, EditAnywhere, Category="Import | Emissive",
        meta=(DisplayName="Compression"))
    TEnumAsByte<TextureCompressionSettings> Emissive_Compression = TC_Default;

    UPROPERTY(Config, EditAnywhere, Category="Import | Emissive",
        meta=(DisplayName="LOD Group"))
    TEnumAsByte<TextureGroup> Emissive_LODGroup = TEXTUREGROUP_World;


    UPROPERTY(Config, EditAnywhere, Category="Import | Ambient Occlusion",
        meta=(DisplayName="sRGB"))
    bool bAO_SRGB = false;

    UPROPERTY(Config, EditAnywhere, Category="Import | Ambient Occlusion",
        meta=(DisplayName="Compression"))
    TEnumAsByte<TextureCompressionSettings> AO_Compression = TC_Grayscale;

    UPROPERTY(Config, EditAnywhere, Category="Import | Ambient Occlusion",
        meta=(DisplayName="LOD Group"))
    TEnumAsByte<TextureGroup> AO_LODGroup = TEXTUREGROUP_WorldSpecular;

    UPROPERTY(Config, EditAnywhere, Category="Import | Ambient Occlusion",
        meta=(DisplayName="Disable Mipmaps"))
    bool bAO_NoMipmaps = true;


    UPROPERTY(Config, EditAnywhere, Category="Import | Opacity",
        meta=(DisplayName="sRGB"))
    bool bOpacity_SRGB = false;

    UPROPERTY(Config, EditAnywhere, Category="Import | Opacity",
        meta=(DisplayName="Compression"))
    TEnumAsByte<TextureCompressionSettings> Opacity_Compression = TC_Grayscale;

    UPROPERTY(Config, EditAnywhere, Category="Import | Opacity",
        meta=(DisplayName="LOD Group"))
    TEnumAsByte<TextureGroup> Opacity_LODGroup = TEXTUREGROUP_WorldSpecular;

    UPROPERTY(Config, EditAnywhere, Category="Import | Opacity",
        meta=(DisplayName="Disable Mipmaps"))
    bool bOpacity_NoMipmaps = true;
};