import { ConversationState, Language, CarResult, ScoredCarResult, TaxBreakdown, FCRComparison, ProcedureType, EVTopic } from './types.ts';
import { EXCHANGE_RATE } from './config.ts';

type Templates = Record<ConversationState, Record<Language, string>>;

const TEMPLATES: Templates = {
  goal_selection: {
    french: `Bienvenue! Comment puis-je vous aider?
1. Acheter une voiture
2. Procédures FCR
3. Comparer des voitures
4. Infos véhicules électriques
5. Parcourir les offres
6. Voitures populaires (subventionnées)`,
    arabic: `مرحبا! كيف نقدر نساعدك؟
1. شراء سيارة
2. إجراءات FCR
3. مقارنة السيارات
4. معلومات السيارات الكهربائية
5. تصفح العروض
6. السيارات الشعبية (مدعومة)`,
    derja: `مرحبا! كيفاش نعاونك؟
1. تشري كرهبة
2. إجراءات FCR
3. تقارن كراهب
4. معلومات على الكهربائية
5. تشوف العروض
6. كراهب شعبية (مدعومة)`,
  },
  asking_car_origin: {
    french: 'D\'où vient la voiture? 1. En Tunisie  2. De l\'étranger (import)',
    arabic: 'الكرهبة منين؟ 1. من تونس  2. من الخارج (استيراد)',
    derja: 'الكرهبة منين؟ 1. من تونس  2. من برّا (توريد)',
  },
  asking_residency: {
    french: 'Vous êtes: 1. En Tunisie  2. À l\'étranger (TRE)',
    arabic: 'أنت: 1. في تونس  2. في الخارج',
    derja: 'وينك: 1. في تونس  2. في الخارج (TRE)',
  },
  asking_fcr_famille: {
    french: 'Avez-vous un membre de famille TRE? 1. Oui  2. Non',
    arabic: 'عندك فرد من العائلة في الخارج (TRE)؟ 1. نعم  2. لا',
    derja: 'عندك حد من عايلتك TRE؟ 1. إيه  2. لا',
  },
  asking_fuel_type: {
    french: `Type carburant?
1. Essence
2. Diesel
3. Hybride (non rechargeable)
4. Hybride rechargeable (PHEV)
5. Électrique
6. Peu importe`,
    arabic: `نوع الوقود؟
1. بنزين
2. ديزل
3. هجين (غير قابل للشحن)
4. هجين قابل للشحن (PHEV)
5. كهربائي
6. لا يهم`,
    derja: `شنوة الكاربيرون؟
1. بنزين
2. مازوط
3. هيبريد (ما يتشارجش)
4. هيبريد يتشارج (PHEV)
5. كهربائي
6. ما يهمش`,
  },
  asking_car_type: {
    french: 'Type véhicule? 1. SUV  2. Berline  3. Compact  4. Peu importe',
    arabic: 'نوع السيارة؟ 1. SUV  2. سيدان  3. مدمجة  4. لا يهم',
    derja: 'شنوة الكرهبة؟ 1. SUV  2. برلين  3. صغيرة  4. ما يهمش',
  },
  asking_condition: {
    french: 'Vous préférez: 1. Neuve  2. Occasion  3. Peu importe',
    arabic: 'تفضل: 1. جديدة  2. مستعملة  3. لا يهم',
    derja: 'تحب: 1. جديدة  2. مستعملة  3. ما يهمش',
  },
  asking_budget: {
    french: `Budget maximum?
1. 50k TND
2. 70k TND
3. 90k TND
4. 120k TND
5. 150k TND
6. 200k TND
7. 300k+ TND`,
    arabic: `الميزانية القصوى؟
1. 50 ألف
2. 70 ألف
3. 90 ألف
4. 120 ألف
5. 150 ألف
6. 200 ألف
7. +300 ألف`,
    derja: `قداش تحب تصرف ماكس؟
1. 50k
2. 70k
3. 90k
4. 120k
5. 150k
6. 200k
7. +300k`,
  },
  showing_cars: {
    french: '',
    arabic: '',
    derja: '',
  },
  // Cost calculator flow
  asking_calc_price: {
    french: 'Quel est le prix de la voiture en euros?',
    arabic: 'قداش سعر الكرهبة باليورو؟',
    derja: 'قداش السوم بالأورو؟',
  },
  asking_calc_engine: {
    french: `Quelle est la cylindrée?
1. Jusqu'à 1600 cc
2. 1601 - 2000 cc
3. Plus de 2000 cc`,
    arabic: `شنية السعة؟
1. حتى 1600 cc
2. 1601 - 2000 cc
3. أكثر من 2000 cc`,
    derja: `قداش السيلاندري؟
1. حتى 1600 cc
2. 1601 - 2000 cc
3. أكثر من 2000 cc`,
  },
  asking_calc_fuel: {
    french: `Type de carburant?
1. Essence
2. Diesel
3. Électrique`,
    arabic: `نوع الوقود؟
1. بنزين
2. ديزل
3. كهربائي`,
    derja: `شنوة الكاربيرون؟
1. بنزين
2. مازوط
3. كهربائي`,
  },
  showing_calculation: {
    french: '',
    arabic: '',
    derja: '',
  },
  // Procedure info flow
  procedure_info: {
    french: `Quelle procédure vous intéresse?
1. Import FCR TRE (Tunisiens à l'étranger)
2. FCR Famille (Article 55)`,
    arabic: `أي إجراء تحب تعرف عليه؟
1. استيراد FCR TRE (تونسيين في الخارج)
2. FCR عائلة (الفصل 55)`,
    derja: `شنو تحب تعرف؟
1. توريد TRE (للتوانسة برّا)
2. FCR عايلة (الفصل 55)`,
  },
  showing_procedure_detail: {
    french: '',
    arabic: '',
    derja: '',
  },
  // Compare cars flow
  car_comparison_input: {
    french: `Quelles voitures voulez-vous comparer?
(ex: Golf 2019 vs Clio 2020, ou "BMW X3 vs Audi Q5")`,
    arabic: `شنية الكراهب اللي تحب تقارنها؟
(مثال: Golf 2019 vs Clio 2020)`,
    derja: `شنو الكراهب اللي تحب تقارنهم؟
(مثلا: Golf 2019 vs Clio 2020)`,
  },
  showing_comparison: {
    french: '',
    arabic: '',
    derja: '',
  },
  // EV info flow
  ev_topic_selection: {
    french: `Quel sujet vous intéresse?
1. Différences Hybride/PHEV/Électrique
2. Nouvelle loi sur les véhicules électriques
3. Bornes de recharge en Tunisie
4. Panneaux solaires pour recharge`,
    arabic: `شنو الموضوع اللي يهمك؟
1. الفرق بين هيبريد/PHEV/كهربائية
2. القانون الجديد للسيارات الكهربائية
3. محطات الشحن في تونس
4. الألواح الشمسية للشحن`,
    derja: `شنو يهمك تعرف؟
1. شنو الفرق بين هيبريد/PHEV/كهربائية
2. القانون الجديد على الكهربائية
3. محطات الشحن في تونس
4. الپانو سولار للشحن`,
  },
  showing_ev_info: {
    french: '',
    arabic: '',
    derja: '',
  },
  // Browse offers flow (same as find_car)
  browse_origin_selection: {
    french: 'D\'où vient la voiture? 1. En Tunisie  2. De l\'étranger (import)',
    arabic: 'الكرهبة منين؟ 1. من تونس  2. من الخارج (استيراد)',
    derja: 'الكرهبة منين؟ 1. من تونس  2. من برّا (توريد)',
  },
  // Popular cars flow
  popular_cars_selection: {
    french: `Voitures populaires (subventionnées):
1. Vérifier mon éligibilité
2. Voir les modèles disponibles`,
    arabic: `السيارات الشعبية (مدعومة):
1. تثبت من أهليتك
2. شوف الموديلات المتاحة`,
    derja: `الكراهب الشعبية (مدعومة):
1. نشوف إذا عندي الحق
2. نشوف الموديلات الموجودة`,
  },
  asking_popular_eligibility: {
    french: `Pour les voitures populaires, vous devez:
- Être résident en Tunisie
- Revenu mensuel ≤10x SMIG célibataire (~5,283 TND) ou ≤15x SMIG couple (~7,889 TND)
- Ne pas avoir bénéficié d'une voiture populaire avant

Votre situation:
1. Célibataire avec revenu ≤5,283 TND/mois
2. Couple avec revenu ≤7,889 TND/mois
3. Revenu supérieur aux seuils`,
    arabic: `للسيارات الشعبية، لازم:
- ساكن في تونس
- الدخل الشهري ≤10x SMIG للأعزب (~5,283 دينار) أو ≤15x SMIG للمتزوج (~7,889 دينار)
- ما أخذتش سيارة شعبية قبل

وضعيتك:
1. أعزب بدخل ≤5,283 دينار/شهر
2. متزوج بدخل ≤7,889 دينار/شهر
3. دخل أعلى من الحدود`,
    derja: `للكراهب الشعبية، لازم:
- ساكن في تونس
- الخلاص الشهري ≤5,283 دينار (أعزب) أو ≤7,889 دينار (متزوج)
- ما خذيتش كرهبة شعبية قبل

وضعيتك:
1. أعزب وخلاصي ≤5,283 دينار/شهر
2. متزوج وخلاصي ≤7,889 دينار/شهر
3. خلاصي أكثر من الحدود`,
  },
  showing_popular_models: {
    french: '',
    arabic: '',
    derja: '',
  },
};

/**
 * Get template response for a state
 */
export function getTemplate(state: ConversationState, language: Language): string {
  return TEMPLATES[state]?.[language] || TEMPLATES[state]?.french || '';
}

/**
 * Get recommendation emoji based on strength
 */
function getRecommendationEmoji(strength: string): string {
  switch (strength) {
    case 'excellent':
      return '⭐⭐⭐';
    case 'good':
      return '⭐⭐';
    case 'fair':
      return '⭐';
    default:
      return '';
  }
}

/**
 * Format a single scored car result
 */
export function formatScoredCarResult(car: ScoredCarResult, rank: number, language: Language): string {
  const price = car.price_eur
    ? `${car.price_eur.toLocaleString()}€`
    : car.price_tnd
      ? `${car.price_tnd.toLocaleString()} TND`
      : '?';

  const totalTnd = car.estimated_total_tnd.toLocaleString();

  const fcrStatus = car.fcr_tre_eligible
    ? '✅ FCR TRE'
    : car.fcr_famille_eligible
      ? '✅ FCR Famille'
      : '';

  const mileage = car.mileage_km
    ? `${(car.mileage_km / 1000).toFixed(0)}k km`
    : 'Neuf';

  const scoreEmoji = getRecommendationEmoji(car.recommendation_strength);

  if (language === 'french') {
    return `${rank}. ${scoreEmoji} ${car.brand} ${car.model} (${car.year})
   💰 ${price} → ~${totalTnd} TND
   ${car.fuel_type} | ${mileage} ${fcrStatus ? `| ${fcrStatus}` : ''}`;
  }

  // Arabic/Derja format
  return `${rank}. ${scoreEmoji} ${car.brand} ${car.model} (${car.year})
   💰 ${price} → ~${totalTnd} TND
   ${car.fuel_type} | ${mileage} ${fcrStatus ? `| ${fcrStatus}` : ''}`;
}

/**
 * Format a single car result (legacy, unscored)
 */
export function formatCarResult(car: CarResult, rank: number, language: Language): string {
  const price = car.price_eur
    ? `${car.price_eur.toLocaleString()}€`
    : car.price_tnd
      ? `${car.price_tnd.toLocaleString()} TND`
      : '?';

  const totalTnd = car.price_eur
    ? Math.round(car.price_eur * EXCHANGE_RATE.effective_rate * 1.5).toLocaleString()
    : car.price_tnd?.toLocaleString() || '?';

  const fcrStatus = car.fcr_tre_eligible
    ? '✅ FCR TRE'
    : car.fcr_famille_eligible
      ? '✅ FCR Famille'
      : '❌ Non FCR';

  const mileage = car.mileage_km
    ? `${(car.mileage_km / 1000).toFixed(0)}k km`
    : 'Neuf';

  if (language === 'french') {
    return `${rank}. ${car.brand} ${car.model} (${car.year}) 💰 ${price} → ~${totalTnd} TND
   ${car.fuel_type} | ${mileage} | ${fcrStatus}`;
  }

  // Arabic/Derja format
  return `${rank}. ${car.brand} ${car.model} (${car.year}) 💰 ${price} → ~${totalTnd} TND
   ${car.fuel_type} | ${mileage} | ${fcrStatus}`;
}

/**
 * Format multiple scored car results with recommendations
 */
export function formatScoredCarResults(cars: ScoredCarResult[], language: Language): string {
  if (cars.length === 0) {
    const noResults: Record<Language, string> = {
      french: '❌ Aucune voiture trouvée avec vos critères. Essayez de modifier vos préférences.',
      arabic: '❌ لم يتم العثور على سيارات بمعاييرك. جرب تعديل تفضيلاتك.',
      derja: '❌ ما لقيت حتى كرهبة بالمعايير متاعك. جرب بدّل الخيارات.',
    };
    return noResults[language];
  }

  const headers: Record<Language, string> = {
    french: '🎯 Meilleures recommandations pour vous:',
    arabic: '🎯 أفضل التوصيات لك:',
    derja: '🎯 أحسن الاقتراحات ليك:',
  };

  const legendFr = `\n(⭐⭐⭐ Excellent | ⭐⭐ Bon | ⭐ Correct)`;
  const legendAr = `\n(⭐⭐⭐ ممتاز | ⭐⭐ جيد | ⭐ مقبول)`;

  const legend = language === 'french' ? legendFr : legendAr;

  const carLines = cars.slice(0, 5).map((car, i) => formatScoredCarResult(car, i + 1, language));

  return `${headers[language]}${legend}\n\n${carLines.join('\n\n')}`;
}

/**
 * Format multiple car results (legacy)
 */
export function formatCarResults(cars: CarResult[], language: Language): string {
  if (cars.length === 0) {
    const noResults: Record<Language, string> = {
      french: '❌ Aucune voiture trouvée. Essayez un budget plus élevé.',
      arabic: '❌ لم يتم العثور على سيارات. جرب ميزانية أعلى.',
      derja: '❌ ما لقيت حتى كرهبة. جرب بميزانية أكبر.',
    };
    return noResults[language];
  }

  const header: Record<Language, string> = {
    french: `🚗 ${cars.length} voiture(s) trouvée(s):`,
    arabic: `🚗 تم العثور على ${cars.length} سيارة:`,
    derja: `🚗 لقيت ${cars.length} كرهبة:`,
  };

  const carLines = cars.slice(0, 3).map((car, i) => formatCarResult(car, i + 1, language));

  return `${header[language]}\n${carLines.join('\n')}`;
}

/**
 * Format calculation result with transition question
 */
export function formatCalculationResult(
  calculation: TaxBreakdown | FCRComparison,
  language: Language
): string {
  const isFcrComparison = 'regime_commun' in calculation;

  let result: string;

  if (isFcrComparison) {
    const comp = calculation as FCRComparison;
    if (language === 'french') {
      result = `**Estimation des coûts d'importation**

**Régime Commun**: ${comp.regime_commun.final_price.toLocaleString()} TND`;

      if (comp.fcr_tre) {
        result += `\n**FCR TRE**: ${comp.fcr_tre.final_price.toLocaleString()} TND`;
      }
      if (comp.fcr_famille) {
        result += `\n**FCR Famille**: ${comp.fcr_famille.final_price.toLocaleString()} TND`;
      }

      result += `\n\n**Recommandation**: ${comp.recommended}`;
      if (comp.savings > 0) {
        result += ` (économie de ${comp.savings.toLocaleString()} TND)`;
      }
    } else {
      result = `**تقدير تكاليف الاستيراد**

**النظام العام**: ${comp.regime_commun.final_price.toLocaleString()} TND`;

      if (comp.fcr_tre) {
        result += `\n**FCR TRE**: ${comp.fcr_tre.final_price.toLocaleString()} TND`;
      }
      if (comp.fcr_famille) {
        result += `\n**FCR عائلة**: ${comp.fcr_famille.final_price.toLocaleString()} TND`;
      }

      result += `\n\n**التوصية**: ${comp.recommended}`;
      if (comp.savings > 0) {
        result += ` (وفر ${comp.savings.toLocaleString()} TND)`;
      }
    }
  } else {
    const breakdown = calculation as TaxBreakdown;
    if (language === 'french') {
      result = `**Estimation des coûts**

- Valeur CIF: ${breakdown.cif.toLocaleString()} TND
- Droits de douane: ${breakdown.droits_douane.toLocaleString()} TND
- Taxe de consommation: ${breakdown.taxe_consommation.toLocaleString()} TND
- TVA: ${breakdown.tva.toLocaleString()} TND
- Total taxes: ${breakdown.total_taxes.toLocaleString()} TND

**Prix final estimé: ${breakdown.final_price.toLocaleString()} TND**
(Charge fiscale: ${breakdown.tax_burden_percent}%)`;
    } else {
      result = `**تقدير التكاليف**

- قيمة CIF: ${breakdown.cif.toLocaleString()} TND
- رسوم جمركية: ${breakdown.droits_douane.toLocaleString()} TND
- ضريبة استهلاك: ${breakdown.taxe_consommation.toLocaleString()} TND
- TVA: ${breakdown.tva.toLocaleString()} TND
- مجموع الضرائب: ${breakdown.total_taxes.toLocaleString()} TND

**السعر النهائي المقدر: ${breakdown.final_price.toLocaleString()} TND**
(العبء الضريبي: ${breakdown.tax_burden_percent}%)`;
    }
  }

  // Add transition question
  const transitionQuestion: Record<Language, string> = {
    french: `\n\nVoulez-vous chercher une voiture maintenant?
1. Oui
2. Non, retour au menu`,
    arabic: `\n\nتحب تلقى كرهبة توا؟
1. نعم
2. لا، رجوع للقائمة`,
    derja: `\n\nتحب تلقى كرهبة توا؟
1. إيه
2. لا، نرجع للقائمة`,
  };

  return result + transitionQuestion[language];
}

/**
 * Get procedure detail text
 */
export function getProcedureDetail(procedure: ProcedureType | null, language: Language): string {
  if (!procedure) return getTemplate('procedure_info', language);

  const details: Record<ProcedureType, Record<Language, string>> = {
    fcr_tre: {
      french: `**Import FCR TRE (Tunisiens à l'étranger)**

**Conditions d'éligibilité:**
- Avoir la nationalité tunisienne
- Résider à l'étranger depuis au moins 2 ans
- Ne pas avoir bénéficié de FCR dans les 5 dernières années

**Limites du véhicule:**
- Essence: max 2000 cc
- Diesel: max 2000 cc
- Électrique/Hybride rechargeable: pas de limite
- Âge max: 5 ans

**Avantages:**
- Paiement de seulement 25% des taxes
- Exonération partielle des droits de douane

**Documents requis:**
- Passeport tunisien
- Attestation de résidence à l'étranger
- Carte grise originale du véhicule`,
      arabic: `**استيراد FCR TRE (التونسيين بالخارج)**

**شروط الأهلية:**
- الجنسية التونسية
- الإقامة في الخارج لمدة سنتين على الأقل
- عدم الاستفادة من FCR خلال 5 سنوات الأخيرة

**حدود السيارة:**
- بنزين: أقصى 2000 cc
- ديزل: أقصى 2000 cc
- كهربائي/هجين قابل للشحن: بدون حدود
- العمر الأقصى: 5 سنوات

**المزايا:**
- دفع 25% فقط من الضرائب
- إعفاء جزئي من الرسوم الجمركية

**الوثائق المطلوبة:**
- جواز سفر تونسي
- شهادة إقامة بالخارج
- البطاقة الرمادية الأصلية للسيارة`,
      derja: `**توريد FCR TRE (للتوانسة برّا)**

**الشروط:**
- تونسي
- ساكن برّا 2 سنين على الأقل
- ما خذيتش FCR في 5 سنين الأخيرة

**حدود الكرهبة:**
- بنزين: ماكس 2000 cc
- مازوط: ماكس 2000 cc
- كهربائية/هيبريد يتشارج: بلا حدود
- العمر ماكس: 5 سنين

**الفوائد:**
- تخلص 25% برك من الضرائب
- إعفاء جزئي من الديوانة

**الورق اللازم:**
- باسبور تونسي
- شهادة إقامة من برّا
- الكارت قريز الأصلي`,
    },
    fcr_famille: {
      french: `**FCR Famille (Article 55)**

**Conditions d'éligibilité:**
- Être résident en Tunisie
- Avoir un parent direct TRE (père, mère, enfant, conjoint)
- Le TRE n'a pas utilisé son FCR

**Limites du véhicule:**
- Essence: max 1600 cc
- Diesel: max 1900 cc
- Électrique/Hybride rechargeable: pas de limite
- Âge max: 3 ans

**Avantages:**
- Taxe de consommation réduite à 10%
- TVA réduite à 7%

**Documents requis:**
- Livret de famille
- Attestation de résidence du TRE
- Engagement à ne pas vendre pendant 5 ans`,
      arabic: `**FCR عائلة (الفصل 55)**

**شروط الأهلية:**
- مقيم في تونس
- عندك قريب مباشر TRE (أب، أم، ولد، زوج/زوجة)
- الـ TRE ما استعملش الـ FCR متاعو

**حدود السيارة:**
- بنزين: أقصى 1600 cc
- ديزل: أقصى 1900 cc
- كهربائي/هجين قابل للشحن: بدون حدود
- العمر الأقصى: 3 سنوات

**المزايا:**
- ضريبة استهلاك مخفضة 10%
- TVA مخفضة 7%

**الوثائق المطلوبة:**
- دفتر العائلة
- شهادة إقامة الـ TRE
- التزام بعدم البيع لمدة 5 سنوات`,
      derja: `**FCR عايلة (الفصل 55)**

**الشروط:**
- ساكن في تونس
- عندك قريب TRE (بوك، أمك، ولدك، مرتك/راجلك)
- الـ TRE ما خذاش الـ FCR متاعو

**حدود الكرهبة:**
- بنزين: ماكس 1600 cc
- مازوط: ماكس 1900 cc
- كهربائية/هيبريد يتشارج: بلا حدود
- العمر ماكس: 3 سنين

**الفوائد:**
- ضريبة استهلاك 10% برك
- TVA 7% برك

**الورق اللازم:**
- دفتر عايلة
- شهادة إقامة الـ TRE
- التزام ما تبيعش الكرهبة 5 سنين`,
    },
  };

  const detail = details[procedure]?.[language] || details[procedure]?.french || '';

  // Add transition question
  const transitionQuestion: Record<Language, string> = {
    french: `\n\nVoulez-vous chercher une voiture maintenant?
1. Oui
2. Non, retour au menu`,
    arabic: `\n\nتحب تلقى كرهبة توا؟
1. نعم
2. لا، رجوع للقائمة`,
    derja: `\n\nتحب تلقى كرهبة توا؟
1. إيه
2. لا، نرجع للقائمة`,
  };

  return detail + transitionQuestion[language];
}

/**
 * Get EV topic detail text
 */
export function getEVTopicDetail(topic: EVTopic | null, language: Language): string {
  if (!topic) return getTemplate('ev_topic_selection', language);

  const details: Record<EVTopic, Record<Language, string>> = {
    hybrid_vs_ev: {
      french: `**Différences entre Hybride, PHEV et Électrique**

**Hybride (HEV)**
- Moteur essence + petit moteur électrique
- Batterie rechargée par freinage régénératif
- Pas besoin de prise électrique
- Économie: 15-25% de carburant
- Exemples: Toyota Yaris Hybrid, Honda Jazz

**Hybride Rechargeable (PHEV)**
- Moteur essence + moteur électrique plus puissant
- Batterie rechargeable sur prise
- 40-80 km en tout électrique
- Idéal pour trajets courts + longs voyages
- Exemples: Peugeot 3008 PHEV, BMW X1 PHEV

**100% Électrique (BEV)**
- Aucun moteur à combustion
- Rechargement uniquement électrique
- Autonomie: 200-500 km selon modèle
- Coût d'usage très bas
- Exemples: Tesla Model 3, MG4, BYD Atto 3`,
      arabic: `**الفرق بين هيبريد، PHEV وكهربائية**

**هيبريد (HEV)**
- موتور بنزين + موتور كهربائي صغير
- البطارية تتشحن من الفرملة
- ما يحتاجش بريزة كهرباء
- توفير: 15-25% من البنزين
- أمثلة: Toyota Yaris Hybrid, Honda Jazz

**هيبريد قابل للشحن (PHEV)**
- موتور بنزين + موتور كهربائي أقوى
- بطارية تتشحن من البريزة
- 40-80 كم كهربائي كامل
- مثالي للمسافات القصيرة + الطويلة
- أمثلة: Peugeot 3008 PHEV, BMW X1 PHEV

**كهربائية 100% (BEV)**
- بدون موتور احتراق
- شحن كهربائي فقط
- المدى: 200-500 كم حسب الموديل
- تكلفة استخدام منخفضة جداً
- أمثلة: Tesla Model 3, MG4, BYD Atto 3`,
      derja: `**الفرق بين هيبريد، PHEV وكهربائية**

**هيبريد (HEV)**
- موتور بنزين + موتور كهربائي صغير
- الباتري يتشارج من الفران
- ما يحتاجش پريز
- توفير: 15-25% من البنزين

**هيبريد يتشارج (PHEV)**
- موتور بنزين + موتور كهربائي أقوى
- الباتري يتشارج من الپريز
- 40-80 كم بالكهرباء
- باهي للمسافات القصيرة والطويلة

**كهربائية 100%**
- بلا موتور بنزين
- شحن كهربائي برك
- المدى: 200-500 كم
- التكلفة رخيصة برشا`,
    },
    ev_law: {
      french: `**Nouvelle loi sur les véhicules électriques en Tunisie**

**Avantages fiscaux (2024)**
- Exonération totale des droits de douane
- TVA réduite à 7% (au lieu de 19%)
- Pas de taxe de consommation
- Pas de TFD (vignette)

**Conditions**
- Véhicule 100% électrique ou hybride rechargeable
- Importation neuve ou occasion < 3 ans
- Homologation technique obligatoire

**Économies estimées**
- Sur un véhicule de 30,000€:
- Régime normal: ~75,000 TND de taxes
- Électrique: ~7,000 TND de taxes
- Économie: ~68,000 TND!

**Note importante**
Les avantages s'appliquent aussi bien en FCR TRE qu'en régime commun.`,
      arabic: `**القانون الجديد للسيارات الكهربائية في تونس**

**المزايا الجبائية (2024)**
- إعفاء كامل من الرسوم الجمركية
- TVA مخفضة إلى 7% (بدل 19%)
- بدون ضريبة استهلاك
- بدون فينيات

**الشروط**
- سيارة كهربائية 100% أو هيبريد قابل للشحن
- استيراد جديد أو مستعمل أقل من 3 سنوات
- المصادقة التقنية إلزامية

**التوفير المقدر**
- على سيارة بـ 30,000€:
- النظام العادي: ~75,000 دينار ضرائب
- كهربائية: ~7,000 دينار ضرائب
- توفير: ~68,000 دينار!`,
      derja: `**القانون الجديد على الكراهب الكهربائية في تونس**

**الفوائد الجبائية (2024)**
- معفي من الديوانة كامل
- TVA 7% برك (عوض 19%)
- بلا ضريبة استهلاك
- بلا فينيات

**الشروط**
- كرهبة كهربائية 100% ولا هيبريد يتشارج
- جديدة ولا مستعملة أقل من 3 سنين
- لازم المصادقة التقنية

**التوفير**
- على كرهبة بـ 30,000€:
- النظام العادي: ~75,000 دينار ضرائب
- كهربائية: ~7,000 دينار ضرائب
- توفير: ~68,000 دينار!`,
    },
    charging_stations: {
      french: `**Bornes de recharge en Tunisie**

**Réseau actuel**
- STEG: stations principales (Tunis, Sousse, Sfax)
- Total Energies: stations-service sélectionnées
- Hotels et centres commerciaux: bornes privées

**Types de charge**
- Lente (Type 2): 7-22 kW, 4-8h pour charge complète
- Rapide (DC): 50-150 kW, 30-60 min pour 80%

**Coût moyen**
- STEG: ~0.200 TND/kWh
- Privé: ~0.300-0.500 TND/kWh
- À domicile: ~0.180 TND/kWh (tarif nuit)

**Conseils**
- Installez une wallbox à domicile (2,000-4,000 TND)
- Utilisez l'app PlugShare pour trouver les bornes
- Planifiez les longs trajets à l'avance

**Développement prévu**
- 200+ bornes rapides d'ici 2025
- Autoroutes couvertes à 100%`,
      arabic: `**محطات الشحن في تونس**

**الشبكة الحالية**
- STEG: المحطات الرئيسية (تونس، سوسة، صفاقس)
- Total Energies: محطات وقود مختارة
- فنادق ومراكز تجارية: شواحن خاصة

**أنواع الشحن**
- بطيء (Type 2): 7-22 kW، 4-8 ساعات للشحن الكامل
- سريع (DC): 50-150 kW، 30-60 دقيقة لـ 80%

**التكلفة المتوسطة**
- STEG: ~0.200 دينار/kWh
- خاص: ~0.300-0.500 دينار/kWh
- في البيت: ~0.180 دينار/kWh (تعريفة الليل)

**نصائح**
- ركب wallbox في الدار (2,000-4,000 دينار)
- استعمل تطبيق PlugShare لإيجاد الشواحن
- خطط للمسافات الطويلة مسبقاً`,
      derja: `**محطات الشحن في تونس**

**الشبكة الحالية**
- STEG: المحطات الكبار (تونس، سوسة، صفاقس)
- Total: بعض محطات البنزين
- هوتيلات وسنترات: شواحن خاصة

**أنواع الشحن**
- بطيء: 4-8 سوايع للشحن الكامل
- سريع: 30-60 دقيقة لـ 80%

**السوم**
- STEG: ~0.200 دينار/kWh
- خاص: ~0.300-0.500 دينار/kWh
- في الدار: ~0.180 دينار/kWh (تعريفة الليل)

**نصايح**
- ركب شاحن في دارك (2,000-4,000 دينار)
- استعمل PlugShare باش تلقى الشواحن`,
    },
    solar_panels: {
      french: `**Panneaux solaires pour recharge**

**Installation recommandée**
- 3-6 kWc pour une voiture électrique
- Coût: 8,000-15,000 TND (après subvention STEG)
- Production: 4,500-9,000 kWh/an

**Économies**
- Recharge gratuite à vie (après amortissement)
- Amortissement: 4-6 ans
- Surplus vendu à STEG

**Avantages combinés**
- Indépendance énergétique
- Empreinte carbone quasi-nulle
- Protection contre hausse des prix

**Procédure**
1. Demande STEG pour raccordement
2. Installation par installateur agréé
3. Compteur bidirectionnel
4. Contrat injection réseau

**Conseil**
Dimensionnez pour couvrir maison + voiture pour maximiser les économies.`,
      arabic: `**الألواح الشمسية للشحن**

**التركيب الموصى به**
- 3-6 kWc لسيارة كهربائية
- التكلفة: 8,000-15,000 دينار (بعد دعم STEG)
- الإنتاج: 4,500-9,000 kWh/سنة

**التوفير**
- شحن مجاني مدى الحياة (بعد الاسترداد)
- الاسترداد: 4-6 سنوات
- الفائض يُباع لـ STEG

**الفوائد المجمعة**
- استقلالية في الطاقة
- بصمة كربونية شبه معدومة
- حماية من ارتفاع الأسعار

**الإجراءات**
1. طلب STEG للربط
2. تركيب من مركب معتمد
3. عداد ثنائي الاتجاه
4. عقد حقن في الشبكة`,
      derja: `**الپانو سولار للشحن**

**التركيب اللازم**
- 3-6 kWc لكرهبة كهربائية
- السوم: 8,000-15,000 دينار (بعد دعم STEG)
- الإنتاج: 4,500-9,000 kWh/عام

**التوفير**
- شحن ببلاش العمر الكل (بعد ما ترجع فلوسك)
- ترجع فلوسك في 4-6 سنين
- الزايد تبيعو لـ STEG

**الفوائد**
- ما تعتمدش على حد في الطاقة
- بيئي 100%
- محمي من ارتفاع الأسعار

**الإجراءات**
1. طلب STEG للربط
2. تركيب من فني معتمد
3. كونتور ثنائي
4. عقد بيع الفائض`,
    },
  };

  const detail = details[topic]?.[language] || details[topic]?.french || '';

  // Add transition question
  const transitionQuestion: Record<Language, string> = {
    french: `\n\nVoulez-vous chercher une voiture électrique?
1. Oui
2. Non, retour au menu`,
    arabic: `\n\nتحب تلقى كرهبة كهربائية؟
1. نعم
2. لا، رجوع للقائمة`,
    derja: `\n\nتحب تلقى كرهبة كهربائية؟
1. إيه
2. لا، نرجع للقائمة`,
  };

  return detail + transitionQuestion[language];
}
