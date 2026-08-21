<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

definePageMeta({
  layout: "default",
});

const toast = useToast();
const router = useRouter();
const { user } = useAuth();

const currentStep = ref(1);

// Clé unique pour forcer le remontage propre de l'éditeur
const editorKey = ref(0);

const schema1 = z.object({
  titre: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(255),
});

type Schema1 = z.output<typeof schema1>;

const state1 = reactive<Partial<Schema1>>({
  titre: "",
});

async function onSubmitStep1(event: FormSubmitEvent<Schema1>) {
  // Incrémenter la clé pour un montage propre
  editorKey.value++;
  currentStep.value = 2;
}

const description = ref("");
const submitting = ref(false);

async function createModule() {
  if (!description.value || description.value.trim() === "") {
    toast.add({
      title: "Erreur",
      description: "Veuillez ajouter une description",
      color: "error",
    });
    return;
  }

  if (!user.value?.id_agent) {
    toast.add({
      title: "Erreur",
      description: "Vous devez être connecté pour créer un module",
      color: "error",
    });
    return;
  }

  submitting.value = true;

  try {
    const response = await $fetch("/api/module/create", {
      method: "POST",
      body: {
        titre: state1.titre,
        description: description.value,
        id_agent: user.value.id_agent,
      },
    });

    toast.add({
      title: "Succès",
      description: `Module « ${state1.titre} » créé`,
      color: "success",
    });

    router.push(`/modules/edit/${response.id_module}`);
  } catch (err: any) { 

    const message =
      err?.data?.message || err?.statusMessage || err?.message || "";

    toast.add({
      title: "Erreur",
      description: message || "Impossible de créer le module",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  router.push("/modules");
}

function goBack() {
  currentStep.value = 1;
  // Réinitialiser pour le prochain montage
  editorKey.value++;
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Créer un nouveau module">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            @click="currentStep === 1 ? cancel() : goBack()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-5xl mx-auto py-8">
        <!-- Indicateur d'étapes -->
        <div class="mb-8">
          <div class="flex items-center justify-center gap-4">
            <div class="flex items-center">
              <div
                class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all"
                :class="
                  currentStep === 1
                    ? 'border-primary bg-primary text-white'
                    : 'border-success bg-success text-white'
                "
              >
                <UIcon
                  v-if="currentStep > 1"
                  name="i-lucide-check"
                  class="text-xl"
                />
                <span v-else class="font-semibold">1</span>
              </div>
              <span
                class="ml-2 text-sm font-medium"
                :class="currentStep === 1 ? 'text-primary' : 'text-muted'"
              >
                Informations
              </span>
            </div>

            <div
              class="w-24 h-0.5"
              :class="currentStep > 1 ? 'bg-success' : 'bg-default'"
            />

            <div class="flex items-center">
              <div
                class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all"
                :class="
                  currentStep === 2
                    ? 'border-primary bg-primary text-white'
                    : 'border-default bg-elevated text-muted'
                "
              >
                <span class="font-semibold">2</span>
              </div>
              <span
                class="ml-2 text-sm font-medium"
                :class="currentStep === 2 ? 'text-primary' : 'text-muted'"
              >
                Description
              </span>
            </div>
          </div>
        </div>

        <!-- Étape 1 -->
        <div
          v-if="currentStep === 1"
          class="bg-elevated border border-default rounded-lg p-6 space-y-6"
        >
          <div>
            <h2 class="text-2xl font-bold mb-2">Informations de base</h2>
            <p class="text-muted">
              Commencez par définir le titre de votre module.
            </p>
          </div>

          <UForm
            :schema="schema1"
            :state="state1"
            class="space-y-6"
            @submit="onSubmitStep1"
          >
            <UFormField label="Titre du module" name="titre" required>
              <UInput
                v-model="state1.titre"
                placeholder="Ex: Introduction à la gestion de projet"
                size="xl"
              />
            </UFormField>

            <div class="flex justify-end gap-3 pt-6 border-t border-default">
              <UButton
                label="Annuler"
                color="neutral"
                variant="subtle"
                @click="cancel"
              />
              <UButton
                label="Suivant"
                type="submit"
                color="primary"
                icon="i-lucide-arrow-right"
                trailing
              />
            </div>
          </UForm>
        </div>

        <!-- Étape 2 -->
        <div
          v-if="currentStep === 2"
          class="bg-elevated border border-default rounded-lg overflow-hidden"
        >
          <div class="p-6 border-b border-default">
            <h2 class="text-2xl font-bold mb-2">Description du module</h2>
            <p class="text-muted">
              Rédigez une description complète et attractive de votre module.
            </p>
          </div>

          <!-- Utiliser :key pour forcer un remontage propre -->
          <ModulesCreateEditor
            :key="editorKey"
            v-model="description"
            module-id="temp"
          />

          <div class="flex justify-between p-6 border-t border-default">
            <UButton
              label="Précédent"
              color="neutral"
              variant="outline"
              icon="i-lucide-arrow-left"
              :disabled="submitting"
              @click="goBack"
            />
            <UButton
              label="Créer le module"
              color="primary"
              icon="i-lucide-check"
              trailing
              :loading="submitting"
              @click="createModule"
            />
          </div>
        </div>

        <!-- Info box -->
        <div
          v-if="currentStep === 1"
          class="mt-6 bg-primary/10 border border-primary/20 rounded-lg p-4"
        >
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-info" class="text-primary mt-0.5 shrink-0" />
            <div class="text-sm">
              <p class="font-medium mb-1">Prochaines étapes</p>
              <p class="text-muted">
                Après la création, vous serez redirigé vers l'éditeur complet où vous pourrez :
              </p>
              <ul class="list-disc pl-5 mt-2 space-y-1 text-muted">
                <li>Compléter les détails (catégories, services, documents)</li>
                <li>Ajouter et organiser les cours</li>
                <li>Créer les quiz pour chaque cours</li>
                <li>Publier le module</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
