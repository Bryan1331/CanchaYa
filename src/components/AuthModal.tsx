import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
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
  Info,
} from 'lucide-react-native';
import { UsuarioCliente } from '../types';

WebBrowser.maybeCompleteAuthSession();

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccessAuth: (usuario: UsuarioCliente) => void;
  motivoMensaje?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onSuccessAuth,
  motivoMensaje,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Configuración directa de Google OAuth Client IDs
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '857084170287-oj738440gac6ukbljf3v2g12uc1ip1fn.apps.googleusercontent.com',
    androidClientId: '857084170287-le3ou5oj2tf0glli499sk76lh5kqgjvu.apps.googleusercontent.com',
    webClientId: '857084170287-le3ou5oj2tf0glli499sk76lh5kqgjvu.apps.googleusercontent.com',
  });

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

  // Evita re-procesar la misma respuesta de Google en cada re-render (bucle de auto-login).
  const processedResponseRef = useRef(false);

  // Formatear nombre dinámico para clientes
  const extraerNombreDeIdentificador = (identificador: string): string => {
    if (identificador.includes('@')) {
      const alias = identificador.split('@')[0];
      const limpio = alias.replace(/[._\-+]/g, ' ').replace(/[0-9]/g, '').trim();
      if (limpio.length >= 2) {
        return limpio
          .split(' ')
          .filter(Boolean)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(' ');
      }
      return `Jugador ${alias}`;
    }

    const telLimpio = identificador.replace(/\D/g, '');
    if (telLimpio.length >= 7) {
      return `Jugador (${telLimpio.slice(-4)})`;
    }
    return `Jugador ${identificador}`;
  };

  const handleLoginSubmit = () => {
    const ident = loginEmail.trim();
    const pass = loginPassword.trim();

    const esCorreoValido = ident.includes('@') && ident.includes('.');

    if (!ident || !pass || !esCorreoValido) {
      setErrorMsg('Por favor ingresa un correo y contraseña válidos.');
      return;
    }

    const identLower = ident.toLowerCase();

    // Detección del Admin (admin1@gmail.com / 123456)
    if (identLower === 'admin1@gmail.com') {
      if (pass !== '123456') {
        setErrorMsg('Contraseña de administrador incorrecta.');
        return;
      }

      const usuarioAdmin: UsuarioCliente = {
        id: 'USR-ADMIN-01',
        nombre: 'Administrador CanchaYa',
        email: 'admin1@gmail.com',
        rol: 'admin',
        telefono: '993694082',
        dni: '75269454',
      };

      setErrorMsg('');
      onSuccessAuth(usuarioAdmin);
      onClose();
      return;
    }

    // Login de Jugador Normal
    const nombreGenerado = extraerNombreDeIdentificador(ident);

    const usuarioLogueado: UsuarioCliente = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      nombre: nombreGenerado,
      email: ident,
      telefono: '9' + Math.floor(10000000 + Math.random() * 90000000),
      rol: 'cliente',
    };

    setErrorMsg('');
    Alert.alert('⚽ ¡Sesión Iniciada!', `¡Hola ${usuarioLogueado.nombre}! Listo para apartar tu cancha.`);
    onSuccessAuth(usuarioLogueado);
    onClose();
  };

  const handleRegisterSubmit = () => {
    const nom = nombre.trim();
    const tel = telefono.trim();
    const em = email.trim().toLowerCase();
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

    // Restricción obligatoria a dominios @gmail.com
    if (!em.endsWith('@gmail.com')) {
      setErrorMsg('El registro solo está permitido para correos @gmail.com.');
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
      rol: 'cliente',
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

  // Al iniciar un intento explícito con Google, permitimos procesar una nueva respuesta.
  const handleGooglePress = () => {
    processedResponseRef.current = false;
    promptAsync();
  };

  // Manejo del resultado de Google OAuth (flujo de autenticación del jugador)
  useEffect(() => {
    if (!response) return;

    // Si la respuesta ya fue procesada, no volver a autenticar.
    if (processedResponseRef.current) return;

    if (response.type === 'success') {
      processedResponseRef.current = true;

      const googleToken =
        response.authentication?.accessToken ??
        response.authentication?.idToken ??
        response.params?.access_token ??
        response.params?.id_token;

      // Obtener nombre y correo reales desde Google userinfo.
      const cargarUsuarioGoogle = async () => {
        let nombreGoogle = 'Jugador Google';
        let emailGoogle = 'jugador.google@gmail.com';

        if (googleToken) {
          try {
            const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${googleToken}`,
              },
            });

            if (resp.ok) {
              const data = (await resp.json()) as { name?: string; email?: string };
              if (data?.name) nombreGoogle = data.name;
              if (data?.email) emailGoogle = data.email;
            } else {
              console.warn('Google userinfo respondió con estado:', resp.status);
            }
          } catch (err) {
            console.error('No se pudo obtener el perfil de Google:', err);
          }
        }

        const usuarioGoogle: UsuarioCliente = {
          id: `USR-GOOGLE-${Math.floor(1000 + Math.random() * 9000)}`,
          nombre: nombreGoogle,
          email: emailGoogle,
          telefono: '993693082',
          dni: '75269454',
          rol: 'cliente',
        };

        setErrorMsg('');
        onSuccessAuth(usuarioGoogle);
        onClose();
      };

      cargarUsuarioGoogle();
      return;
    }

    if (response.type === 'error') {
      processedResponseRef.current = true;

      const googleCode =
        (response.error as any)?.error ||
        response.params?.error ||
        'error';
      const googleDescription =
        (response.error as any)?.description ||
        response.params?.error_description ||
        'Google bloqueó o rechazó la autorización. Revisa el redirect URI y los usuarios de prueba.';
      setErrorMsg(`Google (${googleCode}): ${googleDescription}`);
      console.error('Google OAuth response bloqueada:', JSON.stringify(response, null, 2));
      console.log('Google redirect URI utilizado:', request?.redirectUri);
    }
  }, [response, onSuccessAuth, onClose]);

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

          {/* Mensaje de Contexto */}
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
                    placeholder="Correo Electrónico"
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
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

                {/* Separador OR */}
                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>o</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Botón Google OAuth */}
                <TouchableOpacity
                  style={[styles.googleBtn, !request && styles.googleBtnDisabled]}
                  onPress={handleGooglePress}
                  disabled={!request}
                  activeOpacity={0.8}
                >
                  <View style={styles.googleBtnGBadge}>
                    <Text style={styles.googleBtnGLetter}>G</Text>
                  </View>
                  <Text style={styles.googleBtnText}>Continuar con Google</Text>
                </TouchableOpacity>

              </View>
            ) : (
              /* FORMULARIO DE REGISTRO */
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
                    placeholder="Correo Electrónico (@gmail.com)"
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

                {/* Separador OR */}
                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>o regístrate con</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Botón Google OAuth */}
                <TouchableOpacity
                  style={[styles.googleBtn, !request && styles.googleBtnDisabled]}
                  onPress={handleGooglePress}
                  disabled={!request}
                  activeOpacity={0.8}
                >
                  <View style={styles.googleBtnGBadge}>
                    <Text style={styles.googleBtnGLetter}>G</Text>
                  </View>
                  <Text style={styles.googleBtnText}>Continuar con Google</Text>
                </TouchableOpacity>

              </View>
            )}
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
    maxHeight: 480,
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
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e293b',
  },
  orText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },
  googleBtnDisabled: {
    opacity: 0.55,
  },
  googleBtnGBadge: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleBtnGLetter: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
  },
  googleBtnText: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '700',
  },
});