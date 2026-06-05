import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  const { data: roadmapData, isLoading: roadmapLoading } = trpc.career.getRoadmap.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
  });

  const { data: recommendations, isLoading: recommendationsLoading } =
    trpc.projects.getRecommendations.useQuery(undefined, {
      enabled: isAuthenticated && !loading,
    });

  if (loading || !isAuthenticated) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  // Show loading while roadmap is being fetched
  if (roadmapLoading) {
    return (
      <ScreenContainer className="justify-center items-center gap-4">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="text-muted">Loading your dashboard...</Text>
      </ScreenContainer>
    );
  }

  // Only show onboarding prompt AFTER loading completes and there is truly no roadmap
  if (!roadmapData) {
    return (
      <ScreenContainer className="p-6 gap-6 justify-center">
        <Text className="text-3xl font-bold text-foreground">Welcome, {user?.name}!</Text>
        <Text className="text-muted">Let's set up your career path.</Text>
        <TouchableOpacity
          className="bg-primary px-6 py-4 rounded-lg items-center"
            onPress={() => router.push("/onboarding" as any)}
        >
          <Text className="text-white font-semibold text-lg">Start Onboarding</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const completionPercentage = roadmapData?.careerPath?.completionPercentage || 0;
  const targetRole = roadmapData?.careerPath?.targetRoleId;

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Welcome back!</Text>
          <Text className="text-muted mt-1">{user?.name}</Text>
        </View>

        {/* Skill Gap Progress */}
        <View className="bg-surface border border-border rounded-lg p-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-foreground">Skill Gap Progress</Text>
            <Text className="text-primary font-bold">{Math.round(completionPercentage)}%</Text>
          </View>

          {/* Progress Bar */}
          <View className="bg-border rounded-full h-2 overflow-hidden mb-3">
            <View
              className="bg-primary h-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </View>

          {roadmapData?.skillGapAnalysis?.missingSkills && (
            <View className="gap-2">
              <Text className="text-sm text-muted">Top Missing Skills:</Text>
              {roadmapData.skillGapAnalysis.missingSkills.slice(0, 3).map((skill: any) => (
                <View key={skill.id} className="flex-row items-center gap-2">
                  <View className="w-2 h-2 bg-warning rounded-full" />
                  <Text className="text-sm text-foreground flex-1">{skill.name}</Text>
                  <Text className="text-xs text-muted">{skill.proficiencyNeeded}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recommended Projects */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-foreground">Recommended Projects</Text>
            <TouchableOpacity onPress={() => router.push("/projects" as any)}>
              <Text className="text-primary font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          {recommendationsLoading ? (
            <ActivityIndicator color="#0a7ea4" />
          ) : recommendations && recommendations.length > 0 ? (
            <FlatList
              data={recommendations.slice(0, 3)}
              scrollEnabled={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <ProjectCard
                  project={item}
                  onPress={() => router.push(`/projects/${item.id}` as any)}
                />
              )}
              ItemSeparatorComponent={() => <View className="h-3" />}
            />
          ) : (
            <Text className="text-muted text-center py-4">No projects available yet</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View className="gap-3 mb-6">
          <TouchableOpacity
            className="bg-primary px-4 py-3 rounded-lg items-center flex-row justify-center gap-2"
            onPress={() => router.push("/projects" as any)}
          >
            <Text className="text-white font-semibold">Browse Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border border-primary px-4 py-3 rounded-lg items-center"
            onPress={() => router.push("/profile" as any)}
          >
            <Text className="text-primary font-semibold">Update Skills</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function ProjectCard({
  project,
  onPress,
}: {
  project: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-lg p-4"
      onPress={onPress}
    >
      <Text className="text-lg font-semibold text-foreground mb-2">{project.title}</Text>

      <View className="flex-row gap-2 mb-3">
        <View className="bg-primary px-2 py-1 rounded">
          <Text className="text-xs text-white font-medium capitalize">{project.difficulty}</Text>
        </View>
        {project.careerRelevance && (
          <View className="bg-success px-2 py-1 rounded">
            <Text className="text-xs text-white font-medium">
              {Math.round(project.careerRelevance)}% match
            </Text>
          </View>
        )}
      </View>

      {project.estimatedTime && (
        <Text className="text-xs text-muted">~{project.estimatedTime} hours</Text>
      )}
    </TouchableOpacity>
  );
}
