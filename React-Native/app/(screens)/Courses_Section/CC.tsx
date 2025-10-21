import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CheckBox from 'react-native-check-box';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/Superbase';

export default function CC() {
  const params = useLocalSearchParams();
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Assume courseId is passed in params
  const courseId = params.courseId || params.id;
  console.log('CC.tsx: courseId from params:', courseId);

  React.useEffect(() => {
    // On mount, check if the user has already completed this course
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('CC.tsx: user from supabase:', user);
        if (!user) return;
        const { data, error } = await supabase
          .from('course_completions')
          .select('id, completed_at')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle();
        console.log('CC.tsx: fetched data:', data, 'error:', error);
        setCompleted(!!data);
        setSuccess(!!data);
      } catch (e) {
        console.log('CC.tsx: error in useEffect fetch', e);
        setCompleted(false);
        setSuccess(false);
      }
    })();
  }, [courseId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('CC.tsx: user in handleSave:', user);
      if (!user) throw new Error('Not logged in');
      if (completed) {
        // Fetch course title and instructor
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('title, instructor')
          .eq('id', courseId)
          .single();
        if (courseError) throw courseError;
        await supabase.from('course_completions').upsert({
          user_id: user.id,
          course_id: courseId,
          completed_at: new Date().toISOString(),
          course_title: course.title,
          instructor: course.instructor,
        });
        setSuccess(true);
      } else {
        await supabase.from('course_completions')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', courseId);
        setSuccess(false);
      }
      // After save, re-fetch the latest completion status from DB
      const { data, error } = await supabase
        .from('course_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();
      console.log('CC.tsx: data after save:', data, 'error:', error);
      setCompleted(!!data);
    } catch (e) {
      console.log('CC.tsx: error in handleSave', e);
      alert('Failed to update completion status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Course Completion</Text>
      <View style={styles.row}>
        <CheckBox
          isChecked={completed}
          onClick={() => setCompleted(!completed)}
          disabled={saving}
        />
        <Text style={styles.label}>I have completed this course</Text>
        <TouchableOpacity
          style={{ marginLeft: 16, backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      {success && <Text style={styles.success}>Course marked as completed! Your certificate will be available in Certificates.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 16, marginLeft: 12 },
  success: { color: 'green', marginTop: 16, fontWeight: 'bold' },
});