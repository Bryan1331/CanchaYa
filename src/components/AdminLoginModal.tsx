import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  ShieldAlert,
  Lock,
  User,
  X,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

interface AdminLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccessLogin: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  visible,
  onClose,
  onSuccessLogin,
}) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const finalUser = usuario.trim();
    const finalPass = password.trim();

    if (!finalUser || !finalPass) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Autenticación real con Firebase Auth
      await signInWithEmailAndPassword(auth, finalUser, finalPass);
      setUsuario('');
      setPassword('');
      onSuccessLogin();
    } catch (error: any) {
      if (
        error.code === 'auth/invalid-email' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else {
        setErrorMsg('Error al iniciar sesión. Inténtalo nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrorMsg('');
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <KeyRound size={22} color="#3b82f6" />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Acceso a Recepción</Text>
          <Text style={styles.subtitle}>
            Ingresa tus credenciales de administrador para gestionar reservas y validar pagos.
          </Text>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <User size={18} color="#64748b" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico (ej: admin1@gmail.com)"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                keyboardType="email-address"
                value={usuario}
                editable={!loading}
                onChangeText={(text) => {
                  setUsuario(text);
                  setErrorMsg('');
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Lock size={18} color="#64748b" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
                value={password}
                editable={!loading}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMsg('');
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#94a3b8" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </TouchableOpacity>
            </View>

            {errorMsg.length > 0 && (
              <View style={styles.errorBox}>
                <ShieldAlert size={14} color="#f87171" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Botón Ingresar */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 30, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 12,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    flex: 1,
  },
  loginBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});