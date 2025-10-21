import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Menu } from 'lucide-react-native';
import Colors from '../../../constant/Colors';
import { supabase } from '../../../lib/Superbase';

type Chapter = {
  title: string;
  page: number;
};

export default function BookReaderScreen() {
    const router = useRouter();
    const { fileUrl, title, tableOfContents: tocString } = useLocalSearchParams<{ fileUrl?: string; title?: string; tableOfContents?: string }>();
    
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showToc, setShowToc] = useState(false);
    
    const webViewRef = useRef<WebView>(null);
    const tableOfContents: Chapter[] = tocString ? JSON.parse(tocString) : [];

    const generateSignedUrl = useCallback(async () => {
        if (!fileUrl) {
            setError("No e-book file specified.");
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            // Generate a temporary, secure URL to access the private e-book file
            const { data, error: urlError } = await supabase
                .storage
                .from('ebook-files')
                .createSignedUrl(fileUrl, 3600); // URL is valid for 1 hour
            
            if (urlError) throw urlError;
            setSignedUrl(data.signedUrl);

        } catch (err: any) {
            setError("Could not load the e-book. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [fileUrl]);

    useEffect(() => {
        generateSignedUrl();
    }, [generateSignedUrl]);

    const goToPage = (pageNumber: number) => {
        if (webViewRef.current && signedUrl) {
            // Construct the URL for the specific page. Google Docs viewer uses '#page=' parameter.
            const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(signedUrl)}#page=${pageNumber}`;
            webViewRef.current.injectJavaScript(`window.location.href = '${viewerUrl}'; true;`);
        }
        setShowToc(false);
    };

    if (isLoading) {
        return <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.centered} />;
    }
    
    if (error || !signedUrl) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.errorText}>{error || "Could not load e-book."}</Text>
                <TouchableOpacity onPress={() => router.back()}><Text style={{ color: Colors.PRIMARY, marginTop: 10}}>Go Back</Text></TouchableOpacity>
            </SafeAreaView>
        );
    }
    
    // We use Google's document viewer to render the PDF from the signed URL
    const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(signedUrl)}`;

    const renderTableOfContents = () => (
        <TouchableOpacity style={styles.tocOverlay} activeOpacity={1} onPress={() => setShowToc(false)}>
            <View style={styles.tocContainer}>
                <ScrollView>
                    <Text style={styles.tocTitle}>Contents</Text>
                    {tableOfContents.map((chapter, index) => (
                        <TouchableOpacity key={index} style={styles.tocItem} onPress={() => goToPage(chapter.page)}>
                            <Text style={styles.tocItemText}>{chapter.title}</Text>
                            <Text style={styles.tocPageNumber}>p. {chapter.page}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.headerButton}>
                    <ArrowLeft size={24} color={Colors.BLACK} />
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{title || 'E-book Reader'}</Text>
                {tableOfContents.length > 0 ? (
                    <Pressable onPress={() => setShowToc(!showToc)} style={styles.headerButton}>
                        <Menu size={24} color={Colors.BLACK} />
                    </Pressable>
                ) : <View style={{ width: 28 }} />}
            </View>

            <WebView
                ref={webViewRef}
                source={{ uri: viewerUrl }}
                startInLoadingState={true}
                renderLoading={() => <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.centered} />}
                style={styles.webview}
            />

            {showToc && renderTableOfContents()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    headerButton: {
        padding: 4
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600'
    },
    webview: {
        flex: 1
    },
    errorText: {
        fontSize: 16,
        color: Colors.ERROR,
        textAlign: 'center'
    },
    tocOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 10
    },
    tocContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '60%',
        backgroundColor: Colors.WHITE,
        borderRightWidth: 1,
        borderColor: '#ccc'
    },
    tocTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    tocItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: '#f5f5f5'
    },
    tocItemText: {
        fontSize: 16,
        flex: 1
    },
    tocPageNumber: {
        fontSize: 16,
        color: Colors.GRAY
    },
});