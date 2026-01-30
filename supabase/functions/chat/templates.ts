import { ConversationState, Language, CarResult, ScoredCarResult, TaxBreakdown, FCRComparison, ProcedureType } from './types.ts';
import { EXCHANGE_RATE } from './config.ts';

type Templates = Record<ConversationState, Record<Language, string>>;

const TEMPLATES: Templates = {
  goal_selection: {
    french: `Bienvenue!
1. Vous cherchez à acheter une voiture ?
2. Vous voulez calculer les coûts d'importation ?
3. Vous avez des questions sur les procédures ?`,
    arabic: `مرحبا!
1. تبحث عن سيارة للشراء؟
2. تريد حساب تكاليف الاستيراد؟
3. عندك أسئلة على الإجراءات؟`,
    derja: `مرحبا!
1. تحب تشري كرهبة؟
2. تحب تحسب مصاريف الاستيراد؟
3. عندك أسئلة على الإجراءات؟`,
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
    french: 'Budget max? 1. 50k TND  2. 70k TND  3. 90k TND  4. 120k+ TND',
    arabic: 'الميزانية؟ 1. 50 ألف  2. 70 ألف  3. 90 ألف  4. +120 ألف',
    derja: 'قداش تحب تصرف؟ 1. 50k  2. 70k  3. 90k  4. +120k',
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
2. FCR Famille (Article 55)
3. Achat local en Tunisie`,
    arabic: `أي إجراء تحب تعرف عليه؟
1. استيراد FCR TRE (تونسيين في الخارج)
2. FCR عائلة (الفصل 55)
3. شراء محلي في تونس`,
    derja: `شنو تحب تعرف؟
1. توريد TRE (للتوانسة برّا)
2. FCR عايلة (الفصل 55)
3. شراء من تونس`,
  },
  showing_procedure_detail: {
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
    achat_local: {
      french: `**Achat local en Tunisie**

**Options disponibles:**

**1. Concessionnaires officiels (Neuf)**
- Prix fixe, garantie constructeur
- Financement disponible
- Pas de douane

**2. Marché occasion local**
- Prix négociable
- Vérifier l'historique du véhicule
- Visite technique obligatoire

**3. RS (Régime Suspendu) - TRE vendant**
- Véhicules FCR TRE revendus
- Prix souvent compétitifs
- Vérifier l'éligibilité du transfert

**Conseils:**
- Toujours vérifier le certificat de situation
- Faire une expertise mécanique
- Négocier le prix final tout compris`,
      arabic: `**الشراء المحلي في تونس**

**الخيارات المتاحة:**

**1. الوكلاء الرسميون (جديد)**
- سعر ثابت، ضمان المصنع
- تمويل متاح
- بدون جمارك

**2. سوق المستعمل المحلي**
- السعر قابل للتفاوض
- تحقق من تاريخ السيارة
- الفحص الفني إلزامي

**3. RS (النظام المعلق) - TRE يبيع**
- سيارات FCR TRE معاد بيعها
- أسعار تنافسية عادة
- تحقق من أهلية النقل

**نصائح:**
- دائماً تحقق من شهادة الوضعية
- اعمل خبرة ميكانيكية
- تفاوض على السعر النهائي شامل`,
      derja: `**شراء من تونس**

**الاختيارات:

**1. الوكلاء (جديدة)**
- سوم ثابت، ضمان المصنع
- تسهيلات موجودة
- بلا ديوانة

**2. سوق المستعمل**
- السوم يتفاوض
- شوف تاريخ الكرهبة
- الفيزيت لازم

**3. RS - TRE يبيع**
- كراهب FCR TRE يرجعو يبيعوها
- الأسعار مليحة عادة
- تثبت من نقل الملكية

**نصايح:**
- ديما شوف شهادة الوضعية
- دير خبير ميكانيك
- فاصل على السوم النهائي`,
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
