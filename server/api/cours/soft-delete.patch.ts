// server/api/cours/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

const BUCKET_NAME_IMAGES = "cours-images";
const BUCKET_NAME_VIDEOS = "cours-videos";

async function deleteCoursImages(
  coursId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<void> {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME_IMAGES)
      .list(coursId);

    if (listError || !files || files.length === 0) return;

    const filePaths = files.map((f) => `${coursId}/${f.name}`);
    await supabase.storage.from(BUCKET_NAME_IMAGES).remove(filePaths);
  } catch {
    //
  }
}

async function deleteCoursVideos(
  description: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<void> {
  try {
    const regex = new RegExp(
      `src=["'](https?://[^"']*${BUCKET_NAME_VIDEOS}[^"']*)["']`,
      "gi"
    );

    const urls: string[] = [];
    let match;
    while ((match = regex.exec(description)) !== null) {
      urls.push(match[1]);
    }

    if (urls.length === 0) return;

    const filePaths: string[] = [];
    for (const url of urls) {
      const pathRegex = new RegExp(`${BUCKET_NAME_VIDEOS}/(.+)$`);
      const pathMatch = url.match(pathRegex);
      if (pathMatch) filePaths.push(pathMatch[1]);
    }

    if (filePaths.length === 0) return;

    await supabase.storage.from(BUCKET_NAME_VIDEOS).remove(filePaths);
  } catch {
    //
  }
}

async function hardDeleteQuizData(
  quizId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<void> {
  // Récupérer toutes les questions du quiz
  const { data: questions } = await supabase
    .from("question")
    .select("id_question")
    .eq("id_quiz", quizId);

  if (questions && questions.length > 0) {
    const questionIds = questions.map((q) => q.id_question);

    // 1. Supprimer reponse_agent liées à ces questions
    await supabase
      .from("reponse_agent")
      .delete()
      .in("id_question", questionIds);

    // 2. Supprimer reponse liées à ces questions
    await supabase
      .from("reponse")
      .delete()
      .in("id_question", questionIds);

    // 3. Supprimer les questions
    await supabase
      .from("question")
      .delete()
      .in("id_question", questionIds);
  }

  // 4. Supprimer resultat_quiz (par sécurité, normalement vide ici)
  await supabase
    .from("resultat_quiz")
    .delete()
    .eq("id_quiz", quizId);

  // 5. Supprimer le quiz
  await supabase
    .from("quiz")
    .delete()
    .eq("id_quiz", quizId);
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du cours requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer le cours
  const { data: cours, error: fetchError } = await supabase
    .from("cours")
    .select("id_cours, id_module, ordre, description")
    .eq("id_cours", id)
    .is("deleted_at", null)
    .single();

  if (fetchError || !cours) {
    throw createError({
      statusCode: 404,
      statusMessage: "Cours non trouvé",
    });
  }

  // Vérifier si un quiz est lié à ce cours
  const { data: quiz } = await supabase
    .from("quiz")
    .select("id_quiz")
    .eq("id_cours", id)
    .maybeSingle();

  if (quiz) {
    // Vérifier si des agents ont des résultats pour ce quiz
    const { data: resultats } = await supabase
      .from("resultat_quiz")
      .select("id_agent")
      .eq("id_quiz", quiz.id_quiz)
      .limit(1);

    const hasResultats = resultats && resultats.length > 0;

    if (!hasResultats) {
      // Hard delete de toutes les données quiz (questions, réponses, résultats, quiz)
      await hardDeleteQuizData(quiz.id_quiz, supabase);
    }
    // Si hasResultats → on laisse tout en place pour préserver les stats
    // Le soft-delete du cours suffit, le quiz devient orphelin mais ses données restent consultables
  }

  // Supprimer les médias du bucket dans tous les cas
  await Promise.all([
    deleteCoursImages(cours.id_cours, supabase),
    deleteCoursVideos(cours.description || "", supabase),
  ]);

  // Soft-delete du cours avec ordre = NULL pour libérer le slot de contrainte unique
  const { error: deleteError } = await supabase
    .from("cours")
    .update({
      deleted_at: new Date().toISOString(),
      ordre: null,
    })
    .eq("id_cours", id);

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: deleteError.message,
    });
  }

  return {
    success: true,
    message: quiz
      ? "Cours supprimé avec ses données quiz"
      : "Cours supprimé",
  };
});
