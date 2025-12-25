import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { serverlessPeerService } from '../services/serverlessPeerService';

const ServerlessConnection: React.FC = () => {
  const [connectionOffer, setConnectionOffer] = useState('');
  const [connectionAnswer, setConnectionAnswer] = useState('');
  const [pastedOffer, setPastedOffer] = useState('');
  const [pastedAnswer, setPastedAnswer] = useState('');
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [isAcceptingOffer, setIsAcceptingOffer] = useState(false);
  const [step, setStep] = useState<'initial' | 'offer-created' | 'answer-created' | 'connected'>('initial');

  // Test if service is available
  React.useEffect(() => {
    console.log('🔍 Testing serverlessPeerService availability...');
    if (serverlessPeerService) {
      console.log('✅ serverlessPeerService is available');
      console.log('📋 Service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(serverlessPeerService)));
    } else {
      console.error('❌ serverlessPeerService is not available');
    }
  }, []);

  const handleCreateOffer = async () => {
    setIsCreatingOffer(true);
    try {
      console.log('🚀 Starting offer creation from UI...');
      const offer = await serverlessPeerService.createConnectionOffer();
      console.log('✅ Offer created successfully from UI');
      setConnectionOffer(offer);
      setStep('offer-created');
      Alert.alert(
        'Offer Created!',
        'Copy this offer and share it with the other device via WhatsApp, email, or any messaging app.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('💥 UI Error creating offer:', error);
      Alert.alert('Error', `Failed to create offer: ${error}`);
    } finally {
      setIsCreatingOffer(false);
    }
  };

  const handleCopyOffer = () => {
    Clipboard.setString(connectionOffer);
    Alert.alert('Copied!', 'Connection offer copied to clipboard. Share it with the other device.');
  };

  const handleAcceptOffer = async () => {
    if (!pastedOffer.trim()) {
      Alert.alert('Error', 'Please paste the connection offer first');
      return;
    }

    setIsAcceptingOffer(true);
    try {
      const answer = await serverlessPeerService.acceptConnectionOffer(pastedOffer);
      setConnectionAnswer(answer);
      setStep('answer-created');
      Alert.alert(
        'Answer Created!',
        'Copy this answer and send it back to the device that created the offer.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to accept offer: ${error}`);
    } finally {
      setIsAcceptingOffer(false);
    }
  };

  const handleCopyAnswer = () => {
    Clipboard.setString(connectionAnswer);
    Alert.alert('Copied!', 'Connection answer copied to clipboard. Send it back to the other device.');
  };

  const handleCompleteConnection = async () => {
    if (!pastedAnswer.trim()) {
      Alert.alert('Error', 'Please paste the connection answer first');
      return;
    }

    try {
      await serverlessPeerService.completeConnection(pastedAnswer);
      setStep('connected');
      Alert.alert('Success!', 'Connection established! You can now communicate directly.');
    } catch (error) {
      Alert.alert('Error', `Failed to complete connection: ${error}`);
    }
  };

  const handlePasteFromClipboard = async (type: 'offer' | 'answer') => {
    const text = await Clipboard.getString();
    if (type === 'offer') {
      setPastedOffer(text);
    } else {
      setPastedAnswer(text);
    }
    Alert.alert('Pasted!', 'Connection info pasted from clipboard');
  };

  const handleReset = () => {
    setConnectionOffer('');
    setConnectionAnswer('');
    setPastedOffer('');
    setPastedAnswer('');
    setStep('initial');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔒 Serverless P2P Connection</Text>
        <Text style={styles.subtitle}>
          No signaling server needed! Share connection info via WhatsApp/clipboard
        </Text>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step !== 'initial' && styles.stepDotActive]} />
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, (step === 'answer-created' || step === 'connected') && styles.stepDotActive]} />
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, step === 'connected' && styles.stepDotActive]} />
      </View>

      {/* Initial State */}
      {step === 'initial' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Role:</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleCreateOffer}
            disabled={isCreatingOffer}
          >
            {isCreatingOffer ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>📤 Create Connection Offer (Device A)</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.orText}>OR</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Paste Connection Offer:</Text>
            <TextInput
              style={styles.textInput}
              value={pastedOffer}
              onChangeText={setPastedOffer}
              placeholder="Paste offer from Device A here..."
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={styles.pasteButton}
              onPress={() => handlePasteFromClipboard('offer')}
            >
              <Text style={styles.pasteButtonText}>📋 Paste from Clipboard</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleAcceptOffer}
            disabled={isAcceptingOffer || !pastedOffer.trim()}
          >
            {isAcceptingOffer ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>📥 Accept Offer (Device B)</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Offer Created */}
      {step === 'offer-created' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Step 1: Offer Created</Text>
          <Text style={styles.instructions}>
            Copy this offer and share it with Device B via WhatsApp, email, or any messaging app:
          </Text>

          <View style={styles.codeContainer}>
            <ScrollView style={styles.codeScroll} horizontal>
              <Text style={styles.codeText}>{connectionOffer}</Text>
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.copyButton} onPress={handleCopyOffer}>
            <Text style={styles.copyButtonText}>📋 Copy Offer</Text>
          </TouchableOpacity>

          <Text style={styles.waitingText}>
            ⏳ Waiting for Device B to send back the answer...
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Paste Answer from Device B:</Text>
            <TextInput
              style={styles.textInput}
              value={pastedAnswer}
              onChangeText={setPastedAnswer}
              placeholder="Paste answer from Device B here..."
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={styles.pasteButton}
              onPress={() => handlePasteFromClipboard('answer')}
            >
              <Text style={styles.pasteButtonText}>📋 Paste from Clipboard</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleCompleteConnection}
            disabled={!pastedAnswer.trim()}
          >
            <Text style={styles.buttonText}>✅ Complete Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>🔄 Start Over</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Answer Created */}
      {step === 'answer-created' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Step 2: Answer Created</Text>
          <Text style={styles.instructions}>
            Copy this answer and send it back to Device A:
          </Text>

          <View style={styles.codeContainer}>
            <ScrollView style={styles.codeScroll} horizontal>
              <Text style={styles.codeText}>{connectionAnswer}</Text>
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.copyButton} onPress={handleCopyAnswer}>
            <Text style={styles.copyButtonText}>📋 Copy Answer</Text>
          </TouchableOpacity>

          <Text style={styles.successText}>
            ✅ Connection will be established once Device A receives this answer!
          </Text>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>🔄 Start Over</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Connected */}
      {step === 'connected' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎉 Connected!</Text>
          <Text style={styles.successText}>
            Direct P2P connection established! No server involved.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ✅ Connection is completely peer-to-peer{'\n'}
              ✅ No signaling server needed{'\n'}
              ✅ All data flows directly between devices{'\n'}
              ✅ Maximum privacy achieved
            </Text>
          </View>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>🔄 New Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              const debugInfo = serverlessPeerService.getDebugInfo();
              Alert.alert('Debug Info', JSON.stringify(debugInfo, null, 2));
            }}
          >
            <Text style={styles.buttonText}>🔍 Show Debug Info</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* How It Works */}
      <View style={styles.howItWorks}>
        <Text style={styles.howItWorksTitle}>How Serverless P2P Works:</Text>
        <Text style={styles.howItWorksText}>
          1️⃣ Device A creates an "offer" with connection details{'\n'}
          2️⃣ Share offer via WhatsApp/clipboard to Device B{'\n'}
          3️⃣ Device B accepts offer and creates an "answer"{'\n'}
          4️⃣ Share answer back to Device A{'\n'}
          5️⃣ Direct P2P connection established!{'\n\n'}
          🔒 No server sees your data - completely private!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
  },
  stepDotActive: {
    backgroundColor: '#4CAF50',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#ccc',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginVertical: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    backgroundColor: '#f9f9f9',
    fontFamily: 'monospace',
    minHeight: 80,
  },
  pasteButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  pasteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  codeContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    maxHeight: 150,
  },
  codeScroll: {
    maxHeight: 150,
  },
  codeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#333',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 14,
    color: '#FF9800',
    textAlign: 'center',
    marginVertical: 12,
    fontStyle: 'italic',
  },
  successText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    marginVertical: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 22,
  },
  howItWorks: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  howItWorksText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});

export default ServerlessConnection;