import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text as NativeText,
  useColorScheme,
  View,
  type TextProps,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SpoilerView, type SpoilerConfig } from 'react-native-spoiler-view';

function Text({ maxFontSizeMultiplier = 1.8, ...props }: TextProps) {
  return (
    <NativeText maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />
  );
}

const LIGHT_COLORS: ThemeColors = {
  background: '#f4f5f7',
  surface: '#ffffff',
  surfaceMuted: '#e9ecf1',
  text: '#15171c',
  muted: '#626975',
  border: '#dadde4',
  accent: '#3568e8',
  accentSoft: '#dfe8ff',
  incomingBubble: '#e8ebf0',
  outgoingBubble: '#dce7ff',
  outgoingText: '#17264d',
  positive: '#127447',
  particle: '#6d7480',
};

const DARK_COLORS: ThemeColors = {
  background: '#0d0f13',
  surface: '#171a20',
  surfaceMuted: '#232730',
  text: '#f4f6fa',
  muted: '#a6adba',
  border: '#303540',
  accent: '#7da2ff',
  accentSoft: '#23345e',
  incomingBubble: '#252932',
  outgoingBubble: '#24365f',
  outgoingText: '#f5f7ff',
  positive: '#5bd39a',
  particle: '#c3c8d1',
};

const STRESS_ITEMS = Array.from({ length: 6 }, (_, index) => index + 1);
const SPOILER_STYLES = {
  message: { borderRadius: 6, paddingHorizontal: 3, paddingVertical: 2 },
  short: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  balance: { borderRadius: 7, paddingHorizontal: 5, paddingVertical: 3 },
  amount: { borderRadius: 6, paddingHorizontal: 4, paddingVertical: 3 },
  inline: {
    borderRadius: 5,
    marginHorizontal: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  lab: { alignSelf: 'stretch', borderRadius: 9, padding: 9 },
  stress: {
    alignItems: 'center',
    borderRadius: 7,
    flex: 1,
    paddingVertical: 9,
  },
} as const;

export default function App() {
  const systemDark = useColorScheme() === 'dark';
  const [dark, setDark] = useState(systemDark);
  const [controlledRevealed, setControlledRevealed] = useState(false);
  const [secretPresses, setSecretPresses] = useState(0);
  const colors = dark ? DARK_COLORS : LIGHT_COLORS;
  const contextConfig = getContextConfig(colors);

  return (
    <GestureHandlerRootView
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <StatusBar
        backgroundColor={colors.background}
        barStyle={dark ? 'light-content' : 'dark-content'}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text
              maxFontSizeMultiplier={1.6}
              style={[styles.title, { color: colors.text }]}
            >
              Spoilers
            </Text>
            <Text
              maxFontSizeMultiplier={2}
              style={[styles.subtitle, { color: colors.muted }]}
            >
              Tap the particles. Keep the context.
            </Text>
          </View>
          <ThemeSwitch dark={dark} onChange={setDark} colors={colors} />
        </View>

        <DemoSection
          title="Conversation"
          description="Hide a full message or only the part that gives it away."
          colors={colors}
        >
          <View
            style={[
              styles.chatSurface,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.avatar, { backgroundColor: colors.accentSoft }]}
            >
              <Text style={[styles.avatarText, { color: colors.accent }]}>
                M
              </Text>
            </View>
            <View style={styles.chatThread}>
              <Text style={[styles.sender, { color: colors.muted }]}>
                Maya · now
              </Text>
              <View
                style={[
                  styles.bubble,
                  styles.incomingBubble,
                  { backgroundColor: colors.incomingBubble },
                ]}
              >
                <Text style={[styles.messageText, { color: colors.text }]}>
                  I finally watched the finale. The person behind the door was…
                </Text>
                <SpoilerView
                  config={{
                    ...contextConfig,
                    overlayColor: colors.incomingBubble,
                  }}
                  style={SPOILER_STYLES.message}
                  accessibilityRevealLabel="Hidden chat spoiler"
                >
                  <Text style={[styles.messageText, { color: colors.text }]}>
                    Mara's sister the whole time.
                  </Text>
                </SpoilerView>
              </View>

              <View
                style={[
                  styles.bubble,
                  styles.outgoingBubble,
                  { backgroundColor: colors.outgoingBubble },
                ]}
              >
                <Text
                  style={[styles.messageText, { color: colors.outgoingText }]}
                >
                  No way. I thought it would be
                </Text>
                <SpoilerView
                  config={{
                    ...contextConfig,
                    overlayColor: colors.outgoingBubble,
                  }}
                  style={SPOILER_STYLES.short}
                  accessibilityRevealLabel="Hidden character name"
                >
                  <Text
                    style={[styles.messageText, { color: colors.outgoingText }]}
                  >
                    Elias.
                  </Text>
                </SpoilerView>
              </View>
            </View>
          </View>
        </DemoSection>

        <DemoSection
          title="Private values"
          description="Mask sensitive data without flattening the rest of the interface."
          colors={colors}
        >
          <View
            style={[
              styles.statement,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.statementHeader}>
              <View>
                <Text style={[styles.accountName, { color: colors.text }]}>
                  Everyday account
                </Text>
                <Text style={[styles.accountMeta, { color: colors.muted }]}>
                  Statement · May 2026
                </Text>
              </View>
              <SpoilerView
                config={contextConfig}
                style={SPOILER_STYLES.balance}
                accessibilityRevealLabel="Hidden account balance"
              >
                <Text style={[styles.balance, { color: colors.text }]}>
                  $12,480.32
                </Text>
              </SpoilerView>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <StatementRow
              merchant="Harbor Coffee"
              detail="Today · Card • 4821"
              amount="− $8.40"
              colors={colors}
            />
            <StatementRow
              merchant="Salary"
              detail="May 28 · Direct deposit"
              amount="+ $4,850.00"
              positive
              colors={colors}
              hiddenAmount
            />
            <StatementRow
              merchant="Cloud Storage"
              detail="May 27 · Subscription"
              amount="− $12.99"
              colors={colors}
            />
          </View>
        </DemoSection>

        <DemoSection
          title="Selective redaction"
          description="A phrase, a name, or a whole sentence can carry the spoiler."
          colors={colors}
        >
          <View
            style={[
              styles.article,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.articleTitle, { color: colors.text }]}>
              Notes from the last chapter
            </Text>
            <View style={styles.proseLine}>
              <Text style={[styles.prose, { color: colors.text }]}>
                The expedition reached the northern ridge just before dawn.
                Inside the observatory, they found{' '}
              </Text>
              <SpoilerView
                config={contextConfig}
                style={SPOILER_STYLES.inline}
                accessibilityRevealLabel="Hidden discovery"
              >
                <Text
                  style={[
                    styles.prose,
                    styles.inlineSecret,
                    { color: colors.text },
                  ]}
                >
                  a working transmitter
                </Text>
              </SpoilerView>
              <Text style={[styles.prose, { color: colors.text }]}>
                {' '}
                and a message addressed to{' '}
              </Text>
              <SpoilerView
                config={contextConfig}
                style={SPOILER_STYLES.inline}
                accessibilityRevealLabel="Hidden recipient name"
              >
                <Text
                  style={[
                    styles.prose,
                    styles.inlineSecret,
                    { color: colors.text },
                  ]}
                >
                  Dr. Vale.
                </Text>
              </SpoilerView>
            </View>
          </View>
        </DemoSection>

        <DemoSection
          title="Test lab"
          description="Compact controls for state, interaction, RTL, and renderer load."
          colors={colors}
        >
          <View
            style={[
              styles.lab,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <LabRow
              title="Controlled state"
              detail="Parent-owned reveal"
              colors={colors}
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    controlledRevealed
                      ? 'Hide controlled spoiler'
                      : 'Reveal controlled spoiler'
                  }
                  onPress={() => setControlledRevealed(current => !current)}
                  style={({ pressed }) => [
                    styles.controlButton,
                    {
                      backgroundColor: colors.accentSoft,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.controlButtonText, { color: colors.accent }]}
                  >
                    {controlledRevealed ? 'Hide' : 'Reveal'}
                  </Text>
                </Pressable>
              }
            >
              <SpoilerView
                revealed={controlledRevealed}
                onReveal={() => setControlledRevealed(true)}
                onHide={() => setControlledRevealed(false)}
                config={contextConfig}
                style={SPOILER_STYLES.lab}
                accessibilityRevealLabel="Hidden launch date"
              >
                <Text style={[styles.labSecret, { color: colors.text }]}>
                  Launch: Friday at 09:00
                </Text>
              </SpoilerView>
            </LabRow>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <LabRow
              title="Interactive child"
              detail="The reveal tap must not press it"
              colors={colors}
            >
              <SpoilerView
                config={contextConfig}
                style={SPOILER_STYLES.lab}
                accessibilityRevealLabel="Hidden interactive control"
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSecretPresses(current => current + 1)}
                  style={({ pressed }) => [
                    styles.secretButton,
                    {
                      backgroundColor: colors.accent,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text style={styles.secretButtonText}>
                    Secret presses: {secretPresses}
                  </Text>
                </Pressable>
              </SpoilerView>
            </LabRow>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <LabRow
              title="RTL content"
              detail="Arabic layout and accessibility"
              colors={colors}
            >
              <SpoilerView
                config={contextConfig}
                style={SPOILER_STYLES.lab}
                accessibilityRevealLabel="رسالة مخفية"
                accessibilityRevealHint="اضغط مرتين لإظهار المحتوى"
              >
                <Text
                  style={[styles.labSecret, styles.rtl, { color: colors.text }]}
                >
                  هذه رسالة عربية مخفية
                </Text>
              </SpoilerView>
            </LabRow>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <View style={styles.stressHeader}>
              <View>
                <Text style={[styles.labTitle, { color: colors.text }]}>
                  Renderer strip
                </Text>
                <Text style={[styles.labDetail, { color: colors.muted }]}>
                  Six simultaneous renderers
                </Text>
              </View>
              <View style={styles.stressStrip}>
                {STRESS_ITEMS.map(item => (
                  <SpoilerView
                    key={item}
                    config={contextConfig}
                    style={SPOILER_STYLES.stress}
                    accessibilityRevealLabel={`Hidden stress item ${item}`}
                  >
                    <Text style={[styles.stressSecret, { color: colors.text }]}>
                      {item}
                    </Text>
                  </SpoilerView>
                ))}
              </View>
            </View>
          </View>
        </DemoSection>

        <Text style={[styles.footer, { color: colors.muted }]}>
          Native reveal · native particles · same API on iOS and Android
        </Text>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentSoft: string;
  incomingBubble: string;
  outgoingBubble: string;
  outgoingText: string;
  positive: string;
  particle: string;
}

function getContextConfig(colors: ThemeColors): Partial<SpoilerConfig> {
  return {
    overlayColor: colors.surface,
    particleColor: colors.particle,
  };
}

interface ThemeSwitchProps {
  dark: boolean;
  onChange: (dark: boolean) => void;
  colors: ThemeColors;
}

function ThemeSwitch({ dark, onChange, colors }: ThemeSwitchProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      style={[styles.themeSwitch, { backgroundColor: colors.surfaceMuted }]}
    >
      {[
        { label: 'Light', value: false },
        { label: 'Dark', value: true },
      ].map(option => {
        const selected = dark === option.value;
        return (
          <Pressable
            key={option.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.themeOption,
              selected && { backgroundColor: colors.surface },
              pressed && styles.pressed,
            ]}
          >
            <Text
              maxFontSizeMultiplier={1.5}
              style={[
                styles.themeOptionText,
                { color: selected ? colors.text : colors.muted },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface DemoSectionProps {
  title: string;
  description: string;
  colors: ThemeColors;
  children: React.ReactNode;
}

function DemoSection({
  title,
  description,
  colors,
  children,
}: DemoSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.muted }]}>
          {description}
        </Text>
      </View>
      {children}
    </View>
  );
}

interface StatementRowProps {
  merchant: string;
  detail: string;
  amount: string;
  positive?: boolean;
  hiddenAmount?: boolean;
  colors: ThemeColors;
}

function StatementRow({
  merchant,
  detail,
  amount,
  positive = false,
  hiddenAmount = false,
  colors,
}: StatementRowProps) {
  const amountText = (
    <Text
      style={[
        styles.amount,
        { color: positive ? colors.positive : colors.text },
      ]}
    >
      {amount}
    </Text>
  );

  return (
    <View style={styles.statementRow}>
      <View style={styles.statementCopy}>
        <Text style={[styles.merchant, { color: colors.text }]}>
          {merchant}
        </Text>
        <Text style={[styles.transactionDetail, { color: colors.muted }]}>
          {detail}
        </Text>
      </View>
      {hiddenAmount ? (
        <SpoilerView
          config={getContextConfig(colors)}
          style={SPOILER_STYLES.amount}
          accessibilityRevealLabel={`Hidden ${merchant} amount`}
        >
          {amountText}
        </SpoilerView>
      ) : (
        amountText
      )}
    </View>
  );
}

interface LabRowProps {
  title: string;
  detail: string;
  colors: ThemeColors;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function LabRow({ title, detail, colors, action, children }: LabRowProps) {
  return (
    <View style={styles.labRow}>
      <View style={styles.labRowHeading}>
        <View style={styles.labCopy}>
          <Text style={[styles.labTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.labDetail, { color: colors.muted }]}>
            {detail}
          </Text>
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    gap: 36,
    paddingBottom: 56,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  headerCopy: { flexBasis: 160, flexGrow: 1, gap: 4, minWidth: 0 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -1 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  themeSwitch: {
    borderRadius: 12,
    flexDirection: 'row',
    padding: 3,
  },
  themeOption: {
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  themeOptionText: { fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  section: { gap: 14 },
  sectionHeading: { gap: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.25 },
  sectionDescription: { fontSize: 14, lineHeight: 20, maxWidth: 340 },
  chatSurface: {
    alignItems: 'flex-start',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  avatarText: { fontSize: 14, fontWeight: '700' },
  chatThread: { flex: 1, gap: 9 },
  sender: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  bubble: {
    gap: 7,
    maxWidth: '92%',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  incomingBubble: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderTopLeftRadius: 5,
  },
  outgoingBubble: {
    alignSelf: 'flex-end',
    borderRadius: 16,
    borderBottomRightRadius: 5,
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  statement: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 16,
    padding: 18,
  },
  statementHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  accountName: { fontSize: 16, fontWeight: '700' },
  accountMeta: { fontSize: 12, marginTop: 3 },
  balance: { fontSize: 19, fontVariant: ['tabular-nums'], fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
  statementRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  statementCopy: { flex: 1, gap: 3 },
  merchant: { fontSize: 14, fontWeight: '600' },
  transactionDetail: { fontSize: 12 },
  amount: { fontSize: 14, fontVariant: ['tabular-nums'], fontWeight: '600' },
  article: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    padding: 18,
  },
  articleTitle: { fontSize: 17, fontWeight: '700' },
  proseLine: { alignItems: 'baseline', flexDirection: 'row', flexWrap: 'wrap' },
  prose: { fontSize: 15, lineHeight: 24 },
  inlineSecret: { lineHeight: 20 },
  lab: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 18,
    padding: 18,
  },
  labRow: { gap: 11 },
  labRowHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  labCopy: { flex: 1, gap: 3 },
  labTitle: { fontSize: 14, fontWeight: '600' },
  labDetail: { fontSize: 12, lineHeight: 17 },
  labSecret: { fontSize: 14, lineHeight: 20 },
  controlButton: { borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7 },
  controlButtonText: { fontSize: 13, fontWeight: '700' },
  secretButton: { alignItems: 'center', borderRadius: 7, paddingVertical: 9 },
  secretButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  stressHeader: { gap: 12 },
  stressStrip: { flexDirection: 'row', gap: 6 },
  stressSecret: { fontSize: 12, fontWeight: '700' },
  footer: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
