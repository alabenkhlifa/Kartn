import { ConversationState, Language, CarResult, ScoredCarResult } from './types.ts';
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
  cost_calculator: {
    french: 'Donnez-moi: prix EUR, cylindrée, carburant (essence/diesel/électrique)',
    arabic: 'أعطني: السعر باليورو، السعة، الوقود',
    derja: 'قولي: السوم بالأورو، السيلاندري، البنزين ولا مازوط',
  },
  procedure_info: {
    french: 'Quelle procédure? 1. Import FCR TRE  2. FCR Famille  3. Achat local',
    arabic: 'أي إجراء؟ 1. استيراد FCR TRE  2. FCR عائلة  3. شراء محلي',
    derja: 'شنو تحب تعرف؟ 1. توريد TRE  2. FCR عايلة  3. شراء من تونس',
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
