
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import Button from '../components/Button';
import { colors, commonStyles } from '../styles/commonStyles';

export default function DeployScreen() {
  console.log('DeployScreen rendered');

  const openUrl = async (url: string) => {
    try {
      console.log('Opening URL:', url);
      await Linking.openURL(url);
    } catch (e) {
      console.error('Failed to open URL:', url, e);
    }
  };

  return (
    <View style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerWithLogo}>
          <Image
            source={require('../assets/images/60e1ffea-4aeb-4101-9cc0-52f16abfc277.png')}
            style={styles.scrollableLogo}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>Deployment Assistant</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Option 1: Quick Public Dev URL (Expo Tunnel)</Text>
          <Text style={styles.text}>
            Use Expo&apos;s Tunnel to instantly share a public development URL while your dev server runs.
          </Text>
          <View style={styles.steps}>
            <Text style={styles.step}>1. Start the dev server with tunnel: npm run dev</Text>
            <Text style={styles.step}>2. Copy the Tunnel URL shown in the terminal (it starts with https://...ngrok.io or similar).</Text>
            <Text style={styles.step}>3. Share that URL publicly. Anyone can open it while your dev server runs.</Text>
          </View>
          <Text style={styles.note}>
            Note: Tunnel links are best for demos and testing. For a reliable always-on public URL, use the GitHub Pages option below.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Option 2: Production Web on GitHub Pages</Text>
          <Text style={styles.text}>
            This project is preconfigured to export static files into the docs/ folder and deploy to GitHub Pages.
          </Text>

          <View style={styles.steps}>
            <Text style={styles.step}>1. Build locally (optional): npm run build:web</Text>
            <Text style={styles.subStep}>- Static files are generated in the docs/ folder</Text>

            <Text style={styles.step}>2. Enable Pages (one-time):</Text>
            <Text style={styles.subStep}>- In your GitHub repo, go to Settings → Pages</Text>
            <Text style={styles.subStep}>- Under &quot;Build and deployment&quot;, choose &quot;GitHub Actions&quot;</Text>

            <Text style={styles.step}>3. Deploy:</Text>
            <Text style={styles.subStep}>- Push to the main branch, or</Text>
            <Text style={styles.subStep}>- Manually run the &quot;Deploy to GitHub Pages&quot; workflow in Actions</Text>

            <Text style={styles.step}>4. Your site will be available at:</Text>
            <Text style={styles.subStep}>https://&lt;your-username&gt;.github.io/&lt;your-repo&gt;/</Text>
          </View>

          <Text style={styles.text}>
            Alternative (no Actions): Set Pages Source to &quot;Deploy from a branch&quot; → Branch: main → Folder: /docs.
            Then build locally and commit the docs/ folder to main. The Actions workflow we added is the cleaner approach.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openUrl('https://docs.github.com/en/pages')}
              activeOpacity={0.85}
            >
              <Text style={styles.linkText}>GitHub Pages Docs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openUrl('https://docs.expo.dev/router/deployment/#web-static-exports')}
              activeOpacity={0.85}
            >
              <Text style={styles.linkText}>Expo Web Export Docs</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            We also generate docs/404.html and docs/.nojekyll automatically to support SPA routing and asset loading on Pages.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Option 3: App Stores (EAS Build)</Text>
          <Text style={styles.text}>
            Use EAS Build for iOS and Android binaries. You&apos;ll need Apple/Google developer accounts.
          </Text>
          <View style={styles.steps}>
            <Text style={styles.step}>1. Login: npx eas login</Text>
            <Text style={styles.step}>2. Configure: npx eas build:configure</Text>
            <Text style={styles.step}>3. Build Android: npx eas build -p android --profile production</Text>
            <Text style={styles.step}>4. Build iOS: npx eas build -p ios --profile production</Text>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openUrl('https://docs.expo.dev/build/introduction/')}
              activeOpacity={0.85}
            >
              <Text style={styles.linkText}>EAS Build Docs</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Heads up: react-native-maps is not supported on web in Natively. If you add maps, make sure to provide a web fallback.
          </Text>
        </View>

        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButtonWrapper}
            onPress={() => {
              console.log('Navigating back to home');
              router.back();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1a4d3a', '#0a0a0a', '#000000']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerWithLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  scrollableLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#d0d0d0',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.4)',
    elevation: 8,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    color: '#d0d0d0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  steps: {
    marginTop: 6,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  step: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  subStep: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 10,
    marginBottom: 4,
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  linkButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    boxShadow: '0px 0px 10px rgba(0,255,136,0.25)',
    elevation: 6,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '700',
  },
  warningCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  backButtonContainer: {
    marginTop: 16,
    marginBottom: 10,
    width: '100%',
  },
  backButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    boxShadow: '0px 4px 12px rgba(0, 255, 136, 0.15)',
    elevation: 4,
  },
  backButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  backButtonText: {
    color: '#d0d0d0',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
