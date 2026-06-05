import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalSearchParams, useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const projectId = parseInt(id || "0", 10);

  const { data, isLoading, error } = trpc.projects.getDetails.useQuery(
    { projectId },
    { enabled: projectId > 0 && isAuthenticated && !authLoading }
  );

  const submitMutation = trpc.projects.submit.useMutation({
    onSuccess: () => {
      alert("Project submitted successfully! 🎉");
    },
    onError: (err) => {
      alert("Failed to submit project. Please try again.");
      console.error(err);
    },
  });

  if (authLoading || isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  if (error || !data?.project) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <Text className="text-xl font-bold text-foreground mb-2">Project Not Found</Text>
        <Text className="text-muted mb-6 text-center">
          This project doesn't exist or couldn't be loaded.
        </Text>
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const { project, skills } = data;

  // Parse tech stack if it's a JSON string
  let techStack: string[] = [];
  try {
    techStack = typeof project.techStack === "string"
      ? JSON.parse(project.techStack)
      : Array.isArray(project.techStack) ? project.techStack : [];
  } catch {
    techStack = [];
  }

  const difficultyColors: Record<string, string> = {
    beginner: "bg-success",
    intermediate: "bg-warning",
    advanced: "bg-error",
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Back Button */}
        <TouchableOpacity
          className="mb-4 flex-row items-center"
          onPress={() => router.back()}
        >
          <Text className="text-primary font-semibold">← Back to Projects</Text>
        </TouchableOpacity>

        {/* Project Title & Badges */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-3">
            {project.title}
          </Text>

          <View className="flex-row flex-wrap gap-2">
            <View className={`${difficultyColors[project.difficulty] || "bg-primary"} px-3 py-1 rounded-full`}>
              <Text className="text-xs text-white font-semibold capitalize">
                {project.difficulty}
              </Text>
            </View>

            {project.estimatedTime && (
              <View className="bg-surface border border-border px-3 py-1 rounded-full">
                <Text className="text-xs text-foreground font-medium">
                  ⏱ ~{project.estimatedTime} hours
                </Text>
              </View>
            )}

            {project.careerRelevance && (
              <View className="bg-surface border border-border px-3 py-1 rounded-full">
                <Text className="text-xs text-foreground font-medium">
                  🎯 {Math.round(project.careerRelevance)}% career match
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View className="bg-surface border border-border rounded-lg p-4 mb-6">
          <Text className="text-lg font-semibold text-foreground mb-2">Description</Text>
          <Text className="text-foreground leading-relaxed">
            {project.description}
          </Text>
        </View>

        {/* Tech Stack */}
        {techStack.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Tech Stack</Text>
            <View className="flex-row flex-wrap gap-2">
              {techStack.map((tech, index) => (
                <View
                  key={index}
                  className="bg-primary px-3 py-2 rounded-lg"
                >
                  <Text className="text-sm text-white font-medium">{tech}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Required Skills */}
        {skills && skills.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Required Skills</Text>
            <View className="gap-2">
              {skills.map((skill: any) => (
                <View
                  key={skill.id}
                  className="bg-surface border border-border rounded-lg p-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-2">
                    <View className={`w-2 h-2 rounded-full ${skill.isPrimary ? "bg-primary" : "bg-muted"}`} />
                    <Text className="text-foreground font-medium">
                      Skill #{skill.skillId}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted">
                    {skill.isPrimary ? "Primary" : "Secondary"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Career Relevance */}
        {project.careerRelevance && (
          <View className="bg-surface border border-border rounded-lg p-4 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-2">Career Relevance</Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-1 bg-border rounded-full h-3 overflow-hidden">
                <View
                  className="bg-success h-full rounded-full"
                  style={{ width: `${project.careerRelevance}%` }}
                />
              </View>
              <Text className="text-foreground font-bold">
                {Math.round(project.careerRelevance)}%
              </Text>
            </View>
            <Text className="text-sm text-muted mt-2">
              How relevant this project is to your career goals
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="gap-3 mb-8">
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-lg items-center"
            onPress={() => {
              submitMutation.mutate({
                projectId: project.id,
                description: `Started working on ${project.title}`,
              });
            }}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-semibold text-lg">
                Start This Project
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="border border-primary px-6 py-4 rounded-lg items-center"
            onPress={() => router.push("/projects" as any)}
          >
            <Text className="text-primary font-semibold text-lg">
              Browse More Projects
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
