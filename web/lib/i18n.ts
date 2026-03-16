import { UILanguage } from './constants';

type TranslationKey =
  | 'welcome.title'
  | 'welcome.subtitle'
  | 'input.placeholder'
  | 'header.title'
  | 'header.newConversation'
  | 'error.generic'
  | 'error.tooLong'
  | 'retry.failed'
  | 'retry.button'
  | 'car.viewListing'
  | 'car.priceUnavailable'
  | 'car.new'
  | 'car.fcrNone'
  | 'wizard.origin'
  | 'wizard.fuel'
  | 'wizard.type'
  | 'wizard.budget'
  | 'wizard.results';

const translations: Record<UILanguage, Record<TranslationKey, string>> = {
  french: {
    'welcome.title': 'Bienvenue sur KarTN',
    'welcome.subtitle': 'Votre assistant automobile tunisien',
    'input.placeholder': 'Posez votre question...',
    'header.title': 'KarTN',
    'header.newConversation': 'Nouvelle conversation',
    'error.generic': 'Une erreur est survenue. Veuillez réessayer.',
    'error.tooLong': 'Message trop long (max 2000 caractères)',
    'retry.failed': "Échec de l'envoi",
    'retry.button': 'Réessayer',
    'car.viewListing': "Voir l'annonce",
    'car.priceUnavailable': 'Prix non disponible',
    'car.new': 'Neuf',
    'car.fcrNone': 'Non FCR',
    'wizard.origin': 'Origine',
    'wizard.fuel': 'Carburant',
    'wizard.type': 'Type',
    'wizard.budget': 'Budget',
    'wizard.results': 'Résultats',
  },
  arabic: {
    'welcome.title': 'مرحباً بكم في KarTN',
    'welcome.subtitle': 'مساعدك في عالم السيارات في تونس',
    'input.placeholder': 'اطرح سؤالك...',
    'header.title': 'KarTN',
    'header.newConversation': 'محادثة جديدة',
    'error.generic': 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    'error.tooLong': 'الرسالة طويلة جداً (الحد الأقصى 2000 حرف)',
    'retry.failed': 'فشل الإرسال',
    'retry.button': 'إعادة المحاولة',
    'car.viewListing': 'عرض الإعلان',
    'car.priceUnavailable': 'السعر غير متوفر',
    'car.new': 'جديدة',
    'car.fcrNone': 'غير مؤهلة FCR',
    'wizard.origin': 'المصدر',
    'wizard.fuel': 'الوقود',
    'wizard.type': 'النوع',
    'wizard.budget': 'الميزانية',
    'wizard.results': 'النتائج',
  },
  derja: {
    'welcome.title': 'مرحبا بيك في KarTN',
    'welcome.subtitle': 'مساعدك في عالم الكراهب في تونس',
    'input.placeholder': 'اسأل سؤالك...',
    'header.title': 'KarTN',
    'header.newConversation': 'محادثة جديدة',
    'error.generic': 'صار مشكل. عاود جرب.',
    'error.tooLong': 'الرسالة طويلة برشا (الحد الأقصى 2000 حرف)',
    'retry.failed': 'ما مشاتش',
    'retry.button': 'عاود جرب',
    'car.viewListing': 'شوف الإعلان',
    'car.priceUnavailable': 'السوم ما موجودش',
    'car.new': 'جديدة',
    'car.fcrNone': 'ما تنجمش FCR',
    'wizard.origin': 'المصدر',
    'wizard.fuel': 'الوقود',
    'wizard.type': 'النوع',
    'wizard.budget': 'الميزانية',
    'wizard.results': 'النتائج',
  },
};

export function t(key: TranslationKey, lang: UILanguage = 'french'): string {
  return translations[lang]?.[key] || translations.french[key] || key;
}

export function getLanguage(): UILanguage {
  if (typeof window === 'undefined') return 'french';
  const saved = localStorage.getItem('kartn_language') as UILanguage | null;
  if (saved && ['french', 'arabic', 'derja'].includes(saved)) return saved;
  return 'french';
}
