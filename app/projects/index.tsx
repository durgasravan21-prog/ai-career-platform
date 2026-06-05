import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

type DifficultyFilter = "all" | "beginner" | "intermediate" | "advanced";

export default function ProjectsScreen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [searchText, setSearchText] = useState("");

  const { data: projects, isLoading } = trpc.projects.getAll.useQuery(
    { difficulty: difficulty === "all" ? undefined : difficulty },
    { enabled: isAuthenticated && !loading }
  );

  if (loading || !isAuthenticated) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  const filteredProjects = projects?.filter((p: any) =>
    p.title.toLowerCase().includes(searchText.toLowerCase())
  ) || [];

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Projects</Text>
          <Text className="text-muted mt-1">Build your portfolio with recommended projects</Text>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Search projects..."
            placeholderTextColor="#9BA1A6"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Difficulty Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6 -mx-6 px-6"
        >
          {(["all", "beginner", "intermediate", "advanced"] as const).map((level) => (
            <TouchableOpacity
              key={level}
              className={`px-4 py-2 rounded-full mr-2 border ${
                difficulty === level
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              }`}
              onPress={() => setDifficulty(level)}
            >
              <Text
                className={`font-medium capitalize ${
                  difficulty === level ? "text-white" : "text-foreground"
                }`}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Projects List */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0a7ea4" />
          </View>
        ) : filteredProjects.length > 0 ? (
          <FlatList
            data={filteredProjects}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ProjectListItem
                project={item}
                onPress={() => router.push(`/projects/${item.id}` as any)}
              />
            )}
            ItemSeparatorComponent={() => <View className="h-3" />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-muted text-center">No projects found</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

function ProjectListItem({
  project,
  onPress,
}: {
  project: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-lg p-4 active:opacity-70"
      onPress={onPress}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-foreground flex-1 mr-2">{project.title}</Text>
        <View className="bg-primary px-2 py-1 rounded">
          <Text className="text-xs text-white font-medium capitalize">{project.difficulty}</Text>
        </View>
      </View>

      {project.description && (
        <Text className="text-sm text-muted mb-3 leading-relaxed" numberOfLines={2}>
          {project.description}
        </Text>
      )}

      <View className="flex-row justify-between items-center">
        <View className="flex-row gap-2">
          {project.careerRelevance && (
            <View className="bg-success px-2 py-1 rounded">
              <Text className="text-xs text-white font-medium">
                {Math.round(project.careerRelevance)}% match
              </Text>
            </View>
          )}
        </View>
        {project.estimatedTime && (
          <Text className="text-xs text-muted">~{project.estimatedTime}h</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
