import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Modal, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const isMobile = width < 700;

const PAYMENT_OPTIONS = [
  { key: 'upi', label: 'UPI', icon: { uri: 'https://img.icons8.com/color/48/000000/qr-code.png' } },
  { key: 'cards', label: 'Cards', icon: { uri: 'https://img.icons8.com/color/48/000000/bank-card-back-side.png' } },
  { key: 'netbanking', label: 'Netbanking', icon: { uri: 'https://img.icons8.com/color/48/000000/bank.png' } },
  { key: 'wallet', label: 'Wallet', icon: { uri: 'https://img.icons8.com/color/48/000000/wallet-app.png' } },
];

const BANKS = [
  { key: 'icici', label: 'ICICI Bank', icon: { uri: 'https://img.icons8.com/color/48/000000/bank.png' } },
  { key: 'boi', label: 'Bank of India', icon: { uri: 'https://img.icons8.com/color/48/000000/bank.png' } },
  { key: 'hdfc', label: 'HDFC Bank', icon: { uri: 'https://img.icons8.com/color/48/000000/bank.png' } },
];

export default function Pay1() {
  const [selectedOption, setSelectedOption] = useState('upi');
  const [selectedBank, setSelectedBank] = useState('icici');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  return (
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="arrow-back" size={isMobile ? 28 : 24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Process</Text>
          <TouchableOpacity style={styles.closeBtn}>
            <Ionicons name="close" size={isMobile ? 28 : 24} color="#222" />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Booking Summary */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabel}>Micro Learning-\nClassroom Management</Text>
              <Text style={styles.summaryValue}>₹ 100</Text>
            </View>
            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabel}>Platform Fee</Text>
              <Text style={styles.summaryValue}>₹ 0</Text>
            </View>
            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabel}>GST</Text>
              <Text style={styles.summaryValue}>₹ 50</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>₹ 150</Text>
            </View>
          </View>
          {/* Payment Options */}
          <View style={styles.optionsBox}>
            <Text style={styles.optionsTitle}>Payment Options</Text>
            <View style={styles.optionsRow}>
              {PAYMENT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.optionBtn, selectedOption === opt.key && styles.optionBtnActive]}
                  onPress={() => setSelectedOption(opt.key)}
                  activeOpacity={0.8}
                >
                  <Image source={opt.icon} style={styles.optionIcon} />
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Option Details */}
            {selectedOption === 'upi' && (
              <View style={styles.optionDetailBox}>
                <Text style={styles.optionDetailTitle}>UPI QR</Text>
                <View style={styles.qrRow}>
                  <View style={styles.qrBox}>
                    <Image source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi' }} style={styles.qrImg} />
                    <Text style={styles.qrText}>Scan the QR using any UPI App</Text>
                  </View>
                  <View style={styles.upiInputBox}>
                    <Text style={styles.optionDetailTitle}>Pay with UPI ID/Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="example@abcdank"
                      value={upiId}
                      onChangeText={setUpiId}
                      placeholderTextColor="#aaa"
                    />
                    <TouchableOpacity style={styles.payBtn} activeOpacity={0.8}>
                      <Text style={styles.payBtnText}>Verify and Pay</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            {selectedOption === 'cards' && (
              <View style={styles.optionDetailBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Your Card Number"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  maxLength={16}
                  placeholderTextColor="#aaa"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Name on the card"
                  value={cardName}
                  onChangeText={setCardName}
                  placeholderTextColor="#aaa"
                />
                <View style={styles.cardRow}>
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder="MM"
                    value={cardExpiry.slice(0,2)}
                    onChangeText={v => setCardExpiry(v + cardExpiry.slice(2))}
                    maxLength={2}
                    keyboardType="numeric"
                    placeholderTextColor="#aaa"
                  />
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder="YY"
                    value={cardExpiry.slice(2,4)}
                    onChangeText={v => setCardExpiry(cardExpiry.slice(0,2) + v)}
                    maxLength={2}
                    keyboardType="numeric"
                    placeholderTextColor="#aaa"
                  />
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder="CVV"
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    maxLength={3}
                    keyboardType="numeric"
                    secureTextEntry
                    placeholderTextColor="#aaa"
                  />
                </View>
                <TouchableOpacity style={styles.payBtn} activeOpacity={0.8}>
                  <Text style={styles.payBtnText}>Make Payment</Text>
                </TouchableOpacity>
              </View>
            )}
            {selectedOption === 'netbanking' && (
              <View style={styles.optionDetailBox}>
                <Text style={styles.optionDetailTitle}>Payment Using Netbanking</Text>
                <View style={styles.bankRow}>
                  {BANKS.map(bank => (
                    <TouchableOpacity
                      key={bank.key}
                      style={[styles.bankBtn, selectedBank === bank.key && styles.bankBtnActive]}
                      onPress={() => setSelectedBank(bank.key)}
                      activeOpacity={0.8}
                    >
                      <Image source={bank.icon} style={styles.bankIcon} />
                      <Text style={styles.bankLabel}>{bank.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowBankDropdown(!showBankDropdown)}>
                  <Text style={styles.dropdownText}>All Bank</Text>
                  <Ionicons name={showBankDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#222" />
                </TouchableOpacity>
                {showBankDropdown && (
                  <View style={styles.dropdownList}>
                    <TouchableOpacity onPress={() => { setSelectedBank('indian'); setShowBankDropdown(false); }}>
                      <Text style={styles.dropdownItem}>Indian Bank</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setSelectedBank('sbi'); setShowBankDropdown(false); }}>
                      <Text style={styles.dropdownItem}>SBI</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity style={styles.payBtn} activeOpacity={0.8}>
                  <Text style={styles.payBtnText}>Make Payment</Text>
                </TouchableOpacity>
              </View>
            )}
            {selectedOption === 'wallet' && (
              <View style={styles.optionDetailBox}>
                <Text style={styles.optionDetailTitle}>Wallet payment coming soon...</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? 0 : 8,
  },
  modalCard: {
    width: isMobile ? '100%' : 700,
    maxWidth: 700,
    height: isMobile ? '100%' : 'auto',
    backgroundColor: '#F6FCFF',
    borderRadius: isMobile ? 0 : 16,
    padding: isMobile ? 0 : 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isMobile ? 16 : 0,
    paddingTop: isMobile ? (Platform.OS === 'ios' ? 48 : 24) : 0,
    paddingBottom: isMobile ? 12 : 12,
    backgroundColor: '#F6FCFF',
    zIndex: 2,
  },
  backBtn: {
    padding: 8,
  },
  closeBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: isMobile ? 22 : 20,
    fontWeight: 'bold',
    color: '#222',
  },
  scrollContent: {
    padding: isMobile ? 16 : 0,
    paddingTop: 0,
    flexGrow: 1,
  },
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryTitle: {
    fontWeight: 'bold',
    fontSize: isMobile ? 18 : 16,
    marginBottom: 10,
    color: '#222',
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: isMobile ? 15 : 14,
    color: '#222',
    flex: 1,
  },
  summaryValue: {
    fontSize: isMobile ? 15 : 14,
    color: '#222',
    fontWeight: 'bold',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#EAF6FB',
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontWeight: 'bold',
    fontSize: isMobile ? 18 : 16,
    color: '#222',
  },
  summaryTotalValue: {
    fontWeight: 'bold',
    fontSize: isMobile ? 18 : 16,
    color: '#222',
  },
  optionsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  optionsTitle: {
    fontWeight: 'bold',
    fontSize: isMobile ? 18 : 16,
    marginBottom: 10,
    color: '#222',
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  optionBtn: {
    alignItems: 'center',
    padding: isMobile ? 12 : 8,
    borderRadius: 8,
    backgroundColor: '#F6FCFF',
    borderWidth: 1,
    borderColor: '#EAF6FB',
    flex: 1,
    marginHorizontal: 2,
  },
  optionBtnActive: {
    borderColor: '#1CB5E0',
    backgroundColor: '#EAF6FB',
  },
  optionIcon: {
    width: isMobile ? 36 : 28,
    height: isMobile ? 36 : 28,
    marginBottom: 4,
    resizeMode: 'contain',
  },
  optionLabel: {
    fontSize: isMobile ? 15 : 13,
    color: '#222',
  },
  optionDetailBox: {
    marginTop: 8,
    backgroundColor: '#F6FCFF',
    borderRadius: 8,
    padding: 12,
  },
  optionDetailTitle: {
    fontWeight: 'bold',
    fontSize: isMobile ? 16 : 15,
    marginBottom: 8,
    color: '#222',
  },
  qrRow: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: 16,
  },
  qrBox: {
    alignItems: 'center',
    marginBottom: isMobile ? 12 : 0,
  },
  qrImg: {
    width: isMobile ? 120 : 100,
    height: isMobile ? 120 : 100,
    marginBottom: 6,
  },
  qrText: {
    fontSize: isMobile ? 14 : 13,
    color: '#888',
    textAlign: 'center',
  },
  upiInputBox: {
    flex: 1,
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EAF6FB',
    borderRadius: 6,
    padding: isMobile ? 14 : 10,
    fontSize: isMobile ? 16 : 15,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputSmall: {
    flex: 1,
    marginRight: 2,
  },
  payBtn: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingVertical: isMobile ? 16 : 12,
    alignItems: 'center',
    marginTop: 8,
  },
  payBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: isMobile ? 18 : 16,
  },
  bankRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  bankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF6FB',
    borderRadius: 6,
    padding: isMobile ? 10 : 6,
    backgroundColor: '#F6FCFF',
    flex: 1,
  },
  bankBtnActive: {
    borderColor: '#1CB5E0',
    backgroundColor: '#EAF6FB',
  },
  bankIcon: {
    width: isMobile ? 36 : 28,
    height: isMobile ? 36 : 28,
    marginRight: 6,
    resizeMode: 'contain',
  },
  bankLabel: {
    fontSize: isMobile ? 15 : 13,
    color: '#222',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF6FB',
    borderRadius: 6,
    padding: isMobile ? 14 : 10,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: isMobile ? 16 : 15,
    color: '#222',
    flex: 1,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EAF6FB',
    borderRadius: 6,
    marginBottom: 8,
  },
  dropdownItem: {
    padding: isMobile ? 14 : 10,
    fontSize: isMobile ? 16 : 15,
    color: '#222',
  },
});
