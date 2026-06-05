import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

/**
 * Home Screen - NativeWind Example
 *
 * This template uses NativeWind (Tailwind CSS for React Native).
 * You can use familiar Tailwind classes directly in className props.
 *
 * Key patterns:
 * - Use `className` instead of `style` for most styling
 * - Theme colors: use tokens directly (bg-background, text-foreground, bg-primary, etc.); no dark: prefix needed
 * - Responsive: standard Tailwind breakpoints work on web
 * - Custom colors defined in tailwind.config.js
 */
function FeatureCard({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-lg p-4 active:opacity-70"
      onPress={onPress}
    >
      <Text className="text-lg font-semibold text-foreground mb-1">{title}</Text>
      <Text className="text-sm text-muted">{description}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Hero Section */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">Career Intelligence</Text>
            <Text className="text-base text-muted text-center">
              AI-powered career path planning and skill development
            </Text>
          </View>

          {/* Feature Cards */}
          <View className="gap-4">
            <FeatureCard
              title="Skill Gap Analysis"
              description="Identify missing skills for your target role"
              onPress={() => router.push("/dashboard" as any)}
            />
            <FeatureCard
              title="Project Recommendations"
              description="Get personalized projects to build your portfolio"
              onPress={() => router.push("/projects" as any)}
            />
            <FeatureCard
              title="Learning Path"
              description="Follow AI-generated learning paths to reach your goals"
              onPress={() => router.push("/onboarding" as any)}
            />
          </View>

          {/* CTA Button */}
          <View className="items-center mt-4">
            <TouchableOpacity
              className="bg-primary px-8 py-4 rounded-full w-full items-center"
              onPress={() => router.push("/dashboard" as any)}
            >
              <Text className="text-white font-semibold text-lg">Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
