import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

type OnboardingStep = "welcome" | "name" | "role" | "skills" | "confirm";

interface OnboardingData {
  name: string;
  targetRoleId: number;
  targetRoleName: string;
  skills: Array<{ skillId: number; skillName: string; proficiency: string }>;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [data, setData] = useState<OnboardingData>({
    name: "",
    targetRoleId: 0,
    targetRoleName: "",
    skills: [],
  });

  const { data: rolesData, isLoading: rolesLoading } = trpc.career.getRoles.useQuery();
  const { data: skillsData, isLoading: skillsLoading } = trpc.skills.getAll.useQuery();

  const updateSkillsMutation = trpc.users.updateSkills.useMutation();
  const updateProfileMutation = trpc.users.updateProfile.useMutation();
  const generateRoadmapMutation = trpc.career.generateRoadmap.useMutation();

  const handleNameSubmit = () => {
    if (data.name.trim().length < 2) {
      alert("Please enter a valid name");
      return;
    }
    setStep("role");
  };

  const handleRoleSelect = (roleId: number, roleName: string) => {
    setData({ ...data, targetRoleId: roleId, targetRoleName: roleName });
    setStep("skills");
  };

  const handleSkillToggle = (skillId: number, skillName: string) => {
    const exists = data.skills.find((s) => s.skillId === skillId);
    if (exists) {
      setData({
        ...data,
        skills: data.skills.filter((s) => s.skillId !== skillId),
      });
    } else {
      setData({
        ...data,
        skills: [...data.skills, { skillId, skillName, proficiency: "intermediate" }],
      });
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      // Update user profile
      await updateProfileMutation.mutateAsync({
        currentRole: "Student",
      });

      // Update user skills
      await updateSkillsMutation.mutateAsync(
        data.skills.map((s) => ({
          skillId: s.skillId,
          proficiencyLevel: s.proficiency as "beginner" | "intermediate" | "advanced",
        }))
      );

      // Generate career roadmap with the selected target role
      await generateRoadmapMutation.mutateAsync({
        targetRoleId: data.targetRoleId,
      });

      // Navigate to dashboard (which now has roadmap data)
      router.replace("/dashboard" as any);
    } catch (error) {
      alert("Error completing onboarding. Please try again.");
      console.error(error);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        {step === "welcome" && <WelcomeStep onNext={() => setStep("name")} />}

        {step === "name" && (
          <NameStep
            name={data.name}
            onNameChange={(name) => setData({ ...data, name })}
            onNext={handleNameSubmit}
          />
        )}

        {step === "role" && (
          <RoleStep
            roles={rolesData || []}
            isLoading={rolesLoading}
            onRoleSelect={handleRoleSelect}
            onBack={() => setStep("name")}
          />
        )}

        {step === "skills" && (
          <SkillsStep
            skills={skillsData || []}
            selectedSkills={data.skills}
            isLoading={skillsLoading}
            onSkillToggle={handleSkillToggle}
            onNext={() => setStep("confirm")}
            onBack={() => setStep("role")}
          />
        )}

        {step === "confirm" && (
          <ConfirmStep
            data={data}
            isLoading={updateSkillsMutation.isPending || updateProfileMutation.isPending}
            onConfirm={handleCompleteOnboarding}
            onBack={() => setStep("skills")}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View className="flex-1 justify-center items-center px-6 gap-6">
      <Text className="text-4xl font-bold text-foreground text-center">Welcome!</Text>
      <Text className="text-lg text-muted text-center">
        Let's help you build your career path with personalized learning recommendations.
      </Text>
      <TouchableOpacity
        className="bg-primary px-8 py-4 rounded-full w-full items-center"
        onPress={onNext}
      >
        <Text className="text-white font-semibold text-lg">Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

function NameStep({
  name,
  onNameChange,
  onNext,
}: {
  name: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
}) {
  return (
    <View className="flex-1 justify-center px-6 gap-6">
      <Text className="text-3xl font-bold text-foreground">What's your name?</Text>
      <TextInput
        className="border border-border rounded-lg px-4 py-3 text-foreground text-lg"
        placeholder="Enter your name"
        placeholderTextColor="#9BA1A6"
        value={name}
        onChangeText={onNameChange}
      />
      <TouchableOpacity
        className="bg-primary px-8 py-4 rounded-full items-center"
        onPress={onNext}
      >
        <Text className="text-white font-semibold text-lg">Next</Text>
      </TouchableOpacity>
    </View>
  );
}

function RoleStep({
  roles,
  isLoading,
  onRoleSelect,
  onBack,
}: {
  roles: any[];
  isLoading: boolean;
  onRoleSelect: (roleId: number, roleName: string) => void;
  onBack: () => void;
}) {
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View className="flex-1 px-6 gap-4">
      <Text className="text-3xl font-bold text-foreground mt-6">What's your dream role?</Text>
      <Text className="text-muted mb-4">Select a career path to get started</Text>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {roles.map((role: any) => (
          <TouchableOpacity
            key={role.id}
            className="bg-surface border border-border rounded-lg p-4 mb-3"
            onPress={() => onRoleSelect(role.id, role.title)}
          >
            <Text className="text-lg font-semibold text-foreground">{role.title}</Text>
            <Text className="text-sm text-muted mt-1">{role.seniority} level</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        className="border border-border px-8 py-4 rounded-full items-center mb-4"
        onPress={onBack}
      >
        <Text className="text-foreground font-semibold">Back</Text>
      </TouchableOpacity>
    </View>
  );
}

function SkillsStep({
  skills,
  selectedSkills,
  isLoading,
  onSkillToggle,
  onNext,
  onBack,
}: {
  skills: any[];
  selectedSkills: any[];
  isLoading: boolean;
  onSkillToggle: (skillId: number, skillName: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View className="flex-1 px-6 gap-4">
      <Text className="text-3xl font-bold text-foreground mt-6">What skills do you have?</Text>
      <Text className="text-muted mb-2">Select all that apply ({selectedSkills.length} selected)</Text>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {skills.map((skill: any) => {
          const isSelected = selectedSkills.some((s) => s.skillId === skill.id);
          return (
            <TouchableOpacity
              key={skill.id}
              className={`rounded-lg p-3 mb-2 border ${
                isSelected ? "bg-primary border-primary" : "bg-surface border-border"
              }`}
              onPress={() => onSkillToggle(skill.id, skill.name)}
            >
              <Text className={`font-medium ${isSelected ? "text-white" : "text-foreground"}`}>
                {skill.name}
              </Text>
              <Text className={`text-xs ${isSelected ? "text-white" : "text-muted"}`}>
                {skill.category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="gap-3 mb-4">
        <TouchableOpacity
          className="bg-primary px-8 py-4 rounded-full items-center"
          onPress={onNext}
          disabled={selectedSkills.length === 0}
        >
          <Text className="text-white font-semibold">Next</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="border border-border px-8 py-4 rounded-full items-center"
          onPress={onBack}
        >
          <Text className="text-foreground font-semibold">Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ConfirmStep({
  data,
  isLoading,
  onConfirm,
  onBack,
}: {
  data: OnboardingData;
  isLoading: boolean;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <View className="flex-1 px-6 gap-6 justify-center">
      <Text className="text-3xl font-bold text-foreground">Let's confirm</Text>

      <View className="bg-surface border border-border rounded-lg p-4 gap-4">
        <View>
          <Text className="text-sm text-muted">Name</Text>
          <Text className="text-lg font-semibold text-foreground">{data.name}</Text>
        </View>

        <View>
          <Text className="text-sm text-muted">Dream Role</Text>
          <Text className="text-lg font-semibold text-foreground">{data.targetRoleName}</Text>
        </View>

        <View>
          <Text className="text-sm text-muted">Current Skills ({data.skills.length})</Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {data.skills.map((skill) => (
              <View key={skill.skillId} className="bg-primary rounded-full px-3 py-1">
                <Text className="text-white text-xs font-medium">{skill.skillName}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className="gap-3">
        <TouchableOpacity
          className="bg-primary px-8 py-4 rounded-full items-center"
          onPress={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Start Learning</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="border border-border px-8 py-4 rounded-full items-center"
          onPress={onBack}
          disabled={isLoading}
        >
          <Text className="text-foreground font-semibold">Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
