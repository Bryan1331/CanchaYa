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
  ScrollView,
  Alert,
} from 'react-native';
import {
  X,
  User,
  Phone,
  Mail,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  Info,
} from 'lucide-react-native';
import { UsuarioCliente } from '../types';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccessAuth: (usuario: UsuarioCliente) => void;
  motivoMensaje?: string; // ej: "Inicia sesión para apartar tu cancha"
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onSuccessAuth,
  motivoMensaje,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Campos de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Campos de Registro
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDemoFill = () => {
    if (tab === 'login') {
      setLoginEmail('rbazan@canchaya.pe');
      setLoginPassword('pichanga123');
      setErrorMsg('');
    } else {
      setNombre('Rodrigo Bazán');
      setTelefono('976123456');
      setEmail('rodrigo.bazan@gmail.com');
      setDni('74859612');
      setRegisterPassword('pichanga123');
      setErrorMsg('');
    }
  };

  const handleLoginSubmit = () => {
    const ident = loginEmail.trim();
    const pass = loginPassword.trim();

    if (!ident || !pass) {
      setErrorMsg('Por favor completa tu correo o teléfono y contraseña.');
      return;
    }

    // Simulación / Validación de cliente
    const usuarioLogueado: UsuarioCliente = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      nombre: ident.includes('@') ? ident.split('@')[0].replace('.', ' ') : 'Jugador CanchaYa',
      email: ident.includes('@') ? ident : `${ident}@canchaya.pe`,
      telefono: ident.startsWith('9') && ident.length === 9 ? ident : '976123456',
      dni: '74859612',
    };

    setErrorMsg('');
    onSuccessAuth(usuarioLogueado);
    onClose();
  };

  const handleRegisterSubmit = () => {
    const nom = nombre.trim();
    const tel = telefono.trim();
    const em = email.trim();
    const doc = dni.trim();
    const pass = registerPassword.trim();

    if (!nom || !tel || !em || !doc || !pass) {
      setErrorMsg('Por favor completa todos los campos para registrarte.');
      return;
    }

    if (!tel.startsWith('9') || tel.length !== 9) {
      setErrorMsg('El celular debe tener 9 dígitos y empezar con 9.');
      return;
    }

    if (doc.length !== 8 || isNaN(Number(doc))) {
      setErrorMsg('El DNI debe tener 8 dígitos numéricos.');
      return;
    }

    if (!em.includes('@') || !em.includes('.')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (pass.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const nuevoUsuario: UsuarioCliente = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      nombre: nom,
      telefono: tel,
      email: em,
      dni: doc,
    };

    setErrorMsg('');
    Alert.alert('🎉 ¡Registro Exitoso!', `Bienvenido a CanchaYa, ${nom}. Tu cuenta ha sido creada.`);
    onSuccessAuth(nuevoUsuario);
    onClose();
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
            <View style={styles.headerTitleRow}>
              <View style={styles.iconContainer}>
                <UserCheck size={20} color="#10b981" />
              </View>
              <View>
                <Text style={styles.title}>Perfil de Jugador</Text>
                <Text style={styles.subtitle}>CanchaYa Cajamarca</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Mensaje de Contexto (si viene por reservar) */}
          {motivoMensaje ? (
            <View style={styles.motivoBanner}>
              <Info size={14} color="#38bdf8" />
              <Text style={styles.motivoText}>{motivoMensaje}</Text>
            </View>
          ) : null}

          {/* Pestañas Iniciar Sesión / Registrarse */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
              onPress={() => {
                setTab('login');
                setErrorMsg('');
              }}
            >
              <Text style={[styles.tabBtnText, tab === 'login' && styles.tabBtnTextActive]}>
                Iniciar Sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
              onPress={() => {
                setTab('register');
                setErrorMsg('');
              }}
            >
              <Text style={[styles.tabBtnText, tab === 'register' && styles.tabBtnTextActive]}>
                Registrarse
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Mensaje de Error */}
            {errorMsg.length > 0 && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {tab === 'login' ? (
              /* FORMULARIO DE INICIO DE SESIÓN */
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Mail size={16} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Correo o Celular"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    value={loginEmail}
                    onChangeText={(text) => {
                      setLoginEmail(text);
                      setErrorMsg('');
                    }}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Lock size={16} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#64748b"
                    secureTextEntry={!showPassword}
                    value={loginPassword}
                    onChangeText={(text) => {
                      setLoginPassword(text);
                      setErrorMsg('');
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleLoginSubmit}>
                  <Text style={styles.submitBtnText}>Entrar a mi Cuenta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* FORMULARIO DE REGISTRO COMPLETO */
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <User size={16} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre y Apellidos completos"
                    placeholderTextColor="#64748b"
                    value={nombre}
                    onChangeText={(text) => {
                      setNombre(text);
                      setErrorMsg('');
                    }}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Phone size={16} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Celular / WhatsApp (9 dígitos)"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                    maxLength={9}
                    value={telefono}
                    onChangeText={(text) => {
                      setTelefono(text);
                      setErrorMsg('');
                    }}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Mail size={16} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Correo Electrónico"
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setErrorMsg('');
                    }}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <CreditCard size={16} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="DNI (8 dígitos)"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    maxLength={8}
                    value={dni}
                    onChangeText={(text) => {
                      setDni(text);
                      setErrorMsg('');
                    }}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Lock size={16} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Crear Contraseña"
                    placeholderTextColor="#64748b"
                    secureTextEntry={!showPassword}
                    value={registerPassword}
                    onChangeText={(text) => {
                      setRegisterPassword(text);
                      setErrorMsg('');
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterSubmit}>
                  <Text style={styles.submitBtnText}>Crear mi Cuenta de Jugador</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Botón Demo Rápido */}
            <TouchableOpacity style={styles.demoBtn} onPress={handleDemoFill}>
              <Sparkles size={14} color="#34d399" />
              <Text style={styles.demoBtnText}>
                Autocompletar Datos de Prueba (Demo)
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  motivoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 12,
  },
  motivoText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#10b981',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#090d16',
    fontWeight: '700',
  },
  formScroll: {
    maxHeight: 380,
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
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
  },
  eyeBtn: {
    padding: 6,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 10,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#090d16',
    fontSize: 14,
    fontWeight: '700',
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 6,
  },
  demoBtnText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
});
