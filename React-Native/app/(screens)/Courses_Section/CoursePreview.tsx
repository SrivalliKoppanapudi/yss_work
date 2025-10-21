import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const getCourseData = (params) => {
  if (params.course) {
    try {
      if (typeof params.course === 'string') {
        return JSON.parse(params.course);
      }
      return params.course;
    } catch {
      return params;
    }
  }
  return params;
};

const CoursePreview = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const {
    name,
    description,
    coverImage,
    status,
    level,
    university,
    specialization,
    tags,
    price,
    discount,
    final,
    sections,
    createdAt,
    instructor
  } = getCourseData(params);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAF6D9' }} contentContainerStyle={{ padding: 24 }}>
      <View style={styles.container}>
        <Text style={styles.title}>{name || 'N/A'}</Text>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.coverImage} />
        ) : (
          <View style={styles.noImage}><Text style={styles.noImageText}>No Cover Image</Text></View>
        )}
        <Text style={styles.label}>Description</Text>
        <Text style={styles.text}>{description || 'N/A'}</Text>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.text}>{status || 'N/A'}</Text>
        <Text style={styles.label}>Level</Text>
        <Text style={styles.text}>{level || 'N/A'}</Text>
        <Text style={styles.label}>University</Text>
        <Text style={styles.text}>{university || 'N/A'}</Text>
        <Text style={styles.label}>Specialization</Text>
        <Text style={styles.text}>{specialization || 'N/A'}</Text>
        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagsRow}>
          {tags && Array.isArray(tags) && tags.length > 0 ? tags.map((tag, i) => (
            <View key={i} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
          )) : <Text style={styles.text}>N/A</Text>}
        </View>
        <Text style={styles.label}>Pricing</Text>
        <Text style={styles.text}>Price: ₹{price || 'N/A'} | Discount: {discount || 'N/A'}% | Final: ₹{final || 'N/A'}</Text>
        {/* Optional Metadata */}
        {(instructor || createdAt) && (
          <View style={styles.metaBox}>
            {instructor && (
              <View style={styles.metaRow}><Text style={styles.label}>Instructor:</Text><Text style={styles.text}>{instructor}</Text></View>
            )}
            {createdAt && (
              <View style={styles.metaRow}><Text style={styles.label}>Created:</Text><Text style={styles.text}>{new Date(createdAt).toLocaleDateString()}</Text></View>
            )}
          </View>
        )}
        <Text style={styles.label}>Content</Text>
        {sections && Array.isArray(sections) && sections.length > 0 ? (
          sections.filter(section => section && (section.title || (section.lessons && section.lessons.length > 0))).length > 0 ? (
            sections.filter(section => section && (section.title || (section.lessons && section.lessons.length > 0))).map((section, idx) => (
              <View key={section.id || idx} style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>{section.title || `Section ${idx + 1}`}</Text>
                {section.lessons && section.lessons.length > 0 ? (
                  <View style={styles.lessonList}>
                    {section.lessons.map((lesson, lidx) => (
                      <View key={lesson.id || lidx} style={styles.lessonRow}>
                        <Text style={styles.lessonIcon}>{lesson.type === 'video' ? '▶️' : lesson.type === 'quiz' ? '❓' : '📄'}</Text>
                        <Text style={styles.lessonTitle}>{lesson.title || 'Untitled Lesson'}</Text>
                        <Text style={styles.lessonDuration}>{lesson.duration || 'N/A'}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyLesson}>No lessons in this section.</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.text}>No sections added yet.</Text>
          )
        ) : (
          <Text style={styles.text}>No sections added yet.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
    textAlign: 'center',
  },
  coverImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 18,
    resizeMode: 'cover',
  },
  noImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    color: '#888',
    fontSize: 16,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 12,
    color: '#1CB5E0',
  },
  text: {
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#EAF6FB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    color: '#1CB5E0',
    fontSize: 13,
  },
  metaBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
    gap: 8,
  },
  sectionBox: {
    backgroundColor: '#EAF6FB',
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#B3E0F7',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 6,
  },
  lessonList: {
    marginTop: 4,
    marginLeft: 12,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  lessonIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 14,
    color: '#222',
  },
  lessonDuration: {
    fontSize: 13,
    color: '#888',
    marginLeft: 8,
  },
  emptyLesson: {
    color: '#888',
    fontStyle: 'italic',
    marginLeft: 8,
    marginTop: 2,
  },
});

export default CoursePreview;
