import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Appbar, useTheme } from 'react-native-paper';

export default function PaymentScreen() {
  const { checkoutUrl, rideId } = useLocalSearchParams<{ checkoutUrl: string; rideId: string }>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const theme = useTheme();

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    console.log('WebView URL:', url);

    // Detectar retorno de Mercado Pago basado en el esquema configurado en el backend
    // success: remisapp://payment/success
    if (url.includes('payment/success')) {
      router.replace({
        pathname: '/(tabs)/history',
        params: { paymentStatus: 'success', rideId }
      });
    } else if (url.includes('payment/failure')) {
      router.replace({
        pathname: '/(tabs)/history',
        params: { paymentStatus: 'failure', rideId }
      });
    } else if (url.includes('payment/pending')) {
      router.replace({
        pathname: '/(tabs)/history',
        params: { paymentStatus: 'pending', rideId }
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction color="white" onPress={() => router.back()} />
        <Appbar.Content title="Pago de Viaje" color="white" />
      </Appbar.Header>

      <View style={styles.webContainer}>
        {loading && (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color={theme.colors.primary}
          />
        )}
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    zIndex: 1,
  },
});
