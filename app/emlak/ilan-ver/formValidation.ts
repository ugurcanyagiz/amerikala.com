export type ListingFormStep = 1 | 2 | 3 | 4 | 5;

export interface ListingValidationInput {
  listing_type: string;
  roommate_type: string;
  title: string;
  description: string;
  property_type: string;
  price: string;
  address: string;
  city: string;
  state: string;
  show_phone: boolean;
  contact_phone: string;
  show_email: boolean;
  contact_email: string;
}

export const normalizeText = (value: string) => value.trim();

export const validateListingStep = (
  currentStep: ListingFormStep,
  data: ListingValidationInput
): Record<string, string> => {
  const errors: Record<string, string> = {};

  switch (currentStep) {
    case 1:
      if (!data.listing_type) {
        errors.listing_type = "İlan türü seçiniz";
      }
      if (data.listing_type === "roommate" && !data.roommate_type) {
        errors.roommate_type = "Alt kategori seçiniz";
      }
      break;

    case 2:
      if (!normalizeText(data.title)) {
        errors.title = "Başlık boş bırakılamaz";
      }
      if (!normalizeText(data.description)) {
        errors.description = "Açıklama boş bırakılamaz";
      }
      if (!data.property_type) {
        errors.property_type = "Emlak tipi seçiniz";
      }
      break;

    case 3:
      if (!data.price || Number.parseInt(data.price, 10) <= 0) {
        errors.price = "Geçerli bir fiyat giriniz";
      }
      break;

    case 4:
      if (!normalizeText(data.address)) {
        errors.address = "Adres zorunludur";
      }
      if (!normalizeText(data.city)) {
        errors.city = "Şehir zorunludur";
      }
      if (!data.state) {
        errors.state = "Eyalet seçiniz";
      }
      break;

    case 5:
      if (data.show_phone && !normalizeText(data.contact_phone)) {
        errors.contact_phone = "Telefon numarası giriniz";
      }
      if (data.show_email && !normalizeText(data.contact_email)) {
        errors.contact_email = "E-posta adresi giriniz";
      }
      break;
  }

  return errors;
};
