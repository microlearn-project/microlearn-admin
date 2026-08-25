<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Agent = Tables<"agent">;

const emit = defineEmits<{
  (e: "restored"): void;
}>();

const toast = useToast();
const open = ref(false);

const archived = ref<Agent[]>([]);
const loadingList = ref(false);
const restoringId = ref<string | null>(null);

// Édition d'email inline — un seul agent édité à la fois.
const editingId = ref<string | null>(null);
const editedEmail = ref("");
const savingEmail = ref(false);

async function loadArchived() {
  loadingList.value = true;
  try {
    archived.value = await $fetch<Agent[]>("/api/agent/archived");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description:
        err?.data?.statusMessage ||
        "Impossible de charger les agents archivés",
      color: "error",
    });
  } finally {
    loadingList.value = false;
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    editingId.value = null;
    loadArchived();
  }
});

async function restore(agent: Agent) {
  restoringId.value = agent.id_agent;
  try {
    await $fetch(`/api/agent/${agent.id_agent}/restore`, {
      method: "PATCH",
    });
    archived.value = archived.value.filter(
      (a) => a.id_agent !== agent.id_agent,
    );
    toast.add({
      title: "Agent restauré",
      description: `${agent.prenom} ${agent.nom} est de nouveau actif`,
      color: "success",
    });
    emit("restored");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description:
        err?.data?.statusMessage || "Impossible de restaurer l'agent",
      color: "error",
    });
  } finally {
    restoringId.value = null;
  }
}

function startEditEmail(agent: Agent) {
  editingId.value = agent.id_agent;
  editedEmail.value = agent.email;
}

function cancelEditEmail() {
  editingId.value = null;
  editedEmail.value = "";
}

async function saveEmail(agent: Agent) {
  if (!editedEmail.value.trim()) {
    toast.add({
      title: "Erreur",
      description: "L'email ne peut pas être vide",
      color: "error",
    });
    return;
  }

  savingEmail.value = true;
  try {
    const updated = await $fetch<Agent>(
      `/api/agent/${agent.id_agent}/archived-email`,
      { method: "PATCH", body: { email: editedEmail.value.trim() } },
    );
    archived.value = archived.value.map((a) =>
      a.id_agent === agent.id_agent ? updated : a,
    );
    toast.add({ title: "Email modifié" });
    editingId.value = null;
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description:
        err?.data?.statusMessage || "Impossible de modifier l'email",
      color: "error",
    });
  } finally {
    savingEmail.value = false;
  }
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
</script>

<template>
  <div @click="open = true">
    <slot />
  </div>

  <UModal
    v-model:open="open"
    title="Agents archivés"
    description="Agents supprimés — restaurer ou libérer leur email pour réutilisation"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div v-if="loadingList" class="py-8 text-center text-muted">
        Chargement...
      </div>

      <div
        v-else-if="archived.length === 0"
        class="py-8 text-center text-muted"
      >
        Aucun agent archivé
      </div>

      <div v-else class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-for="agent in archived"
          :key="agent.id_agent"
          class="p-3 bg-muted/20 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium shrink-0"
            >
              {{ agent.prenom[0] }}{{ agent.nom[0] }}
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">
                {{ agent.prenom }} {{ agent.nom }}
              </p>

              <div v-if="editingId === agent.id_agent" class="flex items-center gap-2 mt-1">
                <UInput
                  v-model="editedEmail"
                  type="email"
                  size="xs"
                  class="flex-1"
                  :disabled="savingEmail"
                />
                <UButton
                  icon="i-lucide-check"
                  size="xs"
                  color="success"
                  variant="soft"
                  :loading="savingEmail"
                  @click="saveEmail(agent)"
                />
                <UButton
                  icon="i-lucide-x"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  :disabled="savingEmail"
                  @click="cancelEditEmail"
                />
              </div>
              <p v-else class="text-xs text-muted truncate">
                {{ agent.email }}
              </p>

              <p class="text-xs text-muted mt-0.5">
                Supprimé le {{ formatDate(agent.deleted_at) }}
              </p>
            </div>

            <div v-if="editingId !== agent.id_agent" class="flex items-center gap-2 shrink-0">
              <UButton
                label="Modifier l'email"
                icon="i-lucide-mail"
                size="xs"
                color="neutral"
                variant="outline"
                :disabled="restoringId === agent.id_agent"
                @click="startEditEmail(agent)"
              />
              <UButton
                label="Restaurer"
                icon="i-lucide-rotate-ccw"
                size="xs"
                color="success"
                variant="soft"
                :loading="restoringId === agent.id_agent"
                @click="restore(agent)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton label="Fermer" color="neutral" variant="outline" @click="open = false" />
      </div>
    </template>
  </UModal>
</template>
