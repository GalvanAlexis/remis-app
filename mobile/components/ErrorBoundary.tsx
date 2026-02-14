import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    };

    console.warn("SENDING ERROR TO BACKEND:", errorData);

    // Try to send to backend
    try {
      // Use localhost address for Android Emulator (10.0.2.2) or local IP for physical device
      // We rely on EXPO_PUBLIC_API_URL or fallback
      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:3000";

      fetch(`${apiUrl}/debug/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      }).catch((err) => console.warn("Failed to send error to backend:", err));
    } catch (e) {
      console.warn("Failed to initiate fetch:", e);
    }

    Alert.alert("Error Capturado (Enviando a Backend...)", error.toString());
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>¡Oops! Algo salió mal</Text>
            <Text style={styles.subtitle}>
              Se ha producido un error inesperado. Por favor, toma una captura
              de esta pantalla.
            </Text>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error?.toString()}
              </Text>
              {this.state.errorInfo && (
                <Text style={styles.stackTrace}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>Intentar de nuevo</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFEBEE",
  },
  scroll: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#D32F2F",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    marginBottom: 20,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    fontFamily: "monospace",
    marginBottom: 10,
  },
  stackTrace: {
    color: "#666",
    fontSize: 12,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
