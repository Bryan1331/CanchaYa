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
  Alert,
} from 'react-native';
import {
  ShieldAlert,
  Lock,
  User,
  X,
  Zap,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react-native';

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

  const handleLogin = (userVal?: string, passVal?: string) => {
    const finalUser = (userVal !== undefined ? userVal : usuario).trim().toLowerCase();
    const finalPass = (passVal !== undefined ? passVal : password).trim();

    // Validar credenciales demo (acepta 'admin' / '1234', 'recepcion' / '1234', 'admin@canchaya.pe' / '1234')
    if (
      (finalUser === 'admin' && finalPass === '1234') ||
      (finalUser === 'recepcion' && finalPass === '1234') ||
      (finalUser === 'admin@canchaya.pe' && finalPass === '1234')
    ) {
      setErrorMsg('');
      setUsuario('');
      setPassword('');
      onSuccessLogin();
    } else {
      setErrorMsg('Credenciales inválidas. Usa admin / 1234 o pulsa "Acceso Rápido Demo".');
    }
  };

  const handleDemoLogin = () => {
    setUsuario('admin');
    setPassword('1234');
    setErrorMsg('');
    handleLogin('admin', '1234');
  };

  const handleClose = () => {
    setErrorMsg('');
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
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
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
                placeholder="Usuario o correo (ej: admin)"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                value={usuario}
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
                placeholder="Contraseña (ej: 1234)"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMsg('');
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
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
            <TouchableOpacity style={styles.loginBtn} onPress={() => handleLogin()}>
              <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            {/* Separador */}
            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>O ACCESO RÁPIDO</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Botón Acceder como Demo */}
            <TouchableOpacity style={styles.demoBtn} onPress={handleDemoLogin}>
              <Zap size={16} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.demoBtnText}>Acceder como Demo (admin / 1234)</Text>
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
    marginBottom: 14,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e293b',
  },
  separatorText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 10,
    letterSpacing: 0.5,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: 12,
    height: 44,
  },
  demoBtnText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },
});
