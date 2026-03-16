import { updateConversation } from '../state.ts';
import { getTemplate } from '../templates.ts';
import { parsePopularCarsSelection, parseSalaryLevel } from '../parser.ts';
import { Language } from '../types.ts';
import { HandlerContext, HandlerResult } from './types.ts';

export async function handlePopularCarsSelection(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  const selection = parsePopularCarsSelection(message);
  if (selection === 'eligibility') {
    const newState = 'asking_popular_eligibility';
    await updateConversation(conversation.id, { state: newState }, supabase);
    return {
      response: {
        message: getTemplate('asking_popular_eligibility', language),
        intent: classification.intent,
        language,
        conversation_id: conversation.id,
        state: newState,
      },
    };
  } else if (selection === 'models') {
    const newState = 'showing_popular_models';
    await updateConversation(conversation.id, { state: newState }, supabase);

    // Show popular car models info
    const popularModelsInfo: Record<Language, string> = {
      french: `**Modèles de voitures populaires disponibles en Tunisie**

Les véhicules populaires sont des voitures subventionnées pour les ménages à revenus modestes.

**Modèles actuellement disponibles:**
- Fiat Punto
- Renault Symbol
- Hyundai Grand i10
- Kia Picanto

**Prix indicatifs:**
- 20,000 - 35,000 TND (avec subvention)

**Où acheter:**
- Concessionnaires officiels agréés
- Inscription via le programme national

Voulez-vous chercher une voiture?
1. Oui
2. Non, retour au menu`,
      arabic: `**موديلات السيارات الشعبية المتاحة في تونس**

السيارات الشعبية هي سيارات مدعومة للعائلات ذات الدخل المحدود.

**الموديلات المتاحة حالياً:**
- Fiat Punto
- Renault Symbol
- Hyundai Grand i10
- Kia Picanto

**الأسعار التقريبية:**
- 20,000 - 35,000 دينار (مع الدعم)

**أين تشتري:**
- الوكلاء الرسميون المعتمدون
- التسجيل عبر البرنامج الوطني

تحب تلقى كرهبة؟
1. نعم
2. لا، رجوع للقائمة`,
      derja: `**موديلات الكراهب الشعبية الموجودة في تونس**

الكراهب الشعبية هي كراهب مدعومة للعايلات اللي دخلها محدود.

**الموديلات الموجودة:**
- Fiat Punto
- Renault Symbol
- Hyundai Grand i10
- Kia Picanto

**الأسعار:**
- 20,000 - 35,000 دينار (مع الدعم)

**وين تشري:**
- الوكلاء الرسميين
- التسجيل في البرنامج الوطني

تحب تلقى كرهبة؟
1. إيه
2. لا، نرجع للقائمة`,
    };

    return {
      response: {
        message: popularModelsInfo[language],
        intent: classification.intent,
        language,
        conversation_id: conversation.id,
        state: newState,
      },
    };
  }

  return {
    response: {
      message: getTemplate('popular_cars_selection', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}

export async function handleAskingPopularEligibility(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  const salaryLevel = parseSalaryLevel(message);
  if (salaryLevel === 'eligible') {
    const eligibleMessage: Record<Language, string> = {
      french: `✅ **Vous êtes potentiellement éligible!**

Prochaines étapes:
1. Préparez vos documents (carte d'identité, fiche de paie, attestation de non-possession)
2. Rendez-vous à un concessionnaire agréé
3. Soumettez votre dossier au programme national

Voulez-vous chercher une voiture maintenant?
1. Oui
2. Non, retour au menu`,
      arabic: `✅ **أنت مؤهل على الأرجح!**

الخطوات القادمة:
1. جهز وثائقك (بطاقة هوية، كشف راتب، شهادة عدم امتلاك)
2. روح لوكيل معتمد
3. قدم ملفك للبرنامج الوطني

تحب تلقى كرهبة توا؟
1. نعم
2. لا، رجوع للقائمة`,
      derja: `✅ **عندك الحق على الأرجح!**

شنو تعمل:
1. جهز الورق (كارت، فيش دي باي، شهادة ما عندكش كرهبة)
2. روح لوكيل رسمي
3. قدم الملف للبرنامج

تحب تلقى كرهبة توا؟
1. إيه
2. لا، نرجع للقائمة`,
    };
    const newState = 'showing_popular_models';
    await updateConversation(conversation.id, { state: newState }, supabase);
    return {
      response: {
        message: eligibleMessage[language],
        intent: classification.intent,
        language,
        conversation_id: conversation.id,
        state: newState,
      },
    };
  } else if (salaryLevel === 'not_eligible') {
    const notEligibleMessage: Record<Language, string> = {
      french: `❌ **Malheureusement, vous n'êtes pas éligible aux voitures populaires.**

Le programme est réservé aux ménages avec un revenu mensuel ≤10x SMIG (~5,283 TND) pour les célibataires ou ≤15x SMIG (~7,889 TND) pour les couples.

Alternatives:
- Chercher une voiture d'occasion économique
- Explorer les offres FCR si vous avez un proche TRE`,
      arabic: `❌ **للأسف، أنت غير مؤهل للسيارات الشعبية.**

البرنامج مخصص للأفراد بدخل ≤10x SMIG (~5,283 دينار) أو للأزواج بدخل ≤15x SMIG (~7,889 دينار).

بدائل:
- ابحث عن سيارة مستعملة اقتصادية
- استكشف عروض FCR إذا عندك قريب TRE`,
      derja: `❌ **للأسف، ما عندكش الحق في الكراهب الشعبية.**

البرنامج للأعزب بخلاص ≤5,283 دينار أو للمتزوج بخلاص ≤7,889 دينار في الشهر.

بدائل:
- لوج على كرهبة مستعملة رخيصة
- شوف FCR إذا عندك حد من عايلتك TRE`,
    };
    const newState = 'goal_selection';
    await updateConversation(conversation.id, { state: newState }, supabase);
    return {
      response: {
        message: notEligibleMessage[language] + '\n\n' + getTemplate('goal_selection', language),
        intent: classification.intent,
        language,
        conversation_id: conversation.id,
        state: newState,
      },
    };
  }

  return {
    response: {
      message: getTemplate('asking_popular_eligibility', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}
