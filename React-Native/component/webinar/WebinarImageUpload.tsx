import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/Superbase';
import Colors from '../../constant/Colors';
import { Upload } from 'lucide-react-native';
import { decode } from 'base64-arraybuffer';

interface Props {
  label: string;
  bucket?: string;
  aspectRatio?: [number, number];
  onImageSelected: (path: string, url: string) => void;
}

const WebinarImageUpload: React.FC<Props> = ({ 
  label, 
  bucket = 'webinar-media',
  aspectRatio = [16, 9],
  onImageSelected 
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      try {
        setUploading(true);
        const base64FileData = result.assets[0].base64;
        const filePath = `${Date.now()}.${result.assets[0].uri.split('.').pop()}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from(bucket)
          .upload(filePath, decode(base64FileData), {
            contentType: `image/${result.assets[0].uri.split('.').pop()}`,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        setPreview(result.assets[0].uri);
        onImageSelected(filePath, publicUrl);

      } catch (error: any) {
        console.error('Error uploading image:', error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={[styles.uploadButton, preview ? styles.hasImage : null]} 
        onPress={pickImage}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color={Colors.PRIMARY} />
        ) : preview ? (
          <Image source={{ uri: preview }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Upload size={24} color={Colors.GRAY} />
            <Text style={styles.placeholderText}>Upload Image</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.GRAY,
    marginBottom: 8,
  },
  uploadButton: {
    height: 180,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  hasImage: {
    borderStyle: 'solid',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: Colors.GRAY,
    fontSize: 14,
  },
  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default WebinarImageUpload; 