import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Star, Send, MessageSquare, BarChart2, User as UserIcon } from 'lucide-react-native';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';

export interface CourseFeedbackProps {
  courseId: string;
  publisherId: string;
  isEnrolled: boolean;
}

export interface FeedbackAuthor {
  id?: string;
  name?: string;
  email?: string;
}

export interface FeedbackData {
  id: string;
  course_id: string;
  user_id?: string;
  rating: number;
  content_feedback?: string | null;
  teaching_feedback?: string | null;
  overall_feedback?: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at?: string;
  teacher_response?: string | null;
  teacher_response_at?: string | null;
  user?: FeedbackAuthor;
}

interface AnalyticsData {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  commonThemes: string[];
}

const TEST_TABLE_NAME = 'course_feedback';

const CourseFeedback = ({ courseId, publisherId, isEnrolled }: CourseFeedbackProps) => {
  const { session, isLoading: authIsLoading } = useAuth();
  const authUser = session?.user;

  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [contentFeedback, setContentFeedback] = useState('');
  const [teachingFeedback, setTeachingFeedback] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [teacherResponseText, setTeacherResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  const isPublisher = authUser?.id === publisherId;

  // --- START: The Core Fix is in this function ---
  const fetchFeedback = useCallback(async () => {
    try {
      const { data: feedbackItems, error } = await supabase
        .from(TEST_TABLE_NAME)
        .select(`
          id,
          course_id,
          user_id,
          rating,
          content_feedback,
          teaching_feedback,
          overall_feedback,
          is_anonymous,
          created_at,
          updated_at,
          teacher_response,
          teacher_response_at,
          authorProfile:profiles (id, name)  
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching feedback:", error);
        throw error; // Or handle it gracefully without throwing
      }

      const processedFeedback = feedbackItems?.map(item => {
        let displayUser: FeedbackAuthor = { name: 'Anonymous' };
        const profileDataFromSupabase = item.authorProfile;

        if (!item.is_anonymous && profileDataFromSupabase) {
          let actualProfileObject: { id: string; name?: string; email?: string } | null = null;
          
          if (Array.isArray(profileDataFromSupabase)) {
            if (profileDataFromSupabase.length > 0) {
              actualProfileObject = profileDataFromSupabase[0];
            }
          } else if (typeof profileDataFromSupabase === 'object' && profileDataFromSupabase !== null) {
            actualProfileObject = profileDataFromSupabase as { id: string; name?: string; email?: string };
          }
          
          if (actualProfileObject) {
            displayUser = {
              id: actualProfileObject.id,
              name: actualProfileObject.name || actualProfileObject.email || 'User',
              email: actualProfileObject.email,
            };
          }
        }
        return {
          ...item,
          content_feedback: item.content_feedback || '',
          teaching_feedback: item.teaching_feedback || '',
          overall_feedback: item.overall_feedback || '',
          user: displayUser,
        };
      }) || [];

      setFeedback(processedFeedback);
      calculateAnalytics(processedFeedback);

    } catch (e) {
      console.error("Failed to fetch feedback details:", e);
      Alert.alert("Error", "Could not load feedback. Please try again later.");
    } finally {
      // This is the crucial fix: ensure loading is set to false after the fetch.
      setLoading(false);
    }
  }, [courseId]);
  // --- END: The Core Fix ---

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const calculateAnalytics = (feedbackData: FeedbackData[]) => {
    if (!feedbackData || feedbackData.length === 0) {
      setAnalytics({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        commonThemes: [],
      });
      return;
    }

    const totalReviews = feedbackData.length;
    const ratingSum = feedbackData.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = totalReviews > 0 ? ratingSum / totalReviews : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbackData.forEach(f => {
      if (f.rating >= 1 && f.rating <= 5) {
        ratingDistribution[f.rating]++;
      }
    });

    const allFeedbackText = feedbackData
      .map(f => `${f.content_feedback || ''} ${f.teaching_feedback || ''} ${f.overall_feedback || ''}`)
      .join(' ');

    const words = allFeedbackText.toLowerCase().match(/\b(\w{4,})\b/g) || [];
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    const commonThemes = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    setAnalytics({
      averageRating,
      totalReviews,
      ratingDistribution,
      commonThemes,
    });
  };

  const handleSubmitFeedback = async () => {
    if (authIsLoading) {
      Alert.alert("Please wait", "Authenticating...");
      return;
    }
    if (!authUser) {
      Alert.alert('Authentication Required', 'Please sign in to submit feedback.');
      return;
    }
    if (!isEnrolled) {
      Alert.alert('Enrollment Required', 'You must be enrolled in this course to submit feedback.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall star rating.');
      return;
    }
    if (!contentFeedback.trim() && !teachingFeedback.trim() && !overallFeedback.trim()) {
      Alert.alert('Feedback Required', 'Please provide feedback in at least one category.');
      return;
    }

    setSubmitting(true);
    try {
      const feedbackToSubmit = {
        course_id: courseId,
        user_id: authUser.id,
        rating,
        content_feedback: contentFeedback.trim() || null,
        teaching_feedback: teachingFeedback.trim() || null,
        overall_feedback: overallFeedback.trim() || null,
        is_anonymous: isAnonymous,
      };

      const { error } = await supabase
        .from(TEST_TABLE_NAME)
        .upsert(feedbackToSubmit, { onConflict: 'course_id,user_id' });

      if (error) {
        console.error('Feedback submission error details:', error);
        throw error;
      }

      Alert.alert('Success', 'Feedback submitted successfully!');
      setRating(0);
      setContentFeedback('');
      setTeachingFeedback('');
      setOverallFeedback('');
      setIsAnonymous(false);
      fetchFeedback();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', error.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitResponse = async (feedbackId: string) => {
    if (!teacherResponseText.trim()) {
      Alert.alert('Error', 'Please enter a response.');
      return;
    }
    if (!isPublisher) {
      Alert.alert('Error', 'Only the course publisher can respond.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from(TEST_TABLE_NAME)
        .update({
          teacher_response: teacherResponseText.trim(),
          teacher_response_at: new Date().toISOString(),
        })
        .eq('id', feedbackId);

      if (error) throw error;

      Alert.alert('Success', 'Response submitted successfully');
      setTeacherResponseText('');
      setIsResponding(false);
      setSelectedFeedbackId(null);
      fetchFeedback();
    } catch (error: any) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', error.message || 'Failed to submit response.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingStars = (value: number, onPress?: (rating: number) => void) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onPress?.(star)}
          disabled={!onPress || authIsLoading || submitting}
          style={styles.starButton}
        >
          <Star
            size={onPress ? 24 : 18}
            color={star <= value ? '#fbbf24' : '#d1d5db'}
            fill={star <= value ? '#fbbf24' : 'none'}
          />
        </Pressable>
      ))}
    </View>
  );

  const renderFeedbackForm = () => {
    if (authIsLoading) {
      return <ActivityIndicator style={styles.centeredLoader} />;
    }
    const userHasSubmittedFeedback = feedback.some(f => f.user_id === authUser?.id);

    if (!isEnrolled && !isPublisher) {
      return (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>You must be enrolled in this course to leave feedback.</Text>
        </View>
      );
    }
    
    if (userHasSubmittedFeedback && !isPublisher) {
      return (
        <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Your Feedback</Text>
            <Text style={styles.infoText}>You have already submitted feedback for this course. You can edit it by submitting new feedback.</Text>
        </View>
      );
    }

    return (
      <View style={styles.feedbackForm}>
        <Text style={styles.sectionTitle}>Leave Your Feedback</Text>
        <View style={styles.ratingInputContainer}>
          <Text style={styles.label}>Overall Rating*</Text>
          {renderRatingStars(rating, setRating)}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Content Feedback</Text>
          <TextInput
            style={styles.textArea}
            value={contentFeedback}
            onChangeText={setContentFeedback}
            placeholder="How was the course content?"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teaching Style Feedback</Text>
          <TextInput
            style={styles.textArea}
            value={teachingFeedback}
            onChangeText={setTeachingFeedback}
            placeholder="How was the teaching style?"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Overall Experience Feedback</Text>
          <TextInput
            style={styles.textArea}
            value={overallFeedback}
            onChangeText={setOverallFeedback}
            placeholder="Share your overall experience."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.anonymousContainer}>
          <Pressable
            style={styles.checkbox}
            onPress={() => setIsAnonymous(!isAnonymous)}
            disabled={submitting}
          >
            <View style={[styles.checkboxInner, isAnonymous && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>Submit anonymously</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.submitButton, (submitting || authIsLoading) && styles.submitButtonDisabled]}
          onPress={handleSubmitFeedback}
          disabled={submitting || authIsLoading}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Send size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  };

  const renderAnalytics = () => {
    if (!isPublisher || !analytics) return null;

    return (
      <View style={styles.analyticsSection}>
        <Text style={styles.sectionTitle}>Feedback Analytics</Text>
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <BarChart2 size={24} color="#3b82f6" />
            <Text style={styles.analyticsTitle}>Overview</Text>
          </View>

          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Average Rating:</Text>
            <View style={styles.ratingContainerAnalytics}>
              {renderRatingStars(Math.round(analytics.averageRating))}
              <Text style={styles.analyticsValue}> ({analytics.averageRating.toFixed(1)})</Text>
            </View>
          </View>

          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Total Reviews:</Text>
            <Text style={styles.analyticsValue}>{analytics.totalReviews}</Text>
          </View>

          <View style={styles.ratingDistribution}>
            <Text style={styles.subSectionTitle}>Rating Distribution</Text>
            {Object.entries(analytics.ratingDistribution).sort(([a],[b]) => Number(b) - Number(a)).map(([ratingVal, count]) => (
              <View key={ratingVal} style={styles.distributionRow}>
                <Text style={styles.distributionLabel}>{ratingVal} star{Number(ratingVal) > 1 ? 's' : ''}</Text>
                <View style={styles.distributionBarContainer}>
                  <View
                    style={[
                      styles.distributionBar,
                      {
                        width: analytics.totalReviews > 0 ? `${(count / analytics.totalReviews) * 100}%` : '0%',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.distributionValue}>{count}</Text>
              </View>
            ))}
          </View>

          <View style={styles.themesContainer}>
            <Text style={styles.subSectionTitle}>Common Themes</Text>
            {analytics.commonThemes.length > 0 ? (
              <View style={styles.themesList}>
                {analytics.commonThemes.map((theme, index) => (
                  <View key={index} style={styles.themeTag}>
                    <Text style={styles.themeText}>{theme}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyFeedbackTextSmall}>No common themes identified yet.</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderFeedbackList = () => {
    if (loading && feedback.length === 0) {
      return <ActivityIndicator size="large" color="#3b82f6" style={styles.centeredLoader} />;
    }

    if (feedback.length === 0) {
      return (
        <View style={styles.emptyFeedbackContainer}>
          <Text style={styles.emptyFeedbackText}>
            No reviews yet for this course.
            {isEnrolled && !isPublisher && " Be the first to leave one!"}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.feedbackListSection}>
        <Text style={styles.sectionTitle}>Course Reviews</Text>
        {feedback.map((item) => (
          <View key={item.id} style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <View style={styles.feedbackUser}>
                {item.is_anonymous || !item.user?.id ? (
                  <View style={styles.anonymousUserContainer}>
                    <UserIcon size={20} color="#6b7280" />
                    <Text style={styles.anonymousUserText}>Anonymous</Text>
                  </View>
                ) : (
                  <Text style={styles.userName}>
                    {item.user?.name || 'User'}
                  </Text>
                )}
                <Text style={styles.feedbackDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              {renderRatingStars(item.rating)}
            </View>

            {item.content_feedback && (
              <View style={styles.feedbackContentSection}>
                <Text style={styles.feedbackLabel}>Content:</Text>
                <Text style={styles.feedbackText}>{item.content_feedback}</Text>
              </View>
            )}
            {item.teaching_feedback && (
              <View style={styles.feedbackContentSection}>
                <Text style={styles.feedbackLabel}>Teaching Style:</Text>
                <Text style={styles.feedbackText}>{item.teaching_feedback}</Text>
              </View>
            )}
            {item.overall_feedback && (
              <View style={styles.feedbackContentSection}>
                <Text style={styles.feedbackLabel}>Overall Experience:</Text>
                <Text style={styles.feedbackText}>{item.overall_feedback}</Text>
              </View>
            )}

            {item.teacher_response && (
              <View style={styles.teacherResponse}>
                <Text style={styles.teacherResponseLabel}>Teacher's Response:</Text>
                <Text style={styles.teacherResponseText}>{item.teacher_response}</Text>
                {item.teacher_response_at && (
                  <Text style={styles.teacherResponseDate}>
                    Responded on: {new Date(item.teacher_response_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}

            {isPublisher && !item.teacher_response && (
              <Pressable
                style={styles.respondButton}
                onPress={() => {
                  setSelectedFeedbackId(item.id);
                  setIsResponding(true);
                  setTeacherResponseText('');
                }}
              >
                <MessageSquare size={16} color="#3b82f6" />
                <Text style={styles.respondButtonText}>Respond</Text>
              </Pressable>
            )}
          </View>
        ))}

        {isResponding && selectedFeedbackId && (
          <View style={styles.responseForm}>
            <Text style={styles.label}>Your Response:</Text>
            <TextInput
              style={styles.responseInput}
              value={teacherResponseText}
              onChangeText={setTeacherResponseText}
              placeholder="Write your response..."
              multiline
              numberOfLines={3}
            />
            <View style={styles.responseActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setIsResponding(false);
                  setSelectedFeedbackId(null);
                  setTeacherResponseText('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, (submitting || authIsLoading || !teacherResponseText.trim()) && styles.submitButtonDisabled]}
                onPress={() => handleSubmitResponse(selectedFeedbackId)}
                disabled={submitting || authIsLoading || !teacherResponseText.trim()}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Send size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Send Response</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView 
        style={styles.scrollViewContainer}
        nestedScrollEnabled={true}
    >
      {isPublisher && renderAnalytics()}
      {!isPublisher && renderFeedbackForm()}
      {renderFeedbackList()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
  },
  container: {
    backgroundColor: '#f9fafb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  feedbackForm: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  infoBox: {
    backgroundColor: '#eef2ff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#4338ca',
    textAlign: 'center',
  },
  ratingInputContainer: {
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 6,
  },
  inputContainer: {
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#fdfdff',
  },
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  analyticsSection: {
    marginBottom: 24,
  },
  analyticsCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  analyticsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  ratingContainerAnalytics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingDistribution: {
    marginTop: 18,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionLabel: {
    width: 70,
    fontSize: 12,
    color: '#6b7280',
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  distributionValue: {
    width: 30,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  themesContainer: {
    marginTop: 18,
  },
  themesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeTag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  themeText: {
    fontSize: 12,
    color: '#4338ca',
  },
  feedbackListSection: {
    paddingBottom: 20,
  },
  centeredLoader: {
    marginVertical: 30,
    alignSelf: 'center',
  },
  feedbackCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  feedbackUser: {
    flex: 1,
    marginRight: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  feedbackDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 3,
  },
  feedbackContentSection: {
    marginBottom: 10,
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 3,
  },
  feedbackText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  teacherResponse: {
    backgroundColor: '#f0f8ff',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  teacherResponseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 3,
  },
  teacherResponseText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 21,
  },
  teacherResponseDate: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 5,
    textAlign: 'right',
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  respondButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  responseForm: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 12,
    backgroundColor: '#fdfdff',
  },
  responseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '500',
  },
  emptyFeedbackContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyFeedbackText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  emptyFeedbackTextSmall: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  anonymousUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousUserText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

export default CourseFeedback;