import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const isMobile = width < 900;

const chapters = [
  'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6', 'Chapter 7', 'Chapter 8', 'Chapter 9'
];

export default function QuixEdit() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [showContents, setShowContents] = useState(false);
  const scrollRef = useRef(null);
  const chapterRefs = Array.from({ length: chapters.length }, () => useRef(null));
  const title = params.title || 'Week 1 – Beginners –Introduction to Physics';
  const introduction = params.introduction || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ut ante eu nunc fringilla iaculis. Mauris pretium erat sit amet lacus Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ut ante eu nunc fringilla iaculis. Mauris pretium erat sit amet lacus Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ut ante eu nunc fringilla iaculis. Mauris pretium erat sit amet lacus';
  const list = Array.isArray(params.list) ? params.list : params.list ? [params.list] : [
    'nunc fringilla iaculis. Mauris pretium erat sit amet lacus',
    'Mauris pretium erat sit amet lacus'
  ];
  const images = Array.isArray(params.images) ? params.images : params.images ? [params.images] : ['🧬', '🌌'];
  const video = params.video || 'video-placeholder';

  return (
    <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: '#FAF6D9' }} contentContainerStyle={{ padding: isMobile ? 6 : 32 }}>
      <View style={[styles.topBar, isMobile && styles.topBarMobile]}>
        <Text style={[styles.topBarTitle, isMobile && styles.topBarTitleMobile]}>{title}</Text>
        <TouchableOpacity style={[styles.editBtn, isMobile && styles.editBtnMobile]} onPress={() => router.push('./EditSection')}>
          <Text style={[styles.editBtnText, isMobile && styles.editBtnTextMobile]}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.container, isMobile && styles.containerMobile]}>
        {/* Sidebar */}
        <View style={[styles.sidebar, isMobile && styles.sidebarMobile]}>
          <View style={styles.contentsHeaderRow}>
            <Text style={[styles.sidebarTitle, isMobile && styles.sidebarTitleMobile]}>Contents</Text>
            <TouchableOpacity onPress={() => setShowContents(v => !v)} style={styles.sixDotBtn}>
              <Text style={styles.sixDotIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
          {showContents && (
            <View style={styles.contentsDropdown}>
              <Text style={styles.sidebarItem}>Cover</Text>
              <Text style={styles.sidebarItem}>Title Page</Text>
              <Text style={styles.sidebarItem}>Contents</Text>
              <Text style={styles.sidebarSection}>Part I</Text>
              {chapters.map((ch, idx) => (
                <Text
                  key={idx}
                  style={styles.sidebarChapter}
                  onPress={() => {
                    setShowContents(false);
                    chapterRefs[idx].current?.measureLayout(
                      scrollRef.current,
                      (x, y) => {
                        scrollRef.current?.scrollTo({ y: y - 20, animated: true });
                      }
                    );
                  }}
                >
                  {ch}
                </Text>
              ))}
            </View>
          )}
        </View>
        {/* Main Content */}
        <View style={[styles.main, isMobile && styles.mainMobile]}>
          {chapters.map((ch, idx) => (
            <View key={ch} ref={chapterRefs[idx]} style={{ marginBottom: 24 }}>
              <Text style={[styles.chapterTitle, isMobile && styles.chapterTitleMobile]}>{ch}</Text>
              <Text style={[styles.introTitle, isMobile && styles.introTitleMobile]}>Introduction</Text>
              <Text style={[styles.introText, isMobile && styles.introTextMobile]}>{introduction}</Text>
              {/* Video/Image Row */}
              <View style={[styles.mediaRow, isMobile && styles.mediaRowMobile]}>
                {/* Video Placeholder */}
                <View style={[styles.mediaBox, isMobile && styles.mediaBoxMobile]}>
                  <Text style={styles.videoIcon}>▶️</Text>
                </View>
                {/* Images as emoji or image */}
                {images.map((img, iidx) => (
                  <View key={iidx} style={[styles.mediaBox, isMobile && styles.mediaBoxMobile]}>
                    <Text style={styles.videoIcon}>{img}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.bulletList}>
                {Array.isArray(list) && list.map((item, lidx) => (
                  <Text key={lidx} style={styles.bulletItem}>• {item}</Text>
                ))}
              </View>
              <Text style={[styles.introText, isMobile && styles.introTextMobile]}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ut ante eu nunc fringilla iaculis. Mauris pretium erat sit amet lacus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris pretium erat sit amet lacus.
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 32,
  },
  containerMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  sidebar: {
    width: 180,
    backgroundColor: '#EAF6FB',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    minHeight: 600,
  },
  sidebarMobile: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 0,
    marginBottom: 10,
    gap: 4,
  },
  sidebarTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 8,
    color: '#222',
  },
  sidebarTitleMobile: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
    color: '#222',
  },
  sidebarItem: {
    color: '#222',
    fontSize: 15,
    marginBottom: 2,
    marginLeft: 4,
  },
  sidebarSection: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 2,
    marginLeft: 4,
  },
  sidebarChapter: {
    color: '#222',
    fontSize: 15,
    marginBottom: 2,
    marginLeft: 18,
  },
  main: {
    flex: 2,
    minWidth: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginLeft: 18,
  },
  mainMobile: {
    width: '100%',
    marginLeft: 0,
    marginTop: 10,
    padding: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 8,
  },
  topBarMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  topBarTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
    flex: 1,
  },
  topBarTitleMobile: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
    flex: 1,
  },
  editBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1CB5E0',
  },
  editBtnMobile: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1CB5E0',
  },
  editBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  editBtnTextMobile: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  chapterTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  chapterTitleMobile: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  introTitle: {
    fontWeight: 'bold',
    fontSize: 19,
    marginBottom: 8,
    color: '#222',
  },
  introTitleMobile: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 8,
    color: '#222',
  },
  introText: {
    fontSize: 15,
    color: '#222',
    marginBottom: 10,
  },
  introTextMobile: {
    fontSize: 15,
    color: '#222',
    marginBottom: 10,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
    justifyContent: 'center',
  },
  mediaRowMobile: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 8,
    justifyContent: 'center',
  },
  mediaBox: {
    width: 110,
    height: 90,
    backgroundColor: '#EAF6FB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaBoxMobile: {
    width: 90,
    height: 70,
    backgroundColor: '#EAF6FB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EAF6FB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {
    fontSize: 38,
    color: '#1CB5E0',
  },
  bulletList: {
    marginVertical: 10,
    marginLeft: 8,
  },
  bulletItem: {
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  contentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sixDotBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EAF6FB',
    marginLeft: 8,
  },
  sixDotIcon: {
    fontSize: 22,
    color: '#1CB5E0',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  contentsDropdown: {
    marginTop: 4,
    backgroundColor: '#EAF6FB',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
});