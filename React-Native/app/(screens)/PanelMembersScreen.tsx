import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
  Linking,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import Colors from '../../constant/Colors';
import { JobService } from '../../lib/jobService';
import { InterviewPanelistV2 } from '../../types/jobs';
import { User, Edit2, Trash2, Linkedin, Plus, Mail } from 'lucide-react-native';
import { supabase } from '../../lib/Superbase';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function PanelMembersScreen() {
  const [panelists, setPanelists] = useState<InterviewPanelistV2[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<InterviewPanelistV2[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editPanelist, setEditPanelist] = useState<InterviewPanelistV2 | null>(null);
  const [draft, setDraft] = useState<Partial<InterviewPanelistV2>>({ name: '' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<'All' | 'Available' | 'Unavailable'>('All');
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState({
    interview_date: new Date().toISOString().split('T')[0],
    interview_time: '10:00',
    interview_type: 'online',
    location: '',
    meeting_link: '',
    additional_notes: '',
  });
  const [schedulePanelist, setSchedulePanelist] = useState<InterviewPanelistV2 | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [assignedInterviews, setAssignedInterviews] = useState<any[]>([]);

  const isMobile = Dimensions.get('window').width < 600;

  useEffect(() => {
    fetchPanelists();
  }, []);

  useEffect(() => {
    let filteredList = panelists;
    if (availabilityFilter !== 'All') {
      filteredList = filteredList.filter(p => p.availability === availabilityFilter);
    }
    if (!search) setFiltered(filteredList);
    else setFiltered(filteredList.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, panelists, availabilityFilter]);

  const fetchPanelists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_panelists')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPanelists(data || []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPanelists();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Panelist', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await JobService.deletePanelistV2(id);
            setPanelists(panelists.filter(p => p.id !== id));
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  const handleCopyEmail = (email: string) => {
    Clipboard.setString(email);
    Alert.alert('Copied', 'Email address copied to clipboard');
  };

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleSave = async () => {
    if (!draft.name) {
      Alert.alert('Name is required');
      console.log('Save failed: Name is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (editPanelist) {
        const updated = await JobService.updatePanelistV2(editPanelist.id, draft as any);
        setPanelists(panelists.map(p => p.id === editPanelist.id ? updated : p));
        console.log('Panelist updated:', updated);
      } else {
        // Try to get the most recent interview_schedules id
        let interviewId: string | null = null;
        const { data: interviews, error: interviewError } = await supabase
          .from('interview_schedules')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1);
        if (interviewError) {
          console.log('Error fetching interviews:', interviewError.message);
        }
        if (interviews && interviews.length > 0) {
          interviewId = interviews[0].id;
        } else {
          // If no interview exists, create a dummy interview
          const { data: newInterview, error: createError } = await supabase
            .from('interview_schedules')
            .insert([
              {
                interview_date: new Date().toISOString().split('T')[0],
                interview_time: '10:00',
                interview_type: 'online',
                status: 'scheduled',
              },
            ])
            .select();
          if (createError) {
            throw createError;
          }
          interviewId = newInterview[0]?.id;
        }
        if (!interviewId) {
          throw new Error('Could not determine a valid interview_id');
        }
        const newPanelist = await JobService.addPanelistV2(interviewId, draft as any);
        setPanelists([newPanelist, ...panelists]);
        console.log('Panelist added:', newPanelist);
      }
      setShowModal(false);
      setDraft({ name: '' });
      setEditPanelist(null);
    } catch (e: any) {
      setError(e.message);
      Alert.alert('Error', e.message);
      console.log('Save error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSchedule = async (panelist: InterviewPanelistV2) => {
    setSchedulePanelist(panelist);
    setScheduleDraft({
      interview_date: new Date().toISOString().split('T')[0],
      interview_time: '10:00',
      interview_type: 'online',
      location: '',
      meeting_link: '',
      additional_notes: '',
    });
    // Fetch all interviews this panelist is assigned to
    try {
      const { data, error } = await supabase
        .from('interview_schedules')
        .select('*')
        .eq('id', panelist.interview_id);
      setAssignedInterviews(data || []);
    } catch (e) {
      setAssignedInterviews([]);
    }
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!schedulePanelist) {
      Alert.alert('No panelist selected');
      console.log('Schedule failed: No panelist selected');
      return;
    }
    setScheduleLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_schedules')
        .insert([
          {
            interview_date: scheduleDraft.interview_date,
            interview_time: scheduleDraft.interview_time,
            interview_type: scheduleDraft.interview_type,
            location: scheduleDraft.interview_type === 'offline' ? scheduleDraft.location : null,
            meeting_link: scheduleDraft.interview_type === 'online' ? scheduleDraft.meeting_link : null,
            additional_notes: scheduleDraft.additional_notes,
            status: 'scheduled',
          },
        ])
        .select();
      if (error) {
        Alert.alert('Error', error.message);
        console.log('Schedule error:', error.message);
        return;
      }
      const interviewId = data[0]?.id;
      if (interviewId) {
        // Set panelist's interview_id and availability
        const { error: panelistError } = await supabase
          .from('interview_panelists')
          .update({ interview_id: interviewId, availability: 'Unavailable' })
          .eq('id', schedulePanelist.id);
        if (panelistError) {
          Alert.alert('Error', panelistError.message);
          console.log('Panelist association error:', panelistError.message);
          return;
        }
        console.log('Interview scheduled:', data[0]);
        console.log('Panelist associated:', schedulePanelist.id, 'with interview', interviewId);
      }
      setShowScheduleModal(false);
      setSchedulePanelist(null);
      setScheduleDraft({
        interview_date: new Date().toISOString().split('T')[0],
        interview_time: '10:00',
        interview_type: 'online',
        location: '',
        meeting_link: '',
        additional_notes: '',
      });
      Alert.alert('Success', 'Interview scheduled and panelist assigned.');
      fetchPanelists(); // Refresh panelist list
    } catch (e: any) {
      Alert.alert('Error', e.message);
      console.log('Schedule error:', e.message);
    } finally {
      setScheduleLoading(false);
    }
  };

  const renderRow = ({ item }: { item: InterviewPanelistV2 }) => (
    <View style={styles.cardMobileV2}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.avatarMobileV2} />
        ) : (
          <View style={styles.avatarPlaceholderMobileV2}><User size={36} color={Colors.GRAY} /></View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.nameMobileV2}>{item.name}</Text>
          {item.role && <Text style={styles.roleMobileV2}>{item.role}</Text>}
          {item.organization && <Text style={styles.orgMobileV2}>{item.organization}</Text>}
        </View>
        <TouchableOpacity onPress={() => { setEditPanelist(item); setDraft(item); setShowModal(true); }} style={styles.actionBtnMobileV2}><Edit2 size={20} color={Colors.PRIMARY} /></TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtnMobileV2}><Trash2 size={20} color={Colors.ERROR} /></TouchableOpacity>
      </View>
      <View style={{ marginTop: 10, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => item.email && Linking.openURL(`mailto:${item.email}`)}>
            <Text style={styles.emailMobileV2}>{item.email}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => item.email && handleCopyEmail(item.email)}>
            <Mail size={16} color={Colors.PRIMARY} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.infoMobileV2}>Phone: {item.phone || '-'}</Text>
          {item.phone && (
            <TouchableOpacity onPress={() => handleCall(item.phone!)}>
              <Text style={styles.callBtn}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
        {item.linkedin_url && (
          <TouchableOpacity onPress={() => Linking.openURL(item.linkedin_url!)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Linkedin size={16} color={Colors.PRIMARY} />
            <Text style={styles.linkMobileV2}>LinkedIn</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.badgeMobileV2, { backgroundColor: item.availability === 'Available' ? '#d1fae5' : '#f3f4f6', color: item.availability === 'Available' ? '#059669' : '#6b7280' }]}> {item.availability || 'Unavailable'} </Text>
        {item.notes && <Text style={styles.notesMobileV2}>{item.notes}</Text>}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
        <TouchableOpacity onPress={() => handleOpenSchedule(item)} style={styles.scheduleBtnV2}><Text style={styles.scheduleMobileV2}>Schedule</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.containerV2}>
      <Text style={styles.titleV2}>Panel Members</Text>
      <View style={styles.topBarV2}>
        <TextInput
          style={styles.searchV2}
          placeholder="Search by name or email"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addBtnV2} onPress={() => { setDraft({ name: '', availability: 'Available' }); setEditPanelist(null); setShowModal(true); }}>
          <Plus size={18} color={Colors.WHITE} />
        </TouchableOpacity>
      </View>
      <View style={styles.filterBarV2}>
        {['All', 'Available', 'Unavailable'].map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.filterBtnV2, availabilityFilter === opt && styles.filterBtnActiveV2]}
            onPress={() => setAvailabilityFilter(opt as any)}
          >
            <Text style={[styles.filterBtnTextV2, availabilityFilter === opt && styles.filterBtnTextActiveV2]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading && <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginVertical: 20 }} />}
      <FlatList
        data={filtered}
        renderItem={renderRow}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={!loading && <Text style={{ textAlign: 'center', color: Colors.GRAY, marginTop: 40 }}>No panel members found.</Text>}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />
      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlayV2}>
          <View style={styles.modalContentV2}>
            <Text style={styles.modalTitleV2}>{editPanelist ? 'Edit Panel Member' : 'Add Panel Member'}</Text>
            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <TextInput style={styles.inputV2} value={draft.name || ''} onChangeText={name => setDraft({ ...draft, name })} placeholder="Name*" />
              <TextInput style={styles.inputV2} value={draft.email || ''} onChangeText={email => setDraft({ ...draft, email })} placeholder="Email" />
              <TextInput style={styles.inputV2} value={draft.phone || ''} onChangeText={phone => setDraft({ ...draft, phone })} placeholder="Phone" />
              <TextInput style={styles.inputV2} value={draft.role || ''} onChangeText={role => setDraft({ ...draft, role })} placeholder="Role" />
              <TextInput style={styles.inputV2} value={draft.organization || ''} onChangeText={organization => setDraft({ ...draft, organization })} placeholder="Organization" />
              <TextInput style={styles.inputV2} value={draft.photo_url || ''} onChangeText={photo_url => setDraft({ ...draft, photo_url })} placeholder="Photo URL" />
              <TextInput style={styles.inputV2} value={draft.linkedin_url || ''} onChangeText={linkedin_url => setDraft({ ...draft, linkedin_url })} placeholder="LinkedIn URL" />
              <TextInput style={styles.inputV2} value={draft.notes || ''} onChangeText={notes => setDraft({ ...draft, notes })} placeholder="Notes" multiline />
              <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 4 }}>
                <Picker
                  selectedValue={draft.availability || 'Available'}
                  onValueChange={availability => setDraft({ ...draft, availability })}
                  style={{ height: 44 }}
                >
                  <Picker.Item label="Available" value="Available" />
                  <Picker.Item label="Unavailable" value="Unavailable" />
                </Picker>
              </View>
            </ScrollView>
            {error && <Text style={{ color: Colors.ERROR, marginTop: 8 }}>{error}</Text>}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginRight: 16 }}>
                <Text style={{ color: Colors.GRAY, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={{ backgroundColor: Colors.PRIMARY, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }}>
                <Text style={{ color: Colors.WHITE, fontWeight: 'bold', fontSize: 16 }}>{editPanelist ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Schedule Modal */}
      <Modal visible={showScheduleModal} animationType="slide" transparent onRequestClose={() => setShowScheduleModal(false)}>
        <View style={styles.modalOverlayV2}>
          <View style={styles.modalContentV2}>
            <Text style={styles.modalTitleV2}>Schedule Interview for {schedulePanelist?.name}</Text>
            {assignedInterviews.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', color: Colors.PRIMARY, marginBottom: 4 }}>Assigned Interviews:</Text>
                {assignedInterviews.map((interview, idx) => (
                  <View key={interview.id || idx} style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, marginBottom: 4 }}>
                    <Text>Date: {interview.interview_date}</Text>
                    <Text>Time: {interview.interview_time}</Text>
                    <Text>Type: {interview.interview_type}</Text>
                    {interview.location && <Text>Location: {interview.location}</Text>}
                    {interview.meeting_link && <Text>Meeting Link: {interview.meeting_link}</Text>}
                    {interview.additional_notes && <Text>Notes: {interview.additional_notes}</Text>}
                  </View>
                ))}
              </View>
            )}
            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputV2}>
                <Text>{scheduleDraft.interview_date}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(scheduleDraft.interview_date)}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowDatePicker(false);
                    if (date) setScheduleDraft({ ...scheduleDraft, interview_date: date.toISOString().split('T')[0] });
                  }}
                />
              )}
              <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.inputV2}>
                <Text>{scheduleDraft.interview_time}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={new Date(`1970-01-01T${scheduleDraft.interview_time}`)}
                  mode="time"
                  display="default"
                  onChange={(_, date) => {
                    setShowTimePicker(false);
                    if (date) {
                      const h = date.getHours().toString().padStart(2, '0');
                      const m = date.getMinutes().toString().padStart(2, '0');
                      setScheduleDraft({ ...scheduleDraft, interview_time: `${h}:${m}` });
                    }
                  }}
                />
              )}
              <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 4 }}>
                <Picker
                  selectedValue={scheduleDraft.interview_type}
                  onValueChange={interview_type => setScheduleDraft({ ...scheduleDraft, interview_type })}
                  style={{ height: 44 }}
                >
                  <Picker.Item label="Online" value="online" />
                  <Picker.Item label="Offline" value="offline" />
                </Picker>
              </View>
              {scheduleDraft.interview_type === 'online' ? (
                <TextInput style={styles.inputV2} value={scheduleDraft.meeting_link} onChangeText={meeting_link => setScheduleDraft({ ...scheduleDraft, meeting_link })} placeholder="Meeting Link" />
              ) : (
                <TextInput style={styles.inputV2} value={scheduleDraft.location} onChangeText={location => setScheduleDraft({ ...scheduleDraft, location })} placeholder="Location" />
              )}
              <TextInput style={styles.inputV2} value={scheduleDraft.additional_notes} onChangeText={additional_notes => setScheduleDraft({ ...scheduleDraft, additional_notes })} placeholder="Additional Notes" multiline />
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)} style={{ marginRight: 16 }}>
                <Text style={{ color: Colors.GRAY, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveSchedule} style={{ backgroundColor: Colors.PRIMARY, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }} disabled={scheduleLoading}>
                <Text style={{ color: Colors.WHITE, fontWeight: 'bold', fontSize: 16 }}>{scheduleLoading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: Colors.PRIMARY, marginBottom: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  search: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 16 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.PRIMARY, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  addBtnText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 8, marginBottom: 4, elevation: 1 },
  headerCell: { flex: 1, fontWeight: 'bold', color: Colors.GRAY, fontSize: 14, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 8, elevation: 1 },
  cellPhoto: { width: 48, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e0e0' },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  cell: { flex: 1, alignItems: 'center' },
  name: { fontWeight: 'bold', fontSize: 15 },
  email: { color: Colors.PRIMARY, textDecorationLine: 'underline' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontWeight: 'bold', fontSize: 13, overflow: 'hidden' },
  cellActions: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionBtn: { marginHorizontal: 6, padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: Colors.WHITE, borderRadius: 16, padding: 24, width: 340, maxWidth: '95%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.PRIMARY, marginBottom: 16 },
  input: { backgroundColor: '#f8f9fa', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.BLACK, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 4 },
  cardMobile: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    alignItems: 'stretch',
  },
  avatarMobile: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  avatarPlaceholderMobile: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  nameMobile: {
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.PRIMARY,
    marginBottom: 2,
  },
  roleMobile: {
    color: Colors.PRIMARY,
    fontWeight: '500',
    fontSize: 15,
    marginBottom: 2,
  },
  orgMobile: {
    color: Colors.GRAY,
    fontSize: 14,
    marginBottom: 2,
  },
  emailMobile: {
    color: Colors.PRIMARY,
    textDecorationLine: 'underline',
    fontSize: 15,
    marginBottom: 2,
  },
  infoMobile: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 2,
  },
  linkMobile: {
    color: Colors.PRIMARY,
    marginLeft: 4,
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  badgeMobile: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 2,
    overflow: 'hidden',
  },
  notesMobile: {
    fontSize: 13,
    color: Colors.GRAY,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionBtnMobile: {
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  scheduleMobile: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 2,
  },
  // New mobile-first styles
  containerV2: { flex: 1, backgroundColor: '#f8f9fa', padding: 12 },
  titleV2: { fontSize: 24, fontWeight: 'bold', color: Colors.PRIMARY, marginBottom: 16, textAlign: 'center' },
  topBarV2: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchV2: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8 },
  addBtnV2: { backgroundColor: Colors.PRIMARY, borderRadius: 8, padding: 10, alignItems: 'center', justifyContent: 'center' },
  filterBarV2: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, gap: 8 },
  filterBtnV2: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb', marginHorizontal: 2 },
  filterBtnActiveV2: { backgroundColor: Colors.PRIMARY },
  filterBtnTextV2: { color: Colors.GRAY, fontWeight: 'bold' },
  filterBtnTextActiveV2: { color: Colors.WHITE },
  cardMobileV2: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6 },
  avatarMobileV2: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e0e0e0' },
  avatarPlaceholderMobileV2: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  nameMobileV2: { fontWeight: 'bold', fontSize: 18, color: Colors.PRIMARY },
  roleMobileV2: { color: Colors.PRIMARY, fontWeight: '500', fontSize: 15 },
  orgMobileV2: { color: Colors.GRAY, fontSize: 14 },
  emailMobileV2: { color: Colors.PRIMARY, textDecorationLine: 'underline', fontSize: 15 },
  infoMobileV2: { fontSize: 14, color: Colors.GRAY },
  linkMobileV2: { color: Colors.PRIMARY, marginLeft: 4, textDecorationLine: 'underline', fontSize: 14 },
  badgeMobileV2: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, fontWeight: 'bold', fontSize: 13, marginTop: 6, marginBottom: 2, overflow: 'hidden' },
  notesMobileV2: { fontSize: 13, color: Colors.GRAY, fontStyle: 'italic', marginTop: 4 },
  actionBtnMobileV2: { marginLeft: 8, padding: 8, borderRadius: 8, backgroundColor: '#f3f4f6' },
  callBtn: { color: Colors.PRIMARY, fontWeight: 'bold', fontSize: 14, marginLeft: 2 },
  scheduleBtnV2: { backgroundColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6 },
  scheduleMobileV2: { color: Colors.PRIMARY, fontWeight: 'bold', fontSize: 15 },
  modalOverlayV2: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalContentV2: { backgroundColor: Colors.WHITE, borderRadius: 16, padding: 20, width: '95%', maxWidth: 400, alignSelf: 'center' },
  modalTitleV2: { fontSize: 18, fontWeight: 'bold', color: Colors.PRIMARY, marginBottom: 16, textAlign: 'center' },
  inputV2: { backgroundColor: '#f8f9fa', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.BLACK, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 4 },
});

// Add this helper at the bottom of the file, before export default
export async function getAvailablePanelMembers() {
  const { data, error } = await supabase
    .from('interview_panelists')
    .select('id, name, availability')
    .eq('availability', 'Available');
  if (error) throw error;
  return data || [];
}