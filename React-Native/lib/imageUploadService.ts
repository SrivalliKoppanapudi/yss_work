import { supabase } from './Superbase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

export interface ImageInfo {
  uri: string;
  width: number;
  height: number;
  fileSize?: number;
  type?: string;
}

class ImageUploadService {
  // Request permissions for accessing the gallery
  async requestGalleryPermission(): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
      }
      return true;
    } catch (error) {
      console.error('Error requesting gallery permission:', error);
      return false;
    }
  }

  // Pick image from gallery
  async pickImageFromGallery(): Promise<ImageInfo | null> {
    try {
      const hasPermission = await this.requestGalleryPermission();
      if (!hasPermission) {
        throw new Error('Gallery permission not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Aspect ratio for course cover images
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          type: asset.type,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      throw error;
    }
  }

  // Take photo with camera
  async takePhoto(): Promise<ImageInfo | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission not granted');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          type: asset.type,
        };
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  // Convert image to blob
  async imageToBlob(uri: string): Promise<Blob> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error converting image to blob:', error);
      throw error;
    }
  }

  // Generate unique filename
  generateFileName(originalName?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName ? originalName.split('.').pop() : 'jpg';
    return `course-cover-${timestamp}-${randomString}.${extension}`;
  }

  // Upload image to Supabase storage
  async uploadImageToStorage(
    imageInfo: ImageInfo,
    bucketName: string = 'course-covers',
    fileName?: string
  ): Promise<UploadResult> {
    try {
      // Generate filename if not provided
      const finalFileName = fileName || this.generateFileName();

      // Convert image to blob
      const blob = await this.imageToBlob(imageInfo.uri);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(finalFileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(finalFileName);

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: finalFileName,
      };
    } catch (error) {
      console.error('Error uploading image to storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Delete image from storage
  async deleteImageFromStorage(
    fileName: string,
    bucketName: string = 'course-covers'
  ): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting image from storage:', error);
      return false;
    }
  }

  // Show image picker options
  async showImagePickerOptions(): Promise<ImageInfo | null> {
    try {
      // For now, we'll just pick from gallery
      // In a real app, you might want to show an action sheet with options
      return await this.pickImageFromGallery();
    } catch (error) {
      console.error('Error showing image picker options:', error);
      throw error;
    }
  }

  // Validate image
  validateImage(imageInfo: ImageInfo): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const minWidth = 400;
    const minHeight = 225;

    if (imageInfo.fileSize && imageInfo.fileSize > maxSize) {
      return {
        valid: false,
        error: 'Image size must be less than 5MB',
      };
    }

    if (imageInfo.width < minWidth || imageInfo.height < minHeight) {
      return {
        valid: false,
        error: `Image dimensions must be at least ${minWidth}x${minHeight}px`,
      };
    }

    return { valid: true };
  }

  // Process and upload image with validation
  async processAndUploadImage(
    imageInfo: ImageInfo,
    bucketName: string = 'course-covers'
  ): Promise<UploadResult> {
    try {
      // Validate image
      const validation = this.validateImage(imageInfo);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Upload to storage
      return await this.uploadImageToStorage(imageInfo, bucketName);
    } catch (error) {
      console.error('Error processing and uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
      };
    }
  }
}

export const imageUploadService = new ImageUploadService(); 