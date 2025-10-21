import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../constant/Colors';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.questionContainer}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.questionText}>{question}</Text>
        {isExpanded ? <ChevronUp size={20} color={Colors.GRAY} /> : <ChevronDown size={20} color={Colors.GRAY} />}
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.BLACK,
    flex: 1,
    marginRight: 8,
  },
  answerContainer: {
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  answerText: {
    fontSize: 14,
    color: Colors.GRAY,
    lineHeight: 22,
  },
});

export default FAQItem;