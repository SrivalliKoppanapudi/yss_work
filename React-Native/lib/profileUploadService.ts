// lib/imageUploadService.ts
import { supabase } from './Superbase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Alert, Platform } from 'react-native';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const profileUploadService = async (
    userId: string,
    type: 'banner' | 'avatar'
): Promise<UploadResult> => {
    try {
        // 1. Request permissions
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "We need access to your photos to update your profile.");
                return { success: false, error: "Permission denied" };
            }
        }

        // 2. Launch Image Picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: type === 'banner' ? [16, 9] : [1, 1],
            quality: 0.8,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return { success: false, error: "Image selection cancelled." };
        }

        const image = result.assets[0];

        // 3. Prepare file for upload
        const fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
        // **IMPORTANT**: The path format `userId/folder/filename` matches our RLS policy.
        const folder = type === 'banner' ? 'banners' : 'avatars';
        const filePath = `${userId}/${folder}/${Date.now()}.${fileExt}`;
        const contentType = image.mimeType ?? `image/${fileExt}`;

        // Read file as base64 and decode
        const base64 = await FileSystem.readAsStringAsync(image.uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // 4. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('profile-media')
            .upload(filePath, decode(base64), { contentType, upsert: true });

        if (uploadError) {
            throw uploadError;
        }

        // 5. Get Public URL
        const { data: urlData } = supabase.storage
            .from('profile-media')
            .getPublicUrl(filePath);

        if (!urlData.publicUrl) {
            throw new Error("Could not get public URL for the uploaded image.");
        }

        return { success: true, url: urlData.publicUrl };

    } catch (error: any) {
        console.error(`Error uploading ${type} image:`, error);
        return { success: false, error: error.message || `Failed to upload ${type}.` };
    }
};