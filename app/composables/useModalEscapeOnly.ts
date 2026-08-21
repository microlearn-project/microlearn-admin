// composables/useModalEscapeOnly.ts
//
// Certains modals (cours, quiz) contiennent des formulaires longs qu'un clic
// accidentel en dehors ne doit pas faire perdre — seuls Échap et le bouton de
// fermeture (X) doivent quitter. `dismissible: false` sur UModal bloque les
// deux à la fois (comportement groupé de Nuxt UI v4) ; on le combine avec un
// écouteur clavier manuel pour ne garder que le blocage du clic extérieur.
import type { Ref } from "vue";

export function useModalEscapeOnly(open: Ref<boolean>) {
  useEventListener(document, "keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && open.value) {
      open.value = false;
    }
  });
}
