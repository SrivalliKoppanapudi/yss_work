import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../../constant/Colors';

export default function WebinarTabs() {
  const [activeTab, setActiveTab] = useState('Webinar');
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity onPress={() => setActiveTab('Workshop')} style={[styles.tab, activeTab === 'Workshop' && styles.activeTab]}>
        <Text style={[styles.tabText, activeTab === 'Workshop' && styles.activeTabText]}>Workshop</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setActiveTab('Webinar')} style={[styles.tab, activeTab === 'Webinar' && styles.activeTab]}>
        <Text style={[styles.tabText, activeTab === 'Webinar' && styles.activeTabText]}>Webinar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.PRIMARY || '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: Colors.GRAY,
  },
  activeTabText: {
    color: Colors.PRIMARY || '#007AFF',
    fontWeight: 'bold',
  },
}); 